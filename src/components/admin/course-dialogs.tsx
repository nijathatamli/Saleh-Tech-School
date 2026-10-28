"use client";

import { useOpenFromQuery } from "@/components/admin/use-open-from-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client-api";
import { CATEGORY_LABEL, LEVEL_LABEL } from "@/lib/admin/labels";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);
const sel = "w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500";

export type CourseData = {
  id: string; slug: string; name: string; shortDesc: string; longDesc: string; category: string; minAge: number; maxAge: number; level: string;
  durationMonths: number; lessonsPerWeek: number; lessonMinutes: number; price: number; tags: string[]; featured: boolean; active: boolean; modules: { title: string; summary: string }[];
};

function CourseForm({ initial, onDone }: { initial?: CourseData; onDone: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: initial?.name ?? "", shortDesc: initial?.shortDesc ?? "", longDesc: initial?.longDesc ?? "", category: initial?.category ?? "programming", level: initial?.level ?? "BEGINNER",
    minAge: String(initial?.minAge ?? 8), maxAge: String(initial?.maxAge ?? 16), durationMonths: String(initial?.durationMonths ?? 6), lessonsPerWeek: String(initial?.lessonsPerWeek ?? 2),
    lessonMinutes: String(initial?.lessonMinutes ?? 60), price: String(initial?.price ?? 0), tags: (initial?.tags ?? []).join(", "),
    modules: (initial?.modules ?? []).map((m) => (m.summary ? `${m.title} | ${m.summary}` : m.title)).join("\n"),
  });
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFields({});
    const body = {
      name: f.name, shortDesc: f.shortDesc, longDesc: f.longDesc, category: f.category, level: f.level,
      minAge: Number(f.minAge), maxAge: Number(f.maxAge), durationMonths: Number(f.durationMonths), lessonsPerWeek: Number(f.lessonsPerWeek), lessonMinutes: Number(f.lessonMinutes), price: Number(f.price),
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean), featured, active,
      modules: f.modules.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [title, ...rest] = l.split("|"); return { title: title.trim(), summary: rest.join("|").trim() }; }),
    };
    const r = initial ? await api("PATCH", `/api/admin/courses/${initial.id}`, body) : await api("POST", "/api/admin/courses", body);
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
        <div><Label htmlFor="cn">Kursun adı</Label><Input id="cn" value={f.name} onChange={set("name")} />{err(fields.name)}</div>
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="cc">Kateqoriya</Label><select id="cc" className={sel} value={f.category} onChange={set("category")}>{Object.entries(CATEGORY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div><div><Label htmlFor="cl">Səviyyə</Label><select id="cl" className={sel} value={f.level} onChange={set("level")}>{Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div></div>
      </div>
      <div><Label htmlFor="cs">Qısa təsvir</Label><Input id="cs" value={f.shortDesc} onChange={set("shortDesc")} maxLength={200} />{err(fields.shortDesc)}</div>
      <div><Label htmlFor="cd">Ətraflı təsvir</Label><textarea id="cd" rows={3} className={sel} value={f.longDesc} onChange={set("longDesc")} /></div>
      <div className="grid gap-5 sm:grid-cols-4">
        <div><Label htmlFor="cmin">Min yaş</Label><Input id="cmin" type="number" value={f.minAge} onChange={set("minAge")} />{err(fields.minAge)}</div>
        <div><Label htmlFor="cmax">Maks yaş</Label><Input id="cmax" type="number" value={f.maxAge} onChange={set("maxAge")} />{err(fields.maxAge)}</div>
        <div><Label htmlFor="cdm">Müddət (ay)</Label><Input id="cdm" type="number" value={f.durationMonths} onChange={set("durationMonths")} />{err(fields.durationMonths)}</div>
        <div><Label htmlFor="cpr">Qiymət (AZN)</Label><Input id="cpr" type="number" min={0} value={f.price} onChange={set("price")} />{err(fields.price)}</div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div><Label htmlFor="clw">Həftədə dərs</Label><Input id="clw" type="number" value={f.lessonsPerWeek} onChange={set("lessonsPerWeek")} />{err(fields.lessonsPerWeek)}</div>
        <div><Label htmlFor="clm">Dərsin müddəti (dəq)</Label><Input id="clm" type="number" value={f.lessonMinutes} onChange={set("lessonMinutes")} />{err(fields.lessonMinutes)}</div>
      </div>
      <div><Label htmlFor="ct">Teqlər (vergüllə)</Label><Input id="ct" value={f.tags} onChange={set("tags")} /></div>
      <div><Label htmlFor="cm">Modullar (hər sətirdə bir modul: “Ad | qısa izah”)</Label><textarea id="cm" rows={5} className={sel} value={f.modules} onChange={set("modules")} />{err(fields.modules)}</div>
      <div className="flex flex-wrap gap-6 text-sm font-bold">
        <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Aktiv (saytda görünür, yeni sinif üçün seçilə bilər)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} /> Populyar</label>
      </div>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex justify-end"><Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : initial ? "Yadda saxla" : "Kursu yarat"}</Button></div>
    </form>
  );
}

export function CreateCourseDialog() {
  const [open, setOpen] = useState(false);
  useOpenFromQuery("kurs", setOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="app">Yeni kurs yarat</Button></DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogTitle>Yeni kurs</DialogTitle><DialogDescription className="mb-5 text-sm text-navy-400">Kurs kataloqdur; konkret tələbə qrupu “Sinif” kimi yaradılır.</DialogDescription><CourseForm onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}

export function EditCourseDialog({ course }: { course: CourseData }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><button className="text-xs font-bold text-electric-600 hover:underline">Redaktə et</button></DialogTrigger>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto"><DialogTitle>Kursu redaktə et</DialogTitle><DialogDescription className="sr-only">Kurs məlumatları</DialogDescription><CourseForm initial={course} onDone={() => setOpen(false)} /></DialogContent>
    </Dialog>
  );
}
