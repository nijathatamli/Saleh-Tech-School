import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { DashCard } from "@/components/dash/card";
import { attendanceRate, averageGrade, monthlyAttendanceByClass } from "@/lib/utils";
import { getServerDictionary } from "@/i18n/server";
import { format } from "@/i18n/locales";
import type { Attendance, Course, Enrollment, Grade, Lesson, ClassGroup, StudentProfile } from "@prisma/client";

type AttendanceWithLesson = Attendance & { lesson: Lesson & { class: ClassGroup } };

type ChildWithRelations = StudentProfile & {
  attendance: AttendanceWithLesson[];
  grades: Grade[];
  enrollments: (Enrollment & { course: Course })[];
};

export function ChildCard({ child }: { child: ChildWithRelations }) {
  const { dict } = getServerDictionary();
  const rate = attendanceRate(child.attendance);
  const grade = averageGrade(child.grades);
  const course = child.enrollments[0]?.course;
  const monthly = monthlyAttendanceByClass(child.attendance)[0];

  return (
    <Link href={`/parent/children/${child.id}`} className="block">
      <DashCard interactive>
        <div className="flex items-center gap-4">
          <Avatar name={`${child.firstName} ${child.lastName}`} src={child.avatarUrl} size={52} />
          <div>
            <p className="font-bold text-dash-ink dark:text-white">
              {child.firstName} {child.lastName}
            </p>
            <p className="text-xs text-dash-ink/50 dark:text-white/40">
              {course?.name ?? dict.studentLeaderboard.courseNotAssigned} · {dict.childProfile.level} {child.level}
            </p>
          </div>
          <span className="ml-auto text-xs font-bold text-dash-ink/50 dark:text-white/40">
            {child.points.toLocaleString("az-AZ")} {dict.childProfile.points}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-dash-ink/50 dark:text-white/40">
              <span>{dict.childProfile.attendance}</span>
              <span className="font-bold text-dash-ink dark:text-white">
                {monthly ? format(dict.attendance.classesThisMonth, { x: monthly.attended, y: monthly.expected }) : `${rate}%`}
              </span>
            </div>
            <Progress value={rate} color="emerald" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-xs text-dash-ink/50 dark:text-white/40">
              <span>{dict.childProfile.teacherFeedbackTitle}</span>
              <span className="font-bold text-dash-ink dark:text-white">{grade}%</span>
            </div>
            <Progress value={grade} color="electric" />
          </div>
        </div>
      </DashCard>
    </Link>
  );
}
