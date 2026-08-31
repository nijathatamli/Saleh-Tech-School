"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function DashTabs({ tabs }: { tabs: { label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex items-center gap-6 border-b border-dash-rule dark:border-dash-dark-rule">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={cn(
              "relative pb-3 text-sm font-bold transition-colors",
              i === active
                ? "text-dash-ink dark:text-white"
                : "text-dash-ink/40 hover:text-dash-ink/70 dark:text-white/35 dark:hover:text-white/70"
            )}
          >
            {tab.label}
            {i === active && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-electric-500" />}
          </button>
        ))}
      </div>
      <div className="pt-6">{tabs[active].content}</div>
    </div>
  );
}
