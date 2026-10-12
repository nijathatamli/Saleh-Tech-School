"use client";

import { useEffect, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { api, useDebounced } from "@/lib/client-api";
import { Input } from "@/components/ui/input";

export type TeacherOption = { id: string; name: string; position: string; email: string };
export type StudentOption = { id: string; name: string; grade: number | null; email: string | null; fin: string | null; active: boolean };

/** Single-select teacher picker: queries the server (only active teachers), supports clearing/reassignment. */
export function TeacherPicker({ value, onChange }: { value: TeacherOption | null; onChange: (t: TeacherOption | null) => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [items, setItems] = useState<TeacherOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void api<{ items: TeacherOption[] }>("GET", `/api/admin/teachers/search?q=${encodeURIComponent(dq)}&limit=8`).then((r) => live && r.ok && setItems(r.data.items));
    return () => {
      live = false;
    };
  }, [dq, open]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-navy-100 bg-navy-50 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-navy-900">{value.name}</p>
          <p className="text-xs text-navy-400">{value.position}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} className="rounded-full p-1 text-navy-400 hover:bg-white hover:text-navy-900" aria-label="Müəllimi sil">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} placeholder="Müəllim axtar..." className="pl-11" autoComplete="off" />
      {open && (
        <ul className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-navy-100 bg-white p-1 shadow-xl" role="listbox">
          {items.length === 0 && <li className="px-4 py-3 text-sm text-navy-400">Müəllim tapılmadı.</li>}
          {items.map((t) => (
            <li key={t.id}>
              <button type="button" role="option" aria-selected={false} onClick={() => { onChange(t); setOpen(false); setQ(""); }} className="flex w-full flex-col rounded-lg px-4 py-2 text-left hover:bg-navy-50">
                <span className="text-sm font-bold text-navy-900">{t.name}</span>
                <span className="text-xs text-navy-400">{t.position}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Multi-select student picker with server-side search (name, surname, FIN, e-mail, student id). */
export function StudentPicker({ selected, onChange, excludeClassId }: { selected: StudentOption[]; onChange: (s: StudentOption[]) => void; excludeClassId?: string }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [items, setItems] = useState<StudentOption[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setBusy(true);
    const qs = new URLSearchParams({ q: dq, limit: "8", ...(excludeClassId ? { excludeClassId } : {}) });
    void api<{ items: StudentOption[] }>("GET", `/api/admin/students/search?${qs}`).then((r) => {
      if (!live) return;
      setBusy(false);
      if (r.ok) setItems(r.data.items);
    });
    return () => {
      live = false;
    };
  }, [dq, excludeClassId]);

  const isSel = (id: string) => selected.some((s) => s.id === id);
  const toggle = (s: StudentOption) => onChange(isSel(s.id) ? selected.filter((x) => x.id !== s.id) : [...selected, s]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad, soyad, FIN, e-poçt və ya tələbə ID ilə axtar..." className="pl-11" autoComplete="off" />
      </div>
      <ul className="max-h-56 overflow-auto rounded-xl border border-navy-100" aria-label="Axtarış nəticələri">
        {items.length === 0 && <li className="px-4 py-3 text-sm text-navy-400">{busy ? "Axtarılır..." : "Tələbə tapılmadı."}</li>}
        {items.map((s) => (
          <li key={s.id}>
            <button type="button" onClick={() => toggle(s)} className="flex w-full items-center gap-3 border-b border-navy-50 px-4 py-2.5 text-left last:border-0 hover:bg-navy-50">
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${isSel(s.id) ? "border-electric-500 bg-electric-500 text-white" : "border-navy-100 bg-white"}`}>
                {isSel(s.id) && <Check className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">{s.name}</span>
                <span className="block truncate text-xs text-navy-400">
                  {s.fin ? `FIN: ${s.fin} · ` : ""}
                  {s.grade ? `${s.grade}-ci sinif · ` : ""}
                  {s.email ?? "giriş yoxdur"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-navy-400">Seçilmiş tələbələr: {selected.length}</p>
        {selected.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-auto">
            {selected.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-lg bg-navy-50 px-3 py-2 text-sm">
                <span className="font-bold text-navy-900">{s.name}</span>
                <button type="button" onClick={() => toggle(s)} className="text-xs font-bold text-red-500 hover:underline">
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
