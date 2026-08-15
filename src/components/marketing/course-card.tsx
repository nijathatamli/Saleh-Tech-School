import Link from "next/link";
import {
  ShieldCheck,
  Code2,
  Bot,
  CircuitBoard,
  Globe,
  BrainCircuit,
  Gamepad2,
  TerminalSquare,
  Wifi,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Course } from "@prisma/client";

const iconMap: Record<string, { icon: LucideIcon; color: string }> = {
  cybersecurity: { icon: ShieldCheck, color: "bg-red-500" },
  programming: { icon: Code2, color: "bg-yellow-500" },
  python: { icon: Code2, color: "bg-blue-500" },
  robotics: { icon: Bot, color: "bg-green-500" },
  electronics: { icon: CircuitBoard, color: "bg-orange-500" },
  web: { icon: Globe, color: "bg-cyan-500" },
  ai: { icon: BrainCircuit, color: "bg-indigo-500" },
  game: { icon: Gamepad2, color: "bg-pink-500" },
  linux: { icon: TerminalSquare, color: "bg-zinc-700" },
  iot: { icon: Wifi, color: "bg-teal-500" },
};

const levelLabel: Record<string, string> = {
  BEGINNER: "Başlanğıc",
  INTERMEDIATE: "Orta",
  ADVANCED: "Qabaqcıl",
};

export function CourseCard({ course }: { course: Course }) {
  const meta = iconMap[course.category] ?? iconMap.programming;
  const Icon = meta.icon;

  return (
    <Link
      href={`/kurslar/${course.slug}`}
      className="group flex flex-col rounded-3xl border border-grey-100 bg-white p-8 transition-all hover:-translate-y-1.5 hover:shadow-xl hover:shadow-secondary/5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.color} text-white shadow-lg`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-6 font-display text-lg leading-snug group-hover:text-primary transition-colors">
        {course.name}
      </h3>
      <p className="mt-2 text-sm text-grey-500 dark:text-zinc-400">{course.shortDesc}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant="default" className="dark:bg-zinc-800 dark:text-white">
          {course.minAge}-{course.maxAge} yaş
        </Badge>
        <Badge variant="primary">{levelLabel[course.level]}</Badge>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-grey-50 pt-4 dark:border-zinc-800">
        <span className="text-xs font-bold text-secondary dark:text-white">{course.durationMonths} ay</span>
        <span className="flex items-center gap-1 text-xs font-bold text-primary">
          Ətraflı bax
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
