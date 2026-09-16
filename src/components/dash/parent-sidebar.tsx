"use client";

import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { getActiveHref } from "@/components/dash/rail";
import type { DashNavItem } from "@/components/dash/sidebar";

export function ParentSidebar({
  items,
  brandHref,
  badges,
  user,
  roleLabel,
}: {
  items: DashNavItem[];
  brandHref: string;
  badges?: Record<string, number>;
  user: { name: string; avatarUrl?: string | null };
  roleLabel: string;
}) {
  const pathname = usePathname();
  const activeHref = getActiveHref(items, brandHref, pathname);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-dash-rule bg-dash-paper py-5 dark:border-dash-dark-rule dark:bg-dash-dark-bg md:flex">
      <Link href={brandHref} className="mb-4 flex items-center px-5">
        <Logo size={16} />
      </Link>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const active = item.href === activeHref;
          const count = badges?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-electric-500/10 font-semibold text-electric-600"
                  : "text-dash-ink/55 hover:bg-dash-ink/[0.04] hover:text-dash-ink dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              <span className={cn("shrink-0", active ? "text-electric-500" : "")}>{item.icon}</span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {!!count && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-dash-ink/10 px-1.5 text-[11px] font-bold text-dash-ink/70 dark:bg-white/10 dark:text-white/70">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl border border-dash-ink/[0.05] bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]">
        <Avatar name={user.name} src={user.avatarUrl} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-dash-ink dark:text-white">{user.name}</p>
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-grey-500">{roleLabel}</p>
        </div>
      </div>
    </aside>
  );
}
