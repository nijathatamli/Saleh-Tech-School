"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useDebounced } from "@/lib/client-api";
import { STAGE_LABEL } from "@/lib/admin/labels";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

export function StageSelect({ id, stage }: { id: string; stage: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function change(next: string) {
    setBusy(true);
    setError(null);
    const r = await api("PATCH", `/api/admin/applications/${id}`, { stage: next });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }
  return (
    <div>
      <select aria-label="Mərhələ" disabled={busy} value={stage} onChange={(e) => change(e.target.value)} className="rounded-lg border border-navy-100 bg-white px-2 py-1.5 text-xs font-bold">
        {Object.entries(STAGE_LABEL).filter(([k]) => k !== "REGISTERED").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}

type P = { id: string; name: string; email: string; children: number };
type App = { id: string; parentName: string; parentPhone: string; studentName: string; studentAge: number };

export function ConvertDialog({ app, classes }: { app: App; classes: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [first, ...rest] = app.studentName.trim().split(/\s+/);
  const [f, setF] = useState({ firstName: first ?? "", lastName: rest.join(" "), email: "", password: "", birthDate: "", grade: "" });
  const [classId, setClassId] = useState("");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [np, setNp] = useState({ name: app.parentName, email: "", phone: app.parentPhone, password: "" });
  const [parent, setParent] = useState<P | null>(null);
  const [pq, setPq] = useState("");
  const dpq = useDebounced(pq);
  const [parents, setParents] = useState<P[]>([]);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    if (!open || mode !== "existing") return;
    let live = true;
    void api<{ items: P[] }>("GET", `/api/admin/parents?q=${encodeURIComponent(dpq)}&limit=6`).then((r) => live && r.ok && setParents(r.data.items));
    return () => {
      live = false;
    };
  }, [dpq, open, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const r = await api("POST", `/api/admin/applications/${app.id}/convert`, {
      student: {
        firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password, birthDate: f.birthDate, grade: f.grade ? Number(f.grade) : undefined,
        ...(mode === "existing" ? { parentId: parent?.id } : { newParent: { name: np.name, email: np.email, phone: np.phone || undefined, password: np.password } }),
      },
      ...(classId ? { classId } : {}),
    });
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.error);
    }
    setOpen(false);
    router.refresh();
  }

  const flat = (k: string) => fields[k] ?? fields[`student.${k}`];
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app" size="sm">Tələbə yarat</Button></DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Müraciəti təsdiqlə və tələbə yarat</DialogTitle>
        <DialogDescription className="mb-5 text-sm text-navy-400">Hesablar və (seçilibsə) sinfə yazılma bir əməliyyatda yaradılır — xəta olarsa heç nə yaranmır.</DialogDescription>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="cvf">Ad</Label><Input id="cvf" value={f.firstName} onChange={set("firstName")} />{err(flat("firstName"))}</div>
            <div><Label htmlFor="cvl">Soyad</Label><Input id="cvl" value={f.lastName} onChange={set("lastName")} />{err(flat("lastName"))}</div>
            <div><Label htmlFor="cve">Tələbənin e-poçtu (giriş)</Label><Input id="cve" type="email" value={f.email} onChange={set("email")} autoComplete="off" />{err(flat("email"))}</div>
            <div><Label htmlFor="cvp">İlkin şifrə</Label><Input id="cvp" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" />{err(flat("password"))}</div>
            <div><Label htmlFor="cvb">Doğum tarixi (müraciətdə yaş: {app.studentAge})</Label><Input id="cvb" type="date" value={f.birthDate} onChange={set("birthDate")} />{err(flat("birthDate"))}</div>
            <div><Label htmlFor="cvg">Sinif (1-11)</Label><Input id="cvg" type="number" min={1} max={11} value={f.grade} onChange={set("grade")} />{err(flat("grade"))}</div>
          </div>
          <div className="rounded-xl border border-navy-100 p-4">
            <div className="mb-3 flex gap-4 text-sm font-bold">
              <label className="flex items-center gap-2"><input type="radio" checked={mode === "new"} onChange={() => setMode("new")} /> Yeni valideyn</label>
              <label className="flex items-center gap-2"><input type="radio" checked={mode === "existing"} onChange={() => setMode("existing")} /> Mövcud valideyn</label>
            </div>
            {mode === "new" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input aria-label="Valideynin adı" placeholder="Valideynin adı" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} />
                <Input aria-label="Valideynin e-poçtu" placeholder="Valideynin e-poçtu" type="email" value={np.email} onChange={(e) => setNp({ ...np, email: e.target.value })} />
                <Input aria-label="Telefon" placeholder="Telefon" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} />
                <Input aria-label="Valideynin şifrəsi" placeholder="Şifrə (ən az 8)" type="password" value={np.password} onChange={(e) => setNp({ ...np, password: e.target.value })} autoComplete="new-password" />
              </div>
            ) : parent ? (
              <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-2 text-sm"><span><b>{parent.name}</b> · {parent.email}</span><button type="button" className="text-xs font-bold text-red-500" onClick={() => setParent(null)}>Sil</button></div>
            ) : (
              <div className="space-y-2">
                <Input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Valideyn axtar" />
                <ul className="max-h-36 overflow-auto rounded-lg border border-navy-100">
                  {parents.length === 0 && <li className="px-4 py-2 text-sm text-navy-400">Valideyn tapılmadı.</li>}
                  {parents.map((p) => <li key={p.id}><button type="button" onClick={() => setParent(p)} className="w-full px-4 py-2 text-left text-sm hover:bg-navy-50"><b>{p.name}</b> · {p.email}</button></li>)}
                </ul>
              </div>
            )}
            {err(fields["student.parentId"] ?? fields["student.newParent.name"] ?? fields["student.newParent.email"] ?? fields["student.newParent.password"] ?? fields["student.newParent"])}
          </div>
          <div><Label htmlFor="cvc">Sinfə əlavə et (istəyə bağlı)</Label><select id="cvc" value={classId} onChange={(e) => setClassId(e.target.value)} className="w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm"><option value="">Sinif seçilməsin</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{err(fields.classId)}</div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="submit" variant="app" disabled={busy}>{busy ? "Yaradılır..." : "Təsdiqlə"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
