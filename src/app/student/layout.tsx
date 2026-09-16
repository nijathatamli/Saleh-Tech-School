import type { Metadata } from "next";
// The approved student dashboard UI (student-dashboard.html) — the shared
// fonts and icon font from the parent portal, plus this design's own regular
// icon face, base styles and generated hover rules — scoped under .sd-root.
import "@/features/parent-dashboard/styles/fonts.css";
import "@/features/parent-dashboard/styles/fontawesome.css";
import "@/features/student-dashboard/styles/fa-regular.css";
import "@/features/student-dashboard/styles/base.css";
import "@/features/student-dashboard/styles/template.generated.css";
import "@/features/student-dashboard/styles/portal.css";

export const metadata: Metadata = { title: "Tələbə paneli" };

// Access control lives in middleware.ts (session + STUDENT role) and the page
// itself re-checks the session before loading data.
export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
