"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { CustomCursor } from "@/components/app/custom-cursor";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-center" richColors closeButton />
      <CustomCursor />
    </SessionProvider>
  );
}
