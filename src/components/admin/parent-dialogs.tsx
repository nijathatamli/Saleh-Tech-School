"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useDebounced } from "@/lib/client-api";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

function ParentForm({ initial, onDone }: { initial?: { id: string; name: string; phone: string | null }; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ name: initial?.name ?? "", email: "", phone: initial?.phone ?? "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const r = initial
      ? await api("PATCH", `/api/admin/parents/${initial.id}`, { name: f.name, phone: f.phone || null, ...(f.password ? { password: f.password } : {}) })
      : await api("POST", "/api/admin/parents", { name: f.name, email: f.email, phone: f.phone || undefined, password: f.password });
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
      <div><Label htmlFor="pn">Ad Soyad</Label><Input id="pn" value={f.name} onChange={set("name")} />{err(fields.name)}</div>
      {!initial && <div><Label htmlFor="pe">E-poçt (giriş)</Label><Input id="pe" type="email" value={f.email} onChange={set("email")} autoComplete="off" />{err(fields.email)}</div>}
      <div><Label htmlFor="pph">Telefon</Label><Input id="pph" value={f.phone} onChange={set("phone")} /></div>
      <div><Label htmlFor="ppw">{initial ? "Yeni şifrə (boş qoysanız dəyişmir)" : "İlkin şifrə"}</Label><Input id="ppw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" placeholder="Ən az 8 simvol" />{err(fields.password)}</div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : initial ? "Yadda saxla" : "Valideyni yarat"}</Button></div>
    </form>
  );
}

export function CreateParentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app">Yeni valideyn yarat</Button></DialogTrigger>
      <DialogContent><DialogTitle>Yeni valideyn</DialogTitle><DialogDescription className="mb-5 text-sm text-navy-400">Valideyn hesabı yaradılır; sonra övlad əlavə və ya köçürmək olar.</DialogDescription><ParentForm onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}

export function EditParentDialog({ parent }: { parent: { id: string; name: string; phone: string | null } }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app-outline" size="sm">Redaktə et</Button></DialogTrigger>
      <DialogContent><DialogTitle>Valideyni redaktə et</DialogTitle><DialogDescription className="sr-only">Valideyn məlumatları</DialogDescription><ParentForm initial={parent} onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}

type P = { id: string; name: string; email: string; children: number };
/** Re-links a student to another parent account (a student always has exactly one parent, so "remove" = move). */
export function ChangeParentDialog({ studentId, currentParentId, studentName }: { studentId: string; currentParentId: string; studentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [items, setItems] = useState<P[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    void api<{ items: P[] }>("GET", `/api/admin/parents?q=${encodeURIComponent(dq)}&limit=8`).then((r) => live && r.ok && setItems(r.data.items));
    return () => {
      live = false;
    };
  }, [dq, open]);
  async function move(parentId: string) {
    if (!window.confirm(`${studentName} seçilən valideynə bağlansın? Ödəniş tarixçəsi də onunla birlikdə köçürüləcək.`)) return;
    setBusy(true);
    setError(null);
    const r = await api("PUT", `/api/admin/students/${studentId}/parent`, { parentId });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="text-xs font-bold text-electric-600 hover:underline">Valideyni dəyiş</button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Valideyni dəyiş</DialogTitle><DialogDescription className="mb-4 text-sm text-navy-400">Hər tələbənin bir valideyn hesabı olmalıdır; köhnə valideyn məlumatlandırılır.</DialogDescription>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Valideyn axtar (ad və ya e-poçt)" />
        <ul className="mt-3 max-h-56 overflow-auto rounded-lg border border-navy-100">
          {items.filter((p) => p.id !== currentParentId).length === 0 && <li className="px-4 py-3 text-sm text-navy-400">Valideyn tapılmadı.</li>}
          {items.filter((p) => p.id !== currentParentId).map((p) => <li key={p.id}><button type="button" disabled={busy} onClick={() => move(p.id)} className="w-full px-4 py-2 text-left text-sm hover:bg-navy-50 disabled:opacity-50"><b>{p.name}</b> · {p.email} · {p.children} övlad</button></li>)}
        </ul>
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
