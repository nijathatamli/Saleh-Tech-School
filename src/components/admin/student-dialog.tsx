"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, useDebounced } from "@/lib/client-api";

type Parent = { id: string; name: string; email: string; children: number };
const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

/** "Yeni tələbə yarat" — creates the User (role STUDENT) + profile on the server; searchable right away. */
export function CreateStudentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "", birthDate: "", grade: "", fin: "" });
  const [active, setActive] = useState(true);
  const [parentMode, setParentMode] = useState<"existing" | "new">("existing");
  const [parent, setParent] = useState<Parent | null>(null);
  const [pq, setPq] = useState("");
  const dpq = useDebounced(pq);
  const [parents, setParents] = useState<Parent[]>([]);
  const [np, setNp] = useState({ name: "", email: "", phone: "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  useEffect(() => {
    if (!open || parentMode !== "existing") return;
    let live = true;
    void api<{ items: Parent[] }>("GET", `/api/admin/parents?q=${encodeURIComponent(dpq)}&limit=6`).then((r) => live && r.ok && setParents(r.data.items));
    return () => {
      live = false;
    };
  }, [dpq, open, parentMode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFields({});
    setBusy(true);
    const body = {
      firstName: f.firstName, lastName: f.lastName, email: f.email, password: f.password, birthDate: f.birthDate,
      grade: f.grade ? Number(f.grade) : undefined, fin: f.fin || undefined, active,
      ...(parentMode === "existing" ? { parentId: parent?.id } : { newParent: { name: np.name, email: np.email, phone: np.phone || undefined, password: np.password } }),
    };
    const r = await api("POST", "/api/admin/students", body);
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setError(r.error);
    }
    setOpen(false);
    setF({ firstName: "", lastName: "", email: "", password: "", birthDate: "", grade: "", fin: "" });
    setParent(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app">Yeni tələbə yarat</Button></DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogTitle>Yeni tələbə</DialogTitle>
        <DialogDescription className="mb-6 text-sm text-navy-400">Tələbə yaradıldıqdan sonra dərhal axtarışda görünür və sinfə əlavə edilə bilər.</DialogDescription>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="sfn">Ad</Label><Input id="sfn" value={f.firstName} onChange={set("firstName")} />{err(fields.firstName)}</div>
            <div><Label htmlFor="sln">Soyad</Label><Input id="sln" value={f.lastName} onChange={set("lastName")} />{err(fields.lastName)}</div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="sem">E-poçt (giriş)</Label><Input id="sem" type="email" value={f.email} onChange={set("email")} autoComplete="off" />{err(fields.email)}</div>
            <div><Label htmlFor="spw">İlkin şifrə</Label><Input id="spw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" placeholder="Ən az 8 simvol" />{err(fields.password)}</div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div><Label htmlFor="sbd">Doğum tarixi</Label><Input id="sbd" type="date" value={f.birthDate} onChange={set("birthDate")} />{err(fields.birthDate)}</div>
            <div><Label htmlFor="sgr">Sinif (1-11)</Label><Input id="sgr" type="number" min={1} max={11} value={f.grade} onChange={set("grade")} />{err(fields.grade)}</div>
            <div><Label htmlFor="sfin">FIN (istəyə bağlı)</Label><Input id="sfin" value={f.fin} onChange={set("fin")} maxLength={12} className="uppercase" />{err(fields.fin)}</div>
          </div>

          <div className="rounded-xl border border-navy-100 p-4">
            <div className="mb-3 flex gap-4 text-sm font-bold">
              <label className="flex items-center gap-2"><input type="radio" checked={parentMode === "existing"} onChange={() => setParentMode("existing")} /> Mövcud valideyn</label>
              <label className="flex items-center gap-2"><input type="radio" checked={parentMode === "new"} onChange={() => setParentMode("new")} /> Yeni valideyn</label>
            </div>
            {parentMode === "existing" ? (
              parent ? (
                <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-2 text-sm"><span><b>{parent.name}</b> · {parent.email}</span><button type="button" className="text-xs font-bold text-red-500" onClick={() => setParent(null)}>Sil</button></div>
              ) : (
                <div className="space-y-2">
                  <Input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Valideyn axtar (ad və ya e-poçt)" />
                  <ul className="max-h-36 overflow-auto rounded-lg border border-navy-100">
                    {parents.length === 0 && <li className="px-4 py-2 text-sm text-navy-400">Valideyn tapılmadı.</li>}
                    {parents.map((p) => <li key={p.id}><button type="button" onClick={() => setParent(p)} className="w-full px-4 py-2 text-left text-sm hover:bg-navy-50"><b>{p.name}</b> · {p.email} · {p.children} övlad</button></li>)}
                  </ul>
                </div>
              )
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Valideynin adı" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} />
                <Input placeholder="E-poçt" type="email" value={np.email} onChange={(e) => setNp({ ...np, email: e.target.value })} />
                <Input placeholder="Telefon (istəyə bağlı)" value={np.phone} onChange={(e) => setNp({ ...np, phone: e.target.value })} />
                <Input placeholder="Şifrə (ən az 8)" type="password" value={np.password} onChange={(e) => setNp({ ...np, password: e.target.value })} autoComplete="new-password" />
              </div>
            )}
            {err(fields.parentId ?? fields.newParent)}
          </div>

          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Aktiv hesab</label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end gap-3"><Button type="button" variant="app-outline" onClick={() => setOpen(false)}>Ləğv et</Button><Button type="submit" variant="app" disabled={busy}>{busy ? "Yaradılır..." : "Tələbəni yarat"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditStudent = { id: string; firstName: string; lastName: string; grade: number | null; fin: string | null; birthDate: string };

/** Edits the profile fields; e-mail (login) stays as is, a new password is optional. */
export function EditStudentDialog({ student }: { student: EditStudent }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ firstName: student.firstName, lastName: student.lastName, birthDate: student.birthDate, grade: student.grade ? String(student.grade) : "", fin: student.fin ?? "", password: "" });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const r = await api("PATCH", `/api/admin/students/${student.id}`, {
      firstName: f.firstName, lastName: f.lastName, birthDate: f.birthDate, grade: f.grade ? Number(f.grade) : null,
      ...(f.fin && f.fin !== student.fin ? { fin: f.fin } : {}), ...(f.password ? { password: f.password } : {}),
    });
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
      <DialogTrigger asChild><Button variant="app-outline" size="sm">Redaktə et</Button></DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogTitle>Tələbəni redaktə et</DialogTitle><DialogDescription className="sr-only">Tələbə məlumatları</DialogDescription>
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><Label htmlFor="efn">Ad</Label><Input id="efn" value={f.firstName} onChange={set("firstName")} />{err(fields.firstName)}</div>
            <div><Label htmlFor="eln">Soyad</Label><Input id="eln" value={f.lastName} onChange={set("lastName")} />{err(fields.lastName)}</div>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div><Label htmlFor="ebd">Doğum tarixi</Label><Input id="ebd" type="date" value={f.birthDate} onChange={set("birthDate")} />{err(fields.birthDate)}</div>
            <div><Label htmlFor="egr">Sinif (1-11)</Label><Input id="egr" type="number" min={1} max={11} value={f.grade} onChange={set("grade")} />{err(fields.grade)}</div>
            <div><Label htmlFor="efin">FIN</Label><Input id="efin" value={f.fin} onChange={set("fin")} maxLength={12} className="uppercase" />{err(fields.fin)}</div>
          </div>
          <div><Label htmlFor="epw">Yeni şifrə (boş qoysanız dəyişmir)</Label><Input id="epw" type="password" value={f.password} onChange={set("password")} autoComplete="new-password" />{err(fields.password)}</div>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
          <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : "Yadda saxla"}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
