import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { AppTopbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherHomeworkPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classIds = teacher.classes.map((c) => c.id);
  const homeworks = await prisma.homework.findMany({
    where: { lesson: { classId: { in: classIds } } },
    include: {
      lesson: { include: { class: { include: { course: true } } } },
      submissions: true,
    },
    orderBy: { dueDate: "desc" },
  });

  return (
    <div>
      <AppTopbar title="Ev tapşırıqları" userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-6 p-6 md:p-10">
        <div className="flex justify-end">
          <Button asChild variant="app">
            <Link href="/teacher/homework/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Yeni tapşırıq
            </Link>
          </Button>
        </div>

        {homeworks.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Hələ tapşırıq yaradılmayıb" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {homeworks.map((h) => {
              const pending = h.submissions.filter((s) => s.status === "SUBMITTED").length;
              return (
                <Link
                  key={h.id}
                  href={`/teacher/homework/${h.id}`}
                  className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <p className="font-bold text-navy-900">{h.title}</p>
                  <p className="mt-1 text-xs text-navy-400">{h.lesson.class.course.name} · Son tarix {formatDate(h.dueDate)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-navy-400">{h.submissions.length} tələbə</span>
                    {pending > 0 && (
                      <span className="rounded-full bg-amber-500/10 px-3 py-1 font-bold text-amber-600">
                        {pending} qiymətləndirmə gözləyir
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
