"use client";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string; fields?: Record<string, string> };

/** fetch wrapper for the admin forms: always resolves, never throws, always yields an Azerbaijani error string. */
export async function api<T = unknown>(method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE", url: string, body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, { method, headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, data: data as T };
    if (res.status === 401) return { ok: false, status: 401, error: "Sessiya müddəti bitib. Zəhmət olmasa yenidən daxil olun." };
    return { ok: false, status: res.status, error: data.error ?? "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.", fields: data.fields };
  } catch {
    return { ok: false, status: 0, error: "Əlaqə qurulmadı. İnternet bağlantınızı yoxlayın." };
  }
}

import { useEffect, useState } from "react";
export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
