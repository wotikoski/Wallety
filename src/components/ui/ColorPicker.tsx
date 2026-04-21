"use client";

import { Shuffle } from "lucide-react";

/** Shared curated palette. Keep in sync with the SQL migration that remaps
 * legacy colors on the database side. */
export const COLOR_PALETTE = [
  "#6173f4", // brand blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate gray (neutral)
] as const;

/** Pick the first palette color not present in `usedColors`. If all are
 * used, rotate to the next one after `currentColor` (or first). */
export function suggestPaletteColor(
  usedColors: (string | null | undefined)[],
  currentColor?: string | null,
): string {
  const used = new Set(usedColors.filter(Boolean).map((c) => c!.toLowerCase()));
  if (currentColor) used.add(currentColor.toLowerCase());
  for (const c of COLOR_PALETTE) {
    if (!used.has(c.toLowerCase())) return c;
  }
  if (currentColor) {
    const idx = COLOR_PALETTE.findIndex((c) => c.toLowerCase() === currentColor.toLowerCase());
    if (idx >= 0) return COLOR_PALETTE[(idx + 1) % COLOR_PALETTE.length];
  }
  return COLOR_PALETTE[0];
}

export function ColorPicker({
  value,
  onChange,
  onSuggest,
  showSuggest = true,
}: {
  value: string;
  onChange: (c: string) => void;
  onSuggest?: () => void;
  showSuggest?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">Cor</label>
        {showSuggest && onSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            className="text-xs text-slate-400 hover:text-brand-600 inline-flex items-center gap-1"
            title="Sugerir outra cor"
          >
            <Shuffle size={11} />
            Sugerir
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {COLOR_PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`w-9 h-9 rounded-full border-2 transition shrink-0 ${
              value?.toLowerCase() === c.toLowerCase()
                ? "border-slate-900 scale-110 shadow-md"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
