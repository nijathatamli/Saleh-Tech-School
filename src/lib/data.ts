import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Course, CourseModule, Project, TeacherProfile, Testimonial } from "@prisma/client";
import publicContent from "@/lib/public-content.json";

export async function getCurrentParent() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "PARENT") return null;

  return prisma.parentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      children: {
        include: {
          enrollments: { include: { course: true } },
          progress: true,
          grades: true,
          submissions: true,
          studentBadges: { include: { badge: true } },
          attendance: { include: { lesson: { include: { class: true } } } },
        },
      },
    },
  });
}

export function getUnreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function getChildForParent(childId: string) {
  const parent = await getCurrentParent();
  if (!parent) return null;
  return prisma.studentProfile.findFirst({
    where: { id: childId, parentId: parent.id },
    include: {
      enrollments: { include: { course: true } },
      progress: true,
      studentBadges: { include: { badge: true } },
      projects: true,
      grades: true,
      attendance: { include: { lesson: { include: { class: true } } }, orderBy: { date: "desc" } },
    },
  });
}

export async function getCurrentTeacher() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return null;

  return prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      classes: {
        include: {
          course: true,
          enrollments: { include: { student: true } },
        },
      },
    },
  });
}

export async function getClassForTeacher(classId: string) {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;
  return prisma.classGroup.findFirst({
    where: { id: classId, teacherId: teacher.id },
    include: {
      course: true,
      teacher: { include: { user: true } },
      enrollments: {
        include: {
          student: { include: { attendance: true, progress: true, grades: true } },
        },
      },
      lessons: { orderBy: { date: "desc" }, include: { homeworks: true } },
    },
  });
}

export async function getCurrentStudent() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "STUDENT") return null;

  return prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      enrollments: { include: { course: true } },
      progress: true,
      studentBadges: { include: { badge: true } },
      projects: true,
      grades: true,
      attendance: { include: { lesson: { include: { class: true } } } },
    },
  });
}

export function getLeaderboard(take = 10) {
  return prisma.studentProfile.findMany({
    where: { active: true }, // deactivated / withdrawn students are not ranked (nor shown to other children)
    orderBy: { points: "desc" },
    take,
    include: { enrollments: { include: { course: true } } },
  });
}

export async function getAdminStats() {
  const [totalStudents, totalTeachers, totalCourses, payments, attendanceRecords, newLeads, trialBookings] =
    await Promise.all([
      prisma.studentProfile.count(),
      prisma.teacherProfile.count(),
      prisma.course.count(),
      prisma.payment.findMany({ where: { status: "PAID" } }),
      prisma.attendance.findMany(),
      prisma.trialBooking.count({ where: { stage: "NEW" } }),
      prisma.trialBooking.count(),
    ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthlyRevenue = payments
    .filter((p) => p.paidAt && new Date(p.paidAt) >= thirtyDaysAgo)
    .reduce((sum, p) => sum + p.amount, 0);

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
  const attendanceRateOverall = attendanceRecords.length
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;

  return {
    totalStudents,
    activeStudents: totalStudents,
    totalTeachers,
    totalCourses,
    monthlyRevenue,
    attendanceRateOverall,
    newLeads,
    trialBookings,
  };
}

export function getLeadsByStage() {
  return prisma.trialBooking.findMany({
    include: { course: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getAllStudentsAdmin() {
  return prisma.studentProfile.findMany({
    include: { parent: { include: { user: true } }, enrollments: { include: { course: true } } },
    orderBy: { firstName: "asc" },
  });
}

export function getAllTeachersAdmin() {
  return prisma.teacherProfile.findMany({
    include: { user: true, courses: true, classes: true },
  });
}

// ---------- Public landing site ----------
// The landing site reads a frozen snapshot (src/lib/public-content.json), NOT the database, so changes made in
// the admin panel (teachers, courses, testimonials, ...) never show up there. Refresh it on purpose with
// scripts/snapshot-public-content.mjs. Course ids in the snapshot are slugs; createTrialBooking resolves them.

type PublicTeacher = Omit<TeacherProfile, "userId"> & { user: { name: string; avatarUrl: string | null } };
export type PublicCourse = Course & { teacher: PublicTeacher | null; modules: CourseModule[] };
export type PublicTeacherWithCourses = PublicTeacher & { courses: Course[] };

const content = publicContent as unknown as {
  teachers: PublicTeacherWithCourses[];
  courses: PublicCourse[];
  testimonials: Testimonial[];
  projects: (Omit<Project, "studentId" | "createdAt"> & { createdAt: string })[];
};
const withDate = <T extends { createdAt: unknown }>(row: T) => ({ ...row, createdAt: new Date(row.createdAt as string) });

export async function getAllCourses(): Promise<PublicCourse[]> {
  return content.courses.map(withDate);
}

export async function getFeaturedCourses(): Promise<PublicCourse[]> {
  return content.courses.filter((c) => c.featured).map(withDate);
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse | null> {
  const c = content.courses.find((x) => x.slug === slug);
  return c ? withDate(c) : null;
}

export async function getTeachers(): Promise<PublicTeacherWithCourses[]> {
  return content.teachers;
}

export async function getTeacherById(id: string): Promise<PublicTeacherWithCourses | null> {
  return content.teachers.find((t) => t.id === id) ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return content.testimonials;
}

export async function getProjectsByCourseTag(courseTag: string, take = 3) {
  return content.projects.filter((p) => p.courseTag === courseTag).slice(0, take).map(withDate);
}

export async function getStudentProjects() {
  return content.projects.slice(0, 6).map(withDate);
}

export async function getPublicStats() {
  const { teachers, courses, testimonials } = content;
  const avgRating = testimonials.length ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length : 0;
  return { totalTeachers: teachers.length, totalCourses: courses.length, avgRating };
}
