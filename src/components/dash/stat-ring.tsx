"use client";

import { useEffect, useState } from "react";

const C = 2 * Math.PI * 52; // r=52

export function StatRing({
  value,
  size = 132,
  stroke = 9,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLit(true), 90);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth={stroke} className="text-dash-rule dark:text-dash-dark-rule" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke="#FF6B00"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={lit ? C * (1 - value / 100) : C}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[31px] font-semibold leading-none tracking-[-0.03em]">
          {value}
          <span className="text-[17px] text-grey-500">%</span>
        </span>
        {label && <span className="mt-1 text-[11px] text-grey-500">{label}</span>}
      </div>
    </div>
  );
}
