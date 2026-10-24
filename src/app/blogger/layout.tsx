import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { PageTransition } from "@/components/app/page-transition";
import { bloggerNav } from "@/lib/nav";
// the blog panel wears the admin panel's design system (same stylesheet, same glass sidebar)
import "@/features/parent-dashboard/styles/fonts.css";
import "@/components/admin/admin.css";

export const metadata: Metadata = { title: "Bloq paneli", robots: { index: false, follow: false } };

export default async function BloggerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "BLOGGER") redirect("/giris");

  return (
    <div className="ad-root">
      <AdminChrome />
      <div className="ad-glow-a" aria-hidden="true" />
      <div className="ad-glow-b" aria-hidden="true" />
      <div className="ad-glow-c" aria-hidden="true" />
      <AdminSidebar
        items={bloggerNav}
        user={{ name: session.user.name ?? "Müəllif", role: "Bloq müəllifi" }}
        home="/blogger"
        groups={[["/blogger"], ["/blogger/profil"]]}
        ariaLabel="Bloq paneli naviqasiyası"
        logoLabel="Saleh Tech School — bloq paneli"
      />
      <div className="relative z-[1] min-w-0 md:ml-[270px]">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}
