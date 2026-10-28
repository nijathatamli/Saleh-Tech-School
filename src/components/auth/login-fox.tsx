"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { FoxPose } from "./fox-pose";

/**
 * The school mascot on the sign-in page. Its moves are frames of the school's own outro video (public/assets/fox):
 * f060 looks at you, f050 has its eyes shut (it looks away while you type the password), f082–f117 end in a wink.
 * The frames are stacked <img> elements and only one is visible, so a change of pose is flicker-free once the
 * (small) files are cached; the first picture is the one the page paints. Reduced motion: the still picture only.
 */
const src = (n: number) => `/assets/fox/f${String(n).padStart(3, "0")}.webp`;
const STILL = 60;
const SHY = [60, 58, 56, 54, 52, 50]; //                          eyes close
const WINK = [...Array.from({ length: 18 }, (_, i) => 82 + i * 2), 117]; // squint, head tilt, ear flop, wink
const BACK = [117, 108, 100, 90, 81, 72, 66, 63, 60]; //          settle back to "watching"
const ALL = [...new Set([...SHY, ...WINK, ...BACK])];
const FRAME_MS = 36;

export function LoginFox({ pose }: { pose: FoxPose }) {
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [frame, setFrame] = useState(STILL);
  const cur = useRef(STILL);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  // the other frames load after the page itself
  useEffect(() => {
    if (reduce) return;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return;
    const go = () => setReady(true);
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
    return () => window.removeEventListener("load", go);
  }, [reduce]);

  // play the list of frames that belongs to the pose
  useEffect(() => {
    if (!ready || reduce) return;
    const path = (list: number[]) => {
      clearInterval(timer.current);
      let i = 0;
      timer.current = setInterval(() => {
        if (i >= list.length) return clearInterval(timer.current);
        cur.current = list[i];
        setFrame(list[i]);
        i += 1;
      }, FRAME_MS);
    };
    const at = SHY.indexOf(cur.current);
    if (pose === "shy") path(at >= 0 ? SHY.slice(at) : SHY);
    else if (pose === "wink") path(WINK);
    else if (at > 0) path(SHY.slice(0, at + 1).reverse()); //  eyes open again
    else if (cur.current !== STILL) path(BACK);
    return () => clearInterval(timer.current);
  }, [pose, ready, reduce]);

  // leans towards the pointer (mouse only) and floats a little
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 16, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 90, damping: 16, mass: 0.6 });
  const rotateY = useTransform(sx, [-1, 1], [-7, 7]);
  const rotateX = useTransform(sy, [-1, 1], [5, -5]);
  const x = useTransform(sx, [-1, 1], [-8, 8]);
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [reduce, mx, my]);

  const frames = useMemo(() => (ready && !reduce ? ALL.filter((n) => n !== STILL) : []), [ready, reduce]);
  const wag = pose === "oops" && !reduce;

  return (
    <motion.div
      className="auth-fox"
      style={reduce ? undefined : { rotateX, rotateY, x }}
      animate={wag ? { rotate: [0, -5, 5, -3, 3, 0] } : { rotate: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div animate={reduce ? undefined : { y: [0, -5, 0] }} transition={{ duration: 5, ease: "easeInOut", repeat: Infinity }}>
        {/* the still picture is what first paints; it is hidden (not covered: the frames are transparent) while another frame is shown */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(STILL)} alt="Saleh Tech School maskotu: eynəkli narıncı tülkü" width={420} height={455} className="auth-fox-img" data-on={frame === STILL ? "true" : "false"} fetchPriority="high" draggable={false} />
        {frames.map((n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={n} src={src(n)} alt="" aria-hidden="true" width={420} height={455} className="auth-fox-img auth-fox-frame" data-on={frame === n ? "true" : "false"} draggable={false} />
        ))}
      </motion.div>
    </motion.div>
  );
}
