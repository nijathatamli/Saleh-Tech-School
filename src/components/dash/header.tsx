"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DashThemeToggle } from "@/components/dash/theme-toggle";
import { LanguageSwitcher } from "@/components/dash/language-switcher";
import type { Locale } from "@/i18n/locales";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function DashHeader({
  brandHref,
  userName,
  userEmail,
  avatarUrl,
  settingsHref,
  notificationsHref,
  locale,
  labels,
  showLanguageSwitcher = true,
}: {
  brandHref: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  settingsHref: string;
  notificationsHref?: string;
  locale: Locale;
  labels: { language: string; profile: string; settings: string; logout: string; light: string; dark: string };
  showLanguageSwitcher?: boolean;
}) {
  const BellButton = (
    <button className="flex h-10 w-10 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white">
      <Bell className="h-5 w-5" />
    </button>
  );

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-white/10 bg-dash-ink px-4 text-white md:px-6">
      <Link href={brandHref} className="flex items-center gap-2 font-display text-base">
        <span className="text-lg">🦊</span>
        Saleh<span className="text-electric-400">.</span>Tech
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <DashThemeToggle light={labels.light} dark={labels.dark} variant="dark" />
        {showLanguageSwitcher && <LanguageSwitcher locale={locale} label={labels.language} variant="dark" />}
        {notificationsHref ? <Link href={notificationsHref}>{BellButton}</Link> : BellButton}

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 flex items-center gap-2 rounded-full outline-none">
            <Avatar name={userName} src={avatarUrl} size={34} />
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
            <Link href={settingsHref}>
              <DropdownMenuItem>
                <Settings className="h-4 w-4" /> {labels.settings}
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> {labels.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
