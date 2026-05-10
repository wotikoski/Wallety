"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/lib/utils/currency";

/**
 * Threshold above which monetary values get abbreviated (e.g. "R$ 1,5M").
 * Below this, the full BRL string is shown ("R$ 999.999,99").
 */
const ABBREVIATE_AT = 1_000_000;

function abbreviate(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}R$ ${(abs / 1e9).toFixed(1).replace(".", ",")}B`;
  if (abs >= 1_000_000)     return `${sign}R$ ${(abs / 1e6).toFixed(1).replace(".", ",")}M`;
  if (abs >= 1_000)         return `${sign}R$ ${(abs / 1e3).toFixed(1).replace(".", ",")}k`;
  return formatCurrency(v);
}

/**
 * Shows a BRL value in full ("R$ 3.971,00"). When the value is large enough
 * to be visually awkward (>= 1M), it abbreviates and becomes a button — clicking
 * reveals a tooltip with the full value, rendered in a Portal so it is never
 * clipped by parent overflow or z-index constraints.
 */
export function SmartCurrency({
  value,
  className,
  style,
  prefix,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
  /** Optional prefix prepended inside the same span, e.g. "+" or "−". */
  prefix?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-dismiss after 2.5 s
  useEffect(() => {
    if (!tooltipPos) return;
    const t = setTimeout(() => setTooltipPos(null), 2500);
    return () => clearTimeout(t);
  }, [tooltipPos]);

  const handleClick = useCallback(() => {
    if (!btnRef.current) return;
    if (tooltipPos) {
      setTooltipPos(null);
      return;
    }
    const rect = btnRef.current.getBoundingClientRect();
    setTooltipPos({
      top:  rect.top + window.scrollY,   // absolute from page top
      left: rect.left + rect.width / 2,  // centre of button
    });
  }, [tooltipPos]);

  const isAbbreviated = Math.abs(value) >= ABBREVIATE_AT;
  const fullText = `${prefix ?? ""}${formatCurrency(value)}`;

  if (!isAbbreviated) {
    return <span className={className} style={style}>{fullText}</span>;
  }

  const shortText = `${prefix ?? ""}${abbreviate(value)}`;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        className={className}
        style={{ ...style, cursor: "pointer", background: "none", border: "none", padding: 0, font: "inherit" }}
        title="Toque para ver o valor completo"
      >
        {shortText}
      </button>

      {mounted && tooltipPos && createPortal(
        <div
          style={{
            position: "fixed",
            top:  tooltipPos.top - window.scrollY - 8,  // 8 px gap above button top
            left: tooltipPos.left,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
          className="animate-fade-in"
        >
          <div
            className="text-[12px] tabular-nums font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg"
            style={{
              background: "var(--color-text)",
              color: "var(--surface-card)",
            }}
          >
            {fullText}
            {/* caret */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent"
              style={{ borderTopColor: "var(--color-text)" }}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
