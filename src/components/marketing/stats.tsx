"use client";

import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 500, suffix: "+", label: "Aktiv Tələbə" },
  { value: 30, suffix: "+", label: "Layihə" },
  { value: 20, suffix: "+", label: "Ekspert Müəllim" },
  { value: 15, suffix: "+", label: "Yarış və Nailiyyət" },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const start = performance.now();
          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="font-display text-4xl text-secondary dark:text-white md:text-5xl">
      {display}
      {suffix}
    </div>
  );
}

export function Stats() {
  return (
    <section className="grid grid-cols-2 gap-12 bg-grey-50 px-6 py-24 text-center dark:bg-zinc-900 md:grid-cols-4 md:px-20">
      {stats.map((s) => (
        <div key={s.label} className="space-y-3">
          <Counter value={s.value} suffix={s.suffix} />
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
