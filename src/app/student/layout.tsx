import { redirect } from "next/navigation";
import { DashHeader } from "@/components/dash/header";
import { DashRail } from "@/components/dash/rail";
import { PageTransition } from "@/components/app/page-transition";
import { getCurrentStudent } from "@/lib/data";
import { getStudentNavItems } from "@/lib/nav";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/giris");

  const { locale, dict } = getServerDictionary();

  return (
    <div className="flex min-h-screen flex-col bg-dash-paper font-app text-dash-ink dark:bg-dash-dark-bg dark:text-white">
      <DashHeader
        brandHref="/student"
        userName={student.user?.name ?? `${student.firstName} ${student.lastName}`}
        userEmail={student.user?.email ?? ""}
        avatarUrl={student.avatarUrl}
        settingsHref="/student/settings"
        locale={locale}
        labels={topbarLabels(dict)}
      />
      <div className="flex flex-1">
        <DashRail items={getStudentNavItems(dict)} brandHref="/student" />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
