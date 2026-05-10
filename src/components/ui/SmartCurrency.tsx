"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils/currency";

/**
 * Threshold above which monetary values get abbreviated (e.g. "R$ 1,5M").
 * Below this, the full BRL string is shown ("R$ 999.999,99").
 *
 * R$ 1.000.000+ is the cutoff — long enough that a full 13-character string
 * starts to overflow tighter cards (KpiCard / SummaryChip).
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
 * reveals a tooltip with the full value.
 *
 * The same behavior applies on desktop and mobile, so the user can always
 * recover the exact number via tap/click.
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
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (!showTooltip) return;
    const t = setTimeout(() => setShowTooltip(false), 2500);
    return () => clearTimeout(t);
  }, [showTooltip]);

  const isAbbreviated = Math.abs(value) >= ABBREVIATE_AT;
  const fullText = `${prefix ?? ""}${formatCurrency(value)}`;

  if (!isAbbreviated) {
    return <span className={className} style={style}>{fullText}</span>;
  }

  const shortText = `${prefix ?? ""}${abbreviate(value)}`;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowTooltip((v) => !v)}
        className={className}
        style={{ ...style, cursor: "pointer" }}
        title="Toque para ver o valor completo"
      >
        {shortText}
      </button>
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-[12px] tabular-nums font-semibold px-3 py-1.5 rounded-[8px] whitespace-nowrap shadow-lg z-30 pointer-events-none animate-fade-in"
          style={{
            background: "var(--color-text)",
            color: "var(--surface-card)",
          }}
        >
          {fullText}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent"
            style={{ borderTopColor: "var(--color-text)" }}
          />
        </div>
      )}
    </span>
  );
}
