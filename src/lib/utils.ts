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

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
