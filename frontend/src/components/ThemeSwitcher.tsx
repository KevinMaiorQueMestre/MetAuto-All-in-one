"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect runs only on the client, avoiding hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#2C2C2E] p-1 rounded-full border border-slate-200 dark:border-[#3A3A3C] backdrop-blur-sm transition-colors duration-300">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-full transition-all duration-300 ${
          theme === "light"
            ? "bg-white dark:bg-[#121212] text-teal-600 dark:text-teal-400 shadow-sm dark:bg-transparent dark:text-[#A1A1AA]"
            : "text-slate-500 dark:text-[#A1A1AA] hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-slate-200"
        }`}
        aria-label="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-full transition-all duration-300 hidden md:block ${
          theme === "system"
            ? "bg-white dark:bg-[#121212] text-teal-600 dark:text-teal-400 shadow-sm dark:bg-slate-700 dark:text-teal-400"
            : "text-slate-500 dark:text-[#A1A1AA] hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-slate-200"
        }`}
        aria-label="System mode"
      >
        <Monitor className="w-4 h-4" />
      </button>

      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-full transition-all duration-300 ${
          theme === "dark"
            ? "bg-slate-800 text-teal-400 shadow-sm"
            : "text-slate-500 dark:text-[#A1A1AA] hover:text-slate-700 dark:text-[#A1A1AA] dark:hover:text-slate-200"
        }`}
        aria-label="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
    </div>
  );
}
