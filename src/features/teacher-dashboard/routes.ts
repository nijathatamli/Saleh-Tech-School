// URL ↔ screen mapping shared by the page (server) and the client component.
// Sections are the nav entries; drill-downs are states of their section with
// their own URL so the browser's back/forward and refresh work.
import type { Detail, Section } from "./logic";

export type Screen = { section: Section; detail: Detail };

export function parseTeacherPath(slug: string[], lessonId?: string): Screen | null {
  const [a, b, c] = slug;
  if (!a) return { section: "/teacher", detail: null };
  if (a === "profile" && !b) return { section: "/teacher/profile", detail: null };
  if (a === "classes") {
    if (!b) return { section: "/teacher/classes", detail: null };
    if (!c) return { section: "/teacher/classes", detail: { kind: "class", key: b } };
    if (c === "attendance" && slug.length === 3) return { section: "/teacher/classes", detail: { kind: "attendance", key: b, lessonId } };
    return null;
  }
  if (a === "students") {
    if (!b) return { section: "/teacher/students", detail: null };
    if (!c) return { section: "/teacher/students", detail: { kind: "student", key: b } };
    return null;
  }
  if (a === "homework") {
    if (!b) return { section: "/teacher/homework", detail: null };
    if (b === "new" && !c) return { section: "/teacher/homework", detail: { kind: "newhw", key: "" } };
    if (c === "grade" && slug.length === 3) return { section: "/teacher/homework", detail: { kind: "grading", key: b } };
    return null;
  }
  return null;
}

export function pathFor(screen: Screen): string {
  const { section, detail } = screen;
  if (!detail) return section;
  switch (detail.kind) {
    case "class":
      return `/teacher/classes/${detail.key}`;
    case "attendance":
      return `/teacher/classes/${detail.key}/attendance${detail.lessonId ? `?lesson=${detail.lessonId}` : ""}`;
    case "student":
      return `/teacher/students/${detail.key}`;
    case "grading":
      return `/teacher/homework/${detail.key}/grade`;
    case "newhw":
      return "/teacher/homework/new";
  }
}

/** The section a drill-down belongs to (the nav item that stays lit). */
export function sectionForDetail(detail: NonNullable<Detail>): Section {
  return detail.kind === "student" ? "/teacher/students" : detail.kind === "grading" || detail.kind === "newhw" ? "/teacher/homework" : "/teacher/classes";
}
