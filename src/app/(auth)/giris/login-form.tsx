"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Email və ya şifrə yanlışdır.");
      return;
    }
    toast.success("Xoş gəldiniz!");

    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      const session = await getSession();
      const roleHome: Record<string, string> = {
        PARENT: "/parent",
        TEACHER: "/teacher",
        STUDENT: "/student",
        ADMIN: "/admin",
      };
      router.push(roleHome[session?.user.role ?? "PARENT"] ?? "/parent");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-app text-2xl font-extrabold text-navy-900">Xoş gəlmisiniz</h1>
        <p className="mt-1 text-sm text-navy-400">Valideyn Panelinə daxil olun</p>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@nümunə.az" />
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">Şifrə</Label>
          <Link href="/sifre-unutdum" className="text-xs font-bold text-electric-600 hover:underline">
            Şifrəni unutmusunuz?
          </Link>
        </div>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

      <Button type="submit" variant="app" size="lg" disabled={loading} className="w-full">
        {loading ? "Yoxlanılır..." : "Daxil ol"}
      </Button>

      <p className="text-center text-sm text-navy-400">
        Hesabınız yoxdur?{" "}
        <Link href="/qeydiyyat" className="font-bold text-electric-600 hover:underline">
          Qeydiyyatdan keçin
        </Link>
      </p>
    </form>
  );
}
