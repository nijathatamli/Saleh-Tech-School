"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "./actions";

export function ForgotForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (result.status === "success") {
        setSent(true);
        setDevLink(result.resetLink || null);
      }
    });
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-500/10 text-electric-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-app text-xl font-extrabold text-navy-900">Email göndərildi</h1>
        <p className="mt-2 text-sm text-navy-400">
          Əgər <span className="font-bold text-navy-900">{email}</span> qeydiyyatdan keçibsə, şifrə yeniləmə linki
          göndərildi.
        </p>
        {devLink && (
          <div className="mt-6 rounded-xl bg-navy-50 p-4 text-left text-xs">
            <p className="mb-2 font-bold text-navy-900">Demo rejimi — real e-poçt servisi qoşulmayıb:</p>
            <Link href={devLink} className="break-all font-bold text-electric-600 hover:underline">
              {devLink}
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-app text-2xl font-extrabold text-navy-900">Şifrəni unutmusunuz?</h1>
        <p className="mt-1 text-sm text-navy-400">Email ünvanınızı daxil edin, sizə link göndərək</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@nümunə.az" />
      </div>
      <Button type="submit" variant="app" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Göndərilir..." : "Link göndər"}
      </Button>
      <p className="text-center text-sm text-navy-400">
        <Link href="/giris" className="font-bold text-electric-600 hover:underline">
          Girişə qayıt
        </Link>
      </p>
    </form>
  );
}
