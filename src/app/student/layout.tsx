import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { getCurrentStudent } from "@/lib/data";
import { studentNav } from "@/lib/nav";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/giris");

  return (
    <div className="flex min-h-screen bg-navy-50 font-app text-navy-900">
      <AppSidebar items={studentNav} brandHref="/student" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
