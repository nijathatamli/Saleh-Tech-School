import Link from "next/link";
import { AuthBackground } from "@/components/marketing/auth-background";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-6 py-16 font-app">
      <AuthBackground />

      <div className="animate-in fade-in zoom-in-95 duration-700 relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center font-display text-xl text-white">
          <span className="mr-2 text-primary">🦊</span>
          Saleh<span className="text-primary">.</span>Tech
        </Link>
        <div className="rounded-3xl bg-white p-8 shadow-2xl transition-shadow duration-500 hover:shadow-electric-500/10 md:p-10">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-navy-400">
          © 2026 Saleh Tech School. Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  );
}
