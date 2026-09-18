import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLeaderboard } from "@/lib/data";
import { noteVisibilityFor } from "@/lib/access";
import type { StudentDashboardData } from "./types";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/**
 * Loads the signed-in student's complete dashboard snapshot (courses with
 * their modules, skill progress, grades, attendance, homework, projects, the
 * full badge catalogue with what has been earned, upcoming lessons, the
 * leaderboard and unread notifications) in one go. Returns null when the
 * session is not a student.
 */
export async function loadStudentDashboard(): Promise<StudentDashboardData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") return null;

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      enrollments: { include: { course: { include: { modules: { orderBy: { order: "asc" } } } } }, orderBy: { startedAt: "asc" } },
      progress: { orderBy: { percent: "desc" } },
      grades: { orderBy: { createdAt: "asc" } },
      studentBadges: { include: { badge: true } },
      projects: { orderBy: { createdAt: "desc" } },
      attendance: {
        include: { lesson: { include: { class: { include: { course: true } } } } },
        orderBy: { date: "desc" },
      },
      submissions: {
        include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
        orderBy: { homework: { dueDate: "desc" } },
      },
    },
  });
  if (!student) return null;

  const now = new Date();
  const classIds = student.enrollments.map((e) => e.classId).filter((id): id is string => !!id);

  const [upcomingLessons, badges, leaderboard, aboveMe, unreadNotifications, notes] = await Promise.all([
    classIds.length
      ? prisma.lesson.findMany({
          where: { classId: { in: classIds }, date: { gte: now } },
          orderBy: { date: "asc" },
          take: 5,
          include: { class: { include: { course: true, teacher: { include: { user: true } } } } },
        })
      : [],
    prisma.badge.findMany({ orderBy: { name: "asc" } }),
    getLeaderboard(8),
    prisma.studentProfile.count({ where: { points: { gt: student.points } } }),
    student.userId ? prisma.notification.count({ where: { userId: student.userId, read: false } }) : 0,
    prisma.studentNote.findMany({ where: { studentId: student.id, ...noteVisibilityFor("STUDENT") }, include: { teacher: { include: { user: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  const earned = new Map(student.studentBadges.map((b) => [b.badgeId, b.earnedAt]));
  const activeFirst = [...student.enrollments].sort((a, b) => Number(b.status === "active") - Number(a.status === "active"));

  return {
    student: {
      id: student.id,
      userId: student.userId,
      firstName: student.firstName,
      lastName: student.lastName,
      birthDate: student.birthDate.toISOString(),
      avatarUrl: student.avatarUrl,
      level: student.level,
      xp: student.xp,
      points: student.points,
      streakDays: student.streakDays,
    },
    courses: activeFirst.map((e) => ({
      slug: e.course.slug,
      name: e.course.name,
      durationMonths: e.course.durationMonths,
      lessonsPerWeek: e.course.lessonsPerWeek,
      lessonMinutes: e.course.lessonMinutes,
      modules: e.course.modules.map((m) => ({ order: m.order, title: m.title })),
    })),
    subjects: student.progress.map((p) => ({ name: p.skill, pct: p.percent })),
    grades: student.grades.map((g) => ({
      subject: g.subject,
      pct: Math.round((g.score / g.maxScore) * 100),
      createdAt: g.createdAt.toISOString(),
    })),
    attendance: student.attendance.map((a) => ({
      id: a.id,
      status: a.status,
      date: a.date.toISOString(),
      courseName: a.lesson.class.course.name,
    })),
    submissions: student.submissions.map((s) => ({
      id: s.id,
      status: s.status,
      score: s.score,
      feedback: s.feedback,
      submittedAt: iso(s.submittedAt),
      title: s.homework.title,
      dueDate: s.homework.dueDate.toISOString(),
      courseName: s.homework.lesson.class.course.name,
    })),
    projects: student.projects.map((p) => ({
      id: p.id,
      title: p.title,
      technologies: p.technologies,
      courseTag: p.courseTag,
      imageUrl: p.imageUrl || null,
      createdAt: p.createdAt.toISOString(),
    })),
    badges: badges.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      emoji: b.emoji,
      description: b.description,
      earnedAt: iso(earned.get(b.id)),
    })),
    upcomingLessons: upcomingLessons.map((l) => ({
      id: l.id,
      title: l.title,
      date: l.date.toISOString(),
      minutes: l.class.course.lessonMinutes,
      courseName: l.class.course.name,
      teacherName: l.class.teacher.user.name,
      teacherPosition: l.class.teacher.position,
      teacherPhotoUrl: l.class.teacher.photoUrl ?? l.class.teacher.user.avatarUrl,
      link: l.videoUrl ?? l.materialsUrl ?? null,
    })),
    leaderboard: leaderboard.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      courseName: s.enrollments[0]?.course.name ?? null,
      level: s.level,
      points: s.points,
      avatarUrl: s.avatarUrl,
    })),
    notes: notes.map((n) => ({ id: n.id, body: n.body, teacherName: n.teacher.user.name, createdAt: n.createdAt.toISOString() })),
    myRank: aboveMe + 1,
    unreadNotifications,
    now: now.getTime(),
  };
}
