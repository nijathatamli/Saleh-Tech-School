import type { Metadata } from "next";
import { SCHOLARSHIP_NAME } from "@/lib/scholarship/config";

export const metadata: Metadata = {
  title: { default: `${SCHOLARSHIP_NAME} — Təqaüd proqramı`, template: `%s | ${SCHOLARSHIP_NAME}` },
  description: `Saleh Tech School təqaüd proqramı "${SCHOLARSHIP_NAME}": Məntiq, Riyaziyyat və İngilis dili üzrə təqaüd imtahanı.`,
};

export default function ScholarshipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
