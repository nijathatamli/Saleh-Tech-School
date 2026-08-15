import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  TrendingUp,
  BookOpen,
  CreditCard,
  Bell,
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

export const parentNav: NavItem[] = [
  { href: "/parent", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/parent/children", label: "Uşaqlarım", icon: <Users className="h-4 w-4 shrink-0" /> },
  { href: "/parent/attendance", label: "Davamiyyət", icon: <CalendarCheck className="h-4 w-4 shrink-0" /> },
  { href: "/parent/progress", label: "Tərəqqi", icon: <TrendingUp className="h-4 w-4 shrink-0" /> },
  { href: "/parent/homework", label: "Ev tapşırığı", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  { href: "/parent/payments", label: "Ödənişlər", icon: <CreditCard className="h-4 w-4 shrink-0" /> },
  { href: "/parent/notifications", label: "Bildirişlər", icon: <Bell className="h-4 w-4 shrink-0" /> },
  { href: "/parent/settings", label: "Ayarlar", icon: <Settings className="h-4 w-4 shrink-0" /> },
];

export const teacherNav: NavItem[] = [
  { href: "/teacher", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/classes", label: "Siniflərim", icon: <School className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/homework", label: "Ev tapşırıqları", icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
  { href: "/teacher/profile", label: "Profil", icon: <User className="h-4 w-4 shrink-0" /> },
];

export const studentNav: NavItem[] = [
  { href: "/student", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/student/homework", label: "Ev tapşırığı", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
  { href: "/student/portfolio", label: "Portfolio", icon: <FolderGit2 className="h-4 w-4 shrink-0" /> },
  { href: "/student/leaderboard", label: "Liderlik Cədvəli", icon: <Trophy className="h-4 w-4 shrink-0" /> },
];

export const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { href: "/admin/leads", label: "CRM / Leads", icon: <KanbanSquare className="h-4 w-4 shrink-0" /> },
  { href: "/admin/students", label: "Tələbələr", icon: <GraduationCap className="h-4 w-4 shrink-0" /> },
  { href: "/admin/teachers", label: "Müəllimlər", icon: <BadgeCheck className="h-4 w-4 shrink-0" /> },
  { href: "/admin/courses", label: "Kurslar", icon: <BookOpen className="h-4 w-4 shrink-0" /> },
];
