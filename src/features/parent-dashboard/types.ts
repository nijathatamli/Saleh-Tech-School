// Serialisable snapshot of everything the parent portal renders. Built on the
// server from Prisma (see data.ts) and handed to the client component, so
// dates travel as ISO strings / epoch millis.

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "GRADED" | "OVERDUE";

export type PortalAttendance = {
  id: string;
  status: AttendanceStatus;
  date: string;
  note: string | null;
  courseName: string;
};

export type PortalSubmission = {
  id: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string | null;
  submittedAt: string | null;
  title: string;
  dueDate: string;
  courseName: string;
  teacherName: string;
  teacherPosition: string;
  teacherPhotoUrl: string | null;
};

export type PortalLesson = {
  id: string;
  title: string;
  date: string;
  minutes: number;
  teacherName: string;
  teacherPosition: string;
  teacherPhotoUrl: string | null;
  link: string | null;
};

export type PortalChild = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  avatarUrl: string | null;
  level: number;
  points: number;
  courseName: string | null;
  enrollmentStatus: string | null;
  enrolledAt: string | null;
  subjects: { name: string; pct: number }[];
  grades: { subject: string; pct: number; createdAt: string }[];
  attendance: PortalAttendance[];
  submissions: PortalSubmission[];
  badges: { id: string; code: string; name: string; emoji: string; earnedAt: string }[];
  nextLesson: PortalLesson | null;
};

export type PortalNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

export type NotificationPrefs = { lessons: boolean; grades: boolean };

export type PortalData = {
  parent: {
    id: string;
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    notifications: NotificationPrefs;
  };
  children: PortalChild[];
  notifications: PortalNotification[];
  locale: string;
  /** Server clock at render time — the client renders "today"/"ago" from this so SSR and hydration agree. */
  now: number;
};
