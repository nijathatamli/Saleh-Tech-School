// Serialisable snapshot of everything the teacher dashboard renders. Built on
// the server from Prisma (see data.ts) and handed to the client component, so
// dates travel as ISO strings / epoch millis.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

export type TeacherStudent = {
  id: string;
  name: string;
  avatarUrl: string | null;
  classId: string;
  parentEmail: string | null;
  parentName: string | null;
  /** attendance across every lesson of this teacher's classes */
  attendance: { lessonId: string; status: AttendanceStatus; date: string }[];
  submissions: { id: string; homeworkId: string; status: SubmissionStatus; score: number | null; feedback: string | null; submittedAt: string | null; dueDate: string }[];
  skills: { name: string; pct: number }[];
};

export type TeacherClass = {
  id: string;
  name: string;
  /** short display code derived from course + group letter (the design's "CS-204") */
  code: string;
  courseName: string;
  courseLevel: string;
  studentIds: string[];
};

export type TeacherLesson = {
  id: string;
  classId: string;
  title: string;
  date: string;
  minutes: number;
};

export type TeacherHomework = {
  id: string;
  lessonId: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
};

export type TeacherDashboardData = {
  teacher: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    position: string;
    photoUrl: string | null;
  };
  classes: TeacherClass[];
  students: TeacherStudent[];
  lessons: TeacherLesson[];
  homeworks: TeacherHomework[];
  unreadNotifications: number;
  /** Server clock at render time — the client renders "today"/"ago" from this so SSR and hydration agree. */
  now: number;
};
