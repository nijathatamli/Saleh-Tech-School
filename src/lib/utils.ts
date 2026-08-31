import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAzn(amount: number) {
  return `${amount.toLocaleString("az-AZ")} AZN`;
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("az-AZ", { day: "2-digit", month: "long", year: "numeric" });
}

export function attendanceRate(records: { status: string }[]) {
  if (records.length === 0) return 0;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return Math.round((present / records.length) * 100);
}

export function averageProgress(records: { percent: number }[]) {
  if (records.length === 0) return 0;
  return Math.round(records.reduce((sum, r) => sum + r.percent, 0) / records.length);
}

export function averageGrade(grades: { score: number; maxScore: number }[]) {
  if (grades.length === 0) return 0;
  const pct = grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length;
  return Math.round(pct);
}

function isSameMonth(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/**
 * Groups attendance records by class for the current calendar month, returning
 * "x/y attended" per class — y is the teacher-set `monthlyExpectedClasses` on
 * the recurring weekly class group.
 */
export function monthlyAttendanceByClass<
  T extends { status: string; date: Date | string; lesson: { class: { id: string; name: string; monthlyExpectedClasses: number } } }
>(records: T[]) {
  const byClass = new Map<string, { className: string; attended: number; expected: number }>();
  for (const r of records) {
    if (!isSameMonth(r.date)) continue;
    const cls = r.lesson.class;
    const entry = byClass.get(cls.id) ?? { className: cls.name, attended: 0, expected: cls.monthlyExpectedClasses };
    if (r.status === "PRESENT" || r.status === "LATE") entry.attended += 1;
    byClass.set(cls.id, entry);
  }
  return Array.from(byClass.values());
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
