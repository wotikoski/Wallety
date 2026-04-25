"use client";

import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // Sync with the class that the anti-flicker script may have already set
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
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
