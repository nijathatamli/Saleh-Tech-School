import { notFound } from "next/navigation";
import Image from "next/image";
import { Award, FolderGit2 } from "lucide-react";
import { getChildForParent, getCurrentParent } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashAttendanceStatusCard } from "@/components/dash/ledger";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { attendanceRate, averageGrade, monthlyAttendanceByClass } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import { format } from "@/i18n/locales";

export const dynamic = "force-dynamic";

export default async function ChildProfilePage({ params }: { params: { id: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const child = await getChildForParent(params.id);
  if (!child) notFound();

  const { locale, dict } = getServerDictionary();
  const rate = attendanceRate(child.attendance);
  const grade = averageGrade(child.grades);
  const monthly = monthlyAttendanceByClass(child.attendance)[0];
  const age = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const absentCount = child.attendance.filter((a) => a.status === "ABSENT").length;
  const lateCount = child.attendance.filter((a) => a.status === "LATE").length;
  const excusedCount = child.attendance.filter((a) => a.status === "EXCUSED").length;

  return (
    <div>
      <DashTopbar
        title={`${child.firstName} ${child.lastName}`}
        userName={parent.user.name}
        userEmail={parent.user.email}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/parent/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashCard className="flex flex-col items-center gap-6 p-8 sm:flex-row">
          <Avatar name={`${child.firstName} ${child.lastName}`} src={child.avatarUrl} size={80} />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-xl text-dash-ink dark:text-white">
              {child.firstName} {child.lastName}
            </h2>
            <p className="mt-1 text-sm text-dash-ink/50 dark:text-white/45">
              {age} {dict.childProfile.yearsOld} · {dict.childProfile.level} {child.level}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {child.enrollments.map((e) => (
                <Badge key={e.id} variant="app-electric">
                  {e.course.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="ml-0 grid grid-cols-3 gap-6 sm:ml-auto">
            <div className="text-center">
              <p className="font-display text-xl text-dash-ink dark:text-white">{rate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-dash-ink/40 dark:text-white/35">{dict.childProfile.attendance}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-dash-ink dark:text-white">{grade}%</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-dash-ink/40 dark:text-white/35">{dict.childProfile.teacherFeedbackTitle}</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-dash-ink dark:text-white">
                {monthly ? format(dict.attendance.classesThisMonth, { x: monthly.attended, y: monthly.expected }) : "—"}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-dash-ink/40 dark:text-white/35">{dict.attendance.classesThisMonthLabel}</p>
            </div>
          </div>
        </DashCard>

        <DashAttendanceStatusCard
          rate={rate}
          attended={monthly?.attended ?? 0}
          total={monthly?.expected ?? 0}
          breakdown={format(dict.attendance.breakdown, { absent: absentCount, late: lateCount, excused: excusedCount })}
          warning={absentCount >= 3}
          standingLabel={dict.attendance.standingGood}
          warningLabel={dict.attendance.standingWarning}
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <DashCard>
              <h3 className="mb-6 font-display text-base text-dash-ink dark:text-white">{dict.childProfile.teacherFeedbackTitle}</h3>
              {child.grades.length === 0 ? (
                <p className="text-sm text-dash-ink/50 dark:text-white/45">{dict.childProfile.noGrades}</p>
              ) : (
                <div className="space-y-4">
                  {child.grades.map((g) => (
                    <div key={g.id}>
                      <div className="mb-1.5 flex justify-between text-xs text-dash-ink/50 dark:text-white/40">
                        <span>{g.subject}</span>
                        <span className="font-bold text-dash-ink dark:text-white">
                          {g.score}/{g.maxScore}
                        </span>
                      </div>
                      <Progress value={Math.round((g.score / g.maxScore) * 100)} color="electric" />
                    </div>
                  ))}
                </div>
              )}
            </DashCard>

            <DashCard>
              <h3 className="mb-6 flex items-center gap-2 font-display text-base text-dash-ink dark:text-white">
                <FolderGit2 className="h-4 w-4 text-electric-500" /> {dict.childProfile.projectsTitle}
              </h3>
              {child.projects.length === 0 ? (
                <DashEmptyState icon={FolderGit2} title={dict.childProfile.noProjectsTitle} />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {child.projects.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-lg border border-dash-rule dark:border-dash-dark-rule">
                      <div className="relative h-32">
                        <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold text-dash-ink dark:text-white">{p.title}</p>
                        <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">{p.technologies.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </DashCard>
          </div>

          <div className="space-y-8">
            <DashCard>
              <h3 className="mb-6 flex items-center gap-2 font-display text-base text-dash-ink dark:text-white">
                <Award className="h-4 w-4 text-amber-500" /> {dict.childProfile.certificatesTitle}
              </h3>
              <DashEmptyState icon={Award} title={dict.childProfile.noCertificatesTitle} description={dict.childProfile.noCertificatesDesc} />
            </DashCard>
          </div>
        </div>
      </div>
    </div>
  );
}
