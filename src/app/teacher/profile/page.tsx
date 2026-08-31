import { getCurrentTeacher } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashSectionLabel } from "@/components/dash/ledger";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherProfilePage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <DashTopbar
        title="Profil"
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="max-w-2xl space-y-6 p-6 md:p-10">
        <DashCard className="flex items-center gap-4">
          <Avatar name={teacher.user.name} src={teacher.photoUrl} size={64} />
          <div>
            <p className="font-bold text-dash-ink dark:text-white">{teacher.user.name}</p>
            <p className="text-sm text-dash-ink/50 dark:text-white/40">{teacher.position}</p>
          </div>
        </DashCard>

        <DashCard>
          <DashSectionLabel className="mb-3">Bio</DashSectionLabel>
          <p className="text-sm leading-relaxed text-dash-ink/70 dark:text-white/60">{teacher.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.specializations.map((s) => (
              <Badge key={s} variant="app-electric">{s}</Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-dash-ink/50 dark:text-white/40">{teacher.experienceYears} illik təcrübə</p>
        </DashCard>
      </div>
    </div>
  );
}
