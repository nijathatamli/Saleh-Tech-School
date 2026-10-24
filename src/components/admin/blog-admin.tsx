"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActiveToggle } from "@/components/admin/teacher-dialogs";
import { api } from "@/lib/client-api";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

/** Admin moderation of one post: take it down / put it back, feature it on the blog front page, delete. */
export function BlogPostModeration({ id, status, featured, title, live }: { id: string; status: string; featured: boolean; title: string; live: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    const r = await fn();
    setBusy(false);
    if (r.ok) router.refresh();
    else setError(r.error ?? "Xəta baş verdi.");
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-xs font-bold">
      {status === "PUBLISHED" ? (
        <button type="button" disabled={busy} className="text-amber-700 hover:underline disabled:opacity-50" onClick={() => window.confirm(`“${title}” saytdan götürülsün? Qaralamaya qayıdacaq.`) && run(() => api("PATCH", `/api/admin/blog/${id}`, { status: "DRAFT" }))}>Saytdan götür</button>
      ) : (
        <button type="button" disabled={busy} className="text-emerald-700 hover:underline disabled:opacity-50" onClick={() => run(() => api("PATCH", `/api/admin/blog/${id}`, { status: "PUBLISHED" }))}>Dərc et</button>
      )}
      {live && (
        <button type="button" disabled={busy} className="text-electric-600 hover:underline disabled:opacity-50" onClick={() => run(() => api("PATCH", `/api/admin/blog/${id}`, { featured: !featured }))}>{featured ? "Seçilmişdən çıxar" : "Seçilmiş et"}</button>
      )}
      <button type="button" disabled={busy} className="text-red-500 hover:underline disabled:opacity-50" onClick={() => window.confirm(`“${title}” həmişəlik silinsin?`) && run(() => api("DELETE", `/api/admin/blog/${id}`))}>Sil</button>
      {error && <span role="alert" className="text-red-500">{error}</span>}
    </div>
  );
}

function AuthorForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "", position: "Bloq müəllifi" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const r = await api("POST", "/api/admin/blog/authors", f);
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.error);
    }
    onDone();
    router.refresh();
  }
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div><Label htmlFor="ba-name">Ad və soyad</Label><Input id="ba-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />{err(fields.name)}</div>
      <div><Label htmlFor="ba-email">E-poçt (giriş üçün)</Label><Input id="ba-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />{err(fields.email)}</div>
      <div><Label htmlFor="ba-pass">İlkin şifrə</Label><Input id="ba-pass" type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><p className="mt-1 text-xs text-navy-400">Ən az 8 simvol. Müəllifə təhlükəsiz yolla ötürün; sonradan “Şifrəni dəyiş” ilə yenilənə bilər.</p>{err(fields.password)}</div>
      <div><Label htmlFor="ba-pos">Vəzifə</Label><Input id="ba-pos" value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} />{err(fields.position)}</div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Yaradılır..." : "Müəllif hesabı yarat"}</Button></div>
    </form>
  );
}

export function CreateAuthorDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app" size="sm">Müəllif əlavə et</Button></DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogTitle>Yeni bloq müəllifi</DialogTitle>
        <DialogDescription className="mb-4 text-sm text-navy-400">Müəllif yalnız öz yazılarını yaza və redaktə edə bilən ayrıca paneli (/blogger) görür.</DialogDescription>
        <AuthorForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

export function AuthorActions({ userId, active, name }: { userId: string; active: boolean; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await api("PATCH", `/api/admin/blog/authors/${userId}`, { password: pw });
    setBusy(false);
    if (!r.ok) return setError(r.fields?.password ?? r.error);
    setOpen(false);
    setPw("");
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><button type="button" className="text-xs font-bold text-electric-600 hover:underline">Şifrəni dəyiş</button></DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogTitle>Şifrəni dəyiş</DialogTitle>
          <DialogDescription className="mb-4 text-sm text-navy-400">{name} üçün yeni şifrə.</DialogDescription>
          <form onSubmit={reset} className="space-y-4" noValidate>
            <div><Label htmlFor="ap-pw">Yeni şifrə</Label><Input id="ap-pw" type="text" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} />{err(error ?? undefined)}</div>
            <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : "Yadda saxla"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <ActiveToggle endpoint={`/api/admin/blog/authors/${userId}`} active={active} label="Müəllif" confirmText="Müəllif deaktiv edilsin? Panelə daxil ola bilməyəcək; yazıları saytda qalır." />
    </div>
  );
}
