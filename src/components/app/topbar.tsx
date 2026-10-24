"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { longDate, parts } from "@/features/parent-dashboard/az";
import { SidebarMobileTrigger } from "@/components/app/sidebar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const today = () => longDate(parts(Date.now()));

/**
 * Admin page header — same layout as the teacher / student / parent dashboards: a large title with a muted line under it,
 * and on the right a glass bell button and a glass pill with today's date and the account menu.
 */
export function AppTopbar({
  title,
  subtitle,
  userName,
  userEmail,
  unreadNotifications = 0,
  notificationsHref,
  settingsHref,
  hideBell = false,
}: {
  title: string;
  subtitle?: string;
  userName: string;
  userEmail: string;
  unreadNotifications?: number;
  notificationsHref?: string;
  /** where "Ayarlar" in the account menu leads; the item is not shown without it */
  settingsHref?: string;
  /** panels without notifications (the blog author panel) show no bell */
  hideBell?: boolean;
}) {
  const router = useRouter();
  const bellClass =
    "ad-glass-chip relative flex h-10 w-10 items-center justify-center rounded-[14px] text-[#6f6f6b] transition-[transform,color] duration-200 ease-out hover:-translate-y-px hover:text-[#171717] active:translate-y-0";
  const bellInner = (
    <>
      <Bell className="h-[18px] w-[18px]" />
      {unreadNotifications > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff6b00] px-1 text-[10px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(255,107,0,0.7)]">
          {unreadNotifications > 9 ? "9+" : unreadNotifications}
        </span>
      )}
    </>
  );
  const label = unreadNotifications > 0 ? `Bildirişlər (${unreadNotifications} oxunmamış)` : "Bildirişlər";

  return (
    <header className="sticky top-0 z-30 flex items-start justify-between gap-4 bg-[rgba(247,247,245,0.78)] px-5 pb-3 pt-5 backdrop-blur-xl md:static md:bg-transparent md:px-10 md:pb-2 md:pt-12 md:backdrop-blur-none">
      <div className="flex min-w-0 items-start gap-3">
        <SidebarMobileTrigger className="ad-glass-chip mt-0.5 !rounded-[14px] !text-[#171717]" />
        <div className="min-w-0">
          <h1 className="ad-title truncate font-display text-[22px] leading-[1.15] text-[#171717] md:text-[34px]">{title}</h1>
          {subtitle && <p className="mt-1 truncate text-[13px] text-[#6f6f6b] md:mt-2.5 md:text-[15px]">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {hideBell ? null : notificationsHref ? (
          <Link href={notificationsHref} aria-label={label} className={bellClass}>
            {bellInner}
          </Link>
        ) : (
          <button type="button" aria-label={label} className={bellClass}>
            {bellInner}
          </button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger aria-label="Hesab menyusu" className="ad-glass-chip flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-1.5 outline-none transition-transform duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-[rgba(255,107,0,0.5)] md:pl-3.5">
            <span className="hidden whitespace-nowrap text-[12.5px] font-medium text-[#6f6f6b] md:inline" suppressHydrationWarning>
              {today()}
            </span>
            <Avatar name={userName} size={34} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-3 py-2">
              <p className="text-sm font-bold text-navy-900">{userName}</p>
              <p className="text-xs text-navy-400">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            {settingsHref && (
              <>
                <DropdownMenuItem onClick={() => router.push(settingsHref)}>
                  <Settings className="h-4 w-4" /> Ayarlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-red-500 hover:bg-red-50">
              <LogOut className="h-4 w-4" /> Çıxış
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
