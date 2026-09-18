import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TeacherClass, TeacherDashboardData, TeacherStudent } from "./types";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

const LEVEL_LABEL: Record<string, string> = { BEGINNER: "Başlanğıc", INTERMEDIATE: "Orta səviyyə", ADVANCED: "İrəli səviyyə" };
const CODE_PREFIX: Record<string, string> = {
  cybersecurity: "CS",
  python: "PY",
  programming: "PR",
  robotics: "RB",
  electronics: "EL",
  web: "WB",
  ai: "AI",
};

/** "CS-A" for the Kiber-A group of a cybersecurity course — the design's short class tag, derived, never stored. */
function classCode(category: string, className: string, index: number) {
  const prefix = CODE_PREFIX[category] ?? category.slice(0, 2).toUpperCase();
  const letter = className.match(/[-\s]([A-Za-z0-9])(?:\s|$)/)?.[1];
  return `${prefix}-${letter ? letter.toUpperCase() : index + 1}`;
}

/**
 * Loads the signed-in teacher's complete dashboard snapshot: classes with
 * their rosters, every student's attendance/homework/skills, all lessons and
 * homework of those classes, plus the unread notification count. Returns null
 * when the session is not a teacher.
 */
export async function loadTeacherDashboard(): Promise<TeacherDashboardData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return null;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      classes: {
        orderBy: { name: "asc" },
        include: {
          course: true,
          lessons: { orderBy: { date: "asc" }, include: { homeworks: true } },
          enrollments: {
            include: {
              student: {
                include: {
                  parent: { include: { user: true } },
                  progress: { orderBy: { percent: "desc" } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!teacher) return null;

  const now = new Date();
  const classIds = teacher.classes.map((c) => c.id);
  const lessonIds = teacher.classes.flatMap((c) => c.lessons.map((l) => l.id));
  const studentIds = [...new Set(teacher.classes.flatMap((c) => c.enrollments.map((e) => e.studentId)))];

  const [attendance, submissions, unreadNotifications, notes] = await Promise.all([
    prisma.attendance.findMany({ where: { lessonId: { in: lessonIds }, studentId: { in: studentIds } } }),
    prisma.submission.findMany({
      where: { studentId: { in: studentIds }, homework: { lesson: { classId: { in: classIds } } } },
      include: { homework: true },
    }),
    prisma.notification.count({ where: { userId: teacher.userId, read: false } }),
    prisma.studentNote.findMany({ where: { teacherId: teacher.id, studentId: { in: studentIds } }, orderBy: { createdAt: "desc" } }),
  ]);

  const classes: TeacherClass[] = teacher.classes.map((c, i) => ({
    id: c.id,
    name: c.name,
    code: classCode(c.course.category, c.name, i),
    courseName: c.course.name,
    courseLevel: LEVEL_LABEL[c.course.level] ?? c.course.level,
    studentIds: c.enrollments.map((e) => e.studentId),
  }));

  const students = new Map<string, TeacherStudent>();
  for (const c of teacher.classes) {
    for (const e of c.enrollments) {
      if (students.has(e.studentId)) continue;
      const s = e.student;
      students.set(s.id, {
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        avatarUrl: s.avatarUrl,
        classId: c.id,
        parentEmail: s.parent.user.email,
        parentName: s.parent.user.name,
        attendance: attendance.filter((a) => a.studentId === s.id).map((a) => ({ lessonId: a.lessonId, status: a.status, date: a.date.toISOString() })),
        submissions: submissions
          .filter((x) => x.studentId === s.id)
          .map((x) => ({
            id: x.id,
            homeworkId: x.homeworkId,
            status: x.status,
            score: x.score,
            feedback: x.feedback,
            submittedAt: iso(x.submittedAt),
            dueDate: x.homework.dueDate.toISOString(),
          })),
        skills: s.progress.map((p) => ({ name: p.skill, pct: p.percent })),
      });
    }
  }

  return {
    teacher: {
      id: teacher.id,
      userId: teacher.userId,
      name: teacher.user.name,
      email: teacher.user.email,
      phone: teacher.user.phone,
      position: teacher.position,
      photoUrl: teacher.photoUrl ?? teacher.user.avatarUrl,
    },
    classes,
    students: [...students.values()],
    lessons: teacher.classes.flatMap((c) =>
      c.lessons.map((l) => ({ id: l.id, classId: c.id, title: l.title, date: l.date.toISOString(), minutes: c.course.lessonMinutes }))
    ),
    homeworks: teacher.classes.flatMap((c) =>
      c.lessons.flatMap((l) =>
        l.homeworks.map((h) => ({ id: h.id, lessonId: l.id, classId: c.id, title: h.title, description: h.description, dueDate: h.dueDate.toISOString() }))
      )
    ),
    notes: notes.map((n) => ({ id: n.id, studentId: n.studentId, body: n.body, visibility: n.visibility, createdAt: n.createdAt.toISOString() })),
    unreadNotifications,
    now: now.getTime(),
  };
}
