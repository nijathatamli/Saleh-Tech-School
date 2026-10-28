"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/** The header's "Yarat" menu links to e.g. `/admin/students?yarat=telebe`: the page's create dialog opens by itself and the address is cleaned. */
export function useOpenFromQuery(key: string, setOpen: (open: boolean) => void) {
  const params = useSearchParams();
  const want = params.get("yarat") === key;
  useEffect(() => {
    if (!want) return;
    setOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("yarat");
    window.history.replaceState(null, "", url.pathname + (url.search ? url.search : ""));
  }, [want, setOpen]);
}
