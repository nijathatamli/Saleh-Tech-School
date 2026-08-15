"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const colors = ["#3366FF", "#8B5CF6", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444"];

export function AdminBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FA" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3D537C" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#3D537C" }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid #DCE4F4", fontSize: 12 }}
          labelStyle={{ fontWeight: 700, color: "#101A30" }}
          cursor={{ fill: "#EEF2FA" }}
        />
        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
