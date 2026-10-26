"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type DockIcon = React.ComponentType<{ className?: string }>;
/** Icons that morph (teardrop → icon shape) when hovered. Any other item uses its own `icon`. */
export type MorphType = "home" | "blog" | "marker" | "email" | "linkedin" | "x" | "github";

export interface DockItem {
  title: string;
  icon: DockIcon;
  /** one of the morphing icons; the title is only the label shown in the tooltip */
  type?: MorphType;
  onClick?: () => void;
  /** a real link (crawlable, middle-clickable): `https://` opens in a new tab, anything else is a normal navigation */
  href?: string;
}

export interface GlassDockProps extends React.HTMLAttributes<HTMLDivElement> {
  items: DockItem[];
  dockClassName?: string;
}

// ---- shapes ----------------------------------------------------------------------------------------------------------
// every icon rests in its final shape; on hover it collapses into a flame/teardrop and springs back (GSAP MorphSVG)

const DROP_A = "M12 21C12 21 15.3954 18.8605 13.3637 16C12.0647 14.1711 9.51275 11.9823 9 10C8 6.134 10.134 3 12 3C13.866 3 16 6.134 15 10C14.4873 11.9823 11.9353 14.1711 10.6363 16C8.60464 18.8605 12 21 12 21Z";
const DROP_B = "M12 21C12 21 14.0216 19.0215 14.3637 16C14.6026 13.8898 13.5128 11.9823 13 10C12 6.134 13.134 3 12 3C10.866 3 12 6.134 11 10C10.4873 11.9823 9.39736 13.8898 9.6363 16C9.97843 19.0215 12 21 12 21Z";

