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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPasswordReset({ email });
      if (result.status === "success") setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-electric-500/10 text-electric-600">
          <MailCheck className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-app text-xl font-extrabold text-navy-900">Sorğunuz qəbul edildi</h1>
        <p className="mt-2 text-sm text-navy-400">
          Əgər <span className="font-bold text-navy-900">{email}</span> qeydiyyatdan keçibsə, məktəb administrasiyası
          sizinlə əlaqə saxlayacaq və yeni şifrə təyin edəcək.
        </p>
        <p className="mt-6">
          <Link href="/giris" className="text-sm font-bold text-electric-600 hover:underline">
            Girişə qayıt
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-app text-2xl font-extrabold text-navy-900">Şifrəni unutmusunuz?</h1>
        <p className="mt-1 text-sm text-navy-400">Email ünvanınızı daxil edin, administrasiya sizinlə əlaqə saxlasın</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@nümunə.az" />
      </div>
      <Button type="submit" variant="app" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Göndərilir..." : "Sorğu göndər"}
      </Button>
      <p className="text-center text-sm text-navy-400">
        <Link href="/giris" className="font-bold text-electric-600 hover:underline">
          Girişə qayıt
        </Link>
      </p>
    </form>
  );
}
