import Image from "next/image";
import { FolderGit2, Award } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function StudentPortfolioPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const { locale, dict } = getServerDictionary();

  return (
    <div>
      <DashTopbar
        title={dict.studentPortfolio.title}
        userName={student.user?.name ?? student.firstName}
        userEmail={student.user?.email ?? ""}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/student/settings"
        showMobileMenuTrigger={false}
      />

      <div className="space-y-8 p-6 md:p-10">
        <DashCard className="flex flex-col items-center gap-6 p-8 sm:flex-row">
          <Avatar name={`${student.firstName} ${student.lastName}`} src={student.avatarUrl} size={80} />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-2xl text-dash-ink dark:text-white">{student.firstName} {student.lastName}</h2>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {student.enrollments.map((e) => (
                <Badge key={e.id} variant="app-cyan">{e.course.name}</Badge>
              ))}
            </div>
          </div>
        </DashCard>

        <div className="grid gap-8 lg:grid-cols-3">
          <DashCard className="lg:col-span-1">
            <h3 className="mb-6 font-display text-base text-dash-ink dark:text-white">{dict.studentPortfolio.skillsTitle}</h3>
            {student.progress.length === 0 ? (
              <p className="text-sm text-dash-ink/50 dark:text-white/45">{dict.studentPortfolio.noSkills}</p>
            ) : (
              <div className="space-y-5">
                {student.progress.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1.5 flex justify-between text-xs text-dash-ink/50 dark:text-white/40">
                      <span>{p.skill}</span>
                      <span className="font-bold text-dash-ink dark:text-white">{p.percent}%</span>
                    </div>
                    <Progress value={p.percent} color="cyan" />
                  </div>
                ))}
              </div>
            )}
          </DashCard>

          <div className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-display text-base text-dash-ink dark:text-white">
              <FolderGit2 className="h-4 w-4 text-electric-500" /> {dict.studentPortfolio.projectsTitle}
            </h3>
            {student.projects.length === 0 ? (
              <DashEmptyState icon={FolderGit2} title={dict.studentPortfolio.noProjectsTitle} description={dict.studentPortfolio.noProjectsDesc} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {student.projects.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-lg border border-dash-rule bg-white dark:border-dash-dark-rule dark:bg-dash-dark-surface">
                    <div className="relative h-36">
                      <Image src={p.imageUrl} alt={p.title} fill sizes="400px" className="object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-dash-ink dark:text-white">{p.title}</p>
                      <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">{p.technologies.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 font-display text-base text-dash-ink dark:text-white">
                <Award className="h-4 w-4 text-amber-500" /> {dict.studentPortfolio.certificatesTitle}
              </h3>
              <DashEmptyState icon={Award} title={dict.studentPortfolio.noCertificatesTitle} description={dict.studentPortfolio.noCertificatesDesc} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
