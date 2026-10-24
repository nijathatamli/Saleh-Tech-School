"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { Avatar } from "@/components/ui/avatar";
import type { NavItem } from "@/components/app/sidebar";

type Rect = { y: number; h: number };

/** Related pages sit together (a hairline between groups) instead of one flat list of fifteen. */
const ADMIN_GROUPS: string[][] = [
  ["/admin"],
  ["/admin/students", "/admin/parents", "/admin/teachers"],
  ["/admin/courses", "/admin/classes", "/admin/schedule", "/admin/attendance"],
  ["/admin/payments", "/admin/leads", "/admin/scholarship"],
  ["/admin/blog"],
  ["/admin/reports", "/admin/notifications", "/admin/audit", "/admin/settings"],
];
const startsGroup = (groups: string[][], href: string, i: number) => i > 0 && groups.some((g) => g[0] === href);

/**
 * The navigation list. Two capsules glide behind the links: a neutral one that follows the cursor / keyboard focus
 * (fades in under the first item you touch, then slides between items) and an orange one that marks the current page
 * and slides when the page changes. Only transform, height and opacity are animated (200–320 ms, ease-out).
 */
function PillNav({ items, badges, groups, home }: { items: NavItem[]; badges: Record<string, number>; groups: string[][]; home: string }) {
  const pathname = usePathname();
  const list = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Rect | null>(null);
  const [instant, setInstant] = useState(true);
  const [active, setActive] = useState<Rect | null>(null);
  // the most specific matching entry wins (/blogger/yazilar/yeni must not also light up /blogger/yazilar)
  const current = items
    .map((i) => i.href)
    .filter((h) => pathname === h || (h !== home && pathname.startsWith(`${h}/`)))
    .sort((x, y) => y.length - x.length)[0];
  const isActive = (href: string) => href === current;

  const measureActive = useCallback(() => {
    const el = list.current?.querySelector<HTMLElement>('[aria-current="page"]');
    setActive(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
  }, []);
  useLayoutEffect(measureActive, [pathname, measureActive]);
  useEffect(() => {
    const node = list.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measureActive); // web fonts or a resized window move the rows
    ro.observe(node);
    return () => ro.disconnect();
  }, [measureActive]);

  const enter = (e: React.SyntheticEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const first = hover === null;
    setInstant(first); // the first appearance must not slide in from wherever the capsule last was
    setHover({ y: el.offsetTop, h: el.offsetHeight });
    if (first) requestAnimationFrame(() => setInstant(false));
  };

  return (
    <div ref={list} className="ad-navlist" onMouseLeave={() => setHover(null)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHover(null)}>
      <span
        aria-hidden="true"
        className="ad-pill ad-pill-active"
        data-on={active ? "true" : "false"}
        style={{ transform: `translate3d(0, ${active?.y ?? 0}px, 0)`, height: active?.h ?? 0 }}
      />
      <span
        aria-hidden="true"
        className="ad-pill ad-pill-hover"
        data-on={hover ? "true" : "false"}
        data-instant={instant ? "true" : "false"}
        style={{ transform: `translate3d(0, ${hover?.y ?? 0}px, 0)`, height: hover?.h ?? 0 }}
      />
      {items.map((item, i) => {
        const count = badges[item.href] ?? 0;
        return (
          <div key={item.href} className="contents">
            {startsGroup(groups, item.href, i) && <span aria-hidden="true" className="ad-sep" />}
            <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className="ad-navlink" onMouseEnter={enter} onFocus={enter}>
              {item.icon}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {count > 0 && (
                <>
                  <span aria-hidden="true" className="ad-navbadge">{count > 99 ? "99+" : count}</span>
                  <span className="sr-only">({count} gözləyir)</span>
                </>
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

type Glance = { paymentsDue: number; newApplications: number };
/** What differs between the panels that share this sidebar (admin by default). */
type Shell = { home?: string; groups?: string[][]; ariaLabel?: string; logoLabel?: string };

function PanelContent({ items, user, glance, shell, onClose }: { items: NavItem[]; user: { name: string; role: string }; glance?: Glance; shell: Shell; onClose?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between px-3 pb-4 pt-1">
        <Link href={shell.home ?? "/admin"} className="flex items-center text-[#1a1a1a]" aria-label={shell.logoLabel ?? "Saleh Tech School — admin"}>
          <Logo size={18} />
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Menyunu bağla" className="flex h-8 w-8 items-center justify-center rounded-[10px] text-[#6f6f6b] transition-colors hover:bg-black/5 hover:text-[#171717]">
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
        )}
      </div>

      <nav aria-label={shell.ariaLabel ?? "Admin naviqasiyası"} className={`app-scrollbar -mx-1 min-h-0 flex-1 overflow-y-auto px-1 ${onClose ? "ad-fade-bottom" : ""}`}>
        <PillNav items={items} badges={glance ? { "/admin/payments": glance.paymentsDue, "/admin/leads": glance.newApplications } : {}} groups={shell.groups ?? ADMIN_GROUPS} home={shell.home ?? "/admin"} />
      </nav>

      <div className="mt-3 flex shrink-0 items-center gap-3 border-t border-[rgba(23,23,23,0.06)] px-2 pt-4">
        <Avatar name={user.name} size={36} />
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-semibold">{user.name}</div>
          <div className="mt-px text-[11px] text-[#6f6f6b]">{user.role}</div>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          aria-label="Çıxış"
          title="Çıxış"
          className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] text-[#6f6f6b] transition-colors hover:bg-black/5 hover:text-[#171717]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}

/** Floating glass sidebar on computers, glass drawer on phones (same ids/events as before: #app-mobile-sidebar, toggle-app-sidebar). */
export function AdminSidebar({ items, user, glance, ...shell }: { items: NavItem[]; user: { name: string; role: string }; glance?: Glance } & Shell) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const toggle = () => setOpen((v) => !v);
    window.addEventListener("toggle-app-sidebar", toggle);
    return () => window.removeEventListener("toggle-app-sidebar", toggle);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("app-sidebar-state", { detail: open }));
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <aside className="ad-glass fixed bottom-[22px] left-[22px] top-[22px] z-20 hidden w-[236px] flex-col rounded-[30px] px-3.5 py-[22px] md:flex">
        <PanelContent items={items} user={user} glance={glance} shell={shell} />
      </aside>

      <div
        className={`fixed inset-0 z-40 bg-[rgba(23,23,23,0.3)] backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside
        id="app-mobile-sidebar"
        aria-label="Naviqasiya"
        // closed = invisible (after the slide-out), so its links are not in the tab order or read by screen readers
        className={`ad-glass app-scrollbar fixed inset-y-3 left-3 z-50 flex w-[17.5rem] max-w-[calc(100vw-1.5rem)] flex-col overflow-y-auto rounded-[28px] px-3.5 py-5 transition-[transform,visibility] duration-300 ease-out md:hidden ${open ? "visible translate-x-0" : "invisible -translate-x-[110%]"}`}
      >
        <PanelContent items={items} user={user} glance={glance} shell={shell} onClose={() => setOpen(false)} />
      </aside>
    </>
  );
}
