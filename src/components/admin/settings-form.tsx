"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/client-api";
import type { Settings } from "@/lib/settings";

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: Number(e.target.value) });
  const str = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setFields({});
    const r = await api("PUT", "/api/admin/settings", v);
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setMsg({ ok: false, text: r.error });
    }
    setMsg({ ok: true, text: "Tənzimləmələr yadda saxlanıldı." });
    router.refresh();
  }
  const err = (k: string) => (fields[k] ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{fields[k]}</p> : null);
  const card = "space-y-5 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]";

  return (
    <form onSubmit={save} className="space-y-6" noValidate>
      <section className={card}>
        <h2 className="text-base font-extrabold text-navy-900">Məktəb haqqında</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label htmlFor="sn">Məktəbin adı</Label><Input id="sn" value={v["school.name"]} onChange={str("school.name")} />{err("school.name")}</div>
          <div><Label htmlFor="sp">Telefon</Label><Input id="sp" value={v["school.phone"]} onChange={str("school.phone")} />{err("school.phone")}</div>
          <div><Label htmlFor="se">E-poçt</Label><Input id="se" type="email" value={v["school.email"]} onChange={str("school.email")} />{err("school.email")}</div>
          <div><Label htmlFor="sa">Ünvan</Label><Input id="sa" value={v["school.address"]} onChange={str("school.address")} />{err("school.address")}</div>
        </div>
      </section>
      <section className={card}>
        <h2 className="text-base font-extrabold text-navy-900">Dərs və ödəniş qaydaları</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><Label htmlFor="lm">Standart dərs müddəti (dəq)</Label><Input id="lm" type="number" value={v["lesson.defaultMinutes"]} onChange={num("lesson.defaultMinutes")} />{err("lesson.defaultMinutes")}</div>
          <div><Label htmlFor="lc">Ödəniş dövrü (dərs sayı)</Label><Input id="lc" type="number" value={v["billing.lessonsPerCycle"]} onChange={num("billing.lessonsPerCycle")} />{err("billing.lessonsPerCycle")}</div>
          <div><Label htmlFor="od">Gecikmə həddi (gün)</Label><Input id="od" type="number" value={v["billing.overdueDays"]} onChange={num("billing.overdueDays")} />{err("billing.overdueDays")}</div>
          <div><Label htmlFor="cc">Standart sinif tutumu (0 = limitsiz)</Label><Input id="cc" type="number" value={v["class.defaultCapacity"]} onChange={num("class.defaultCapacity")} />{err("class.defaultCapacity")}</div>
        </div>
        <p className="text-xs text-navy-400">Ödəniş dövrü və tutum yalnız <b>yeni</b> siniflər üçün standart dəyərdir; mövcud siniflər öz dəyərlərini saxlayır.</p>
      </section>
      <section className={card}>
        <h2 className="text-base font-extrabold text-navy-900">Bildirişlər</h2>
        <label className="flex items-center gap-3 text-sm font-bold text-navy-900"><input type="checkbox" checked={v["notify.paymentDueToFamilies"]} onChange={(e) => setV({ ...v, "notify.paymentDueToFamilies": e.target.checked })} /> Ödəniş vaxtı çatanda valideyn və tələbəyə də bildiriş göndər (adminlər həmişə bildiriş alır)</label>
      </section>
      {msg && <p role="status" className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>{msg.text}</p>}
      <Button type="submit" variant="app" disabled={busy}>{busy ? "Saxlanılır..." : "Yadda saxla"}</Button>
    </form>
  );
}
