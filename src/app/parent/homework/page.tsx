import { BookOpen } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { ParentPageHeader } from "@/components/dash/parent-page-header";
import { DashCard } from "@/components/dash/card";
import { DashEmptyState } from "@/components/dash/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { homeworkStatusMeta, homeworkStatusOrder } from "@/lib/homework";
import { getServerDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function HomeworkPage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const { dict } = getServerDictionary();
  const statusMeta = homeworkStatusMeta(dict);

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div className="mx-auto max-w-[1240px]">
        <ParentPageHeader title={dict.homework.title} />
        <div className="px-6 pb-20 md:px-11">
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

  const sorted = [...submissions].sort(
    (a, b) => homeworkStatusOrder.indexOf(a.status) - homeworkStatusOrder.indexOf(b.status)
  );

  return (
    <div className="mx-auto max-w-[1240px]">
      <ParentPageHeader title={dict.homework.title} />

      <div className="space-y-6 px-6 pb-20 md:px-11">
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
          <DashCard className="rounded-[22px] p-0">
            <div className="divide-y divide-dash-ink/[0.06] dark:divide-white/10">
              {sorted.map((s) => {
                const meta = statusMeta[s.status as keyof typeof statusMeta];
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-4 p-6">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold">{s.homework.title}</p>
                      <p className="mt-1 text-xs text-grey-500">
                        {s.homework.lesson.class.course.name} · {dict.homework.dueDate} {formatDate(s.homework.dueDate)}
                      </p>
                      {s.feedback && (
                        <p className="mt-2 rounded-lg bg-dash-paper-2 p-3 text-xs italic text-dash-ink/70 dark:bg-white/5 dark:text-white/60">
                          &quot;{s.feedback}&quot;
                        </p>
                      )}
                    </div>
                    {s.score !== null && <span className="font-semibold">{s.score}/100</span>}
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