const SHAPES: Record<MorphType, { rest: string; steps: { d: string; duration: number; ease?: string }[]; settle: number }> = {
  home: {
    rest: "M21 18V10.5339C21 9.57062 20.5374 8.66591 19.7565 8.1019L13.7565 3.76856C12.7079 3.01128 11.2921 3.01128 10.2435 3.76856L4.24353 8.1019C3.46259 8.66591 3 9.57062 3 10.5339V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18Z",
    steps: [
      { d: "M12.6387 3.53796L15.1949 7.69178C15.7004 8.51322 15.7802 9.5276 15.4092 10.4179L11.3846 20.0769C11.2016 20.516 11.5243 21 12 21V21C12.4757 21 12.7984 20.516 12.6154 20.0769L8.5908 10.4179C8.21983 9.5276 8.29956 8.51322 8.80506 7.69178L11.3613 3.53796C11.6541 3.06206 12.3459 3.06206 12.6387 3.53796Z", duration: 0.1 },
      { d: "M12.1483 3.46366L12.8548 8.05624C12.9493 8.67024 12.8508 9.29842 12.573 9.85405L8.08541 18.8292C7.58673 19.8265 8.31198 21 9.42705 21H14.5729C15.688 21 16.4133 19.8265 15.9146 18.8292L11.427 9.85405C11.1492 9.29842 11.0507 8.67024 11.1452 8.05624L11.8517 3.46366C11.8778 3.29407 12.1222 3.29407 12.1483 3.46366Z", duration: 0.09 },
    ],
    settle: 0.71,
  },
  blog: { rest: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z", steps: [{ d: DROP_A, duration: 0.1 }, { d: DROP_B, duration: 0.05 }], settle: 0.7 },
  marker: { rest: "M12 21C12 21 14.6062 18.8589 16.64 16C17.941 14.1711 19 12.0475 19 10C19 6.134 15.87 3 12 3C8.13 3 5 6.134 5 10C5 12.0475 6.05896 14.1711 7.36 16C9.39381 18.8589 12 21 12 21Z", steps: [{ d: DROP_A, duration: 0.1 }, { d: DROP_B, duration: 0.05 }], settle: 0.75 },
  email: { rest: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z", steps: [{ d: DROP_A, duration: 0.1 }, { d: DROP_B, duration: 0.05 }], settle: 0.7 },
  linkedin: {
    rest: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z",
    steps: [{ d: DROP_A, duration: 0.125 }, { d: "M13.364 5.63604C14.0062 9.12971 7.68417 13.4401 8.36401 18.3639C8.84929 21.8787 15.1508 21.8787 15.6361 18.3639C16.316 13.4401 9.99389 9.12969 10.6361 5.63604C11.3564 1.71793 12.6438 1.71795 13.364 5.63604Z", duration: 0.05 }],
    settle: 0.8,
  },
  x: { rest: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z", steps: [{ d: DROP_A, duration: 0.1 }, { d: DROP_B, duration: 0.05 }], settle: 0.75 },
  github: {
    rest: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
    steps: [{ d: DROP_A, duration: 0.1 }, { d: DROP_B, duration: 0.05 }],
    settle: 0.75,
  },
};

// GSAP and its MorphSVG plugin are heavy and only needed once somebody hovers an icon: load them then, once.
let gsapReady: Promise<typeof import("gsap")["gsap"]> | null = null;
function loadGsap() {
  gsapReady ??= Promise.all([import("gsap"), import("gsap/MorphSVGPlugin")]).then(([g, m]) => {
    g.gsap.registerPlugin(m.MorphSVGPlugin);
    return g.gsap;
  });
  return gsapReady;
}

/** The icon shape plays "collapse into a teardrop, then spring back" on hover. The scale/opacity custom properties
 *  (--dock-scale / --dock-opacity) are what the stylesheet reads, so the shape and the size animate together. */
function MorphingIcon({ type, active }: { type: MorphType; active: boolean }) {
  const root = useRef<HTMLSpanElement>(null);
  const path = useRef<SVGPathElement>(null);
  const running = useRef(false);

  const play = useCallback(async () => {
    if (running.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    const p = path.current;
    if (!el || !p) return;
    running.current = true;
    try {
      const gsap = await loadGsap();
      const shape = SHAPES[type];
      gsap.to(el, {
        "--dock-scale": 0.25,
        "--dock-opacity": 0,
        duration: 0.1,
        onComplete: () => {
          gsap.to(p, {
            keyframes: [
              ...shape.steps.map((s) => ({ morphSVG: s.d, duration: s.duration })),
              {
                morphSVG: shape.rest,
                duration: shape.settle,
                ease: "elastic.out(1, .9)",
                onStart: () => {
                  gsap.to(el, { "--dock-scale": 0.7, duration: shape.settle, ease: "elastic.out(1, .9)" });
                  gsap.to(el, { "--dock-opacity": 1, duration: 0.2 });
                },
                onComplete: () => { running.current = false; },
              },
            ],
          });
        },
      });
    } catch {
      running.current = false; // plugin failed to load: the icon simply stays as it is
    }
  }, [type]);

  return (
    <span ref={root} data-dock-morph="" className={cn("dock-ic", active && "active")} onMouseEnter={play} onFocus={play}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path ref={path} d={SHAPES[type].rest} />
      </svg>
    </span>
  );
}

export const GlassDock = React.forwardRef<HTMLDivElement, GlassDockProps>(({ items, className, dockClassName, ...props }, ref) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);
  const [tipX, setTipX] = useState(0);
  const slots = useRef<(HTMLElement | null)[]>([]);

  const enter = (index: number) => {
    if (hovered !== null && index !== hovered) setDirection(index > hovered ? 1 : -1);
    setHovered(index);
    const el = slots.current[index];
    if (el) setTipX(el.offsetLeft + el.offsetWidth / 2); // centre of the item inside the dock
  };
  const leave = () => {
    setHovered(null);
    setDirection(0);
  };

  return (
    <div ref={ref} className={cn("w-max max-w-full", className)} {...props}>
      <nav
        aria-label="Sürətli keçidlər"
        className={cn("glass-dock glass-border relative flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/80 px-3 py-3 shadow-2xl backdrop-blur-xl dark:bg-black/80 sm:gap-4 sm:px-6 sm:py-4", dockClassName)}
        onMouseLeave={leave}
      >
        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: -52, x: tipX }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 140, damping: 20 }}
              className="pointer-events-none absolute left-0 top-0 z-30"
              aria-hidden="true"
            >
              {/* framer-motion owns the transform of the element above (x/y), so the centring lives on this inner box */}
              <div className="-translate-x-1/2">
              <div className="flex min-w-[88px] items-center justify-center rounded-lg border border-neutral-700 bg-black px-4 py-2 text-white shadow-md dark:border-neutral-300 dark:bg-white dark:text-black">
                <div className="relative flex h-4 w-full items-center justify-center overflow-hidden">
                  <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.span
                      key={items[hovered].title}
                      custom={direction}
                      initial={{ x: direction > 0 ? 35 : -35, opacity: 0, filter: "blur(6px)" }}
                      animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ x: direction > 0 ? -35 : 35, opacity: 0, filter: "blur(6px)" }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="whitespace-nowrap text-[13px] font-medium tracking-wide"
                    >
                      {items[hovered].title}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {items.map((el, index) => {
          const Icon = el.icon;
          const isHovered = hovered === index;
          const external = !!el.href && /^https:\/\//.test(el.href);
          const inner = (
            <motion.span
              className="flex h-full w-full items-center justify-center"
              whileTap={{ scale: 0.95 }}
              animate={{ scale: isHovered ? 1.1 : 1, y: isHovered ? -3 : 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              {el.type ? (
                <MorphingIcon type={el.type} active={isHovered} />
              ) : (
                <Icon className={cn("h-[22px] w-[22px] transition-colors duration-200", isHovered ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400")} />
              )}
            </motion.span>
          );
          const cls = "relative flex h-10 w-10 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary max-[380px]:h-9 max-[380px]:w-9";
          const handlers = { onMouseEnter: () => enter(index), onFocus: () => enter(index), onBlur: leave };
          return el.href && external ? (
            <a key={el.title} ref={(n) => { slots.current[index] = n; }} href={el.href} aria-label={el.title} className={cls} target="_blank" rel="noopener noreferrer" {...handlers}>
              {inner}
            </a>
          ) : el.href ? (
            <Link key={el.title} ref={(n) => { slots.current[index] = n; }} href={el.href} aria-label={el.title} className={cls} {...handlers}>
              {inner}
            </Link>
          ) : (
            <button key={el.title} ref={(n) => { slots.current[index] = n; }} type="button" aria-label={el.title} onClick={el.onClick} className={cls} {...handlers}>
              {inner}
            </button>
          );
        })}
      </nav>
    </div>
  );
});

GlassDock.displayName = "GlassDock";
export default GlassDock;
