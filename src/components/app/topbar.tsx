"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { SidebarMobileTrigger } from "@/components/app/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AppTopbar({
  title,
  subtitle,
  userName,
  userEmail,
  unreadNotifications = 0,
  notificationsHref,
}: {
  title: string;
  subtitle?: string;
  userName: string;
  userEmail: string;
  unreadNotifications?: number;
  notificationsHref?: string;
}) {
  const BellButton = (
    <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-900">
      <Bell className="h-5 w-5" />
      {unreadNotifications > 0 && (
        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
          {unreadNotifications > 9 ? "9+" : unreadNotifications}
        </span>
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-navy-100 bg-white/80 px-4 py-4 backdrop-blur-md md:px-10">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarMobileTrigger />
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg text-navy-900 md:text-xl">{title}</h1>
          {subtitle && <p className="truncate text-xs text-navy-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        {notificationsHref ? <Link href={notificationsHref}>{BellButton}</Link> : BellButton}

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
            <Avatar name={userName} size={38} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-2">
              <p className="text-sm font-bold text-navy-900">{userName}</p>
              <p className="text-xs text-navy-400">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4" /> Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4" /> Ayarlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Çıxış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
