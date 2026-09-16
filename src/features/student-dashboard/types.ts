// Serialisable snapshot of everything the student dashboard renders. Built on
// the server from Prisma (see data.ts) and handed to the client component, so
// dates travel as ISO strings / epoch millis.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

export type StudentAttendance = {
  id: string;
  status: AttendanceStatus;
  date: string;
  courseName: string;
};

export type StudentSubmission = {
  id: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  title: string;
  dueDate: string;
  courseName: string;
};

export type StudentLesson = {
  id: string;
  title: string;
  date: string;
  minutes: number;
  courseName: string;
  teacherName: string;
  teacherPosition: string;
  teacherPhotoUrl: string | null;
  link: string | null;
};

export type StudentProject = {
  id: string;
  title: string;
  technologies: string[];
  courseTag: string;
  imageUrl: string | null;
  createdAt: string;
};

export type StudentBadge = {
  id: string;
  code: string;
  name: string;
  emoji: string;
  description: string;
  /** null when the badge exists in the catalogue but has not been earned yet */
  earnedAt: string | null;
};

export type StudentCourse = {
  slug: string;
  name: string;
  durationMonths: number;
  lessonsPerWeek: number;
  lessonMinutes: number;
  modules: { order: number; title: string }[];
};

export type LeaderboardRow = {
  id: string;
  name: string;
  courseName: string | null;
  level: number;
  points: number;
  avatarUrl: string | null;
};

export type StudentDashboardData = {
  student: {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    birthDate: string;
    avatarUrl: string | null;
    level: number;
    xp: number;
    points: number;
    streakDays: number;
  };
  courses: StudentCourse[];
  subjects: { name: string; pct: number }[];
  grades: { subject: string; pct: number; createdAt: string }[];
  attendance: StudentAttendance[];
  submissions: StudentSubmission[];
  projects: StudentProject[];
  badges: StudentBadge[];
  upcomingLessons: StudentLesson[];
  leaderboard: LeaderboardRow[];
  /** 1-based position of the signed-in student among all students by points */
  myRank: number;
  unreadNotifications: number;
  /** Server clock at render time — the client renders "today"/"ago" from this so SSR and hydration agree. */
  now: number;
};
