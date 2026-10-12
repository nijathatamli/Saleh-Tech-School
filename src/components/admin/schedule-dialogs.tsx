"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client-api";

const Select = (p: React.SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500" />;
const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

export function CreateLessonDialog({ classes, defaultMinutes }: { classes: { id: string; name: string }[]; defaultMinutes: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState("");
  const [minutes, setMinutes] = useState(String(defaultMinutes));
  const [room, setRoom] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const r = await api("POST", "/api/admin/lessons", { classId, date, durationMinutes: Number(minutes) || null, room: room || null });
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.error);
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app">Yeni dərs əlavə et</Button></DialogTrigger>
      <DialogContent>
        <DialogTitle>Dərs planlaşdır</DialogTitle>
        <DialogDescription className="mb-5 text-sm text-navy-400">Müəllim və ya otaq həmin vaxt məşğuldursa, sistem dərsi qəbul etməyəcək.</DialogDescription>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div><Label htmlFor="lc">Sinif</Label><Select id="lc" value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">Sinif seçin</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>{err(fields.classId)}</div>
          <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="ld">Tarix və vaxt</Label><Input id="ld" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />{err(fields.date)}</div><div><Label htmlFor="lm">Müddət (dəq)</Label><Input id="lm" type="number" min={15} max={240} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div></div>
          <div><Label htmlFor="lr">Otaq (istəyə bağlı)</Label><Input id="lr" value={room} onChange={(e) => setRoom(e.target.value)} maxLength={40} placeholder="Otaq 2" /></div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="submit" variant="app" disabled={busy || !classId || !date}>{busy ? "Yoxlanılır..." : "Planlaşdır"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LessonRowActions({ id, status, date, minutes, room }: { id: string; status: string; date: string; minutes: number; room: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const toLocal = (iso: string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Baku", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)).replace(" ", "T");
  const [d, setD] = useState(toLocal(date));
  const [m, setM] = useState(String(minutes));
  const [r, setR] = useState(room ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await api("PATCH", `/api/admin/lessons/${id}`, { date: d, durationMinutes: Number(m) || null, room: r || null });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setOpen(false);
    router.refresh();
  }
  async function cancel() {
    if (!window.confirm("Dərs ləğv edilsin? Tələbələr, valideynlər və müəllim məlumatlandırılacaq.")) return;
    setBusy(true);
    const res = await api("DELETE", `/api/admin/lessons/${id}`);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }
  if (status === "CANCELLED" || status === "COMPLETED") return <span className="text-xs text-navy-400">{error}</span>;
  return (
    <div className="flex items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild><button className="text-xs font-bold text-electric-600 hover:underline">Vaxtı dəyiş</button></DialogTrigger>
        <DialogContent>
          <DialogTitle>Dərsin vaxtını dəyiş</DialogTitle><DialogDescription className="sr-only">Tarix, müddət və otaq</DialogDescription>
          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><div><Label htmlFor="rd">Tarix və vaxt</Label><Input id="rd" type="datetime-local" value={d} onChange={(e) => setD(e.target.value)} /></div><div><Label htmlFor="rm">Müddət (dəq)</Label><Input id="rm" type="number" value={m} onChange={(e) => setM(e.target.value)} /></div></div>
            <div><Label htmlFor="rr">Otaq</Label><Input id="rr" value={r} onChange={(e) => setR(e.target.value)} /></div>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
            <div className="flex justify-end gap-3"><Button variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button variant="app" onClick={save} disabled={busy}>{busy ? "Yoxlanılır..." : "Yadda saxla"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
      <button onClick={cancel} disabled={busy} className="text-xs font-bold text-red-500 hover:underline disabled:opacity-50">Ləğv et</button>
      {error && !open && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
