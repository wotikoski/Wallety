"use client";

import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Theme toggle with three-tier priority:
 *   1. Manual override stored in localStorage ("theme" key)
 *   2. OS/system prefers-color-scheme preference
 *   3. Light mode as default
 * Clicking cycles between dark and light and saves the choice.
 * If the system preference changes and no manual override is set, the
 * app follows the system automatically.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(isDark: boolean) {
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    }

    // Initial state: stored override → system → light
    const stored = localStorage.getItem("theme");
    applyTheme(stored === "dark" || (stored === null && mq.matches));

    // Follow system changes only when no manual override is set
    function onSystemChange(e: MediaQueryListEvent) {
      if (localStorage.getItem("theme") === null) applyTheme(e.matches);
    }
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      title={dark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-app-border text-app-muted hover:text-app-text hover:bg-[var(--surface-raised)] transition"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
