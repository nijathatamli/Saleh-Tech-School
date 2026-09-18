import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/i18n/server";
import { noteVisibilityFor } from "@/lib/access";
import type { PortalChild, PortalData } from "./types";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

/**
 * Loads the signed-in parent's complete portal snapshot (every child, their
 * attendance/homework/progress/badges/next lesson, plus notifications and
 * notification preferences) in one go. Returns null when the session is not a parent.
 */
export async function loadParentPortal(): Promise<PortalData | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARENT") return null;

  const parent = await prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      children: {
        include: {
          enrollments: { include: { course: true }, orderBy: { startedAt: "asc" } },
          progress: { orderBy: { percent: "desc" } },
          grades: { orderBy: { createdAt: "asc" } },
          studentBadges: { include: { badge: true }, orderBy: { earnedAt: "desc" } },
          notes: { where: noteVisibilityFor("PARENT"), include: { teacher: { include: { user: true } } }, orderBy: { createdAt: "desc" } },
          attendance: {
            include: { lesson: { include: { class: { include: { course: true } } } } },
            orderBy: { date: "desc" },
          },
          submissions: {
            include: {
              homework: {
                include: { lesson: { include: { class: { include: { course: true, teacher: { include: { user: true } } } } } } },
              },
            },
            orderBy: { homework: { dueDate: "desc" } },
          },
        },
      },
    },
  });
  if (!parent) return null;

  const now = new Date();
  const notifications = await prisma.notification.findMany({
    where: { userId: parent.userId },
    orderBy: { createdAt: "desc" },
  });

  const children: PortalChild[] = await Promise.all(
    parent.children.map(async (child) => {
      const classIds = child.enrollments.map((e) => e.classId).filter((id): id is string => !!id);
      const nextLesson = classIds.length
        ? await prisma.lesson.findFirst({
            where: { classId: { in: classIds }, date: { gte: now } },
            orderBy: { date: "asc" },
            include: { class: { include: { course: true, teacher: { include: { user: true } } } } },
          })
        : null;
      const primary = child.enrollments.find((e) => e.status === "active") ?? child.enrollments[0];

      return {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        birthDate: child.birthDate.toISOString(),
        avatarUrl: child.avatarUrl,
        level: child.level,
        points: child.points,
        courseName: primary?.course.name ?? null,
        enrollmentStatus: primary?.status ?? null,
        enrolledAt: iso(child.enrollments[0]?.startedAt),
        subjects: child.progress.map((p) => ({ name: p.skill, pct: p.percent })),
        grades: child.grades.map((g) => ({
          subject: g.subject,
          pct: Math.round((g.score / g.maxScore) * 100),
          createdAt: g.createdAt.toISOString(),
        })),
        attendance: child.attendance.map((a) => ({
          id: a.id,
          status: a.status,
          date: a.date.toISOString(),
          note: a.note,
          courseName: a.lesson.class.course.name,
        })),
        submissions: child.submissions.map((s) => ({
          id: s.id,
          status: s.status,
          score: s.score,
          feedback: s.feedback,
          submittedAt: iso(s.submittedAt),
          title: s.homework.title,
          dueDate: s.homework.dueDate.toISOString(),
          courseName: s.homework.lesson.class.course.name,
          teacherName: s.homework.lesson.class.teacher.user.name,
          teacherPosition: s.homework.lesson.class.teacher.position,
          teacherPhotoUrl: s.homework.lesson.class.teacher.photoUrl ?? s.homework.lesson.class.teacher.user.avatarUrl,
        })),
        badges: child.studentBadges.map((b) => ({
          id: b.id,
          code: b.badge.code,
          name: b.badge.name,
          emoji: b.badge.emoji,
          earnedAt: b.earnedAt.toISOString(),
        })),
        notes: child.notes.map((n) => ({
          id: n.id,
          body: n.body,
          teacherName: n.teacher.user.name,
          teacherPosition: n.teacher.position,
          teacherPhotoUrl: n.teacher.photoUrl ?? n.teacher.user.avatarUrl,
          createdAt: n.createdAt.toISOString(),
        })),
        nextLesson: nextLesson
          ? {
              id: nextLesson.id,
              title: nextLesson.title,
              date: nextLesson.date.toISOString(),
              minutes: nextLesson.class.course.lessonMinutes,
              teacherName: nextLesson.class.teacher.user.name,
              teacherPosition: nextLesson.class.teacher.position,
              teacherPhotoUrl: nextLesson.class.teacher.photoUrl ?? nextLesson.class.teacher.user.avatarUrl,
              link: nextLesson.videoUrl ?? nextLesson.materialsUrl ?? null,
            }
          : null,
      };
    })
  );

  return {
    parent: {
      id: parent.id,
      userId: parent.userId,
      name: parent.user.name,
      email: parent.user.email,
      phone: parent.user.phone,
      avatarUrl: parent.user.avatarUrl,
      notifications: { lessons: parent.notifyLessons, grades: parent.notifyGrades },
    },
    children,
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    locale: getLocale(),
    now: now.getTime(),
  };
}
