"use client";

import { useEffect, useState } from "react";

export type Subject = { name: string; pct: number };

export function ProgressBars({ subjects }: { subjects: Subject[] }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLit(true), 90);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col gap-[22px]">
      {subjects.map((s) => (
        <div key={s.name}>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[14.5px] font-medium tracking-[-0.005em]">{s.name}</span>
            <span className="text-sm font-semibold tabular-nums">{s.pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-dash-rule dark:bg-dash-dark-rule">
            <div
              className="h-full rounded-full bg-electric-500"
              style={{
                width: lit ? `${s.pct}%` : 0,
                transition: "width 1.05s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
