import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { getCurrentTeacher } from "@/lib/data";
import { teacherNav } from "@/lib/nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) redirect("/giris");

  return (
    <div className="flex min-h-screen bg-navy-50 font-app text-navy-900">
      <AppSidebar items={teacherNav} brandHref="/teacher" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
