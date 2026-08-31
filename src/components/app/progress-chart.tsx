"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ProgressChart({ data }: { data: { label: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0E4D3" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A7E70" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#8A7E70" }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: 16, border: "1px solid #F0E4D3", fontSize: 12 }}
          labelStyle={{ fontWeight: 700, color: "#241F1A" }}
        />
        <Line type="monotone" dataKey="score" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, fill: "#FF6B00" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
