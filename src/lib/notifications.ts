// Notifications shown in the bell panel of the teacher and student dashboards (the parent portal has its own screen,
// the admin panel its own page). The rows are written by the business actions (new class, absence, grade, ...).
import { prisma } from "@/lib/prisma";

export type DashboardNotification = { id: string; title: string; body: string; read: boolean; createdAt: string };

export async function recentNotifications(userId: string, take = 30): Promise<DashboardNotification[]> {
  const rows = await prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take });
  return rows.map((n) => ({ id: n.id, title: n.title, body: n.body, read: n.read, createdAt: n.createdAt.toISOString() }));
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
}
