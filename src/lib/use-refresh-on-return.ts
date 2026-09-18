"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-reads server state when the user comes back to a dashboard tab after a
 * while (or the network reconnects). The database is the source of truth —
 * a teacher's change shows up here on the next visit, refresh or return,
 * without any dashboard-to-dashboard messaging.
 */
export function useRefreshOnReturn(minHiddenMs = 60_000) {
  const router = useRouter();
  useEffect(() => {
    let hiddenAt: number | null = null;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt !== null && Date.now() - hiddenAt >= minHiddenMs) {
        hiddenAt = null;
        router.refresh();
      }
    };
    const onOnline = () => router.refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [router, minHiddenMs]);
}
