import { LucideIcon, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  electric: { icon: "bg-electric-500/10 text-electric-600", ring: "from-electric-500/10" },
  violet: { icon: "bg-indigo-500/10 text-indigo-600", ring: "from-indigo-500/10" },
  cyan: { icon: "bg-sky-500/10 text-sky-600", ring: "from-sky-500/10" },
  emerald: { icon: "bg-emerald-500/10 text-emerald-600", ring: "from-emerald-500/10" },
  amber: { icon: "bg-amber-500/10 text-amber-600", ring: "from-amber-500/10" },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "electric",
  trend,
  trendDirection = "up",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
  trend?: string;
  trendDirection?: "up" | "down";
  className?: string;
}) {
  const c = colorMap[color];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-navy-900/[0.06]",
        className
      )}
    >
      <div className={cn("pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100", c.ring)} />
      <div className="relative flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-widest text-navy-400">{label}</p>
          <p className="mt-2 font-display text-3xl text-navy-900">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1.5 flex items-center gap-0.5 text-xs font-semibold",
                trendDirection === "up" ? "text-emerald-600" : "text-red-500"
              )}
            >
              {trendDirection === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {trend}
            </p>
          )}
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110", c.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
