"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The frames come from the school's own outro video (public/assets/fox/fNNN.webp = video frame NNN, cut out of its
 * background). The fox keeps the video's moves: it works at the laptop with its head down (glasses glowing with the
 * screen), looks up, watches the viewer, then tilts its head, winks and flops an ear — and goes back to work.
 */
const ASSET = (n: number) => `/assets/fox/f${String(n).padStart(3, "0")}.webp`;
const range = (a: number, b: number, step: number) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

const WORK = range(0, 36, 3); //                      head down, typing (loops)
const UP = [...range(38, 60, 2)]; //                  looks up from the laptop
const IDLE = range(60, 81, 3); //                     faces the viewer, glances around
const EVENT = [...range(82, 116, 2), 117]; //         squint, head tilt, ear flop, wink
const ALL = [...new Set([...WORK, ...UP, ...IDLE, ...EVENT])];
const STILL = 60; // the picture shown before (and without) the animation: the fox looking at you

const MS30 = (frames: number) => (frames * 1000) / 30; // video frames → milliseconds
const stepMs = (list: number[]) => MS30(list[1] - list[0]);

/** What the fox "types" on its laptop, one line after the other. */
const LINES = ['print("Salam, dünya!")', "for ay in range(12): öyrən()", "robot.irəli(10)", "if kod_işləyir: bayram()", "# Mən Saleh, sənə necə kömək edə bilərəm?"];

