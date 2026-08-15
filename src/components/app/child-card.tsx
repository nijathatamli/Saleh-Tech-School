import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { attendanceRate, averageProgress } from "@/lib/utils";
import type { Attendance, Course, Enrollment, SkillProgress, StudentProfile } from "@prisma/client";

type ChildWithRelations = StudentProfile & {
  attendance: Attendance[];
  progress: SkillProgress[];
  enrollments: (Enrollment & { course: Course })[];
};

export function ChildCard({ child }: { child: ChildWithRelations }) {
  const rate = attendanceRate(child.attendance);
  const progress = averageProgress(child.progress);
  const course = child.enrollments[0]?.course;

  return (
    <Link
      href={`/parent/children/${child.id}`}
      className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        <Avatar name={`${child.firstName} ${child.lastName}`} src={child.avatarUrl} size={52} />
        <div>
          <p className="font-bold text-navy-900">
            {child.firstName} {child.lastName}
          </p>
          <p className="text-xs text-navy-400">{course?.name ?? "Kurs təyin edilməyib"} · Səviyyə {child.level}</p>
        </div>
        <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
          {child.points.toLocaleString("az-AZ")} ⭐
        </span>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-navy-400">
            <span>Davamiyyət</span>
            <span className="font-bold text-navy-900">{rate}%</span>
          </div>
          <Progress value={rate} color="emerald" />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-navy-400">
            <span>Tərəqqi</span>
            <span className="font-bold text-navy-900">{progress}%</span>
          </div>
          <Progress value={progress} color="electric" />
        </div>
      </div>
    </Link>
  );
}
