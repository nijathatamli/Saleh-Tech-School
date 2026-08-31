import { LucideIcon, ChevronRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashCard } from "@/components/dash/card";

const pillTone = {
  pending: "bg-electric-500 text-white",
  done: "border border-dash-ink/25 text-dash-ink/60 dark:border-white/25 dark:text-white/60",
  closed: "bg-dash-rule text-dash-ink/45 dark:bg-white/10 dark:text-white/40",
} as const;

export function DashStatusPill({
  tone,
  children,
  className,
}: {
  tone: keyof typeof pillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold", pillTone[tone], className)}>
      {children}
    </span>
  );
}

export function DashSectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-dash-ink/45 dark:text-white/40", className)}>
      <span className="text-electric-500">●</span>
      {children}
    </p>
  );
}

export function DashLedgerCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "dash-ledger overflow-hidden rounded-xl border border-dash-rule bg-white dark:border-dash-dark-rule dark:bg-dash-dark-surface",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DashLedgerRow({
  icon: Icon,
  title,
  meta,
  trailing,
  chevron = false,
  className,
}: {
  icon: LucideIcon;
  title: React.ReactNode;
  meta?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group flex flex-wrap items-center gap-4 border-b border-dash-rule/70 px-5 py-4 transition-colors last:border-0 hover:bg-dash-paper-2/60 dark:border-dash-dark-rule/70 dark:hover:bg-white/[0.03]",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-dash-paper-2 text-dash-ink/50 transition-colors group-hover:text-electric-600 dark:bg-white/5 dark:text-white/45">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-dash-ink transition-colors group-hover:text-electric-600 dark:text-white">{title}</p>
        {meta && <p className="mt-0.5 truncate text-xs text-dash-ink/50 dark:text-white/40">{meta}</p>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-3">{trailing}</div>}
      {chevron && (
        <ChevronRight className="h-4 w-4 shrink-0 text-dash-ink/30 transition-transform group-hover:translate-x-1 group-hover:text-electric-600 dark:text-white/25" />
      )}
    </div>
  );
}

export function DashAttendanceStatusCard({
  rate,
  attended,
  total,
  breakdown,
  warning,
  standingLabel,
  warningLabel,
}: {
  rate: number;
  attended: number;
  total: number;
  breakdown: string;
  warning: boolean;
  standingLabel: string;
  warningLabel: string;
}) {
  return (
    <DashCard className="flex flex-col items-center gap-6 p-5 md:flex-row md:justify-between">
      <div className="flex items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border border-electric-500/20 bg-electric-500/10 font-bold text-electric-600">
          <span className="text-xl leading-none">{rate}%</span>
        </div>
        <div>
          <h3 className="text-base font-semibold text-dash-ink dark:text-white">
            {attended} / {total}
          </h3>
          <p className="mt-0.5 text-xs text-dash-ink/50 dark:text-white/40">{breakdown}</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-3 md:w-auto">
        {warning ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <span>{warningLabel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>{standingLabel}</span>
          </div>
        )}
      </div>
    </DashCard>
  );
}
