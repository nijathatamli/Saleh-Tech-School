"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";

export type PillItem = { href: string; label: string; active?: boolean; className?: string };
type Box = { x: number; w: number };

/**
 * Desktop navigation links with a glass capsule: a soft pill fades in behind the link under the cursor (or keyboard focus)
 * and glides from link to link; a lighter capsule marks the current page. Only transform, width and opacity are animated
 * (260 ms, ease-out); with "reduce motion" it just appears.
 */
export function PillLinks({ items, label }: { items: PillItem[]; label: string }) {
  const nav = useRef<HTMLElement>(null);
  const [hover, setHover] = useState<Box | null>(null);
  const [instant, setInstant] = useState(true);
  const [active, setActive] = useState<Box | null>(null);

  const measureActive = useCallback(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setActive(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, []);
  useLayoutEffect(measureActive, [measureActive, items]);
  useEffect(() => {
    const node = nav.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measureActive); // fonts loading / a resized window move the links
    ro.observe(node);
    return () => ro.disconnect();
  }, [measureActive]);

  const enter = (e: React.SyntheticEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const first = hover === null;
    setInstant(first); // the first appearance must not slide in from wherever the capsule last was
    setHover({ x: el.offsetLeft, w: el.offsetWidth });
    if (first) requestAnimationFrame(() => setInstant(false));
  };

  return (
    <nav
      ref={nav}
      aria-label={label}
      className="pill-nav relative hidden items-center gap-0.5 rounded-full bg-black/[0.035] p-1 ring-1 ring-black/[0.05] md:flex dark:bg-white/[0.06] dark:ring-white/10"
      onMouseLeave={() => setHover(null)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHover(null)}
    >
      <span aria-hidden="true" className="pill-nav-capsule pill-nav-active" data-on={active ? "true" : "false"} style={{ transform: `translate3d(${active?.x ?? 0}px,0,0)`, width: active?.w ?? 0 }} />
      <span aria-hidden="true" className="pill-nav-capsule pill-nav-hover" data-on={hover ? "true" : "false"} data-instant={instant ? "true" : "false"} style={{ transform: `translate3d(${hover?.x ?? 0}px,0,0)`, width: hover?.w ?? 0 }} />
      {items.map((l) => (
        <Link
          key={l.href + l.label}
          href={l.href}
          aria-current={l.active ? "page" : undefined}
          onMouseEnter={enter}
          onFocus={enter}
          className={`pill-nav-link relative z-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold outline-none transition-colors duration-200 ease-out focus-visible:ring-2 focus-visible:ring-primary/60 ${l.className ?? "text-grey-500 hover:text-secondary dark:text-zinc-400 dark:hover:text-white"} ${l.active ? "!text-secondary dark:!text-white" : ""}`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
