"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Light / dark switch drawn as the "glass toggle" from the design reference: a frosted pill with a coloured light
 * inside (warm yellow by day, violet-to-blue by night), a clear glass bead that rolls from one end to the other
 * carrying a sun or a moon, the label on the free side, and a coloured glow under the pill. Switching crossfades
 * the light and the labels (with a little blur) while the bead slides with a soft overshoot and squashes in motion.
 * The look is pure CSS keyed on `html.dark` (so it is right from the first paint, with no hydration flash); the
 * component only flips the class, remembers the choice and tells assistive technology the state.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  const bead = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const sync = () => setDark(html.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync); // another tab / the system / a second toggle on the page
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      /* private mode: the choice is simply not remembered */
    }
    const el = bead.current;
    if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.remove("gt-moving");
      void el.offsetWidth; // restart the squash animation if it is clicked again quickly
      el.classList.add("gt-moving");
    }
  }

  return (
    <button type="button" onClick={toggle} aria-label="Tema dəyiş" aria-pressed={dark === null ? undefined : dark} className="gt">
      <span className="gt-glow gt-glow-day" aria-hidden="true" />
      <span className="gt-glow gt-glow-night" aria-hidden="true" />
      <span className="gt-track" aria-hidden="true">
        <span className="gt-fill gt-fill-day" />
        <span className="gt-fill gt-fill-night" />
        <span className="gt-label gt-label-day">Gündüz</span>
        <span className="gt-label gt-label-night">Gecə</span>
      </span>
      <span className="gt-bead" aria-hidden="true">
        <span ref={bead} className="gt-lens" onAnimationEnd={(e) => e.currentTarget.classList.remove("gt-moving")}>
          <svg className="gt-icon gt-icon-sun" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="4.4" />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="11.1" y="1.6" width="1.8" height="3.6" rx="0.9" transform={`rotate(${i * 45} 12 12)`} />
            ))}
          </svg>
          <svg className="gt-icon gt-icon-moon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.6 14.9A8.7 8.7 0 0 1 9.1 3.4a.7.7 0 0 0-.9-.9A10.2 10.2 0 1 0 21.5 15.8a.7.7 0 0 0-.9-.9Z" />
          </svg>
        </span>
      </span>
    </button>
  );
}
