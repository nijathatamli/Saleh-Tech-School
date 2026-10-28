"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { Volume2, VolumeX, X } from "lucide-react";
import { armNotifySound, playNotifySound, setSoundEnabled, soundEnabled } from "@/lib/notify-sound";

type Item = { id: string; title: string; body: string; type: string; event: string | null; createdAt: string };
type Feed = { now: string; userId: string; role: string; unread: number; items: Item[] };

const POLL_MS = 15_000;
const SHOW_MS = 6500;
const MAX_VISIBLE = 3;
const CURSOR_KEY = "sts-notif-cursor";
/** where tapping the banner leads (the other panels show their notifications in a bell panel on the page itself) */
const HOME: Record<string, string | undefined> = { ADMIN: "/admin/notifications" };

const TONE: Record<string, string> = { success: "#16a34a", warning: "#f59e0b", error: "#dc2626", info: "#ff6b00" };

/**
 * New notifications arrive as a banner that slides in from the edge of the screen — the top-right corner on a
 * computer, the top of the screen on a phone — together with a short chime, like the banners of iOS / macOS.
 * Mounted once in the layout of every panel (admin, teacher, student, parent). It asks `/api/notifications/live` every
 * 15 s while the tab is visible, and straight away when the tab is shown again or the window regains focus.
 * A banner can be swiped away, closed with its button, or left alone (it leaves after a few seconds; hovering keeps it).
 */
