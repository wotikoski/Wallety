"use client";

import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Reflects the OS color-scheme preference in real time.
 * The app no longer supports manual theme overrides — the system setting
 * is the source of truth (light by default, dark when the OS is dark).
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function apply(matches: boolean) {
      setDark(matches);
      if (matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    // Sync immediately with current system preference
    apply(mq.matches);

    // Keep in sync if the user changes their OS setting while the app is open
    mq.addEventListener("change", (e) => apply(e.matches));
    return () => mq.removeEventListener("change", (e) => apply(e.matches));
  }, []);

  return (
    <div
      title={dark ? "Modo escuro (sistema)" : "Modo claro (sistema)"}
      className="w-8 h-8 flex items-center justify-center rounded-[10px] border border-app-border text-app-muted"
    >
      {dark ? <Moon size={15} /> : <Sun size={15} />}
    </div>
  );
}
