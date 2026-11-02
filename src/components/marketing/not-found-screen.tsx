"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Menu, X } from "lucide-react";
import { Logo } from "@/components/app/logo";

const VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260713_234424_b1332b69-2e69-4302-8dbc-40f86846afbd.mp4";
const ACCENT = "#F16524";
const LINKS = [
  { href: "/haqqimizda", label: "Haqqımızda" },
  { href: "/kurslar", label: "Kurslar" },
  { href: "/reyler", label: "Rəylər" },
  { href: "/bloq", label: "Bloq" },
  { href: "/elaqe", label: "Əlaqə" },
];
const MENU = [...LINKS, { href: "/giris", label: "Giriş" }];

/** The same logo as the landing page header, on a white pill so the orange mark stays visible on the orange screen. */
function Brand() {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-secondary shadow-[0_6px_18px_-8px_rgba(150,60,0,0.5)]">
      <Logo size={18} />
    </span>
  );
}

/**
 * The 404 page: an orange gradient screen with a huge white "404" (stretched to the height of the window and faded out
 * at the bottom) behind the school's fox mascot (a looping video on white, blended into the gradient with
 * `mix-blend-darken`), a small nav bar with a slide-in menu, and a way back home. One viewport, no scrolling.
 */
export function NotFoundScreen() {
  const [open, setOpen] = useState(false);
  const [scaleY, setScaleY] = useState(1);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "404 - Səhifə tapılmadı | Saleh Tech School";
    return () => {
      document.title = prev;
    };
  }, []);

  // the "404" and the oval are stretched so that the figures are as tall as the window
  useLayoutEffect(() => {
    const measure = () => {
      const h = text.current?.offsetHeight;
      if (h) setScaleY(window.innerHeight / h);
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener("resize", measure);
  }, []);

  // the page behind the menu does not scroll while it is open; Escape closes it
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      className="fixed inset-0 z-[100] flex h-screen w-full flex-col overflow-hidden font-sans"
      style={{ background: "linear-gradient(to bottom, #FF8233, #FDAC55)", fontFamily: "var(--font-inter), Inter, sans-serif" }}
    >
      {/* giant 404 + oval */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.8, WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 95%)", maskImage: "linear-gradient(to bottom, black 40%, transparent 95%)" }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div
            ref={text}
            className="select-none whitespace-nowrap font-black leading-none tracking-tighter"
            style={{ color: "#FFFFFF", fontSize: "clamp(200px, 48vw, 800px)", transform: `scale(1.15, ${scaleY * 1.4})` }}
          >
            404
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[22vh] rounded-full bg-white sm:h-[26vh] md:h-[50vh]"
            style={{ width: "clamp(120px, 20vw, 400px)", transform: `scaleY(${scaleY})`, transformOrigin: "center" }}
          />
        </div>
      </div>

      {/* nav */}
      <nav aria-label="Əsas naviqasiya" className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 md:px-12">
        <Link href="/" aria-label="Saleh Tech School — ana səhifə">
          <Brand />
        </Link>
        <div className="hidden gap-1 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium transition-colors hover:opacity-90" style={{ color: ACCENT }}>
              {l.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menyu"
          aria-expanded={open}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-white transition-colors hover:opacity-90 sm:px-5 sm:py-2.5"
          style={{ background: ACCENT }}
        >
          <Menu className="h-4 w-4" />
          <span className="hidden text-sm font-medium sm:inline">Menyu</span>
        </button>
      </nav>

      {/* menu overlay */}
      <div
        className={`fixed inset-0 z-50 transition-[visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "visible" : "invisible"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <div
          role="dialog"
          aria-label="Menyu"
          className={`absolute right-0 top-0 h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:w-[380px] ${open ? "translate-x-0" : "translate-x-full"}`}
          style={{ background: "linear-gradient(135deg, #FF6B1A 0%, #FF9642 100%)" }}
        >
          <div className="flex items-center justify-between p-6">
            <Brand />
            <button type="button" onClick={() => setOpen(false)} aria-label="Menyunu bağla" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col gap-2 px-6">
            {MENU.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                tabIndex={open ? 0 : -1}
                className={`rounded-2xl bg-white/10 px-6 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/20 ${open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                style={{ transitionDelay: open ? `${150 + i * 60}ms` : "0ms" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className={`absolute bottom-0 left-0 right-0 p-6 transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: open ? "450ms" : "0ms" }}>
            <Link href="/" tabIndex={open ? 0 : -1} className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-base font-semibold transition-transform hover:scale-[1.02]" style={{ color: ACCENT }}>
              <ArrowLeft className="h-4 w-4" /> Ana səhifəyə qayıt
            </Link>
          </div>
        </div>
      </div>

      {/* the fox */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ marginTop: "calc(-6vh - 40px)" }}>
        <div className="h-[85vh] w-[120vw] sm:h-[70vh] sm:w-[70vw] md:h-[78vh] md:w-[62vw]">
          <video autoPlay loop muted playsInline preload="auto" aria-hidden="true" className="pointer-events-none h-full w-full object-contain mix-blend-darken">
            <source src={VIDEO} type="video/mp4" />
          </video>
        </div>
      </div>

      {/* bottom */}
      <div className="relative z-30 mt-auto flex flex-col items-center px-4 pb-8 text-center sm:pb-16">
        <h1 className="mb-3 text-lg font-medium text-white drop-shadow-[0_1px_8px_rgba(190,70,0,0.6)] sm:mb-4 sm:text-xl md:text-2xl">Ups, axtardığınız səhifə tapılmadı!</h1>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg sm:px-8 sm:py-4 sm:text-base"
          style={{ background: ACCENT }}
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" /> Ana səhifəyə qayıt
        </Link>
      </div>
    </div>
  );
}
