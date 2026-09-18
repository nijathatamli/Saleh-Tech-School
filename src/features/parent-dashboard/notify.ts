// Kept for compatibility: notifications now live in src/lib/events.ts and are
// written inside the same transaction as the change they announce.
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents as notify, type NotifyCategory } from "@/lib/events";

export type { NotifyCategory };

export function notifyParentsOfStudents(
  studentIds: string[],
  notification: { title: string; body: string; type?: "info" | "success" | "warning" | "error"; category: NotifyCategory }
) {
  return notify(prisma, studentIds, notification);
}
