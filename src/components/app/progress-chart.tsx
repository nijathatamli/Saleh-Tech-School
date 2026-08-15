"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function ProgressChart({ data }: { data: { label: string; score: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3D537C" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#3D537C" }} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #DCE4F4", fontSize: 12 }}
          labelStyle={{ fontWeight: 700, color: "#101A30" }}
        />
        <Line type="monotone" dataKey="score" stroke="#3366FF" strokeWidth={3} dot={{ r: 4, fill: "#3366FF" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
