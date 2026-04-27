"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body via a React portal.
 * Use this to wrap any fixed-positioned overlay (modal, drawer, sheet)
 * so it escapes scroll containers (overflow-y-auto on <main>) and always
 * covers the full viewport — including the Topbar — in every browser.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
