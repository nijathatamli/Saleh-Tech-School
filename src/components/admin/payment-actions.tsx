"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";

/**
 * Buttons of one lesson cycle. A cycle is opened automatically when a student completes its 8 lessons (status DUE); the admin then
 * either confirms the payment ("Ödəniş etdi") or blocks the student's account until it arrives ("Hesabı blokla" / "Blokdan çıxar").
 */
export function PaymentActions({ id, status, studentId = null, studentActive = null }: { id: string; status: string; studentId?: string | null; studentActive?: boolean | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blockable = !!studentId && studentActive !== null;
  async function call(path: string, body: unknown) {
    setBusy(true);
    setError(null);
    const r = await api("PATCH", `/api/admin/payments/${id}/${path}`, body);
    setBusy(false);
    if (!r.ok) setError(r.error);
    return r.ok;
  }
  async function set(next: "PAID" | "DUE" | "CANCELLED") {
    if (!(await call("status", { status: next }))) return;
    // paid while the account is blocked: offer to switch the login back on right away
    if (next === "PAID" && blockable && studentActive === false && window.confirm("Ödəniş qəbul edildi. Tələbənin hesabı blokdan çıxarılsın?")) await call("block", { blocked: false });
    router.refresh();
  }
  async function block(blocked: boolean) {
    if (blocked && !window.confirm("Tələbənin hesabı bloklansın? Tələbə sistemə daxil ola bilməyəcək (məlumatlar saxlanılır), valideynə bildiriş gedəcək.")) return;
    if (await call("block", { blocked })) router.refresh();
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "DUE" && (
        <>
          <Button size="sm" variant="app" disabled={busy} onClick={() => set("PAID")}>Ödəniş etdi</Button>
          {blockable && studentActive && <button disabled={busy} onClick={() => block(true)} className="text-xs font-bold text-red-500 hover:text-red-600">Hesabı blokla</button>}
          <button disabled={busy} onClick={() => set("CANCELLED")} className="text-xs font-bold text-navy-400 hover:text-red-500">Ləğv et</button>
        </>
      )}
      {(status === "PAID" || status === "CANCELLED") && (
        <button disabled={busy} onClick={() => window.confirm("Ödəniş yenidən açılsın?") && set("DUE")} className="text-xs font-bold text-navy-400 hover:text-electric-600">Yenidən aç</button>
      )}
      {blockable && !studentActive && (status === "DUE" || status === "PAID") && (
        <button disabled={busy} onClick={() => block(false)} className="text-xs font-bold text-electric-600 hover:text-electric-700">Blokdan çıxar</button>
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
