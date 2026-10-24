"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/components/blog/upload";
import { api } from "@/lib/client-api";

const err = (m?: string) => (m ? <p role="alert" className="mt-1.5 text-xs font-semibold text-red-500">{m}</p> : null);

export function ProfileForm({ initial }: { initial: { name: string; email: string; avatarUrl: string | null; position: string; bio: string } }) {
  const router = useRouter();
  const [v, setV] = useState({ name: initial.name, position: initial.position, bio: initial.bio, avatarUrl: initial.avatarUrl });
  const [fields, setFields] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  async function pick(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    const r = await uploadImage(f);
    setBusy(false);
    if (r.ok) setV((p) => ({ ...p, avatarUrl: r.url }));
    else setMsg({ kind: "error", text: r.error });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setFields({});
    const r = await api("PATCH", "/api/blogger/profile", { name: v.name, position: v.position, bio: v.bio, avatarUrl: v.avatarUrl });
    setBusy(false);
    if (!r.ok) {
      setFields(r.fields ?? {});
      return setMsg({ kind: "error", text: r.error });
    }
    setMsg({ kind: "ok", text: "Profil yeniləndi." });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5 rounded-[26px] border border-[rgba(23,23,23,0.05)] bg-white p-6 shadow-[0_1px_2px_rgba(23,23,23,0.03)]">
      <div className="flex items-center gap-5">
        <Avatar src={v.avatarUrl} name={v.name || "?"} size={80} />
        <div className="space-y-2">
          <Button type="button" variant="app-outline" size="sm" disabled={busy} onClick={() => file.current?.click()}><ImagePlus className="mr-2 h-4 w-4" aria-hidden /> Şəkil seç</Button>
          {v.avatarUrl && <button type="button" onClick={() => setV((p) => ({ ...p, avatarUrl: null }))} className="ml-3 text-xs font-semibold text-red-500 hover:underline">Sil</button>}
          <p className="text-xs text-navy-400">Kvadrat şəkil daha yaxşı görünür.</p>
          <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" aria-label="Profil şəkli yüklə" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      <div>
        <Label htmlFor="pf-name">Ad və soyad</Label>
        <Input id="pf-name" value={v.name} maxLength={80} onChange={(e) => setV({ ...v, name: e.target.value })} className="mt-2" />
        {err(fields.name)}
      </div>
      <div>
        <Label htmlFor="pf-email">E-poçt</Label>
        <Input id="pf-email" value={initial.email} disabled className="mt-2" />
        <p className="mt-1 text-xs text-navy-400">E-poçtu və şifrəni administrator dəyişir.</p>
      </div>
      <div>
        <Label htmlFor="pf-pos">Vəzifə (məqalənin altında görünür)</Label>
        <Input id="pf-pos" value={v.position} maxLength={80} onChange={(e) => setV({ ...v, position: e.target.value })} className="mt-2" />
        {err(fields.position)}
      </div>
      <div>
        <Label htmlFor="pf-bio">Haqqında</Label>
        <textarea id="pf-bio" value={v.bio} maxLength={600} rows={4} onChange={(e) => setV({ ...v, bio: e.target.value })} className="mt-2 w-full rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm text-navy-900 focus:border-electric-500" />
        <p className="mt-1 text-right text-xs text-navy-400">{v.bio.length}/600</p>
        {err(fields.bio)}
      </div>
      {msg && <p role={msg.kind === "error" ? "alert" : "status"} className={`rounded-xl px-3 py-2 text-sm font-semibold ${msg.kind === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{msg.text}</p>}
      <Button type="submit" variant="app" size="md" disabled={busy}>{busy ? "Saxlanılır..." : "Yadda saxla"}</Button>
    </form>
  );
}
