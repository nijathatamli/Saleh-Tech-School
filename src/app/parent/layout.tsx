import type { Metadata } from "next";
// The approved parent portal UI (parent-dashboard.html) — its fonts, icon
// font, base styles and generated hover/focus rules — scoped under .pp-root.
import "@/features/parent-dashboard/styles/fonts.css";
import "@/features/parent-dashboard/styles/fontawesome.css";
import "@/features/parent-dashboard/styles/base.css";
import "@/features/parent-dashboard/styles/template.generated.css";
import "@/features/parent-dashboard/styles/portal.css";

export const metadata: Metadata = { title: "Valideyn portalı" };

// Access control lives in middleware.ts (session + PARENT role) and the page
// itself re-checks the session before loading data.
export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
