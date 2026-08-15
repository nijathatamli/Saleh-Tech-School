"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-black">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-2xl md:text-3xl">Nəsə səhv getdi</h1>
      <p className="mt-3 max-w-sm text-grey-500 dark:text-zinc-400">
        Xəta baş verdi. Zəhmət olmasa bir daha cəhd edin, problem davam edərsə bizimlə əlaqə saxlayın.
      </p>
      <Button onClick={reset} size="lg" className="mt-8">
        Yenidən cəhd et
      </Button>
    </div>
  );
}
