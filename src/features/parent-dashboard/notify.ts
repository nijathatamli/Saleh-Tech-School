// Parent notifications. Teacher-side actions call this when something a
// parent should hear about happens (a lesson is scheduled, attendance is
// marked, homework is set or graded, a badge is awarded). Honours each
// parent's portal preferences (Tənzimləmələr → Bildirişlər).
import { prisma } from "@/lib/prisma";

export type NotifyCategory = "lessons" | "grades";

export async function notifyParentsOfStudents(
  studentIds: string[],
  notification: { title: string; body: string; type?: "info" | "success" | "warning" | "error"; category: NotifyCategory }
) {
  if (studentIds.length === 0) return 0;
  const parents = await prisma.parentProfile.findMany({
    where: { children: { some: { id: { in: studentIds } } } },
    select: { userId: true, notifyLessons: true, notifyGrades: true },
  });
  const recipients = parents.filter((p) => (notification.category === "lessons" ? p.notifyLessons : p.notifyGrades));
  if (recipients.length === 0) return 0;
  const { count } = await prisma.notification.createMany({
    data: recipients.map((p) => ({
      userId: p.userId,
      title: notification.title,
      body: notification.body,
      type: notification.type ?? "info",
    })),
  });
  return count;
}
