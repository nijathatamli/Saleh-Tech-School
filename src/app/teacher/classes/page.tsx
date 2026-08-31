import Link from "next/link";
import { School } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherClassesPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <DashTopbar
        title="Siniflərim"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />
      <div className="p-6 md:p-10">
        {teacher.classes.length === 0 ? (
          <DashEmptyState icon={School} title="Hələ sinif təyin edilməyib" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacher.classes.map((c) => (
              <Link key={c.id} href={`/teacher/classes/${c.id}`}>
                <DashCard interactive>
                  <p className="font-bold text-dash-ink dark:text-white">{c.name}</p>
                  <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">{c.course.name}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-dash-ink/50 dark:text-white/40">{c.schedule}</span>
                    <span className="font-bold text-dash-ink dark:text-white">{c.enrollments.length} tələbə</span>
                  </div>
                </DashCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
