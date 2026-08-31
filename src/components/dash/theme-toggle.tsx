"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashThemeToggle({ light, dark, variant = "default" }: { light: string; dark: string; variant?: "default" | "dark" }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? light : dark}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
        variant === "dark"
          ? "text-white/40 hover:bg-white/5 hover:text-white"
          : "text-dash-ink/40 hover:bg-dash-paper-2 hover:text-dash-ink dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
      )}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
