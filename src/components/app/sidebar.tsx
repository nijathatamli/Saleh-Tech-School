"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

export function AppSidebar({ items, brandHref }: { items: NavItem[]; brandHref: string }) {
  const pathname = usePathname();

  return (
    <aside className="app-scrollbar sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-navy-800 bg-navy-950 px-4 py-6 md:flex">
      <Link href={brandHref} className="mb-8 flex items-center px-2 font-display text-lg text-white">
        <span className="mr-2 text-primary">🦊</span>
        Saleh<span className="text-primary">.</span>Tech
      </Link>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== brandHref && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-electric-500 text-white" : "text-navy-100/70 hover:bg-navy-900 hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl bg-navy-900 p-4 text-xs text-navy-100/60">
        <p className="font-bold text-white">Kömək lazımdır?</p>
        <p className="mt-1">Dəstək xəttimizlə əlaqə saxlayın.</p>
      </div>
    </aside>
  );
}
