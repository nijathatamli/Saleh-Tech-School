"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";

export function PaymentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function set(next: "PAID" | "DUE" | "CANCELLED") {
    setBusy(true);
    setError(null);
    const r = await api("PATCH", `/api/admin/payments/${id}/status`, { status: next });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "DUE" && (
        <>
          <Button size="sm" variant="app" disabled={busy} onClick={() => set("PAID")}>Ödənilib</Button>
          <button disabled={busy} onClick={() => set("CANCELLED")} className="text-xs font-bold text-navy-400 hover:text-red-500">Ləğv et</button>
        </>
      )}
      {(status === "PAID" || status === "CANCELLED") && (
        <button disabled={busy} onClick={() => window.confirm("Ödəniş yenidən açılsın?") && set("DUE")} className="text-xs font-bold text-navy-400 hover:text-electric-600">Yenidən aç</button>
      )}
      {error && <span role="alert" className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="app-outline" size="sm" disabled={disabled || busy} onClick={async () => { setBusy(true); await api("PATCH", "/api/admin/notifications", {}); setBusy(false); router.refresh(); }}>
      Hamısını oxunmuş et
    </Button>
  );
}
