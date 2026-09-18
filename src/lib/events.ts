// Side effects that belong to a business change: notifications and the audit
// trail. Both take the transaction client so they commit — or roll back —
// together with the change they describe.
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export type NotifyCategory = "lessons" | "grades";
export type EntityRef = { entityType: "attendance" | "lesson" | "homework" | "submission" | "grade" | "note" | "badge"; entityId: string };

type Payload = { title: string; body: string; type?: "info" | "success" | "warning" | "error"; category: NotifyCategory } & Partial<EntityRef>;

/** Notifies the parents of the given students, honouring each parent's preferences. */
export async function notifyParentsOfStudents(db: Db, studentIds: string[], n: Payload) {
  if (!studentIds.length) return 0;
  const parents = await db.parentProfile.findMany({
    where: { children: { some: { id: { in: studentIds } } } },
    select: { userId: true, notifyLessons: true, notifyGrades: true },
  });
  const recipients = parents.filter((p) => (n.category === "lessons" ? p.notifyLessons : p.notifyGrades));
  if (!recipients.length) return 0;
  const { count } = await db.notification.createMany({
    data: recipients.map((p) => ({ userId: p.userId, title: n.title, body: n.body, type: n.type ?? "info", entityType: n.entityType, entityId: n.entityId })),
  });
  return count;
}

/** Notifies the students themselves (those with a login). */
export async function notifyStudents(db: Db, studentIds: string[], n: Omit<Payload, "category">) {
  if (!studentIds.length) return 0;
  const students = await db.studentProfile.findMany({ where: { id: { in: studentIds }, userId: { not: null } }, select: { userId: true } });
  const userIds = students.map((s) => s.userId).filter((id): id is string => !!id);
  if (!userIds.length) return 0;
  const { count } = await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, title: n.title, body: n.body, type: n.type ?? "info", entityType: n.entityType, entityId: n.entityId })),
  });
  return count;
}

/** Notifies specific users (e.g. the teacher of a class). */
export async function notifyUsers(db: Db, userIds: string[], n: Omit<Payload, "category">) {
  if (!userIds.length) return 0;
  const { count } = await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, title: n.title, body: n.body, type: n.type ?? "info", entityType: n.entityType, entityId: n.entityId })),
  });
  return count;
}

/** Records who changed what, with the before/after snapshot. */
export function audit(
  db: Db,
  entry: { actorUserId: string; action: string; entityType: string; entityId: string; before?: unknown; after?: unknown }
) {
  return db.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before === undefined ? undefined : (entry.before as Prisma.InputJsonValue),
      after: entry.after === undefined ? undefined : (entry.after as Prisma.InputJsonValue),
    },
  });
}
