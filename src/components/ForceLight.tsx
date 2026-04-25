"use client";

import { useEffect } from "react";

/**
 * Temporarily removes the "dark" class from <html> while the page is mounted,
 * then restores it on unmount (i.e., when the user navigates away).
 * Use this on pages that must always render in light mode (Terms, Privacy, etc.).
 */
export function ForceLight() {
  useEffect(() => {
    const html = document.documentElement;
    const wasDark = html.classList.contains("dark");
    html.classList.remove("dark");
    return () => {
      if (wasDark) html.classList.add("dark");
    };
  }, []);
  return null;
}
