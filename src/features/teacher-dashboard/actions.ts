"use server";

// Server actions behind the teacher dashboard's controls. These consolidate
// the actions the previous teacher pages used (lessons, attendance, homework,
// grading — with the parent notifications and Grade rows they already wrote)
// plus the profile/avatar/note actions this design adds. Every action
// re-checks the session and only touches the signed-in teacher's classes.
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParentsOfStudents } from "@/features/parent-dashboard/notify";
import { clock, dayMonth, fromBakuLocal, parts } from "@/features/parent-dashboard/az";

const DASHBOARD = "/teacher";

async function teacherSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return null;
  return session;
}

function revalidate() {
  revalidatePath(DASHBOARD, "layout");
  revalidatePath("/parent", "layout");
  revalidatePath("/student", "layout");
}

// ---- lessons (the Siniflərim calendar) --------------------------------------

const lessonSchema = z.object({ classId: z.string().min(1), date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/) });

/** Adds a lesson to a class on a given day/time (school time); parents see it as "Növbəti dərs". */
export async function createLesson(input: { classId: string; date: string }) {
  const session = await teacherSession();
  if (!session) return { ok: false as const };
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classId, teacher: { userId: session.user.id } },
    include: { course: true, enrollments: true },
  });
  if (!classGroup) return { ok: false as const };

  const date = fromBakuLocal(parsed.data.date);
  const duplicate = await prisma.lesson.findFirst({ where: { classId: classGroup.id, date } });
  if (duplicate) return { ok: true as const, id: duplicate.id };

  const lesson = await prisma.lesson.create({
    data: { classId: classGroup.id, title: classGroup.course.name, description: "", date },
  });
  await notifyParentsOfStudents(
    classGroup.enrollments.map((e) => e.studentId),
    {
      title: "Yeni dərs planlaşdırıldı",
      body: `${classGroup.course.name}: ${dayMonth(parts(date))}, ${clock(parts(date))}.`,
      category: "lessons",
    }
  );
  revalidate();
  return { ok: true as const, id: lesson.id };
}

export async function deleteLesson(lessonId: string) {
  const session = await teacherSession();
  if (!session) return { ok: false as const };
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, class: { teacher: { userId: session.user.id } } } });
  if (!lesson) return { ok: false as const };
  await prisma.lesson.delete({ where: { id: lesson.id } }); // attendance + homework cascade
  revalidate();
  return { ok: true as const };
}

// ---- attendance ---------------------------------------------------------------

const STATUS_OF = { p: "PRESENT", l: "LATE", a: "ABSENT" } as const;
const STATUS_WORD = { ABSENT: "qayıb", LATE: "gecikmə" } as const;

/** Upserts one attendance row per marked student for a lesson; absences and late marks notify parents. */
export async function saveAttendance(lessonId: string, marks: Record<string, "p" | "l" | "a">) {
  const session = await teacherSession();
  if (!session) return { ok: false as const };
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, class: { teacher: { userId: session.user.id } } },
    include: { class: { include: { enrollments: true } } },
  });
  if (!lesson) return { ok: false as const };

  const allowed = new Set(lesson.class.enrollments.map((e) => e.studentId));
  const existing = await prisma.attendance.findMany({ where: { lessonId } });
  const byStudent = new Map(existing.map((a) => [a.studentId, a]));

  for (const [studentId, mark] of Object.entries(marks)) {
    if (!allowed.has(studentId) || !STATUS_OF[mark]) continue;
    const status = STATUS_OF[mark];
    const current = byStudent.get(studentId);
    if (current) {
      if (current.status !== status) await prisma.attendance.update({ where: { id: current.id }, data: { status } });
    } else {
      await prisma.attendance.create({ data: { lessonId, studentId, status, date: lesson.date } });
    }
    if (status !== "PRESENT" && current?.status !== status) {
      const student = await prisma.studentProfile.findUnique({ where: { id: studentId }, select: { firstName: true } });
      await notifyParentsOfStudents([studentId], {
        title: "Davamiyyət bildirişi",
        body: `${student?.firstName ?? "Tələbə"} ${dayMonth(parts(lesson.date))} tarixli "${lesson.title}" dərsində ${STATUS_WORD[status]} kimi qeyd edildi.`,
        type: "warning",
        category: "lessons",
      });
    }
  }
  revalidate();
  return { ok: true as const };
}

