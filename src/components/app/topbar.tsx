"use client";

import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings, User } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AppTopbar({
  title,
  userName,
  userEmail,
  unreadNotifications = 0,
}: {
  title: string;
  userName: string;
  userEmail: string;
  unreadNotifications?: number;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-100 bg-white/80 px-6 py-4 backdrop-blur-md md:px-10">
      <h1 className="font-display text-lg text-navy-900 md:text-xl">{title}</h1>

      <div className="flex items-center gap-4">
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-900">
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </button>

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
