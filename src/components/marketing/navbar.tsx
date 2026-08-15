"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/", label: "Ana Səhifə" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/#parents", label: "Valideyn Paneli" },
  { href: "/#testimonials", label: "Rəylər" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-grey-100 bg-white/90 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center font-display text-xl tracking-tight">
            <span className="mr-2 text-primary">🦊</span>
            Saleh<span className="text-primary">.</span>Tech
          </Link>
          <nav className="hidden space-x-8 text-sm font-semibold text-grey-500 md:flex">
            {links.map((l) => (
              <Link key={l.label} href={l.href} className="relative transition-colors hover:text-secondary dark:hover:text-white">
                {l.label}
              </Link>
            ))}
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
          <Link href="/giris" onClick={() => setOpen(false)}>
            Giriş
          </Link>
        </nav>
      )}
    </header>
  );
}
