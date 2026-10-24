import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError, MSG } from "@/lib/api";
import { audit, notifyParentsOfStudentsDirect } from "@/lib/events";
import { getSettings } from "@/lib/settings";

export const paymentBlockSchema = z.object({ blocked: z.boolean({ errorMap: () => ({ message: MSG.invalid }) }) });

export const paymentStatusSchema = z.object({ status: z.enum(["PAID", "DUE", "CANCELLED"], { errorMap: () => ({ message: MSG.invalid }) }) });

const select = {
  id: true, title: true, amount: true, status: true, cycle: true, lessonsFrom: true, lessonsTo: true, dueDate: true, paidAt: true, createdAt: true, invoiceNo: true,
  student: { select: { id: true, firstName: true, lastName: true, active: true } },
  class: { select: { id: true, name: true } },
} satisfies Prisma.PaymentSelect;

/** OVERDUE is derived (DUE for longer than `billing.overdueDays`), never stored — so it clears itself the moment the payment is marked PAID. */
const present = (p: Prisma.PaymentGetPayload<{ select: typeof select }>, overdueBefore?: Date) => ({
  overdue: p.status === "DUE" && !!overdueBefore && p.dueDate < overdueBefore,
  id: p.id, title: p.title, amount: p.amount, status: p.status, cycle: p.cycle, lessonsFrom: p.lessonsFrom, lessonsTo: p.lessonsTo, invoiceNo: p.invoiceNo,
  dueAt: p.dueDate.toISOString(), paidAt: p.paidAt?.toISOString() ?? null, createdAt: p.createdAt.toISOString(),
  studentId: p.student?.id ?? null, studentActive: p.student?.active ?? null, studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : "—",
  classId: p.class?.id ?? null, className: p.class?.name ?? "—",
});

export async function listPayments(p: { status?: string; q?: string; studentId?: string; classId?: string; page: number; size: number }) {
  // lesson-based cycles only: the older invoice rows have no student/class
  const settings = await getSettings();
  const overdueBefore = new Date(Date.now() - settings["billing.overdueDays"] * 86_400_000);
  const overdueOnly = p.status === "OVERDUE";
  const where: Prisma.PaymentWhereInput = {
    cycle: { not: null },
    ...(overdueOnly ? { status: "DUE", dueDate: { lt: overdueBefore } } : p.status && ["DUE", "PAID", "PENDING", "CANCELLED"].includes(p.status) ? { status: p.status as never } : {}),
    ...(p.studentId ? { studentId: p.studentId } : {}),
    ...(p.classId ? { classId: p.classId } : {}),
    ...(p.q ? { OR: [{ student: { OR: [{ firstName: { contains: p.q, mode: "insensitive" } }, { lastName: { contains: p.q, mode: "insensitive" } }] } }, { class: { name: { contains: p.q, mode: "insensitive" } } }, { invoiceNo: { contains: p.q, mode: "insensitive" } }] } : {}),
  };
  const [total, rows, counts] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, select, orderBy: [{ createdAt: "desc" }, { id: "asc" }], skip: (p.page - 1) * p.size, take: p.size }),
    prisma.payment.groupBy({ by: ["status"], where: { cycle: { not: null } }, _count: { _all: true } }),
  ]);
  const overdueCount = await prisma.payment.count({ where: { cycle: { not: null }, status: "DUE", dueDate: { lt: overdueBefore } } });
  return { total, items: rows.map((r) => present(r, overdueBefore)), counts: { ...Object.fromEntries(counts.map((c) => [c.status, c._count._all])), OVERDUE: overdueCount } as Record<string, number> };
}

/** Allowed moves: DUE → PAID | CANCELLED, and PAID/CANCELLED → DUE (to undo a mistake). Everything is audited. */
export async function setPaymentStatus(actorUserId: string, id: string, status: "PAID" | "DUE" | "CANCELLED") {
  const row = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "id" = ${id} FOR UPDATE`; // two simultaneous clicks: the second sees the first one's result
    const cur = await tx.payment.findUnique({ where: { id }, select: { id: true, status: true, cycle: true, studentId: true, title: true, amount: true } });
    if (!cur || cur.cycle === null) throw new ApiError(404, MSG.notFound);
    if (cur.status === status) return cur; // idempotent
    if (!["DUE", "PAID", "CANCELLED", "PENDING", "OVERDUE"].includes(cur.status)) throw new ApiError(409, MSG.invalid);
    await tx.payment.update({ where: { id }, data: { status, paidAt: status === "PAID" ? new Date() : null } });
    await audit(tx, { actorUserId, action: status === "PAID" ? "payment.paid" : status === "CANCELLED" ? "payment.cancel" : "payment.reopen", entityType: "payment", entityId: id, before: { status: cur.status }, after: { status } });
    if (status === "PAID" && cur.studentId) {
      await notifyParentsOfStudentsDirect(tx, [cur.studentId], { title: "Ödəniş qəbul edildi", body: `${cur.title} — ${cur.amount} AZN ödənişi təsdiqləndi.`, type: "success", event: "PAYMENT_PAID", entityType: "payment", entityId: id });
    }
    return cur;
  });
  void row;
  const fresh = await prisma.payment.findUniqueOrThrow({ where: { id }, select });
  return present(fresh);
}

/**
 * "Hesabı blokla / Blokdan çıxar" next to an unpaid cycle: switches the student's login off (or back on) — the same switch as
 * deactivating the student, so open sessions stop at once and nothing is deleted. Audited; the family is told why.
 */
export async function setStudentBlockedForPayment(actorUserId: string, paymentId: string, blocked: boolean) {
  await prisma.$transaction(async (tx) => {
    const pay = await tx.payment.findUnique({ where: { id: paymentId }, select: { id: true, cycle: true, title: true, studentId: true } });
    if (!pay || pay.cycle === null || !pay.studentId) throw new ApiError(404, MSG.notFound);
    await tx.$queryRaw`SELECT "id" FROM "StudentProfile" WHERE "id" = ${pay.studentId} FOR UPDATE`;
    const st = await tx.studentProfile.findUnique({ where: { id: pay.studentId }, select: { id: true, userId: true, active: true, firstName: true, lastName: true } });
    if (!st) throw new ApiError(404, MSG.studentNotFound);
    if (st.active === !blocked) return; // idempotent: already in the requested state
    await tx.studentProfile.update({ where: { id: st.id }, data: { active: !blocked } });
    if (st.userId) await tx.user.update({ where: { id: st.userId }, data: { active: !blocked } });
    await audit(tx, { actorUserId, action: blocked ? "student.block" : "student.unblock", entityType: "student", entityId: st.id, before: { active: st.active }, after: { active: !blocked, paymentId, reason: "payment" } });
    await notifyParentsOfStudentsDirect(tx, [st.id], blocked
      ? { title: "Hesab bloklandı", body: `${st.firstName} ${st.lastName} üçün hesab ödəniş (${pay.title}) gözlənildiyindən müvəqqəti bloklandı. Ödəniş təsdiqləndikdən sonra yenidən açılacaq.`, type: "warning", event: "PAYMENT_DUE", entityType: "payment", entityId: paymentId }
      : { title: "Hesab yenidən açıldı", body: `${st.firstName} ${st.lastName} üçün hesab yenidən aktivdir.`, type: "success", event: "GENERAL", entityType: "payment", entityId: paymentId });
  });
  const fresh = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, select });
  return present(fresh);
}