export function NotificationToaster() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [items, setItems] = useState<Item[]>([]);
  const [role, setRole] = useState("");
  const [mounted, setMounted] = useState(false);
  const [wide, setWide] = useState(true);
  const [sound, setSound] = useState(true);
  const [blocked, setBlocked] = useState(false); // the browser has not allowed sound yet: the banner says how to turn it on
  const seen = useRef(new Set<string>());
  const busy = useRef(false);

  useEffect(() => {
    setMounted(true);
    setSound(soundEnabled());
    const off = armNotifySound();
    const touched = () => setBlocked(false); // the first tap unlocks audio (and plays a chime that was waiting)
    window.addEventListener("pointerdown", touched, { capture: true, passive: true });
    window.addEventListener("keydown", touched, { capture: true, passive: true });
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => {
      off();
      window.removeEventListener("pointerdown", touched, true);
      window.removeEventListener("keydown", touched, true);
      mq.removeEventListener("change", sync);
    };
  }, []);

  const poll = useCallback(async () => {
    if (busy.current || document.hidden) return;
    busy.current = true;
    try {
      let since: string | null = null;
      try {
        const saved = JSON.parse(sessionStorage.getItem(CURSOR_KEY) ?? "null") as { userId: string; now: string } | null;
        since = saved?.now ?? null;
      } catch {
        /* no storage: start from "now" */
      }
      const res = await fetch(`/api/notifications/live${since ? `?since=${encodeURIComponent(since)}` : ""}`, { cache: "no-store" });
      if (!res.ok) return;
      const feed = (await res.json()) as Feed;
      try {
        const saved = JSON.parse(sessionStorage.getItem(CURSOR_KEY) ?? "null") as { userId: string } | null;
        // another account signed in on this tab: its first answer only sets the cursor
        if (saved && saved.userId !== feed.userId) {
          sessionStorage.setItem(CURSOR_KEY, JSON.stringify({ userId: feed.userId, now: feed.now }));
          return;
        }
        sessionStorage.setItem(CURSOR_KEY, JSON.stringify({ userId: feed.userId, now: feed.now }));
      } catch {
        /* ignore */
      }
      setRole(feed.role);
      const fresh = feed.items.filter((n) => !seen.current.has(n.id));
      if (!fresh.length) return;
      fresh.forEach((n) => seen.current.add(n.id));
      if (playNotifySound() === "blocked") setBlocked(true);
      setItems((cur) => [...fresh.reverse(), ...cur].slice(0, MAX_VISIBLE + 2));
      router.refresh(); // the bell counters and lists on the page
    } catch {
      /* offline: try again at the next tick */
    } finally {
      busy.current = false;
    }
  }, [router]);

  useEffect(() => {
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    const now = () => void poll();
    document.addEventListener("visibilitychange", now);
    window.addEventListener("focus", now);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", now);
      window.removeEventListener("focus", now);
    };
  }, [poll]);

  const close = useCallback((id: string) => setItems((cur) => cur.filter((n) => n.id !== id)), []);
  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    if (next) playNotifySound();
  };
  const open = (id: string) => {
    close(id);
    const href = HOME[role];
    if (href) router.push(href);
  };

  if (!mounted) return null;
  const visible = items.slice(0, MAX_VISIBLE);
  return createPortal(
    <div className="nt-stack" role="region" aria-label="Yeni bildirişlər" data-testid="notification-stack">
      <AnimatePresence initial={false}>
        {visible.map((n) => (
          <Banner key={n.id} n={n} wide={wide} reduce={!!reduce} sound={sound} hint={blocked && sound} onClose={close} onOpen={open} onToggleSound={toggleSound} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

function Banner({
  n, wide, reduce, sound, hint, onClose, onOpen, onToggleSound,
}: {
  n: Item; wide: boolean; reduce: boolean; sound: boolean; hint: boolean;
  onClose: (id: string) => void; onOpen: (id: string) => void; onToggleSound: () => void;
}) {
  const [hold, setHold] = useState(false);
  const holdRef = useRef(false);
  holdRef.current = hold;

  // leaves by itself after a few seconds; every second the pointer spends on it restarts the count
  useEffect(() => {
    if (hold) return;
    const t = setTimeout(() => onClose(n.id), SHOW_MS);
    return () => clearTimeout(t);
  }, [hold, n.id, onClose]);

  const fly = wide ? { x: 460, y: -10 } : { x: 0, y: -150 }; // all the way off the screen edge
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const gone = wide ? info.offset.x > 70 || info.velocity.x > 500 : info.offset.y < -28 || info.velocity.y < -400;
    if (gone) onClose(n.id);
    else setHold(false);
  };

  return (
    <motion.div
      layout={!reduce}
      className="nt-banner"
      role="status"
      data-type={n.type}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, ...fly }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, ...fly, transition: { duration: 0.26, ease: [0.4, 0, 1, 1] } }}
      transition={{ type: "spring", stiffness: 380, damping: 30, mass: 0.9 }}
      drag={reduce ? false : wide ? "x" : "y"}
      dragConstraints={wide ? { left: 0, right: 0 } : { top: 0, bottom: 0 }}
      dragElastic={wide ? { left: 0.04, right: 0.9 } : { top: 0.9, bottom: 0.04 }}
      onDragStart={() => setHold(true)}
      onDragEnd={onDragEnd}
      onHoverStart={() => setHold(true)}
      onHoverEnd={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={() => setHold(false)}
    >
      <button type="button" className="nt-main" onClick={() => onOpen(n.id)}>
        <span className="nt-icon" aria-hidden="true">
          <Image src="/logo-s.png" alt="" width={44} height={44} />
          <i style={{ background: TONE[n.type] ?? TONE.info }} />
        </span>
        <span className="nt-text">
          <span className="nt-app">
            Saleh Tech School <b>indi</b>
          </span>
          <span className="nt-title">{n.title}</span>
          <span className="nt-body">{n.body}</span>
          {hint && <span className="nt-hint">Səs üçün səhifədə bir dəfə klik et</span>}
        </span>
      </button>
      <div className="nt-actions">
        <button type="button" onClick={onToggleSound} aria-label={sound ? "Bildiriş səsini söndür" : "Bildiriş səsini yandır"} aria-pressed={!sound}>
          {sound ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => onClose(n.id)} aria-label="Bildirişi bağla">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
