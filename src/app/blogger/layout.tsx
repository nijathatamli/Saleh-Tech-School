import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminChrome } from "@/components/admin/admin-chrome";
import { PageTransition } from "@/components/app/page-transition";
import { bloggerNav } from "@/lib/nav";
// the blog panel wears the admin panel's design system (same stylesheet, same top bar with tabs)
import "@/features/parent-dashboard/styles/fonts.css";
import "@/components/admin/admin.css";

export const metadata: Metadata = { title: "Bloq paneli", robots: { index: false, follow: false } };

export default async function BloggerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "BLOGGER") redirect("/giris");

  const tabs = bloggerNav.map((n) => ({ href: n.href, label: n.label }));
  return (
    <div className="ad-root">
      <AdminChrome />
      <AdminHeader
        tabs={tabs}
        badges={{}}
        user={{ name: session.user.name ?? "Müəllif", email: session.user.email ?? "" }}
        shell={{
          home: "/blogger",
          ariaLabel: "Bloq paneli naviqasiyası",
          logoLabel: "Saleh Tech School — bloq paneli",
          settingsHref: "/blogger/profil",
          createLabel: "Yeni yazı",
          create: [{ label: "Yeni yazı", href: "/blogger/yazilar/yeni" }],
        }}
      />
      <main className="ad-main">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
