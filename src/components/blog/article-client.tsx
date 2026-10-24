"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Thin orange bar under the navbar showing how far down the article the reader is. */
export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const el = document.getElementById("blog-article");
    const onScroll = () => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      setP(Math.min(1, Math.max(0, total > 0 ? -r.top / total : 0)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1">
      <div className="h-full origin-left bg-primary" style={{ transform: `scaleX(${p})`, transition: "transform 80ms linear" }} />
    </div>
  );
}

/** Counts one read per browser tab session (the server also limits repeats per address). */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `blog-view:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* storage blocked: count anyway */
    }
    const t = setTimeout(() => {
      fetch("/api/blog/view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }), keepalive: true }).catch(() => {});
    }, 4000); // a read, not a bounce
    return () => clearTimeout(t);
  }, [slug]);
  return null;
}

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${title} ${url}`)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}` },
  ];
  const btn = "inline-flex items-center gap-2 rounded-full border border-grey-200 px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-zinc-700";
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Paylaş">
      {links.map((l) => (
        <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer" className={btn}>
          {l.label}
        </a>
      ))}
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Linki kopyalayın:", url);
          }
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Link2 className="h-3.5 w-3.5" aria-hidden />}
        {copied ? "Kopyalandı" : "Linki kopyala"}
      </button>
    </div>
  );
}
