import Link from "next/link";
import { School } from "lucide-react";
import { getCurrentTeacher } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function TeacherClassesPage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <AppTopbar title="Siniflərim" userName={teacher.user.name} userEmail={teacher.user.email} />
      <div className="p-6 md:p-10">
        {teacher.classes.length === 0 ? (
          <EmptyState icon={School} title="Hələ sinif təyin edilməyib" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teacher.classes.map((c) => (
              <Link
                key={c.id}
                href={`/teacher/classes/${c.id}`}
                className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <p className="font-bold text-navy-900">{c.name}</p>
                <p className="mt-1 text-xs text-navy-400">{c.course.name}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-navy-400">
                  <span>{c.schedule}</span>
                  <span className="font-bold text-navy-900">{c.enrollments.length} tələbə</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
