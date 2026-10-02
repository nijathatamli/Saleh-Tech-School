"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/app/logo";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";
import { SCHOLARSHIP_BASE, SCHOLARSHIP_NAME } from "@/lib/scholarship/config";

const links = [
  { href: "/", label: "Ana Səhifə", active: true },
  { href: "/#courses", label: "Kurslar", active: false },
  { href: "/#parents", label: "Valideyn Paneli", active: false },
  { href: "/#testimonials", label: "Rəylər", active: false },
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
      <header className="fixed top-0 left-0 z-50 w-full border-b border-grey-100 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center" aria-label="Saleh Tech School — ana səhifə">
              <Logo size={20} />
            </Link>
            <Link href={SCHOLARSHIP_BASE} className="hidden whitespace-nowrap border-l border-grey-200 pl-6 text-[11px] font-bold uppercase tracking-widest text-primary dark:border-zinc-700 lg:block">
              {SCHOLARSHIP_NAME}
            </Link>
          </div>
          <nav className="hidden space-x-6 whitespace-nowrap text-sm font-semibold text-grey-500 dark:text-zinc-400 md:flex lg:space-x-8" aria-label="Təqaüd naviqasiyası">
            {scholarshipLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`nav-link-hover ${isActive(l.href) ? "text-secondary dark:text-white" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild size="md" className="hidden lg:inline-flex">
              <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`}>İmtahana başla</Link>
            </Button>
            <button className="text-2xl md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menyu" aria-expanded={open}>
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
    <header className="fixed top-0 left-0 z-50 w-full border-b border-grey-100 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center">
            <Logo size={20} />
          </Link>
          <nav className="hidden space-x-8 text-sm font-semibold text-grey-500 dark:text-zinc-400 md:flex">
            {links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`nav-link-hover ${l.active ? "text-secondary dark:text-white" : ""}`}
              >
                {l.label}
              </Link>
            ))}
            <Link href={SCHOLARSHIP_BASE} className="nav-link-hover text-primary">
              Təqaüd Proqramı
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/giris"
            className="hidden text-sm font-bold text-secondary transition-colors hover:text-primary dark:text-white md:inline-block"
          >
            Giriş
          </Link>
          <Button asChild size="md">
            <Link href="/sinaq-dersi">Qeydiyyat</Link>
          </Button>
          <button className="text-2xl md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menyu">
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
        </nav>
      )}
    </header>
  );
}
