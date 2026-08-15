"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="Tema dəyiş"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-grey-100 text-grey-500 transition-all hover:bg-secondary hover:text-white dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-white dark:hover:text-secondary"
    >
      <Moon className="h-4 w-4 dark:hidden" />
      <Sun className="hidden h-4 w-4 dark:block" />
    </button>
  );
}
