// Operational reports and the dashboard numbers. Everything is aggregated in the database
// (COUNT / SUM / GROUP BY) — no table is ever loaded into memory.
import { prisma } from "@/lib/prisma";
import { fromBakuLocal } from "@/features/parent-dashboard/az";
import { getSettings } from "@/lib/settings";

const n = (v: bigint | number | null | undefined) => Number(v ?? 0);
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
const day = /^\d{4}-\d{2}-\d{2}$/;

export function resolveRange(from?: string, to?: string) {
  const today = new Date();
  const toDay = to && day.test(to) ? to : new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(today);
  const fromDay = from && day.test(from) ? from : new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(new Date(today.getTime() - 29 * 86_400_000));
  return { fromDay, toDay, start: fromBakuLocal(`${fromDay}T00:00`), end: new Date(fromBakuLocal(`${toDay}T00:00`).getTime() + 86_400_000) };
}

export async function getReports(fromParam?: string, toParam?: string) {
  const { fromDay, toDay, start, end } = resolveRange(fromParam, toParam);
  const settings = await getSettings();
  const overdueBefore = new Date(Date.now() - settings["billing.overdueDays"] * 86_400_000);
  const now = new Date();
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  const [stu, noClass, att, classRows, payByStatus, overdue, paidRange, revenue, teacherRows, leadsByStage] = await Promise.all([
    prisma.$queryRaw<{ total: bigint; active: bigint; fresh: bigint }[]>`SELECT count(*) AS total, count(*) FILTER (WHERE "active") AS active, count(*) FILTER (WHERE "createdAt" >= ${start} AND "createdAt" < ${end}) AS fresh FROM "StudentProfile"`,
    prisma.studentProfile.count({ where: { active: true, enrollments: { none: { class: { status: "ACTIVE" } } } } }),
    prisma.attendance.groupBy({ by: ["status"], where: { date: { gte: start, lt: end }, lesson: { status: { not: "CANCELLED" } } }, _count: { _all: true } }),
    prisma.$queryRaw<{ id: string; name: string; teacher: string; capacity: number | null; students: bigint; lessons: bigint; completed: bigint; present: bigint; recorded: bigint }[]>`
      SELECT c."id", c."name", u."name" AS teacher, c."capacity",
        (SELECT count(*) FROM "Enrollment" e WHERE e."classId" = c."id") AS students,
        (SELECT count(*) FROM "Lesson" l WHERE l."classId" = c."id" AND l."status" <> 'CANCELLED' AND l."date" >= ${start} AND l."date" < ${end}) AS lessons,
        (SELECT count(*) FROM "Lesson" l WHERE l."classId" = c."id" AND l."status" = 'COMPLETED' AND l."date" >= ${start} AND l."date" < ${end}) AS completed,
        (SELECT count(*) FROM "Attendance" a JOIN "Lesson" l ON l."id" = a."lessonId" WHERE l."classId" = c."id" AND l."status" <> 'CANCELLED' AND a."date" >= ${start} AND a."date" < ${end} AND a."status" IN ('PRESENT','LATE')) AS present,
        (SELECT count(*) FROM "Attendance" a JOIN "Lesson" l ON l."id" = a."lessonId" WHERE l."classId" = c."id" AND l."status" <> 'CANCELLED' AND a."date" >= ${start} AND a."date" < ${end}) AS recorded
      FROM "ClassGroup" c JOIN "TeacherProfile" t ON t."id" = c."teacherId" JOIN "User" u ON u."id" = t."userId"
      WHERE c."status" = 'ACTIVE' ORDER BY c."name"`,
    prisma.payment.groupBy({ by: ["status"], where: { cycle: { not: null } }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { cycle: { not: null }, status: "DUE", dueDate: { lt: overdueBefore } }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { cycle: { not: null }, status: "PAID", paidAt: { gte: start, lt: end } }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.$queryRaw<{ month: string; total: bigint | null }[]>`SELECT to_char("paidAt", 'YYYY-MM') AS month, sum("amount") AS total FROM "Payment" WHERE "status" = 'PAID' AND "paidAt" >= ${sixMonthsAgo} GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ id: string; name: string; classes: bigint; students: bigint; lessons: bigint; mins: bigint | null }[]>`
      SELECT t."id", u."name",
        (SELECT count(*) FROM "ClassGroup" c WHERE c."teacherId" = t."id" AND c."status" = 'ACTIVE') AS classes,
        (SELECT count(DISTINCT e."studentId") FROM "Enrollment" e JOIN "ClassGroup" c ON c."id" = e."classId" WHERE c."teacherId" = t."id" AND c."status" = 'ACTIVE') AS students,
        (SELECT count(*) FROM "Lesson" l JOIN "ClassGroup" c ON c."id" = l."classId" WHERE c."teacherId" = t."id" AND l."status" <> 'CANCELLED' AND l."date" >= ${start} AND l."date" < ${end}) AS lessons,
        (SELECT sum(COALESCE(l."durationMinutes", co."lessonMinutes")) FROM "Lesson" l JOIN "ClassGroup" c ON c."id" = l."classId" JOIN "Course" co ON co."id" = c."courseId" WHERE c."teacherId" = t."id" AND l."status" <> 'CANCELLED' AND l."date" >= ${start} AND l."date" < ${end}) AS mins
      FROM "TeacherProfile" t JOIN "User" u ON u."id" = t."userId" WHERE u."active" ORDER BY u."name"`,
    prisma.trialBooking.groupBy({ by: ["stage"], where: { createdAt: { gte: start, lt: end } }, _count: { _all: true } }),
  ]);

  const s = stu[0];
  const attBy = Object.fromEntries(att.map((a) => [a.status, a._count._all])) as Record<string, number>;
  const attTotal = Object.values(attBy).reduce((x, y) => x + y, 0);
  const pay = Object.fromEntries(payByStatus.map((p) => [p.status, { count: p._count._all, amount: p._sum.amount ?? 0 }])) as Record<string, { count: number; amount: number }>;
  const leadMap = Object.fromEntries(leadsByStage.map((l) => [l.stage, l._count._all])) as Record<string, number>;
  const leadTotal = Object.values(leadMap).reduce((x, y) => x + y, 0);

  return {
    range: { from: fromDay, to: toDay },
    students: { total: n(s.total), active: n(s.active), inactive: n(s.total) - n(s.active), newInRange: n(s.fresh), withoutClass: noClass, attendance: { ...(attBy as Record<string, number>), total: attTotal, rate: pct((attBy.PRESENT ?? 0) + (attBy.LATE ?? 0), attTotal) } },
    classes: classRows.map((c) => ({ id: c.id, name: c.name, teacher: c.teacher, students: n(c.students), capacity: c.capacity, utilization: c.capacity ? pct(n(c.students), c.capacity) : null, lessons: n(c.lessons), completedLessons: n(c.completed), attendanceRate: n(c.recorded) ? pct(n(c.present), n(c.recorded)) : null })),
    financial: {
      due: pay.DUE ?? { count: 0, amount: 0 }, paid: pay.PAID ?? { count: 0, amount: 0 }, cancelled: pay.CANCELLED ?? { count: 0, amount: 0 },
      overdue: { count: overdue._count._all, amount: overdue._sum.amount ?? 0, afterDays: settings["billing.overdueDays"] },
      paidInRange: { count: paidRange._count._all, amount: paidRange._sum.amount ?? 0 },
      revenueByMonth: revenue.map((r) => ({ month: r.month, amount: n(r.total) })),
    },
    teachers: teacherRows.map((t) => ({ id: t.id, name: t.name, classes: n(t.classes), students: n(t.students), lessons: n(t.lessons), hours: Math.round((n(t.mins) / 60) * 10) / 10 })),
    admissions: { total: leadTotal, byStage: leadMap, converted: leadMap.REGISTERED ?? 0, conversionRate: pct(leadMap.REGISTERED ?? 0, leadTotal) },
  };
}

/** Numbers for the admin home page — one round of grouped queries, no row loading. */
export async function getDashboard() {
  const settings = await getSettings();
  const now = new Date();
  const dayStart = fromBakuLocal(`${new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku" }).format(now)}T00:00`);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const overdueBefore = new Date(now.getTime() - settings["billing.overdueDays"] * 86_400_000);

  const [activeStudents, activeTeachers, activeClasses, todayLessons, todayAbsent, due, overdue, newApps, apps7, schReg, schDone, monthRevenue, tight, loads] = await Promise.all([
    prisma.studentProfile.count({ where: { active: true } }),
    prisma.teacherProfile.count({ where: { user: { active: true } } }),
    prisma.classGroup.count({ where: { status: "ACTIVE" } }),
    prisma.lesson.findMany({ where: { date: { gte: dayStart, lt: dayEnd }, status: { not: "CANCELLED" } }, orderBy: { date: "asc" }, take: 8, select: { id: true, date: true, room: true, status: true, class: { select: { id: true, name: true, teacher: { select: { user: { select: { name: true } } } } } } } }),
    prisma.attendance.count({ where: { date: { gte: dayStart, lt: dayEnd }, status: { in: ["ABSENT", "EXCUSED"] }, lesson: { status: { not: "CANCELLED" } } } }),
    prisma.payment.aggregate({ where: { cycle: { not: null }, status: "DUE" }, _count: { _all: true }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { cycle: { not: null }, status: "DUE", dueDate: { lt: overdueBefore } }, _count: { _all: true } }),
    prisma.trialBooking.count({ where: { stage: "NEW" } }),
    prisma.trialBooking.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.scholarshipStudent.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.scholarshipAttempt.count({ where: { status: "SUBMITTED" } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.$queryRaw<{ id: string; name: string; capacity: number; students: bigint }[]>`SELECT c."id", c."name", c."capacity", count(e."id") AS students FROM "ClassGroup" c LEFT JOIN "Enrollment" e ON e."classId" = c."id" WHERE c."status" = 'ACTIVE' AND c."capacity" IS NOT NULL GROUP BY c."id" HAVING count(e."id") >= c."capacity" * 0.9 ORDER BY count(e."id")::float / c."capacity" DESC LIMIT 5`,
    prisma.$queryRaw<{ id: string; name: string; lessons: bigint; students: bigint }[]>`
      SELECT t."id", u."name",
        (SELECT count(*) FROM "Lesson" l JOIN "ClassGroup" c ON c."id" = l."classId" WHERE c."teacherId" = t."id" AND l."status" <> 'CANCELLED' AND l."date" >= ${now} AND l."date" < ${new Date(now.getTime() + 7 * 86_400_000)}) AS lessons,
        (SELECT count(DISTINCT e."studentId") FROM "Enrollment" e JOIN "ClassGroup" c ON c."id" = e."classId" WHERE c."teacherId" = t."id" AND c."status" = 'ACTIVE') AS students
      FROM "TeacherProfile" t JOIN "User" u ON u."id" = t."userId" WHERE u."active" ORDER BY lessons DESC, students DESC LIMIT 5`,
  ]);
  return {
    activeStudents, activeTeachers, activeClasses,
    todayLessons: todayLessons.map((l) => ({ id: l.id, date: l.date.toISOString(), room: l.room, status: l.status, classId: l.class.id, className: l.class.name, teacherName: l.class.teacher.user.name })),
    todayAbsent,
    paymentsDue: { count: due._count._all, amount: due._sum.amount ?? 0 }, paymentsOverdue: overdue._count._all, overdueAfterDays: settings["billing.overdueDays"],
    newApplications: newApps, applications7d: apps7, scholarshipRegistrations7d: schReg, scholarshipFinished: schDone,
    monthRevenue: monthRevenue._sum.amount ?? 0,
    fullClasses: tight.map((c) => ({ id: c.id, name: c.name, capacity: c.capacity, students: n(c.students) })),
    teacherLoad: loads.map((t) => ({ id: t.id, name: t.name, lessonsWeek: n(t.lessons), students: n(t.students) })),
  };
}
