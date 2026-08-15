import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppSidebar } from "@/components/app/sidebar";
import { adminNav } from "@/lib/nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/giris");

  return (
    <div className="flex min-h-screen bg-navy-50 font-app text-navy-900">
      <AppSidebar items={adminNav} brandHref="/admin" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
