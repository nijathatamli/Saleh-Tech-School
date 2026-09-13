"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashNavItem } from "@/components/dash/sidebar";

// Exact match for the index route, prefix match for the rest, and always the
// LONGEST matching href wins — so /parent never stays lit on /parent/homework.
export function getActiveHref(items: DashNavItem[], brandHref: string, pathname: string) {
  return items
    .filter((i) => (i.href === brandHref ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export function DashRail({
  items,
  brandHref,
  hideDesktopRail = false,
}: {
  items: DashNavItem[];
  brandHref: string;
  hideDesktopRail?: boolean;
}) {
  const pathname = usePathname();
  const activeHref = getActiveHref(items, brandHref, pathname);

  return (
    <>
      {/* Desktop rail — unchanged behaviour, longest-match active state */}
      {!hideDesktopRail && (
        <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[72px] shrink-0 flex-col items-center gap-1.5 border-r border-black/20 bg-dash-ink py-5 md:flex">
          {items.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  active ? "text-electric-500" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && (
                  <span className="absolute -left-2.5 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-electric-500" />
                )}
                {item.icon}
              </Link>
            );
          })}
        </aside>
      )}

      {/* Mobile bottom nav — glass bar kept, oversized active pill REMOVED.
          Active = orange icon + darker bold label + 4px orange dot. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-dash-rule bg-white/85 px-2 backdrop-blur-xl backdrop-saturate-150 dark:border-dash-dark-rule dark:bg-dash-dark-surface/85 md:hidden"
        style={{ paddingTop: "0.5rem", paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {items.slice(0, 5).map((item) => {
          const active = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl bg-transparent px-1 pb-1 pt-1 outline-none transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-500/55",
                active ? "text-electric-500" : "text-dash-ink/45 dark:text-white/45"
              )}
            >
              {item.icon}
              <span
                className={cn(
                  "text-[9.5px] leading-none tracking-[0.01em] transition-colors",
                  active ? "font-bold text-dash-ink dark:text-white" : "font-semibold"
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full transition-all duration-200",
                  active ? "scale-100 bg-electric-500 opacity-100" : "scale-50 bg-transparent opacity-0"
                )}
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
