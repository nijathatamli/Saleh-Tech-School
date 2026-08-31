import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, CalendarCheck } from "lucide-react";
import { getClassForTeacher, getCurrentTeacher } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashLedgerCard, DashLedgerRow } from "@/components/dash/ledger";
import { DashTabs } from "@/components/dash/tabs";
import { Avatar } from "@/components/ui/avatar";
import { attendanceRate, averageProgress, averageGrade, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

export default async function TeacherClassDetailPage({ params }: { params: { id: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classGroup = await getClassForTeacher(params.id);
  if (!classGroup) notFound();

  const lessonsTab = (
    classGroup.lessons.length === 0 ? (
      <DashEmptyState icon={CalendarCheck} title="Hələ dərs yoxdur" />
    ) : (
      <DashLedgerCard>
        {classGroup.lessons.map((l) => (
          <Link key={l.id} href={`/teacher/classes/${classGroup.id}/attendance/${l.id}`}>
            <DashLedgerRow
              icon={CalendarCheck}
              title={l.title}
              meta={formatDate(l.date)}
              trailing={<span className="text-xs font-bold text-electric-600">Davamiyyəti işarələ</span>}
            />
          </Link>
        ))}
      </DashLedgerCard>
    )
  );

  const rosterTab = (
    classGroup.enrollments.length === 0 ? (
      <DashEmptyState icon={Users} title="Bu sinifdə tələbə yoxdur" />
    ) : (
      <DashLedgerCard>
        {classGroup.enrollments.map((e) => (
          <Link key={e.id} href={`/teacher/students/${e.student.id}`}>
            <div className="flex flex-wrap items-center gap-4 border-b border-dash-rule/70 px-5 py-4 transition-colors last:border-0 hover:bg-dash-paper-2/60 dark:border-dash-dark-rule/70 dark:hover:bg-white/[0.03]">
              <Avatar name={`${e.student.firstName} ${e.student.lastName}`} src={e.student.avatarUrl} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-dash-ink dark:text-white">
                  {e.student.firstName} {e.student.lastName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-6 text-xs">
                <div className="text-right">
                  <p className="font-bold text-dash-ink dark:text-white">{attendanceRate(e.student.attendance)}%</p>
                  <p className="text-dash-ink/40 dark:text-white/35">Davamiyyət</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dash-ink dark:text-white">{averageProgress(e.student.progress)}%</p>
                  <p className="text-dash-ink/40 dark:text-white/35">Tərəqqi</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-dash-ink dark:text-white">{averageGrade(e.student.grades)}%</p>
                  <p className="text-dash-ink/40 dark:text-white/35">Qiymət</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </DashLedgerCard>
    )
  );

  return (
    <div>
      <DashTopbar
        title={classGroup.name}
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashCard>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="h-9 w-9 shrink-0 rounded-lg bg-electric-500" aria-hidden />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{classGroup.course.name}</p>
                <h2 className="mt-0.5 font-display text-xl text-dash-ink dark:text-white">{classGroup.name}</h2>
                <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/40">{classGroup.schedule}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-dash-paper-2 px-4 py-2 text-sm font-bold text-dash-ink dark:bg-white/5 dark:text-white">
              <Users className="h-4 w-4 text-electric-500" />
              {classGroup.enrollments.length} tələbə
            </div>
          </div>
        </DashCard>

        <DashTabs
          tabs={[
            { label: "Dərslər", content: lessonsTab },
            { label: "Tələbələr", content: rosterTab },
          ]}
        />
      </div>
    </div>
  );
}
