import { BookOpen } from "lucide-react";
import { getCurrentParent } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const statusVariant: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default" }> = {
  PENDING: { label: "Gözləyir", variant: "warning" },
  SUBMITTED: { label: "Təqdim edilib", variant: "default" },
  GRADED: { label: "Qiymətləndirilib", variant: "success" },
  OVERDUE: { label: "Gecikmiş", variant: "danger" },
};

export default async function HomeworkPage({ searchParams }: { searchParams: { child?: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const child = searchParams.child
    ? parent.children.find((c) => c.id === searchParams.child)
    : parent.children[0];

  if (!child) {
    return (
      <div>
        <AppTopbar title="Ev tapşırığı" userName={parent.user.name} userEmail={parent.user.email} />
        <div className="p-6 md:p-10">
          <EmptyState icon={BookOpen} title="Uşaq tapılmadı" />
        </div>
      </div>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: { studentId: child.id },
    include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    orderBy: { homework: { dueDate: "desc" } },
  });

  const groups = {
    pending: submissions.filter((s) => s.status === "PENDING"),
    submitted: submissions.filter((s) => s.status === "SUBMITTED" || s.status === "GRADED"),
    overdue: submissions.filter((s) => s.status === "OVERDUE"),
  };

  return (
    <div>
      <AppTopbar title="Ev tapşırığı" userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-10 p-6 md:p-10">
        {parent.children.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map((c) => (
              <a
                key={c.id}
                href={`/parent/homework?child=${c.id}`}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  c.id === child.id ? "bg-electric-500 text-white" : "border border-navy-100 bg-white text-navy-400"
                }`}
              >
                {c.firstName} {c.lastName}
              </a>
            ))}
          </div>
        )}

        {submissions.length === 0 ? (
          <EmptyState icon={BookOpen} title="Hələ ev tapşırığı yoxdur" description="Yeni tapşırıqlar burada görünəcək." />
        ) : (
          [
            { title: "Gecikmiş", items: groups.overdue },
            { title: "Gözləyən", items: groups.pending },
            { title: "Tamamlanmış", items: groups.submitted },
          ].map(
            (section) =>
              section.items.length > 0 && (
                <div key={section.title}>
                  <h3 className="mb-4 font-display text-base text-navy-900">{section.title}</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {section.items.map((s) => {
                      const meta = statusVariant[s.status];
                      return (
                        <div key={s.id} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-navy-900">{s.homework.title}</p>
                              <p className="mt-1 text-xs text-navy-400">{s.homework.lesson.class.course.name}</p>
                            </div>
                            <Badge variant={meta.variant} size="md">{meta.label}</Badge>
                          </div>
                          <p className="mt-3 text-xs text-navy-400">Son tarix: {formatDate(s.homework.dueDate)}</p>
                          {s.score !== null && (
                            <p className="mt-2 text-sm font-bold text-navy-900">Qiymət: {s.score}/100</p>
                          )}
                          {s.feedback && (
                            <p className="mt-2 rounded-xl bg-navy-50 p-3 text-xs italic text-navy-600">"{s.feedback}"</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
          )
        )}
      </div>
    </div>
  );
}
