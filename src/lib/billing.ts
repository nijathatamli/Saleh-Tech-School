// Lesson completion and the lesson-based payment cycle.
//
// A lesson counts for a student when the teacher marked them as taking part
// (Attendance.completed — PRESENT or LATE). Every `lessonsPerCycle` completed lessons
// (default 8) of a (student, class) pair open one payment cycle:
//
//     cycle 1 = completed lessons 1-8, cycle 2 = 9-16, ...
//
// Each cycle is one Payment row keyed by (studentId, classId, cycle). That unique key is
// the idempotency guarantee: marking more lessons, re-marking the same lesson, or two
// teachers' requests racing each other can never create a second payment, a second
// notification or re-open a cycle the admin has already marked PAID.
// Everything below takes the transaction client, so the lesson record, the payment and
// the notifications commit — or roll back — together.
import { randomBytes } from "node:crypto";
import type { AttendanceStatus, Prisma } from "@prisma/client";
import { audit, notifyAdmins, notifyParentsOfStudentsDirect, notifyStudents } from "@/lib/events";
import { ApiError } from "@/lib/api";
import { getSettings } from "@/lib/settings";

type Tx = Prisma.TransactionClient;

export const COMPLETING: AttendanceStatus[] = ["PRESENT", "LATE"];
export const isCompleting = (s: AttendanceStatus) => COMPLETING.includes(s);

export { cycleProgress } from "@/lib/cycle";

const invoiceNo = () => `INV-${new Date().getUTCFullYear()}-${randomBytes(4).toString("hex").toUpperCase()}`;

/**
 * Brings the payment cycles of one (student, class) up to date with the number of completed
 * lessons. Safe to call as often as you like. Returns the payments it created (usually 0 or 1).
 */