// ---- homework + grading -----------------------------------------------------------

const hwSchema = z.object({
  classId: z.string().min(1),
  title: z.string().trim().min(3),
  description: z.string().trim().min(3),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Creates homework for a class (attached to its nearest lesson), a PENDING submission per student, and notifies parents. */
export async function createHomework(input: { classId: string; title: string; description: string; dueDate: string }) {
  const session = await teacherSession();
  if (!session) return { ok: false as const, error: "unauthorized" as const };
  const parsed = hwSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };

  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.data.classId, teacher: { userId: session.user.id } },
    include: { course: true, enrollments: true, lessons: { orderBy: { date: "desc" } } },
  });
  if (!classGroup) return { ok: false as const, error: "unauthorized" as const };
  const now = Date.now();
  const lesson = classGroup.lessons.find((l) => l.date.getTime() <= now) ?? classGroup.lessons[classGroup.lessons.length - 1];
  if (!lesson) return { ok: false as const, error: "no-lesson" as const };

  const dueDate = new Date(`${parsed.data.dueDate}T23:59:00+04:00`);
  const homework = await prisma.homework.create({
    data: { lessonId: lesson.id, title: parsed.data.title, description: parsed.data.description, dueDate },
  });
  const studentIds = classGroup.enrollments.map((e) => e.studentId);
  await prisma.submission.createMany({
    data: studentIds.map((studentId) => ({ homeworkId: homework.id, studentId, status: "PENDING" as const })),
  });
  await notifyParentsOfStudents(studentIds, {
    title: "Yeni ev tapşırığı",
    body: `${classGroup.course.name}: "${homework.title}" — son tarix ${dayMonth(parts(dueDate))}.`,
    category: "grades",
  });
  revalidate();
  return { ok: true as const, id: homework.id };
}

const gradeSchema = z.array(z.object({ submissionId: z.string().min(1), score: z.coerce.number().int().min(0).max(100), feedback: z.string().optional() }));

/** Grades several submissions of one homework: score + feedback, GRADED status, a Grade row for the trend, and a parent notification each. */
export async function saveGrades(rows: { submissionId: string; score: number; feedback?: string }[]) {
  const session = await teacherSession();
  if (!session) return { ok: false as const };
  const parsed = gradeSchema.safeParse(rows);
  if (!parsed.success) return { ok: false as const };

  for (const r of parsed.data) {
    const submission = await prisma.submission.findFirst({
      where: { id: r.submissionId, homework: { lesson: { class: { teacher: { userId: session.user.id } } } } },
      include: { homework: { include: { lesson: { include: { class: { include: { course: true } } } } } } },
    });
    if (!submission) continue;
    const feedback = r.feedback?.trim() || null;
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: "GRADED", score: r.score, feedback, submittedAt: submission.submittedAt ?? new Date() },
    });
    await prisma.grade.upsert({
      where: { submissionId: submission.id },
      create: { studentId: submission.studentId, submissionId: submission.id, subject: submission.homework.lesson.class.course.name, score: r.score, maxScore: 100 },
      update: { score: r.score },
    });
    await notifyParentsOfStudents([submission.studentId], {
      title: "Ev tapşırığı qiymətləndirildi",
      body: `"${submission.homework.title}" — ${r.score} bal${feedback ? `. Müəllim qeydi: ${feedback}` : ""}`,
      type: "success",
      category: "grades",
    });
  }
  revalidate();
  return { ok: true as const, count: parsed.data.length };
}

// ---- student note ----------------------------------------------------------------------

