"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Moon, Settings, Sun, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { locales, localeMeta, type Locale } from "@/i18n/locales";
import { setLocaleAction } from "@/i18n/actions";
import { cn } from "@/lib/utils";

/**
 * Replaces the site's dark full-width DashHeader for the parent section only —
 * the mockup has no top bar, just a floating date/avatar chip. Every control
 * DashHeader carried (theme, language, notifications, sign-out) lives inside
 * this chip's dropdown instead, so nothing is lost, it's just not visible
 * until opened.
 */
export function ParentTopBar({
  userName,
  userEmail,
  avatarUrl,
  settingsHref,
  notificationsHref,
  notificationsLabel,
  dateLabel,
  locale,
  labels,
}: {
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  settingsHref: string;
  notificationsHref: string;
  notificationsLabel: string;
  dateLabel: string;
  locale: Locale;
  labels: { language: string; profile: string; settings: string; logout: string; light: string; dark: string };
}) {
  const [isDark, setIsDark] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <div className="fixed right-6 top-4 z-30 md:right-10">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full border border-dash-ink/[0.06] bg-white/90 py-1 pl-4 pr-1 text-xs font-medium text-dash-ink/55 shadow-sm backdrop-blur-md outline-none transition hover:border-dash-ink/12 dark:border-white/10 dark:bg-dash-dark-surface/90 dark:text-white/55">
          <span className="hidden sm:inline">{dateLabel}</span>
          <Avatar name={userName} src={avatarUrl} size={30} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-3 py-2">
            <p className="text-sm font-bold text-navy-900">{userName}</p>
            <p className="text-xs text-navy-400">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <Link href={settingsHref}>
            <DropdownMenuItem>
              <User className="h-4 w-4" /> {labels.profile}
            </DropdownMenuItem>
          </Link>
          <Link href={notificationsHref}>
            <DropdownMenuItem>
              <Bell className="h-4 w-4" /> {notificationsLabel}
            </DropdownMenuItem>
          </Link>
          <Link href={settingsHref}>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" /> {labels.settings}
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? labels.light : labels.dark}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {locales.map((l) => (
            <DropdownMenuItem
              key={l}
              disabled={isPending}
              onClick={() => startTransition(() => setLocaleAction(l))}
              className={cn("justify-between", l === locale && "text-electric-600")}
            >
              <span className="flex items-center gap-2">
                <span>{localeMeta[l].flag}</span>
                {localeMeta[l].nativeName}
              </span>
              {l === locale && <span className="text-xs">✓</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> {labels.logout}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
