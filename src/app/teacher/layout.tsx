import type { Metadata } from "next";
// The approved teacher dashboard UI (teacher-dashboard.html) — the shared fonts
// and icon faces from the parent/student folders, plus this design's own base
// styles and generated hover rules — scoped under .td-root.
import "@/features/parent-dashboard/styles/fonts.css";
import "@/features/parent-dashboard/styles/fontawesome.css";
import "@/features/student-dashboard/styles/fa-regular.css";
import "@/features/teacher-dashboard/styles/base.css";
import "@/features/teacher-dashboard/styles/template.generated.css";
import "@/features/teacher-dashboard/styles/portal.css";

export const metadata: Metadata = { title: "Müəllim paneli" };

// Access control lives in middleware.ts (session + TEACHER role) and the page
// itself re-checks the session before loading data.
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return children;
}
