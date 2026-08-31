"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { locales, localeMeta, type Locale } from "@/i18n/locales";
import { setLocaleAction } from "@/i18n/actions";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  locale,
  label,
  variant = "default",
}: {
  locale: Locale;
  label: string;
  variant?: "default" | "dark";
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn(
          "flex h-10 items-center gap-1.5 rounded-full px-3 transition-colors disabled:opacity-50",
          variant === "dark" ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-navy-400 hover:bg-navy-50 hover:text-navy-900"
        )}
        disabled={isPending}
      >
        <Languages className="h-4 w-4" />
        <span className="text-xs font-bold uppercase">{locale}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
