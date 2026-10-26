"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BrainCircuit, CircuitBoard, Code2, Bot, Gamepad2, Globe, ShieldCheck, ArrowRight, type LucideIcon } from "lucide-react";

export type CadetCourse = { slug: string; name: string; shortDesc: string; category: string; minAge: number; maxAge: number };

const ICONS: Record<string, LucideIcon> = { cybersecurity: ShieldCheck, programming: Code2, python: Code2, robotics: Bot, electronics: CircuitBoard, ai: BrainCircuit, game: Gamepad2, web: Globe };

/** pointer x across the frame (14 % … 86 %) is the head's gaze, 0 = looking to the left of the screen, 1 = to the right */
const X_FROM = 0.14;
const X_TO = 0.86;
const IDLE_MS = 3500;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Second landing section. A cartoon cadet's head is a short video that is never played: the cursor (or a finger) scrubs it, so
 * his head and eyes follow the pointer. The courses are laid out left to right along the same gaze axis: the one he is looking
 * at lights up (and its tagline replaces the subtitle); hovering a course turns his head to it. The red button closes a glass helmet.
 */
export function CadetHero({ courses }: { courses: CadetCourse[] }) {
  const section = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const helmet = useRef<HTMLImageElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [helmetOn, setHelmetOn] = useState(false);
  const [clipOn, setClipOn] = useState(false);
  const [touch, setTouch] = useState(false); // no hover: phones and tablets
  const lastDockTouch = useRef(-Infinity);

  // shared mutable state of the animation loop
  const target = useRef(0.5);
  const shown = useRef(0.5);
  const lastMove = useRef(-Infinity);
  const hover = useRef<number | null>(null);
  const visible = useRef(false);
  const activeRef = useRef<number | null>(null);
  const leftCount = Math.ceil(courses.length / 2);
  /** Where on the clip he looks AT each card: left cards look left (0 → 0.2), right cards look right (0.84 → 1), the middle of the
   *  clip is "straight ahead" and belongs to no card. The lower card of a side gets the milder pose (the extreme poses look up). */
  const gaze = useCallback(
    (i: number) => {
      const rightCount = courses.length - leftCount;
      return i < leftCount ? (0.2 * i) / Math.max(leftCount - 1, 1) : 0.84 + (0.16 * (i - leftCount)) / Math.max(rightCount - 1, 1);
    },
    [courses.length, leftCount]
  );
  const left = courses.slice(0, leftCount);
  // the right stack runs bottom-up along the gaze axis: the lower a card is, the closer to the middle he looks, so moving the
  // pointer DOWN on either side brings his gaze back towards the centre instead of further up and out (the clip's far poses look up)
  const right = courses.slice(left.length).reverse();

  // entrance: hidden until the section is on screen, then one timeline (skipped for reduced motion)
  useLayoutEffect(() => {
    const el = section.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const parts = el.querySelectorAll<HTMLElement>("[data-enter]");
    parts.forEach((p) => (p.style.opacity = "0"));
    let done = false;
    const play = () => {
      if (done) return;
      done = true;
      let t = 0;
      parts.forEach((p) => {
        const kind = p.dataset.enter;
        const from = kind === "title" ? { opacity: 0, transform: "translateY(26px)", filter: "blur(14px)" } : kind === "pop" ? { opacity: 0, transform: "scale(0.6)" } : { opacity: 0, transform: "translateY(14px)" };
        const to = kind === "title" ? { opacity: 1, transform: "none", filter: "blur(0)" } : kind === "pop" ? { opacity: 1, transform: "none" } : { opacity: 1, transform: "none" };
        const a = p.animate([from, to], { duration: 760, delay: t, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
        a.finished.then(() => { p.style.opacity = ""; a.cancel(); }).catch(() => {});
        t += kind === "pop" ? 0 : 90;
      });
    };
    if (typeof IntersectionObserver === "undefined") { play(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { play(); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // load the head clip as a blob (instant seeks), then run the follow loop
  useEffect(() => {
    const el = section.current;
    const vid = video.current;
    const fr = frame.current;
    if (!el || !vid || !fr) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    setTouch(!window.matchMedia("(hover: hover)").matches);
    let alive = true;
    let objectUrl: string | null = null;
    let raf = 0;
    let first = true;
    let ringX = 0;
    let ringY = 0;
    let px = 0;
    let py = 0;

    const io = new IntersectionObserver(([e]) => { visible.current = e.isIntersecting; }, { threshold: 0 });
    io.observe(el);
    // while this dark section is under the floating header, the header wears a dark glass look (readable text on navy)
    const root = document.documentElement;
    const navZone = Math.max(0, window.innerHeight - 96);
    const navIo = new IntersectionObserver(([e]) => root.classList.toggle("cd-dark-nav", e.isIntersecting), { rootMargin: `0px 0px -${navZone}px 0px`, threshold: 0 });
    navIo.observe(el);

    const setGaze = (clientX: number) => {
      const r = fr.getBoundingClientRect();
      target.current = clamp01(((clientX - r.left) / r.width - X_FROM) / (X_TO - X_FROM));
      lastMove.current = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (hover.current === null) setGaze(e.clientX);
      else lastMove.current = performance.now();
    };
    const onEnter = () => { if (fine) document.documentElement.classList.add("cd-over"); };
    const onLeave = () => document.documentElement.classList.remove("cd-over");
    if (!reduce) {
      el.addEventListener("pointermove", onMove, { passive: true });
      el.addEventListener("pointerdown", onMove, { passive: true });
    }
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible.current) return;
      // after a few seconds of stillness his gaze sweeps from one side to the other on its own (the whole clip, so every course
      // gets its turn; on a phone this is how it moves unless a finger is on it)
      let goal = hover.current !== null ? gaze(hover.current) : target.current;
      if (hover.current === null && now - lastMove.current > IDLE_MS) goal = 0.5 + 0.46 * Math.sin(now / 1700);
      shown.current += (goal - shown.current) * 0.14;
      if (vid.readyState >= 2 && !reduce) {
        const t = shown.current * (vid.duration || 0);
        if (!vid.seeking && Math.abs(vid.currentTime - t) > 0.004) {
          vid.currentTime = t;
          if (first) { first = false; setClipOn(true); }
        }
      }
      // which course is he looking at? none while he looks roughly straight ahead
      let best: number | null = null;
      let bestD = 0.17;
      for (let i = 0; i < courses.length; i++) {
        const d = Math.abs(gaze(i) - shown.current);
        if (d < bestD) { bestD = d; best = i; }
      }
      if (hover.current !== null) best = hover.current;
      if (best !== activeRef.current) { activeRef.current = best; setActive(best); }
      if (fine && ring.current && dot.current) {
        ringX += (px - ringX) * 0.55;
        ringY += (py - ringY) * 0.55;
        ring.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
        dot.current.style.transform = `translate3d(${px}px, ${py}px, 0)`;
      }
    };
    raf = requestAnimationFrame(tick);

    if (!reduce) {
      fetch("/assets/cadet/head.mp4")
        .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
        .then((b) => { if (alive) { objectUrl = URL.createObjectURL(b); vid.src = objectUrl; vid.load(); } })
        .catch(() => { if (alive) { vid.src = "/assets/cadet/head.mp4"; vid.load(); } });
    }
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      navIo.disconnect();
      root.classList.remove("cd-dark-nav");
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      document.documentElement.classList.remove("cd-over");
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [courses, gaze]);

  // the phone row keeps the current course in view
  useEffect(() => {
    const row = dock.current;
    const chip = active === null ? undefined : row?.querySelectorAll<HTMLElement>(".cd-chip")[active];
    if (!row || !chip || row.scrollWidth <= row.clientWidth || !row.offsetParent) return;
    if (performance.now() - lastDockTouch.current < 6000) return; // the reader is scrolling the row: do not fight them
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
  }, [active]);

  function toggleHelmet() {
    const h = helmet.current;
    const b = button.current;
    const next = !helmetOn;
    setHelmetOn(next);
    b?.animate([{ transform: "scale(1)" }, { transform: "scale(0.88)" }, { transform: "scale(1)" }], { duration: 320, easing: "ease-out" });
    if (!h) return;
    const drop = "translateY(calc(-70 * var(--u)))";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      h.style.opacity = next ? "1" : "0";
      h.style.transform = next ? "none" : drop;
      return;
    }
    const a = h.animate(
      next
        ? [{ opacity: 0, transform: drop }, { opacity: 1, transform: "translateY(calc(8 * var(--u)))", offset: 0.7 }, { opacity: 1, transform: "none" }]
        : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: drop }],
      { duration: 720, easing: "cubic-bezier(.3,1.2,.4,1)", fill: "forwards" }
    );
    void a;
  }

  const current = active === null ? null : courses[active];
  const card = (c: CadetCourse, i: number) => {
    const Icon = ICONS[c.category] ?? Code2;
    const on = i === active;
    return (
      <li key={c.slug}>
        <Link
          href={`/kurslar/${c.slug}`}
          className={`cd-card${on ? " is-active" : ""}`}
          data-enter="rise"
          aria-current={on ? "true" : undefined}
          onPointerEnter={() => { hover.current = i; }}
          onPointerLeave={() => { hover.current = null; lastMove.current = performance.now(); }}
          onFocus={() => { hover.current = i; }}
          onBlur={() => { hover.current = null; }}
        >
          <span className="cd-ico"><Icon size={20} aria-hidden /></span>
          <span>
            <b>{c.name}</b>
            <small>{c.minAge}–{c.maxAge} yaş</small>
            <span className="cd-go">Kursa bax <ArrowRight size={12} aria-hidden style={{ display: "inline", verticalAlign: "-1px" }} /></span>
          </span>
        </Link>
      </li>
    );
  };

  return (
    <section ref={section} className="cd-section" aria-labelledby="cd-title">
      <div className="cd-stage">
        <div ref={frame} className="cd-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cd-plate" src="/assets/cadet/plate.jpg" alt="" width={1920} height={1080} loading="lazy" decoding="async" />
          <video ref={video} className={`cd-head${clipOn ? " is-on" : ""}`} muted playsInline preload="auto" tabIndex={-1} aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={helmet} className="cd-helmet" src="/assets/cadet/helmet.jpg" alt="" width={960} height={958} loading="lazy" decoding="async" />
          <div className="cd-copy">
            <span className="cd-eyebrow" data-enter="rise">Kurslarımız</span>
            <h2 id="cd-title" className="cd-title" data-enter="title">Kəşf et</h2>
            <p className="cd-sub" data-enter="rise" >
              {current ? `${current.name}: ${current.shortDesc}` : touch ? "Ekrana toxun və ya sürüşdür: baş baxdığı kursu göstərir" : "Başını çevirdiyi kursu seç: kursoru sağa-sola apar"}
            </p>
          </div>
          <span className="cd-caption cd-caption-l" data-enter="rise">3D interaktiv</span>
          <span className="cd-caption cd-caption-r" data-enter="rise">Saleh Tech School</span>
          <button
            ref={button}
            type="button"
            className="cd-push"
            data-enter="pop"
            aria-pressed={helmetOn}
            aria-label={helmetOn ? "Dəbilqəni çıxar" : "Dəbilqəni tax"}
            onClick={toggleHelmet}
          >
            BAS<br />MƏNƏ
          </button>
        </div>
        <ul className="cd-cards cd-cards-l" aria-label="Kurslar, sol">{left.map((c) => card(c, courses.indexOf(c)))}</ul>
        <ul className="cd-cards cd-cards-r" aria-label="Kurslar, sağ">{right.map((c) => card(c, courses.indexOf(c)))}</ul>
        <div ref={ring} className="cd-ring" aria-hidden="true" />
        <div ref={dot} className="cd-dot" aria-hidden="true" />
      </div>
      <ul ref={dock} className="cd-dock" aria-label="Kurslar" onPointerDown={() => { lastDockTouch.current = performance.now(); }} onWheel={() => { lastDockTouch.current = performance.now(); }} onTouchMove={() => { lastDockTouch.current = performance.now(); }}>
        {courses.map((c, i) => {
          const Icon = ICONS[c.category] ?? Code2;
          return (
            <li key={c.slug} style={{ display: "contents" }}>
              <Link href={`/kurslar/${c.slug}`} className={`cd-chip${i === active ? " is-active" : ""}`}>
                <span className="cd-ico"><Icon size={20} aria-hidden /></span>
                <span><b>{c.name}</b><small>{c.minAge}–{c.maxAge} yaş</small></span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
