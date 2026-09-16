import {
  LayoutDashboard,
  TrendingUp,
  CalendarCheck,
  BookOpen,
  Settings,
  School,
  ClipboardList,
  User,
  FolderGit2,
  Trophy,
  KanbanSquare,
  GraduationCap,
  BadgeCheck,
} from "lucide-react";
import type { NavItem } from "@/components/app/sidebar";
import type { DashNavItem } from "@/components/dash/sidebar";
import type { Dictionary } from "@/i18n";

export function getStudentNavItems(dict: Dictionary): DashNavItem[] {
  return [
    { href: "/student", label: dict.nav.dashboard, icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { href: "/student/progress", label: dict.nav.progress, icon: <TrendingUp className="h-4 w-4 shrink-0" /> },
    { href: "/student/attendance", label: dict.nav.attendance, icon: <CalendarCheck className="h-4 w-4 shrink-0" /> },
    { href: "/student/homework", label: dict.nav.homework, icon: <BookOpen className="h-4 w-4 shrink-0" /> },
    { href: "/student/portfolio", label: dict.nav.portfolio, icon: <FolderGit2 className="h-4 w-4 shrink-0" /> },
    { href: "/student/leaderboard", label: dict.nav.leaderboard, icon: <Trophy className="h-4 w-4 shrink-0" /> },
    { href: "/student/settings", label: dict.nav.settings, icon: <Settings className="h-4 w-4 shrink-0" /> },
  ];
}

export const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/classes", label: "Siniflərim", icon: <School className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/homework", label: "Ev tapşırıqları", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/profile", label: "Profil", icon: <User className="h-4 w-4 shrink-0" /> },
];

export function getTeacherNavItems(): DashNavItem[] {
  return [
    { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
    { href: "/teacher/classes", label: "Siniflərim", icon: <School className="h-4 w-4 shrink-0" /> },
    { href: "/teacher/homework", label: "Ev tapşırıqları", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
    { href: "/teacher/profile", label: "Profil", icon: <User className="h-4 w-4 shrink-0" /> },
  ];
}

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/admin/leads", label: "CRM / Leads", icon: <KanbanSquare className="h-4 w-4 shrink-0" /> },
  { href: "/admin/students", label: "Tələbələr", icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
  { href: "/admin/teachers", label: "Müəllimlər", icon: <BadgeCheck className="h-4 w-4 shrink-0" /> },
  { href: "/admin/courses", label: "Kurslar", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
];
