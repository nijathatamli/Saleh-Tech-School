import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { PageTransition } from "@/components/app/page-transition";
import { adminNav } from "@/lib/nav";
// the same fonts as the other dashboards (Inter + Plus Jakarta Sans), then this panel's own glass design system
import "@/features/parent-dashboard/styles/fonts.css";
import "@/components/admin/admin.css";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/giris");

  // the two things an admin acts on first, shown in the sidebar on every page
  const [paymentsDue, newApplications] = await Promise.all([
    prisma.payment.count({ where: { status: "DUE", cycle: { not: null } } }),
    prisma.trialBooking.count({ where: { stage: "NEW" } }),
  ]);

  return (
    <div className="ad-root">
      <AdminChrome />
      <div className="ad-glow-a" aria-hidden="true" />
      <div className="ad-glow-b" aria-hidden="true" />
      <div className="ad-glow-c" aria-hidden="true" />
      <AdminSidebar
        items={adminNav}
        user={{ name: session.user.name ?? "Admin", role: "Admin" }}
        glance={{ paymentsDue, newApplications }}
      />
      <div className="relative z-[1] min-w-0 md:ml-[270px]">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
