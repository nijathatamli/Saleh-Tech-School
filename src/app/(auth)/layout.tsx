import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-6 py-16 font-app">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-electric-500/20 blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center font-display text-xl text-white">
          <span className="mr-2 text-primary">🦊</span>
          Saleh<span className="text-primary">.</span>Tech
        </Link>
        <div className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">{children}</div>
        <p className="mt-6 text-center text-xs text-navy-400">
          © 2026 Saleh Tech School. Bütün hüquqlar qorunur.
        </p>
      </div>
    </div>
  );
}
