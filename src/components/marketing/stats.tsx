"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const stats = [
  { value: "100+", label: "Aktiv Tələbə" },
  { value: "20+", label: "Ekspert Müəllim" },
  { value: "15+", label: "Tədris Proqramı" },
  { value: "98%", label: "Məmnuniyyət" },
];

const LOOPS = 2; // full 0-9 turns a reel makes before it lands

/** One digit as a vertical reel (0-9 repeated). It spins down to its digit with motion blur, in a window whose top and bottom fade out. */
function Reel({ digit, column, rolling, still }: { digit: number; column: number; rolling: boolean; still: boolean }) {
  const rows = Array.from({ length: 10 * (LOOPS + 1) }, (_, i) => i % 10);
  const end = 10 * LOOPS + digit; // rows to travel
  return (
    <span className="odo-window" aria-hidden="true">
      <span
        className={`odo-reel${rolling ? " is-rolling" : ""}${still ? " is-still" : ""}`}
        style={{ ["--odo-end" as string]: end, ["--odo-delay" as string]: `${column * 140}ms`, ["--odo-dur" as string]: `${1500 + column * 220}ms` }}
      >
        {rows.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </span>
    </span>
  );
}

function Stat({ value, label, index, rolling, still }: { value: string; label: string; index: number; rolling: boolean; still: boolean }) {
  // columns count from the left over the digits only
  let col = -1;
  return (
    <div className="space-y-3">
      <div className="font-display text-4xl text-secondary dark:text-white md:text-5xl" aria-label={value}>
        <span className="odo" aria-hidden="true">
          {value.split("").map((ch, i) => {
            if (/\d/.test(ch)) {
              col += 1;
              return <Reel key={i} digit={Number(ch)} column={col + index} rolling={rolling} still={still} />;
            }
            return (
              <span key={i} className={`odo-suffix${rolling ? " is-rolling" : ""}${still ? " is-still" : ""}`} style={{ ["--odo-delay" as string]: `${(col + index) * 140 + 900}ms` }}>
                {ch}
              </span>
            );
          })}
        </span>
      </div>
      <div className={`odo-label text-[10px] font-bold uppercase tracking-widest text-primary${rolling ? " is-rolling" : ""}${still ? " is-still" : ""}`} style={{ ["--odo-delay" as string]: `${index * 140 + 1700}ms` }}>
        {label}
      </div>
    </div>
  );
}

export function Stats() {
  const root = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"final" | "armed" | "rolling">("final");

  // server render and no-JS show the real numbers; with JS (and motion allowed) the reels are armed at 0 and spin when the section appears
  useLayoutEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMode("armed");
  }, []);
  useEffect(() => {
    const el = root.current;
    if (mode !== "armed" || !el) return;
    if (typeof IntersectionObserver === "undefined") return setMode("rolling");
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setMode("rolling"); io.disconnect(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [mode]);

  return (
    <section ref={root} className="grid grid-cols-2 gap-12 bg-grey-50 px-6 py-24 text-center dark:bg-zinc-900 md:grid-cols-4 md:px-20">
      {stats.map((s, i) => (
        <Stat key={s.label} value={s.value} label={s.label} index={i} rolling={mode === "rolling"} still={mode === "final"} />
      ))}
    </section>
  );
}
