"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { DashNavItem } from "@/components/dash/sidebar";

export function DashRail({ items, brandHref }: { items: DashNavItem[]; brandHref: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || (href !== brandHref && pathname.startsWith(href));
  }

  return (
    <>
      <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[72px] shrink-0 flex-col items-center gap-1.5 border-r border-black/20 bg-dash-ink py-5 md:flex">
        {items.map((item) => {
          const active = isActive(item.href);
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
              {active && <span className="absolute -left-2.5 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-electric-500" />}
              {item.icon}
            </Link>
          );
        })}
      </aside>

      <nav
        className="app-scrollbar fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-dash-rule bg-white/90 px-2 backdrop-blur-md dark:border-dash-dark-rule dark:bg-dash-dark-surface/90 md:hidden"
        style={{ paddingTop: "0.5rem", paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {items.slice(0, 5).map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                active ? "bg-electric-500 text-white" : "text-dash-ink/40 dark:text-white/40"
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