export async function syncPaymentCycles(tx: Tx, args: { classId: string; studentId: string; actorUserId: string }) {
  const { classId, studentId, actorUserId } = args;

  // Serialise concurrent completions of the same student in the same class.
  const locked = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "Enrollment" WHERE "classId" = ${classId} AND "studentId" = ${studentId} FOR UPDATE`;
  if (!locked.length) return [];

  const [cls, student, completed, lastCycle] = await Promise.all([
    tx.classGroup.findUniqueOrThrow({ where: { id: classId }, include: { course: { select: { name: true, price: true } } } }),
    tx.studentProfile.findUniqueOrThrow({ where: { id: studentId }, select: { firstName: true, lastName: true, parentId: true } }),
    tx.attendance.count({ where: { studentId, completed: true, lesson: { classId } } }),
    tx.payment.aggregate({ where: { studentId, classId }, _max: { cycle: true } }),
  ]);

  const settings = await getSettings(tx);
  const size = Math.max(1, cls.lessonsPerCycle);
  const reached = Math.floor(completed / size);
  const created = [];

  for (let cycle = (lastCycle._max.cycle ?? 0) + 1; cycle <= reached; cycle++) {
    const from = (cycle - 1) * size + 1;
    const to = cycle * size;
    const { count } = await tx.payment.createMany({
      skipDuplicates: true,
      data: [
        {
          parentId: student.parentId,
          studentId,
          classId,
          cycle,
          lessonsFrom: from,
          lessonsTo: to,
          title: `${cls.course.name} — ${cycle}-ci ödəniş dövrü (dərs ${from}–${to})`,
          amount: cls.course.price,
          status: "DUE",
          dueDate: new Date(),
          invoiceNo: invoiceNo(),
        },
      ],
    });
    if (count === 0) continue; // another request created this cycle first: no second payment, no second notification

    const payment = await tx.payment.findUniqueOrThrow({ where: { studentId_classId_cycle: { studentId, classId, cycle } } });
    const name = `${student.firstName} ${student.lastName}`;
    const ref = { entityType: "payment" as const, entityId: payment.id };
    await notifyAdmins(tx, {
      title: "Ödəniş bildirişi",
      body: `${name} · ${cls.name} · ${to} dərs tamamlandı. Ödəniş vaxtıdır.`,
      type: "warning",
      event: "PAYMENT_DUE",
      ...ref,
    });
    if (settings["notify.paymentDueToFamilies"]) await notifyParentsOfStudentsDirect(tx, [studentId], {
      title: "Ödəniş vaxtıdır",
      body: `${name} üçün "${cls.name}" sinifində ${to} dərs tamamlandı. Növbəti ödəniş: ${cls.course.price} AZN.`,
      type: "warning",
      event: "PAYMENT_DUE",
      ...ref,
    });
    if (settings["notify.paymentDueToFamilies"]) await notifyStudents(tx, [studentId], { title: "Ödəniş vaxtıdır", body: `"${cls.name}" sinifində ${to} dərs tamamlandı.`, type: "info", event: "PAYMENT_DUE", ...ref });
    await audit(tx, { actorUserId, action: "payment.due", entityType: "payment", entityId: payment.id, after: { studentId, classId, cycle, lessonsFrom: from, lessonsTo: to, amount: payment.amount } });
    created.push(payment);
  }
  return created;
}

/**
 * Records a student's participation in a lesson (one row per lesson+student, created or
 * updated), keeps `completed` in line with the status, and updates the payment cycles.
 * Returns whether anything changed — marking the same thing twice is a no-op. `confirm` is the
 * explicit "lesson completed" action: it also completes a row that already says PRESENT but
 * predates lesson tracking, whereas the ordinary attendance screen leaves such history alone.
 */
export async function setParticipation(
  tx: Tx,
  args: { actorUserId: string; lesson: { id: string; classId: string; date: Date }; studentId: string; status: AttendanceStatus; note?: string | null; confirm?: boolean }
) {
  const { actorUserId, lesson, studentId, status } = args;
  // a cancelled lesson never happened: marking it would count towards (and bill) the family's payment cycle
  // Serialise every change to this student's participation in this class (the same row syncPaymentCycles locks later, so no
  // lock-order problem): two simultaneous requests for one lesson then run one after the other and the second is a no-op,
  // instead of racing on the (lesson, student) unique key and failing.
  await tx.$queryRaw`SELECT "id" FROM "Enrollment" WHERE "classId" = ${lesson.classId} AND "studentId" = ${studentId} FOR UPDATE`;
  const row = await tx.lesson.findUnique({ where: { id: lesson.id }, select: { status: true } });
  if (!row) throw new ApiError(404, "Dərs tapılmadı.");
  if (row.status === "CANCELLED") throw new ApiError(409, "Ləğv edilmiş dərs üçün davamiyyət qeyd etmək olmaz.");
  const completed = isCompleting(status);
  const current = await tx.attendance.findUnique({ where: { lessonId_studentId: { lessonId: lesson.id, studentId } } });
  if (current && current.status === status && (current.completed === completed || !args.confirm)) return { changed: false as const, attendance: current, payments: [] };

  const attendance = current
    ? await tx.attendance.update({ where: { id: current.id }, data: { status, completed, markedById: actorUserId, ...(args.note !== undefined ? { note: args.note } : {}) } })
    : await tx.attendance.create({ data: { lessonId: lesson.id, studentId, status, completed, date: lesson.date, markedById: actorUserId, note: args.note ?? null } });

  await audit(tx, {
    actorUserId,
    action: completed ? "lesson.complete" : "attendance.mark",
    entityType: "attendance",
    entityId: attendance.id,
    before: current ? { status: current.status, completed: current.completed } : null,
    after: { status, completed, lessonId: lesson.id, studentId },
  });
  await tx.lesson.updateMany({ where: { id: lesson.id, status: { in: ["SCHEDULED", "IN_PROGRESS"] } }, data: { status: "COMPLETED" } });
  const payments = completed ? await syncPaymentCycles(tx, { classId: lesson.classId, studentId, actorUserId }) : [];
  return { changed: true as const, attendance, payments };
}
