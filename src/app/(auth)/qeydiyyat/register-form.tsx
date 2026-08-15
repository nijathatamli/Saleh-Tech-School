"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerParent } from "./actions";

export function RegisterForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerParent(form);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInRes?.error) {
        router.push("/giris");
        return;
      }
      router.push("/parent");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="font-app text-2xl font-extrabold text-navy-900">Hesab yaradın</h1>
        <p className="mt-1 text-sm text-navy-400">Valideyn Paneli üçün qeydiyyatdan keçin</p>
      </div>

      <div>
        <Label htmlFor="name">Ad Soyad</Label>
        <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Elvin Məmmədov" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="siz@nümunə.az" />
      </div>
      <div>
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+994 50 123 45 67" />
      </div>
      <div>
        <Label htmlFor="password">Şifrə</Label>
        <Input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
      </div>

      {error && <p className="text-sm font-semibold text-red-500">{error}</p>}

      <Button type="submit" variant="app" size="lg" disabled={isPending} className="w-full">
        {isPending ? "Yaradılır..." : "Qeydiyyatdan keç"}
      </Button>

      <p className="text-center text-sm text-navy-400">
        Artıq hesabınız var?{" "}
        <Link href="/giris" className="font-bold text-electric-600 hover:underline">
          Daxil olun
        </Link>
      </p>
    </form>
  );
}
