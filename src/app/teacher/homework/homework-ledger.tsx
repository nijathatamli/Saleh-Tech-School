"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { DashLedgerCard, DashStatusPill } from "@/components/dash/ledger";
import { cn } from "@/lib/utils";

type HomeworkItem = {
  id: string;
  title: string;
  description: string;
  dueDateFormatted: string;
  courseName: string;
  submissionCount: number;
  pendingCount: number;
  graded: boolean;
};

export function HomeworkLedger({ items }: { items: HomeworkItem[] }) {
  const [selectedId, setSelectedId] = useState(items[0]?.id ?? null);
  const selected = items.find((i) => i.id === selectedId) ?? items[0] ?? null;

  return (
    <div className="grid gap-0 overflow-hidden rounded-xl border border-dash-rule dark:border-dash-dark-rule md:grid-cols-[1fr_320px]">
      <DashLedgerCard className="rounded-none border-0 border-b border-dash-rule dark:border-dash-dark-rule md:border-b-0 md:border-r">
        {items.map((h) => {
          const active = h.id === selected?.id;
          return (
            <button
              key={h.id}
              onClick={() => setSelectedId(h.id)}
              className={cn(
                "flex w-full items-center gap-4 border-b border-l-4 border-dash-rule/70 px-5 py-4 text-left transition-colors last:border-b-0 dark:border-dash-dark-rule/70",
                active
                  ? "border-l-electric-500 bg-dash-paper-2 dark:bg-white/[0.06]"
                  : "border-l-transparent hover:bg-dash-paper-2/60 dark:hover:bg-white/[0.03]"
              )}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-dash-ink/50 dark:bg-dash-dark-surface dark:text-white/45">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-dash-ink dark:text-white">{h.title}</p>
                <p className="mt-0.5 truncate text-xs text-dash-ink/50 dark:text-white/40">
                  {h.courseName} · Son tarix {h.dueDateFormatted}
                </p>
              </div>
              {h.graded ? (
                <DashStatusPill tone="done">Qiymətləndirilib</DashStatusPill>
              ) : h.pendingCount > 0 ? (
                <DashStatusPill tone="pending">{h.pendingCount} gözləyir</DashStatusPill>
              ) : (
                <DashStatusPill tone="closed">Davam edir</DashStatusPill>
              )}
            </button>
          );
        })}
      </DashLedgerCard>

      {selected && (
        <div className="flex flex-col bg-white p-6 dark:bg-dash-dark-surface">
          <h3 className="font-display text-base text-dash-ink dark:text-white">{selected.title}</h3>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-dash-ink/60 dark:text-white/50">{selected.description}</p>

          <div className="mt-6 space-y-1.5 border-t border-dash-rule pt-4 text-xs dark:border-dash-dark-rule">
            <p className="font-bold uppercase tracking-widest text-dash-ink/40 dark:text-white/35">Təfərrüat</p>
            <p className="text-dash-ink/60 dark:text-white/45">Son tarix: {selected.dueDateFormatted}</p>
            <p className="text-dash-ink/60 dark:text-white/45">{selected.submissionCount} tələbə</p>
          </div>

          <Link
            href={`/teacher/homework/${selected.id}`}
            className="mt-6 flex items-center justify-center rounded-xl bg-dash-ink px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-black dark:bg-white dark:text-dash-ink dark:hover:bg-white/90"
          >
            Qiymətləndir
          </Link>
        </div>
      )}
    </div>
  );
}
