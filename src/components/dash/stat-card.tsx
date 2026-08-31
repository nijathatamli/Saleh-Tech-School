import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  electric: "bg-electric-500/10 text-electric-600",
  teal: "bg-teal-500/10 text-teal-600",
  violet: "bg-violet-500/10 text-violet-600",
  amber: "bg-amber-500/10 text-amber-600",
};

export function DashStatCard({
  label,
  value,
  icon: Icon,
  color = "electric",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dash-rule bg-white p-5 dark:border-dash-dark-rule dark:bg-dash-dark-surface",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-dash-ink/45 dark:text-white/45">{label}</p>
          <p className="mt-1.5 font-display text-2xl text-dash-ink dark:text-white">{value}</p>
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", colorMap[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
