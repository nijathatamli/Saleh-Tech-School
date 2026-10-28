import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/admin-header";
import { NotificationToaster } from "@/components/app/notification-toaster";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { PageTransition } from "@/components/app/page-transition";
import { adminNav } from "@/lib/nav";
// Inter + Plus Jakarta Sans, then this panel's own design system (white top bar with tabs, grey canvas of white cards)
import "@/features/parent-dashboard/styles/fonts.css";
import "@/components/admin/admin.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/giris");

  // the two things an admin acts on first, shown on their tabs on every page; and the bell
  const [paymentsDue, newApplications, unread] = await Promise.all([
    prisma.payment.count({ where: { status: "DUE", cycle: { not: null } } }),
    prisma.trialBooking.count({ where: { stage: "NEW" } }),
    prisma.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);
  // settings and notifications live in the header (gear, bell); every other page is a tab
  const tabs = adminNav.filter((n) => n.href !== "/admin/settings" && n.href !== "/admin/notifications").map((n) => ({ href: n.href, label: n.label }));

  return (
    <div className="ap-root">
      <AdminChrome />
      <NotificationToaster />
      <AdminHeader
        tabs={tabs}
        badges={{ "/admin/payments": paymentsDue, "/admin/leads": newApplications }}
        user={{ name: session.user.name ?? "Admin", email: session.user.email ?? "" }}
        unread={unread}
        shell={{
          home: "/admin",
          ariaLabel: "Admin naviqasiyası",
          logoLabel: "Saleh Tech School — admin",
          settingsHref: "/admin/settings",
          notificationsHref: "/admin/notifications",
          search: { action: "/admin/students", placeholder: "Tələbə axtar...", label: "Tələbə axtar" },
          createLabel: "Yarat",
          create: [
            { label: "Yeni tələbə", href: "/admin/students?yarat=telebe" },
            { label: "Yeni valideyn", href: "/admin/parents?yarat=valideyn" },
            { label: "Yeni müəllim", href: "/admin/teachers?yarat=muellim" },
            { label: "Yeni kurs", href: "/admin/courses?yarat=kurs" },
            { label: "Yeni sinif", href: "/admin/classes?yarat=sinif" },
          ],
        }}
      />
      <main className="ap-main">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
