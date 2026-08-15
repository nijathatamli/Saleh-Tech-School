"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { resetPassword } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await resetPassword({ token, password });
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/giris"), 2000);
    });
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h1 className="mt-6 font-app text-xl font-extrabold text-navy-900">Şifrə yeniləndi</h1>
        <p className="mt-2 text-sm text-navy-400">Girişə yönləndirilirsiniz...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-app text-2xl font-extrabold text-navy-900">Yeni şifrə təyin edin</h1>
      </div>
      <div>
        <Label htmlFor="password">Yeni şifrə</Label>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
      <Button type="submit" variant="app" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Yenilənir..." : "Şifrəni yenilə"}
      </Button>
    </form>
  );
}
