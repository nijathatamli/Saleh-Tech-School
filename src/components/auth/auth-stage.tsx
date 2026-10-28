"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { AuthBackground } from "@/components/marketing/auth-background";
import { FoxPoseContext, type FoxPose } from "./fox-pose";
import { LoginFox } from "./login-fox";

/**
 * Frame of the sign-in, forgot-password and reset-password pages: a dark scene with floating glass tiles and light
 * orbs, the mascot peeking over the top edge of a frosted glass card (its laptop is blurred *through* the glass),
 * and a speech bubble that follows what the visitor is doing. The card tilts a little towards the pointer and a soft
 * sheen follows it. Every animation is framer-motion; with "reduce motion" the page is still and complete.
 */
const SAY: Record<FoxPose, string> = {
  watch: "Salam! Mən Saleh 👋",
  shy: "Mən baxmıram 🙈",
  wink: "Xoş gəldin! 😉",
  oops: "Hmm, bir də yoxla 🤔",
};
const ROUTE_SAY: Record<string, string> = {
  "/sifre-unutdum": "Narahat olma, kömək edəcəyik 💪",
  "/sifre-yenile": "Yeni şifrə seçək! 🔑",
};

const TILES = [
  { cls: "left-[6%] top-[14%] h-36 w-36 md:h-52 md:w-52", rot: -12, dy: 16, dur: 11, hide: false },
  { cls: "right-[7%] top-[24%] h-24 w-24 md:h-40 md:w-40", rot: 14, dy: -20, dur: 13, hide: false },
  { cls: "bottom-[10%] left-[12%] h-28 w-44 md:h-36 md:w-60", rot: 8, dy: -14, dur: 9, hide: true },
  { cls: "bottom-[14%] right-[10%] h-32 w-32 md:h-44 md:w-44", rot: -9, dy: 18, dur: 12, hide: true },
];
const CHIPS = ["</>", "{ }", "01", ";", "#", "( )"];

export function AuthStage({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [pose, setPose] = useState<FoxPose>("watch");
  const ctx = useMemo(() => ({ pose, setPose }), [pose]);
  const card = useRef<HTMLDivElement>(null);

  // card tilt + sheen follow the pointer (mouse only)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 120, damping: 20, mass: 0.5 });
  const rotY = useTransform(sx, [-1, 1], [-4, 4]);
  const rotX = useTransform(sy, [-1, 1], [3, -3]);
  const tileX = useTransform(sx, [-1, 1], [-26, 26]);
  const tileY = useTransform(sy, [-1, 1], [-18, 18]);
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
        const el = card.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, [reduce, mx, my]);

  const say = pose === "watch" ? ROUTE_SAY[Object.keys(ROUTE_SAY).find((k) => pathname.startsWith(k)) ?? ""] ?? SAY.watch : SAY[pose];
  const rise = reduce ? {} : { initial: { opacity: 0, y: 46, scale: 0.96, filter: "blur(14px)" }, animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" } };

  return (
    <FoxPoseContext.Provider value={ctx}>
      <div className="auth-scene relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-5 pb-12 pt-24 font-app md:pt-20">
        <AuthBackground />

        {/* coloured light under the glass: without it the frost would have nothing to refract */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { cls: "-left-24 bottom-[-6%] h-[460px] w-[460px] bg-[#ff6b00]/45", dx: 60, dy: -40, dur: 16 },
            { cls: "-right-20 top-[-8%] h-[420px] w-[420px] bg-[#3b82f6]/40", dx: -50, dy: 50, dur: 19 },
            { cls: "left-[38%] top-[34%] h-[360px] w-[360px] bg-[#a855f7]/30", dx: 40, dy: 30, dur: 22 },
            { cls: "right-[8%] bottom-[-10%] h-[340px] w-[340px] bg-[#14b8a6]/30", dx: -40, dy: -30, dur: 18 },
          ].map((o, i) => (
            <motion.div
              key={i}
              className={`absolute rounded-full blur-[90px] ${o.cls}`}
              animate={reduce ? undefined : { x: [0, o.dx, 0], y: [0, o.dy, 0] }}
              transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>

        {/* floating glass tiles behind everything: the frost has shapes to blur */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {TILES.map((t, i) => (
            <motion.div key={i} className={`absolute ${t.cls} ${t.hide ? "hidden sm:block" : ""}`} style={reduce ? undefined : { x: tileX, y: tileY }}>
              <motion.div
                className="auth-tile h-full w-full"
                initial={reduce ? { rotate: t.rot } : { opacity: 0, scale: 0.7, rotate: t.rot - 20 }}
                animate={reduce ? { rotate: t.rot } : { opacity: 1, scale: 1, rotate: [t.rot, t.rot + 7, t.rot], y: [0, t.dy, 0] }}
                transition={reduce ? undefined : { opacity: { duration: 0.8, delay: 0.2 + i * 0.12 }, scale: { type: "spring", stiffness: 120, damping: 14, delay: 0.2 + i * 0.12 }, rotate: { duration: t.dur, repeat: Infinity, ease: "easeInOut" }, y: { duration: t.dur * 0.8, repeat: Infinity, ease: "easeInOut" } }}
              />
            </motion.div>
          ))}
          {!reduce &&
            CHIPS.map((c, i) => (
              <motion.span
                key={c}
                className="auth-chip"
                style={{ left: `${[9, 90, 20, 76, 4, 60][i]}%`, top: `${[62, 54, 18, 12, 38, 84][i]}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.7, 0], y: [0, -46, -92] }}
                transition={{ duration: 7 + i, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
              >
                {c}
              </motion.span>
            ))}
        </div>

        <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-10 md:py-7">
          <Link href="/" aria-label="Saleh Tech School — ana səhifə" className="flex items-center text-white">
            <Logo size={20} />
          </Link>
          <Link href="/" className="auth-back">
            <ArrowLeft className="h-3.5 w-3.5" /> Sayta qayıt
          </Link>
        </header>

        <div className="relative z-10 w-full max-w-md" style={{ perspective: 1400 }}>
          <div className="auth-fox-wrap">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={say}
                aria-hidden="true"
                className="auth-bubble"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.9, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.95, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
              >
                {say}
              </motion.p>
            </AnimatePresence>
            <motion.div initial={reduce ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 110, damping: 15, delay: 0.5 }}>
              <LoginFox pose={pose} />
            </motion.div>
          </div>

          <motion.div
            ref={card}
            className="auth-card"
            style={reduce ? undefined : { rotateX: rotX, rotateY: rotY }}
            {...rise}
            transition={{ type: "spring", stiffness: 130, damping: 19, mass: 0.9 }}
          >
            {children}
          </motion.div>
          <p className="mt-6 text-center text-xs text-white/60">© 2026 Saleh Tech School. Bütün hüquqlar qorunur.</p>
        </div>
      </div>
    </FoxPoseContext.Provider>
  );
}
