"use client";

import { formatAzn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const BLUE = "#3b82f6";
export const MINT = "#22e0a1";
export const AMBER = "#f5a524";
export const PURPLE = "#a855f7";
export const RED = "#f43f5e";
const AXIS = { fontSize: 11, fill: "#667085" };

type Tip = { active?: boolean; payload?: { name?: string; value?: number; color?: string; payload?: { label: string } }[]; label?: string };
function DarkTip({ active, payload, label, fmt }: Tip & { fmt: (name: string, v: number) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1c2333", color: "#fff", borderRadius: 6, padding: "8px 11px", fontSize: 12, lineHeight: 1.5, boxShadow: "0 10px 24px -10px rgba(0,0,0,.5)" }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <i style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }} />
          <span style={{ opacity: 0.8 }}>{p.name}</span>
          <b>{fmt(p.name ?? "", p.value ?? 0)}</b>
        </div>
      ))}
    </div>
  );
}

/** Two bar series per day, each on its own axis (left: money, right: count) — blue and mint like the reference. */
/** `aMoney`: the first series is money (shown as AZN in the tooltip). */
export function DualBars({ data, aName, bName }: { data: { label: string; a: number; b: number }[]; aName: string; bName: string }) {
  return (
    <div role="img" aria-label={`${aName} və ${bName}, son 7 gün`}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={4} barCategoryGap="22%">
          <CartesianGrid stroke="#eef0f5" vertical={false} />
          <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis yAxisId="a" tick={AXIS} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))} />
          <YAxis yAxisId="b" orientation="right" tick={AXIS} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
          <Tooltip cursor={{ fill: "#f3f5f9" }} content={<DarkTip fmt={(name, v) => (name === aName ? formatAzn(v) : String(v))} />} />
          <Bar yAxisId="a" dataKey="a" name={aName} fill={BLUE} radius={[2, 2, 0, 0]} maxBarSize={22} />
          <Bar yAxisId="b" dataKey="b" name={bName} fill={MINT} radius={[2, 2, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Donut({ data, label }: { data: { name: string; value: number; color: string }[]; label: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = total ? data : [{ name: "Məlumat yoxdur", value: 1, color: "#e6e9f0" }];
  return (
    <div role="img" aria-label={label} className="mx-auto h-[190px] w-[190px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={shown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={90} startAngle={90} endAngle={-270} stroke="#fff" strokeWidth={total ? 2 : 0} isAnimationActive>
            {shown.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          {total > 0 && <Tooltip content={<DarkTip fmt={(_, v) => String(v)} />} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** A tiny line: no axes, the shape of the last days only. */
export function Spark({ values, color, label }: { values: number[]; color: string; label: string }) {
  const w = 96, h = 34, pad = 3;
  const max = Math.max(1, ...values), min = Math.min(0, ...values);
  const pts = values.map((v, i) => [pad + (i * (w - 2 * pad)) / Math.max(1, values.length - 1), h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return (
    <svg role="img" aria-label={label} width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
