import { BookOpen } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashEmptyState } from "@/components/dash/empty-state";
import { DashLedgerCard, DashStatusPill } from "@/components/dash/ledger";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import type { Dictionary } from "@/i18n";
import { submitHomework } from "./actions";

export const dynamic = "force-dynamic";

function statusMeta(dict: Dictionary) {
  return {
    PENDING: { label: dict.studentHomework.statusPending, tone: "pending" as const },
    SUBMITTED: { label: dict.studentHomework.statusSubmitted, tone: "closed" as const },
    GRADED: { label: dict.studentHomework.statusGraded, tone: "done" as const },
    OVERDUE: { label: dict.studentHomework.statusOverdue, tone: "pending" as const },
  };
}

export default async function StudentHomeworkPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const { locale, dict } = getServerDictionary();
  const meta = statusMeta(dict);

  const submissions = await prisma.submission.findMany({
    where: { studentId: student.id },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "desc" } },
  });

  const order = ["OVERDUE", "PENDING", "SUBMITTED", "GRADED"];
  const sorted = [...submissions].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <div>
      <DashTopbar
        title={dict.studentHomework.title}
        userName={student.user?.name ?? student.firstName}
        userEmail={student.user?.email ?? ""}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/student/settings"
        showMobileMenuTrigger={false}
      />

      <div className="p-6 md:p-10">
        {submissions.length === 0 ? (
          <DashEmptyState icon={BookOpen} title={dict.studentHomework.noneTitle} />
        ) : (
          <DashLedgerCard>
            {sorted.map((s) => {
              const m = meta[s.status as keyof typeof meta];
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-4 border-b border-dash-rule/70 p-5 last:border-0 dark:border-dash-dark-rule/70">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-dash-ink dark:text-white">{s.homework.title}</p>
                    <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">
                      {s.homework.lesson.class.course.name} · {dict.studentHomework.dueDate} {formatDate(s.homework.dueDate)}
                    </p>
                    {s.feedback && (
                      <p className="mt-2 rounded-lg bg-dash-paper-2 p-2 text-xs italic text-dash-ink/70 dark:bg-white/5 dark:text-white/60">
                        &quot;{s.feedback}&quot;
                      </p>
                    )}
                  </div>
                  {s.score !== null && <span className="font-bold text-dash-ink dark:text-white">{s.score}/100</span>}
                  <DashStatusPill tone={m.tone}>{m.label}</DashStatusPill>
                  {s.status === "PENDING" && (
                    <form action={submitHomework.bind(null, s.id)}>
                      <Button type="submit" variant="app" size="sm">{dict.studentHomework.submit}</Button>
                    </form>
                  )}
                </div>
              );
            })}
          </DashLedgerCard>
        )}
      </div>
    </div>
  );
}
