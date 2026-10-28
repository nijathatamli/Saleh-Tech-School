import type { Metadata } from "next";
import { AuthStage } from "@/components/auth/auth-stage";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthStage>{children}</AuthStage>;
}
