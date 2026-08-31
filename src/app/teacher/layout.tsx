import { redirect } from "next/navigation";
import { DashHeader } from "@/components/dash/header";
import { DashRail } from "@/components/dash/rail";
import { PageTransition } from "@/components/app/page-transition";
import { getCurrentTeacher } from "@/lib/data";
import { getTeacherNavItems } from "@/lib/nav";

const labels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) redirect("/giris");

  return (
    <div className="flex min-h-screen flex-col bg-dash-paper font-app text-dash-ink dark:bg-dash-dark-bg dark:text-white">
      <DashHeader
        brandHref="/teacher"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        avatarUrl={teacher.photoUrl}
        settingsHref="/teacher/profile"
        locale="az"
        labels={labels}
        showLanguageSwitcher={false}
      />
      <div className="flex flex-1">
        <DashRail items={getTeacherNavItems()} brandHref="/teacher" />
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
    </div>
  );
}
