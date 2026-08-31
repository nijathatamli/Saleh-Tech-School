"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

export type NavItem = { href: string; label: string; icon: React.ReactNode };

const roleLabels: Record<string, string> = {
  PARENT: "Valideyn",
  TEACHER: "Müəllim",
  STUDENT: "Tələbə",
  ADMIN: "Admin",
};

export function AppSidebar({
  items,
  brandHref,
  user,
}: {
  items: NavItem[];
  brandHref: string;
  user?: { name: string; email?: string; role?: string; avatarUrl?: string | null };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onToggle() {
      setMobileOpen((v) => !v);
    }
    window.addEventListener("toggle-app-sidebar", onToggle);
    return () => window.removeEventListener("toggle-app-sidebar", onToggle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const content = (
    <>
      <div className="mb-2 flex items-center justify-between px-2">
        <Link href={brandHref} className="flex items-center font-display text-lg text-white">
          <span className="mr-2 text-primary">🦊</span>
          Saleh<span className="text-primary">.</span>Tech
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-100/60 hover:bg-navy-900 hover:text-white md:hidden"
          aria-label="Menyunu bağla"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 mt-4 px-3 text-[10px] font-bold uppercase tracking-widest text-navy-100/30">Menyu</p>

      <nav className="flex-1 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== brandHref && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                active ? "bg-electric-500 text-white shadow-lg shadow-electric-500/20" : "text-navy-100/70 hover:bg-navy-900 hover:text-white"
              )}
            >
              {active && <span className="absolute -left-4 h-5 w-1 rounded-r-full bg-electric-400" />}
              <span className={cn("transition-transform duration-200", !active && "group-hover:scale-110")}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {user ? (
        <div className="mt-auto flex items-center gap-3 rounded-2xl bg-navy-900 p-3">
          <Avatar name={user.name} src={user.avatarUrl} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-white">{user.name}</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-electric-400">
              {user.role ? roleLabels[user.role] ?? user.role : ""}
            </p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-navy-100/50 transition-colors hover:bg-navy-800 hover:text-red-400"
            aria-label="Çıxış"
            title="Çıxış"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-auto rounded-2xl bg-navy-900 p-4 text-xs text-navy-100/60">
          <p className="font-bold text-white">Kömək lazımdır?</p>
          <p className="mt-1">Dəstək xəttimizlə əlaqə saxlayın.</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className="app-scrollbar sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-navy-800 bg-navy-950 px-4 py-6 md:flex">
        {content}
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={cn(
          "app-scrollbar fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-y-auto border-r border-navy-800 bg-navy-950 px-4 py-6 transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
}

export function SidebarMobileTrigger({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("toggle-app-sidebar"))}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-900 md:hidden",
        className
      )}
      aria-label="Menyu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
