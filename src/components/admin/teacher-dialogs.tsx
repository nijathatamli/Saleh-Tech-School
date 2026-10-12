"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client-api";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

type T = { id: string; name: string; email?: string; phone: string | null; position: string; bio?: string; experienceYears: number; specializations: string[]; active?: boolean };

function TeacherForm({ initial, onDone }: { initial?: T; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ name: initial?.name ?? "", email: initial?.email ?? "", password: "", phone: initial?.phone ?? "", position: initial?.position ?? "", bio: initial?.bio ?? "", experienceYears: String(initial?.experienceYears ?? 0), specializations: (initial?.specializations ?? []).join(", ") });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const common = { name: f.name, phone: f.phone || (initial ? null : undefined), position: f.position, bio: f.bio, experienceYears: Number(f.experienceYears) || 0, specializations: f.specializations.split(",").map((s) => s.trim()).filter(Boolean) };
    const r = initial
      ? await api("PATCH", `/api/admin/teachers/${initial.id}`, { ...common, ...(f.password ? { password: f.password } : {}) })
      : await api("POST", "/api/admin/teachers", { ...common, email: f.email, password: f.password });
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.error);
    }
    onDone();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="tn">Ad Soyad</Label><Input id="tn" value={f.name} onChange={set("name")} />{err(fields.name)}</div>
        <div><Label htmlFor="tp">Vəzifə</Label><Input id="tp" value={f.position} onChange={set("position")} placeholder="Python müəllimi" />{err(fields.position)}</div>
      </div>
      {!initial && <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="te">E-poçt (giriş)</Label><Input id="te" type="email" value={f.email} onChange={set("email")} autoComplete="off" />{err(fields.email)}</div><div><Label htmlFor="tw">İlkin şifrə</Label><Input id="tw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" placeholder="Ən az 8 simvol" />{err(fields.password)}</div></div>}
      {initial && <div><Label htmlFor="tw">Yeni şifrə (dəyişmək istəmirsinizsə boş qoyun)</Label><Input id="tw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" />{err(fields.password)}</div>}
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="tph">Telefon</Label><Input id="tph" value={f.phone} onChange={set("phone")} /></div>
        <div><Label htmlFor="tx">Təcrübə (il)</Label><Input id="tx" type="number" min={0} max={60} value={f.experienceYears} onChange={set("experienceYears")} /></div>
      </div>
      <div><Label htmlFor="ts">İxtisaslar (vergüllə)</Label><Input id="ts" value={f.specializations} onChange={set("specializations")} placeholder="Python, Django, SQL" /></div>
      <div><Label htmlFor="tb">Haqqında</Label><textarea id="tb" value={f.bio} onChange={set("bio")} rows={3} className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500" /></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : initial ? "Yadda saxla" : "Müəllimi yarat"}</Button></div>
    </form>
  );
}

export function CreateTeacherDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app">Yeni müəllim yarat</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto"><DialogTitle>Yeni müəllim</DialogTitle><DialogDescription className="mb-5 text-sm text-navy-400">Müəllim hesabı yaradılır və dərhal sinif təyinatı üçün seçilə bilər.</DialogDescription><TeacherForm onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}

export function EditTeacherDialog({ teacher }: { teacher: T }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app-outline" size="sm">Redaktə et</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto"><DialogTitle>Müəllimi redaktə et</DialogTitle><DialogDescription className="sr-only">Müəllim məlumatları</DialogDescription><TeacherForm initial={teacher} onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}

/** Generic activate/deactivate toggle for teachers, students and parents. */
export function ActiveToggle({ endpoint, active, label, confirmText }: { endpoint: string; active: boolean; label: string; confirmText?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    if (active && !window.confirm(confirmText ?? `${label} deaktiv edilsin? Hesab giriş edə bilməyəcək, amma bütün məlumatlar saxlanılacaq.`)) return;
    setBusy(true);
    setError(null);
    const r = await api("PATCH", endpoint, { active: !active });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }
  return (
    <>
      <Button variant={active ? "app-outline" : "app"} size="sm" onClick={toggle} disabled={busy}>{active ? "Deaktiv et" : "Aktiv et"}</Button>
      {error && <span role="alert" className="text-xs font-semibold text-red-500">{error}</span>}
    </>
  );
}
