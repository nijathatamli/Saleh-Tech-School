import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, CalendarCheck } from "lucide-react";
import { getClassForTeacher, getCurrentTeacher } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { attendanceRate, averageProgress, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeacherClassDetailPage({ params }: { params: { id: string } }) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  const classGroup = await getClassForTeacher(params.id);
  if (!classGroup) notFound();

  return (
    <div>
      <AppTopbar title={classGroup.name} userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-electric-600">{classGroup.course.name}</p>
              <h2 className="mt-1 font-display text-xl text-navy-900">{classGroup.name}</h2>
              <p className="mt-1 text-sm text-navy-400">{classGroup.schedule}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-navy-50 px-4 py-2 text-sm font-bold text-navy-900">
              <Users className="h-4 w-4 text-electric-500" />
              {classGroup.enrollments.length} tələbə
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <h3 className="border-b border-navy-100 p-6 font-display text-base text-navy-900">Tələbələr</h3>
          {classGroup.enrollments.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="Bu sinifdə tələbə yoxdur" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs font-bold uppercase tracking-widest text-navy-400">
                    <th className="px-6 py-3">Ad</th>
                    <th className="px-6 py-3">Davamiyyət</th>
                    <th className="px-6 py-3">Tərəqqi</th>
                    <th className="px-6 py-3">Xal</th>
                  </tr>
                </thead>
                <tbody>
                  {classGroup.enrollments.map((e) => (
                    <tr key={e.id} className="border-b border-navy-50 last:border-0">
                      <td className="px-6 py-4">
                        <Link
                          href={`/teacher/students/${e.student.id}`}
                          className="flex items-center gap-3 font-bold text-navy-900 hover:text-electric-600"
                        >
                          <Avatar name={`${e.student.firstName} ${e.student.lastName}`} src={e.student.avatarUrl} size={32} />
                          {e.student.firstName} {e.student.lastName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-navy-600">{attendanceRate(e.student.attendance)}%</td>
                      <td className="px-6 py-4 text-navy-600">{averageProgress(e.student.progress)}%</td>
                      <td className="px-6 py-4 font-bold text-navy-900">{e.student.points.toLocaleString("az-AZ")} ⭐</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <h3 className="border-b border-navy-100 p-6 font-display text-base text-navy-900">Dərslər</h3>
          {classGroup.lessons.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={CalendarCheck} title="Hələ dərs yoxdur" />
            </div>
          ) : (
            <div className="divide-y divide-navy-100">
              {classGroup.lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/teacher/classes/${classGroup.id}/attendance/${l.id}`}
                  className="flex items-center justify-between p-5 transition-colors hover:bg-navy-50"
                >
                  <div>
                    <p className="text-sm font-bold text-navy-900">{l.title}</p>
                    <p className="text-xs text-navy-400">{formatDate(l.date)}</p>
                  </div>
                  <span className="text-xs font-bold text-electric-600">Davamiyyəti işarələ</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
