import { notFound } from "next/navigation";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashLedgerCard, DashStatusPill } from "@/components/dash/ledger";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { gradeSubmission } from "../actions";

export const dynamic = "force-dynamic";

const topbarLabels = { language: "Dil", profile: "Profil", settings: "Tənzimləmələr", logout: "Çıxış", light: "İşıqlı", dark: "Qaranlıq" };

const statusMeta: Record<string, { label: string; tone: "pending" | "done" | "closed" }> = {
  PENDING: { label: "Gözləyir", tone: "closed" },
  SUBMITTED: { label: "Təqdim edilib", tone: "pending" },
  GRADED: { label: "Qiymətləndirilib", tone: "done" },
  OVERDUE: { label: "Gecikmiş", tone: "pending" },
};

export default async function HomeworkGradingPage({ params }: { params: { id: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const homework = await prisma.homework.findFirst({
    where: { id: params.id, lesson: { class: { teacherId: teacher.id } } },
    include: {
      lesson: { include: { class: { include: { course: true } } } },
      submissions: { include: { student: true }, orderBy: { student: { firstName: "asc" } } },
    },
  });
  if (!homework) notFound();

  return (
    <div>
      <DashTopbar
        title={homework.title}
        userName={teacher.user.name}
        userEmail={teacher.user.email}
        locale="az"
        labels={topbarLabels}
        settingsHref="/teacher/profile"
        showLanguageSwitcher={false}
        showMobileMenuTrigger={false}
      />

      <div className="space-y-6 p-6 md:p-10">
        <DashCard>
          <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{homework.lesson.class.course.name}</p>
          <h2 className="mt-1 font-display text-lg text-dash-ink dark:text-white">{homework.title}</h2>
          <p className="mt-2 text-sm text-dash-ink/60 dark:text-white/50">{homework.description}</p>
          <p className="mt-2 text-xs text-dash-ink/45 dark:text-white/40">Son tarix: {formatDate(homework.dueDate)}</p>
        </DashCard>

        <DashLedgerCard>
          {homework.submissions.map((s) => {
            const meta = statusMeta[s.status];
            return (
              <div
                key={s.id}
                className="flex flex-col gap-4 border-b border-dash-rule/70 p-5 last:border-0 dark:border-dash-dark-rule/70 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                  <Avatar name={`${s.student.firstName} ${s.student.lastName}`} src={s.student.avatarUrl} size={36} />
                  <span className="font-bold text-dash-ink dark:text-white">
                    {s.student.firstName} {s.student.lastName}
                  </span>
                </div>
                <DashStatusPill tone={meta.tone}>{meta.label}</DashStatusPill>

                {s.status === "GRADED" ? (
                  <div className="flex-1 text-sm">
                    <span className="font-bold text-dash-ink dark:text-white">{s.score}/100</span>
                    {s.feedback && <span className="ml-2 italic text-dash-ink/50 dark:text-white/40">&quot;{s.feedback}&quot;</span>}
                  </div>
                ) : s.status === "SUBMITTED" ? (
                  <form action={gradeSubmission} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="submissionId" value={s.id} />
                    <input
                      type="number"
                      name="score"
                      min={0}
                      max={100}
                      required
                      placeholder="Bal"
                      className="w-20 rounded-lg border border-dash-rule bg-white px-3 py-1.5 text-sm text-dash-ink focus:border-electric-500 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white"
                    />
                    <input
                      type="text"
                      name="feedback"
                      placeholder="Rəy yazın..."
                      className="min-w-[160px] flex-1 rounded-lg border border-dash-rule bg-white px-3 py-1.5 text-sm text-dash-ink focus:border-electric-500 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white"
                    />
                    <Button type="submit" variant="app" size="sm">Qiymətləndir</Button>
                  </form>
                ) : (
                  <span className="flex-1 text-xs text-dash-ink/45 dark:text-white/40">Tələbə hələ təqdim etməyib</span>
                )}
              </div>
            );
          })}
        </DashLedgerCard>
      </div>
    </div>
  );
}
