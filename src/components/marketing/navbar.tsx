"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/app/logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { PillLinks } from "./pill-nav";
import { Button } from "@/components/ui/button";
import { SCHOLARSHIP_BASE, SCHOLARSHIP_NAME } from "@/lib/scholarship/config";

const links = [
  { href: "/", label: "Ana Səhifə", active: true },
  { href: "/#courses", label: "Kurslar", active: false },
  { href: "/#parents", label: "Valideyn Paneli", active: false },
  { href: "/#testimonials", label: "Rəylər", active: false },
  { href: "/bloq", label: "Bloq", active: false },
];

// Inside the scholarship section the same header switches to the scholarship navigation.
const scholarshipLinks = [
  { href: SCHOLARSHIP_BASE, label: "Təqaüd haqqında" },
  { href: `${SCHOLARSHIP_BASE}/qeydiyyat`, label: "Qeydiyyat" },
  { href: `${SCHOLARSHIP_BASE}/hazirliq`, label: "Hazırlıq" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const inScholarship = pathname === SCHOLARSHIP_BASE || pathname.startsWith(`${SCHOLARSHIP_BASE}/`);

  if (inScholarship) {
    const isActive = (href: string) => (href === SCHOLARSHIP_BASE ? pathname === href : pathname.startsWith(href));
    return (
      <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-7xl rounded-[28px] border border-white/60 bg-white/55 px-3 py-2.5 min-[380px]:px-4 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_44px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-[1.8] sm:px-6 dark:border-white/10 dark:bg-black/45 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_44px_-24px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center" aria-label="Saleh Tech School — ana səhifə">
              <Logo size={20} />
            </Link>
            <Link href={SCHOLARSHIP_BASE} className="hidden whitespace-nowrap border-l border-grey-200 pl-6 text-[11px] font-bold uppercase tracking-widest text-primary dark:border-zinc-700 lg:block">
              {SCHOLARSHIP_NAME}
            </Link>
          </div>
          <PillLinks label="Təqaüd naviqasiyası" items={scholarshipLinks.map((l) => ({ href: l.href, label: l.label, active: isActive(l.href) }))} />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild size="md" className="hidden lg:inline-flex">
              <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`}>İmtahana başla</Link>
            </Button>
            <button className="-mr-2 flex h-11 w-11 items-center justify-center text-2xl md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menyu" aria-expanded={open}>
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mt-4 flex flex-col gap-4 border-t border-grey-100 pt-4 text-sm font-semibold text-grey-500 md:hidden dark:border-zinc-800">
            {scholarshipLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={isActive(l.href) ? "text-secondary dark:text-white" : ""}
              >
                {l.label}
              </Link>
            ))}
            <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`} className="text-primary" onClick={() => setOpen(false)}>
              İmtahana başla
            </Link>
          </nav>
        )}
      </header>
    );
  }

  return (
    <header className="fixed inset-x-3 top-3 z-50 mx-auto max-w-7xl rounded-[28px] border border-white/60 bg-white/55 px-3 py-2.5 min-[380px]:px-4 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_18px_44px_-24px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-[1.8] sm:px-6 dark:border-white/10 dark:bg-black/45 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_44px_-24px_rgba(0,0,0,0.8)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <Logo size={20} />
          </Link>
          <PillLinks
            label="Əsas naviqasiya"
            items={[
              ...links.map((l) => ({ href: l.href, label: l.label, active: l.href === "/" ? pathname === "/" : l.href === "/bloq" && (pathname === "/bloq" || pathname.startsWith("/bloq/")) })),
              { href: SCHOLARSHIP_BASE, label: "Təqaüd Proqramı", className: "text-primary hover:text-primary" },
            ]}
          />
        </div>
        <div className="flex items-center gap-1 min-[380px]:gap-2 sm:gap-4">
          {/* under 340px there is no room for it next to the sign-up button: it moves into the menu */}
          <span className="max-[339px]:hidden"><ThemeToggle /></span>
          <Link
            href="/giris"
            className="hidden text-sm font-bold text-secondary transition-colors hover:text-primary dark:text-white md:inline-block"
          >
            Giriş
          </Link>
          <Button asChild size="md" className="px-3 min-[380px]:px-4 sm:px-6">
            <Link href="/sinaq-dersi">Qeydiyyat</Link>
          </Button>
          <button className="-mr-2 flex h-11 w-11 items-center justify-center text-2xl md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menyu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mt-4 flex flex-col gap-4 border-t border-grey-100 pt-4 text-sm font-semibold text-grey-500 md:hidden dark:border-zinc-800">
          {links.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href={SCHOLARSHIP_BASE} className="text-primary" onClick={() => setOpen(false)}>
            Təqaüd Proqramı
          </Link>
          <Link href="/giris" onClick={() => setOpen(false)}>
            Giriş
          </Link>
          <div className="min-[340px]:hidden"><ThemeToggle /></div>
        </nav>
      )}
    </header>
  );
}
