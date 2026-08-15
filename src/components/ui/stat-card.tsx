import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const colorMap = {
  electric: "bg-electric-500/10 text-electric-600",
  violet: "bg-violet-500/10 text-violet-600",
  cyan: "bg-cyan-500/10 text-cyan-600",
  emerald: "bg-emerald-500/10 text-emerald-600",
  amber: "bg-amber-500/10 text-amber-600",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "electric",
  trend,
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
  trend?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-navy-400">{label}</p>
          <p className="mt-2 font-app text-3xl font-extrabold text-navy-900">{value}</p>
          {trend && <p className="mt-1 text-xs font-semibold text-emerald-600">{trend}</p>}
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
