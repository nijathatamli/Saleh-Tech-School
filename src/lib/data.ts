import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
          attendance: { include: { lesson: { include: { class: true } } } },
        },
      },
    },
  });
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

export function getAllCourses() {
  return prisma.course.findMany({
    orderBy: { createdAt: "asc" },
    include: { teacher: { include: { user: true } } },
  });
}

export function getFeaturedCourses() {
  return prisma.course.findMany({
    where: { featured: true },
    orderBy: { createdAt: "asc" },
    include: { teacher: { include: { user: true } } },
  });
}

export function getCourseBySlug(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      modules: { orderBy: { order: "asc" } },
      teacher: { include: { user: true } },
    },
  });
}

export function getTeachers() {
  return prisma.teacherProfile.findMany({
    include: { user: true, courses: true },
  });
}

export function getTeacherById(id: string) {
  return prisma.teacherProfile.findUnique({
    where: { id },
    include: { user: true, courses: true, classes: true },
  });
}

export function getTestimonials() {
  return prisma.testimonial.findMany({ where: { featured: true } });
}

export function getStudentProjects() {
  return prisma.project.findMany({
    include: { student: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
}

export async function getPublicStats() {
  const [totalStudents, totalTeachers, totalCourses, testimonials] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.teacherProfile.count(),
    prisma.course.count(),
    prisma.testimonial.findMany({ select: { rating: true } }),
  ]);

  const avgRating = testimonials.length
    ? testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length
    : 0;

  return { totalStudents, totalTeachers, totalCourses, avgRating };
}