/** Sends a teacher's note about a student to the parent as a notification. */
export async function sendStudentNote(studentId: string, note: string) {
  const session = await teacherSession();
  if (!session) return { ok: false as const };
  const text = note.trim();
  if (text.length < 3) return { ok: false as const };
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId, class: { teacher: { userId: session.user.id } } } });
  if (!enrollment) return { ok: false as const };
  const teacher = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  const count = await notifyParentsOfStudents([studentId], {
    title: "Yeni müəllim qeydi",
    body: `${teacher?.name ?? "Müəllim"}: ${text}`,
    category: "grades",
  });
  revalidate();
  return { ok: true as const, count };
}

// ---- profile ----------------------------------------------------------------------------------

const profileSchema = z.object({ name: z.string().trim().min(3), phone: z.string().trim().min(9), position: z.string().trim().min(3) });

export async function updateTeacherProfile(formData: FormData) {
  const session = await teacherSession();
  if (!session) return { ok: false as const, error: "unauthorized" as const };
  const parsed = profileSchema.safeParse({ name: formData.get("name"), phone: formData.get("phone"), position: formData.get("position") });
  if (!parsed.success) return { ok: false as const, error: "invalid" as const };

  await prisma.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name, phone: parsed.data.phone } });
  await prisma.teacherProfile.update({ where: { userId: session.user.id }, data: { position: parsed.data.position } });
  revalidate();
  return { ok: true as const };
}

export async function updateTeacherAvatar(url: string) {
  const session = await teacherSession();
  if (!session) return;
  await prisma.teacherProfile.update({ where: { userId: session.user.id }, data: { photoUrl: url } });
  await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl: url } });
  revalidate();
}

// ---- skills + badges (kept from the previous student page; the design has no
// control for them yet — see README "Open points") ------------------------------

async function teacherOwnsStudent(userId: string, studentId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId, class: { teacher: { userId } } },
    select: { id: true },
  });
  return !!enrollment;
}

const skillSchema = z.object({
  studentId: z.string().min(1),
  skill: z.string().trim().min(2).max(60),
  percent: z.coerce.number().int().min(0).max(100),
});

/** Sets a skill's progress for a student — the bars under "Öyrənmə inkişafı" in the parent portal. */
export async function updateSkillProgress(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = skillSchema.safeParse({
    studentId: formData.get("studentId"),
    skill: formData.get("skill"),
    percent: formData.get("percent"),
  });
  if (!parsed.success) return;
  if (!(await teacherOwnsStudent(session.user.id, parsed.data.studentId))) return;

  const existing = await prisma.skillProgress.findFirst({
    where: { studentId: parsed.data.studentId, skill: { equals: parsed.data.skill, mode: "insensitive" } },
  });
  if (existing) {
    await prisma.skillProgress.update({ where: { id: existing.id }, data: { percent: parsed.data.percent } });
  } else {
    await prisma.skillProgress.create({
      data: { studentId: parsed.data.studentId, skill: parsed.data.skill, percent: parsed.data.percent },
    });
  }

  revalidate();
  
}

const badgeSchema = z.object({ studentId: z.string().min(1), badgeId: z.string().min(1) });

/** Awards a badge — shown under "Nailiyyətlər" and announced to the parent. */
export async function awardBadge(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "TEACHER") return;

  const parsed = badgeSchema.safeParse({ studentId: formData.get("studentId"), badgeId: formData.get("badgeId") });
  if (!parsed.success) return;
  if (!(await teacherOwnsStudent(session.user.id, parsed.data.studentId))) return;

  const badge = await prisma.badge.findUnique({ where: { id: parsed.data.badgeId } });
  if (!badge) return;
  const already = await prisma.studentBadge.findFirst({ where: { studentId: parsed.data.studentId, badgeId: badge.id } });
  if (already) return;

  await prisma.studentBadge.create({ data: { studentId: parsed.data.studentId, badgeId: badge.id } });
  await notifyParentsOfStudents([parsed.data.studentId], {
    title: "Nailiyyət açıldı",
    body: `${badge.emoji} ${badge.name} — ${badge.description}`,
    type: "success",
    category: "grades",
  });

  revalidate();
  
}
