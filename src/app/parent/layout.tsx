import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { getCurrentParent } from "@/lib/data";
import { parentNav } from "@/lib/nav";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const parent = await getCurrentParent();
  if (!parent) redirect("/giris");

  return (
    <div className="flex min-h-screen bg-navy-50 font-app text-navy-900">
      <AppSidebar items={parentNav} brandHref="/parent" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
