import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";

/** The admin header with the live unread-notification count (payment due, new classes ...). */
export async function AdminTopbar({ title, subtitle }: { title: string; subtitle?: string }) {
  const session = await getServerSession(authOptions);
  const unread = session?.user?.id ? await prisma.notification.count({ where: { userId: session.user.id, read: false } }) : 0;
  return (
    <AppTopbar
      title={title}
      subtitle={subtitle}
      userName={session?.user?.name ?? "Admin"}
      userEmail={session?.user?.email ?? ""}
      unreadNotifications={unread}
      notificationsHref="/admin/notifications"
    />
  );
}
