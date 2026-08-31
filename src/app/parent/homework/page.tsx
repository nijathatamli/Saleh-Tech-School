import { BookOpen } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";
import type { Dictionary } from "@/i18n";

export const dynamic = "force-dynamic";

function statusVariant(dict: Dictionary) {
  return {
    PENDING: { label: dict.homework.statusPending, variant: "warning" as const },
    SUBMITTED: { label: dict.homework.statusSubmitted, variant: "default" as const },
    GRADED: { label: dict.homework.statusGraded, variant: "success" as const },
    OVERDUE: { label: dict.homework.statusOverdue, variant: "danger" as const },
  };
}

export default async function HomeworkPage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { locale, dict } = getServerDictionary();
  const labels = topbarLabels(dict);
  const statusMeta = statusVariant(dict);

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div>
        <DashTopbar title={dict.homework.title} userName={parent.user.name} userEmail={parent.user.email} locale={locale} labels={labels} settingsHref="/parent/settings" showMobileMenuTrigger={false} />
        <div className="p-6 md:p-10">
          <DashEmptyState icon={BookOpen} title={dict.homework.childNotFound} />
        </div>
      </div>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: { studentId: child.id },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "desc" } },
  });

  const order = ["OVERDUE", "PENDING", "SUBMITTED", "GRADED"];
  const sorted = [...submissions].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  return (
    <div>
      <DashTopbar title={dict.homework.title} userName={parent.user.name} userEmail={parent.user.email} locale={locale} labels={labels} settingsHref="/parent/settings" showMobileMenuTrigger={false} />

      <div className="space-y-6 p-6 md:p-10">
        {parent.children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => (
              <a
                key={c.id}
                href={`/parent/homework?child=${c.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  c.id === child.id
                    ? "bg-electric-500 text-white"
                    : "border border-dash-rule bg-white text-dash-ink/50 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white/50"
                }`}
              >
                {c.firstName} {c.lastName}
              </a>
            ))}
          </div>
        )}

        {submissions.length === 0 ? (
          <DashEmptyState icon={BookOpen} title={dict.homework.noneTitle} description={dict.homework.noneDesc} />
        ) : (
          <DashCard className="p-0">
            <div className="divide-y divide-dash-rule dark:divide-dash-dark-rule">
              {sorted.map((s) => {
                const meta = statusMeta[s.status as keyof typeof statusMeta];
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-4 p-5">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-dash-ink dark:text-white">{s.homework.title}</p>
                      <p className="mt-1 text-xs text-dash-ink/50 dark:text-white/40">
                        {s.homework.lesson.class.course.name} · {dict.homework.dueDate} {formatDate(s.homework.dueDate)}
                      </p>
                      {s.feedback && (
                        <p className="mt-2 rounded-lg bg-dash-paper-2 p-2 text-xs italic text-dash-ink/70 dark:bg-white/5 dark:text-white/60">
                          &quot;{s.feedback}&quot;
                        </p>
                      )}
                    </div>
                    {s.score !== null && <span className="font-bold text-dash-ink dark:text-white">{s.score}/100</span>}
                    <Badge variant={meta.variant} size="md">{meta.label}</Badge>
                  </div>
                );
              })}
            </div>
          </DashCard>
        )}
      </div>
    </div>
  );
}