const KEYWORDS = /^(print|for|in|range|if|else|def|return)$/;
/** Tiny syntax colouring for the partly typed line. */
function highlight(text: string) {
  const out: { t: string; c: string }[] = [];
  const re = /(#.*$)|("[^"]*"?)|(\b\d+\b)|([\p{L}_][\p{L}\p{N}_]*)|(\s+)|(.)/gu;
  for (const m of text.matchAll(re)) {
    const [t, comment, str, num, word] = m;
    if (comment) out.push({ t, c: "fox-c-comment" });
    else if (str) out.push({ t, c: "fox-c-string" });
    else if (num) out.push({ t, c: "fox-c-number" });
    else if (word) out.push({ t, c: KEYWORDS.test(word) ? "fox-c-keyword" : text.slice((m.index ?? 0) + t.length).startsWith("(") ? "fox-c-func" : "" });
    else out.push({ t, c: "" });
  }
  return out;
}

/** Types the lines in a loop while `running`; pausing keeps the half-typed line where it is. */
function useTypewriter(running: boolean) {
  const [text, setText] = useState("");
  const st = useRef({ line: 0, n: 0, phase: "type" as "type" | "hold" | "erase" });
  useEffect(() => {
    if (!running) return;
    let timer: ReturnType<typeof setTimeout>;
    const s = st.current;
    const step = () => {
      const line = LINES[s.line];
      if (s.phase === "type") {
        s.n += 1;
        setText(line.slice(0, s.n));
        if (s.n >= line.length) {
          s.phase = "hold";
          timer = setTimeout(step, 1500);
        } else timer = setTimeout(step, 38 + Math.random() * 55);
      } else if (s.phase === "hold") {
        s.phase = "erase";
        timer = setTimeout(step, 0);
      } else {
        s.n = Math.max(0, s.n - 2);
        setText(line.slice(0, s.n));
        if (s.n === 0) {
          s.line = (s.line + 1) % LINES.length;
          s.phase = "type";
          timer = setTimeout(step, 350);
        } else timer = setTimeout(step, 16);
      }
    };
    timer = setTimeout(step, 250);
    return () => clearTimeout(timer);
  }, [running]);
  return text;
}

type FoxState = "still" | "down" | "work" | "up" | "idle" | "event";

/**
 * The landing-page mascot. A canvas plays the cut-out video frames in a small state machine (idle → down → work →
 * up → idle → event → …); the speech bubble types code only while the fox works; code symbols float out of the
 * laptop; the fox leans a little towards the cursor. Until the frames are loaded, and with "reduce motion", it is one
 * still picture. Nothing runs while it is off screen.
 */
export function FoxMascot() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [motion, setMotion] = useState(false);
  const [visible, setVisible] = useState(true);
  const [live, setLive] = useState(false);
  const [state, setState] = useState<FoxState>("still");
  const visibleRef = useRef(true);
  visibleRef.current = visible;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMotion(!mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // load the frames (after the page itself, and not on "data saver"), then run the choreography
  useEffect(() => {
    if (!motion) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    let alive = true;
    // the compressed frames stay in memory (~2.3 MB); decoded pictures (3 MB each) exist only for the segment that
    // is playing and the one that comes next, so the page never holds all 51 decoded at once
    const blobs = new Map<number, Blob>();
    const bitmaps = new Map<number, ImageBitmap>();
    const pending = new Map<number, Promise<void>>();
    // The canvas is as many pixels as the fox is shown at (css width x pixel density, never above the 840 px of the
    // frames) and each frame is scaled ONCE with the browser's high-quality filter when it is decoded. Drawing an
    // 840 px picture into a ~450 px box every frame makes edges jagged and shimmering on ordinary (1x) screens.
    const FW = 840;
    const FH = 910;
    const size = () => {
      const css = cv.offsetWidth || 448; // layout width: unaffected by the entrance / tilt transforms
      const w = Math.max(320, Math.min(FW, Math.round(css * Math.min(window.devicePixelRatio || 1, 2))));
      return { w, h: Math.round((w * FH) / FW) };
    };
    let res = size();
    const fit = () => {
      cv.width = res.w;
      cv.height = res.h;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
    };
    fit();
    const decode = (n: number) => {
      if (bitmaps.has(n)) return Promise.resolve();
      let p = pending.get(n);
      if (!p) {
        const at = res;
        p = (at.w < FW ? createImageBitmap(blobs.get(n)!, { resizeWidth: at.w, resizeHeight: at.h, resizeQuality: "high" }) : createImageBitmap(blobs.get(n)!)).then((bm) => {
          if (alive && at === res) bitmaps.set(n, bm);
          else bm.close(); // closed, or decoded for a size that is no longer current
          if (pending.get(n) === p) pending.delete(n);
        });
        pending.set(n, p);
      }
      return p;
    };
    /** decode what is needed now (awaited) and what comes next (in the background); free the rest */
    const prepare = async (now: number[], next: number[] = []) => {
      const keep = new Set([...now, ...next, STILL]);
      for (const [n, bm] of bitmaps) if (!keep.has(n)) { bm.close(); bitmaps.delete(n); }
      const later = Promise.all(next.map(decode));
      await Promise.all(now.map(decode));
      void later;
    };
    const draw = (n: number, alpha = 1) => {
      const bm = bitmaps.get(n);
      if (!bm) {
        void decode(n); // size just changed: this frame is skipped, the next ones are there
        return;
      }
      ctx.globalAlpha = alpha;
      ctx.drawImage(bm, 0, 0, cv.width, cv.height);
      ctx.globalAlpha = 1;
    };
    const frame = (n: number) => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      draw(n);
    };
    const nextFrame = () => new Promise<number>((res) => requestAnimationFrame(res));
    /** waits while the tab is hidden or the fox is off screen */
    const whileHidden = async () => {
      while (alive && (document.hidden || !visibleRef.current)) await new Promise((r) => setTimeout(r, 200));
    };
    /** shows each frame of the list for `ms` (real time, so a slow device skips frames instead of slowing the fox down) */
    const play = async (frames: number[], ms: number) => {
      let i = 0;
      let t0 = performance.now();
      frame(frames[0]);
      while (alive && i < frames.length - 1) {
        await nextFrame();
        await whileHidden();
        const now = performance.now();
        if (now - t0 >= ms) {
          const skip = Math.max(1, Math.floor((now - t0) / ms));
          t0 += skip * ms;
          i = Math.min(frames.length - 1, i + skip);
          frame(frames[i]);
        }
      }
      await new Promise((r) => setTimeout(r, ms));
    };
    const blendTo = async (from: number, to: number, ms: number) => {
      const t0 = performance.now();
      let p = 0;
      while (alive && p < 1) {
        await nextFrame();
        p = Math.min(1, (performance.now() - t0) / ms);
        ctx.clearRect(0, 0, cv.width, cv.height);
        draw(from, 1 - p);
        draw(to, p);
      }
    };
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const run = async () => {
      if (typeof createImageBitmap === "undefined") return;
      try {
        await Promise.all(
          ALL.map(async (n) => {
            const r = await fetch(ASSET(n));
            if (!r.ok) throw new Error(String(r.status));
            blobs.set(n, await r.blob());
          })
        );
      } catch {
        return; // stay on the still picture
      }
      if (!alive) return;
      const pingPong = [...IDLE, ...[...IDLE].reverse().slice(1, -1)];
      const workLoop = [...WORK, ...[...WORK].reverse().slice(1, -1)];
      await prepare([STILL], [...UP]);
      frame(STILL);
      setLive(true);
      await wait(1100);
      while (alive) {
        await whileHidden();
        setState("down");
        await prepare(UP, WORK);
        await play([...UP].reverse(), stepMs(UP)); //   looks down at the laptop
        setState("work");
        await prepare(WORK, UP);
        for (let k = 0; k < 2 && alive; k++) await play(workLoop, stepMs(WORK)); // working
        setState("up");
        await prepare(UP, IDLE);
        await play(UP, stepMs(UP)); //                   looks up
        setState("idle");
        await prepare(IDLE, EVENT);
        await play(pingPong, stepMs(IDLE)); //           watches the viewer
        await play(pingPong, stepMs(IDLE));
        setState("event");
        await prepare([...EVENT, IDLE[2]], IDLE);
        await play(EVENT, stepMs(EVENT)); //             squint, tilt, ear flop, wink
        await blendTo(EVENT[EVENT.length - 1], IDLE[2], 280);
        setState("idle");
        await prepare(IDLE, UP);
        await play(pingPong, stepMs(IDLE));
      }
      for (const bm of bitmaps.values()) bm.close();
      bitmaps.clear();
    };
    // a window that grows well past the size the frames were prepared for: prepare them again at the new size
    let rt: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const next = size();
        if (next.w <= res.w * 1.2 && next.w >= res.w * 0.6) return;
        res = next;
        pending.clear();
        for (const bm of bitmaps.values()) bm.close();
        bitmaps.clear();
        fit();
      }, 300);
    };
    window.addEventListener("resize", onResize);
    const start = () => void run();
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => {
      alive = false;
      clearTimeout(rt);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", start);
      for (const bm of bitmaps.values()) bm.close();
      bitmaps.clear();
    };
  }, [motion]);

  // lean towards the cursor (mouse only)
  useEffect(() => {
    const el = root.current;
    if (!el || !motion || !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
        el.style.setProperty("--ry", `${(nx * 6).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${(-ny * 4).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--rx", "0deg");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [motion]);

  const playing = motion && visible;
  // the fox types only while it is working at the laptop
  const text = useTypewriter(playing && live && state === "work");
  const parts = highlight(live || !motion ? (motion ? text : LINES[0]) : "");

  return (
    <div ref={root} className="fox relative w-full max-w-md pt-[19%]" data-play={playing ? "true" : "false"} data-live={live ? "true" : "false"} data-state={state}>
      <div className="fox-glow" aria-hidden="true" />
      <div className="fox-tilt">
        <div className="fox-stage relative" style={{ aspectRatio: "840 / 910" }}>
          <Image
            src={ASSET(STILL)}
            alt="Saleh Tech School maskotu: mavi köynək və eynək taxmış narıncı tülkü noutbuk arxasında kod yazır"
            fill
            sizes="(min-width: 768px) 28rem, 90vw"
            priority
            className="fox-base object-contain"
          />
          <canvas ref={canvas} width={840} height={910} aria-hidden="true" className="fox-canvas absolute inset-0 h-full w-full" />
          {/* code that floats up out of the laptop */}
          {["</>", "{ }", "01", ";", "#"].map((s, i) => (
            <span key={s} aria-hidden="true" className="fox-chip" style={{ left: `${[10, 82, 4, 88, 16][i]}%`, animationDelay: `${i * 0.9}s` }}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="fox-bubble" aria-hidden="true">
        <div className="fox-bubble-bar">
          <i /><i /><i />
          <span>saleh.py</span>
        </div>
        <div className="fox-bubble-code">
          <span className="fox-c-prompt">›</span>{" "}
          {parts.map((p, i) => (
            <span key={i} className={p.c}>{p.t}</span>
          ))}
          <span className="fox-caret" />
        </div>
      </div>
    </div>
  );
}
