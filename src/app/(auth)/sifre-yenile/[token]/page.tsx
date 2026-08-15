import type { Metadata } from "next";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Şifrəni yenilə" };

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <ResetForm token={params.token} />;
}
