"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Plus, Search, Settings } from "lucide-react";
import { Logo } from "@/components/app/logo";
import { Avatar } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type Tab = { href: string; label: string };
export type CreateItem = { label: string; href: string };
type Shell = {
  home: string;
  ariaLabel: string;
  logoLabel: string;
  settingsHref: string;
  notificationsHref?: string;
  /** a GET form in the header (admin: student search); omit for none */
  search?: { action: string; placeholder: string; label: string };
  /** the blue button: several entries open a menu, one entry is a plain link */
  create: CreateItem[];
  createLabel: string;
};

/**
 * The panel's top bar: logo, search, the blue action button, settings, bell, account — and under it the row of text
 * tabs. The current tab is bold; a blue underline slides to it when the page changes. If the tabs do not fit, the row
 * scrolls (arrows appear at the ends) and the current tab is kept in view.
 */
export function AdminHeader({ tabs, badges, user, unread, shell }: { tabs: Tab[]; badges: Record<string, number>; user: { name: string; email: string }; unread?: number; shell: Shell }) {
  const router = useRouter();
  const pathname = usePathname();
  const strip = useRef<HTMLDivElement>(null);
  const [ink, setInk] = useState<{ x: number; w: number } | null>(null);
  const [edge, setEdge] = useState({ l: false, r: false });

  // the most specific matching tab wins (/blogger/yazilar/yeni must not also light up /blogger/yazilar)
  const current = tabs
    .map((t) => t.href)
    .filter((h) => pathname === h || (h !== shell.home && pathname.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];

  const measure = useCallback(() => {
    const el = strip.current;
    const a = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el) return;
    setInk(a ? { x: a.offsetLeft, w: a.offsetWidth } : null);
    setEdge({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  }, []);

  useLayoutEffect(() => {
    const el = strip.current;
    const a = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (el && a) {
      const target = a.offsetLeft - (el.clientWidth - a.offsetWidth) / 2;
      if (a.offsetLeft < el.scrollLeft || a.offsetLeft + a.offsetWidth > el.scrollLeft + el.clientWidth) el.scrollTo({ left: Math.max(0, target) });
    }
    measure();
  }, [pathname, measure]);
  useEffect(() => {
    const el = strip.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure); // web fonts or a resized window move the tabs
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const more = (dir: -1 | 1) => strip.current?.scrollBy({ left: dir * Math.max(180, (strip.current?.clientWidth ?? 600) * 0.6) });
  const single = shell.create.length === 1 ? shell.create[0] : null;

  return (
    <header className="ad-header">
      <div className="ad-header-row">
        <Link href={shell.home} className="mr-2 flex items-center text-[#1c2333]" aria-label={shell.logoLabel}>
          <Logo size={17} />
        </Link>

        {shell.search && (
          <form action={shell.search.action} method="GET" role="search" className="ad-search">
            <Search aria-hidden="true" />
            <input name="q" type="search" placeholder={shell.search.placeholder} aria-label={shell.search.label} autoComplete="off" />
          </form>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {single ? (
            <Link href={single.href} className="ad-btn ad-btn-app inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{shell.createLabel}</span><span className="sm:hidden">{single.label}</span>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="ad-btn ad-btn-app inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3.5 text-xs font-semibold outline-none" aria-label={shell.createLabel}>
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{shell.createLabel}</span> <ChevronDown className="hidden h-3.5 w-3.5 opacity-80 sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {shell.create.map((c) => (
                  <DropdownMenuItem key={c.href} onClick={() => router.push(c.href)}>{c.label}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Link href={shell.settingsHref} aria-label="Tənzimləmələr" title="Tənzimləmələr" className="ad-iconbtn">
            <Settings />
          </Link>
          {shell.notificationsHref && (
            <Link href={shell.notificationsHref} aria-label={unread ? `Bildirişlər (${unread} oxunmamış)` : "Bildirişlər"} title="Bildirişlər" className="ad-iconbtn">
              <Bell />
              {!!unread && <span className="ad-dot">{unread > 9 ? "9+" : unread}</span>}
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Hesab menyusu" className="ad-user outline-none">
              <Avatar name={user.name} size={32} />
              <span className="ad-user-name">{user.name}</span>
              <ChevronDown className="h-3.5 w-3.5 text-[#667085]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-3 py-2">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-navy-400">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500">
                <LogOut className="h-4 w-4" /> Çıxış
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="ad-tabs-wrap">
        <button type="button" className="ad-tab-arrow l" data-show={edge.l} onClick={() => more(-1)} aria-label="Əvvəlki bölmələr" tabIndex={-1}>
          <ChevronLeft />
        </button>
        <nav aria-label={shell.ariaLabel}>
          <div ref={strip} className="ad-tabs" onScroll={measure}>
            {tabs.map((t) => {
              const count = badges[t.href] ?? 0;
              return (
                <Link key={t.href} href={t.href} aria-current={t.href === current ? "page" : undefined} className="ad-tab">
                  {t.label}
                  {count > 0 && (
                    <>
                      <span aria-hidden="true" className="ad-tab-count">{count > 99 ? "99+" : count}</span>
                      <span className="sr-only">({count} gözləyir)</span>
                    </>
                  )}
                </Link>
              );
            })}
            <span aria-hidden="true" className="ad-tab-ink" style={{ width: ink?.w ?? 0, opacity: ink ? 1 : 0, transform: `translateX(${ink?.x ?? 0}px)` }} />
          </div>
        </nav>
        <button type="button" className="ad-tab-arrow r" data-show={edge.r} onClick={() => more(1)} aria-label="Növbəti bölmələr" tabIndex={-1}>
          <ChevronRight />
        </button>
      </div>
    </header>
  );
}
