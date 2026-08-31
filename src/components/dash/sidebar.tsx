import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export type DashNavItem = { href: string; label: string; icon: React.ReactNode };

export function DashSidebarMobileTrigger({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("toggle-dash-sidebar"))}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-dash-ink/50 transition-colors hover:bg-dash-paper-2 hover:text-dash-ink md:hidden",
        className
      )}
      aria-label="Menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}
