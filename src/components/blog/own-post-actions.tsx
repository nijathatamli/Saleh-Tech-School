"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";

export function OwnPostActions({ id, slug, live, title }: { id: string; slug: string; live: boolean; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function remove() {
    if (!window.confirm(`“${title}” yazısı silinsin? Bu əməliyyat geri qaytarılmır.`)) return;
    setBusy(true);
    setError(null);
    const r = await api("DELETE", `/api/blogger/posts/${id}`);
    setBusy(false);
    if (r.ok) router.refresh();
    else setError(r.error);
  }
  return (
    <div className="flex items-center justify-end gap-3 text-sm font-semibold">
      <Link href={`/blogger/yazilar/${id}`} className="text-electric-600 hover:underline">Redaktə</Link>
      {live && <a href={`/bloq/${slug}`} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:underline">Bax</a>}
      <button type="button" onClick={remove} disabled={busy} className="text-red-500 hover:underline disabled:opacity-50">Sil</button>
      {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
