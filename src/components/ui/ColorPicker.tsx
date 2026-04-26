"use client";

import { Shuffle } from "lucide-react";

/** Shared curated palette. Keep in sync with the SQL migration that remaps
 * legacy colors on the database side. */
export const COLOR_PALETTE = [
  "#6366f1", // brand blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate gray (neutral)
] as const;

/** Pick an initial palette color for a new item: first slot not yet used
 * by siblings; if all are used, starts at the first palette slot. */
export function suggestPaletteColor(usedColors: (string | null | undefined)[]): string {
  const used = new Set(usedColors.filter(Boolean).map((c) => c!.toLowerCase()));
  for (const c of COLOR_PALETTE) {
    if (!used.has(c.toLowerCase())) return c;
  }
  return COLOR_PALETTE[0];
}

/** Pick a random palette color different from the current one.
 * Used by the "Sugerir" button so each click feels genuinely random. */
export function rotatePaletteColor(currentColor?: string | null): string {
  const others = COLOR_PALETTE.filter(
    (c) => !currentColor || c.toLowerCase() !== currentColor.toLowerCase(),
  );
  return others[Math.floor(Math.random() * others.length)];
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
        <label className="text-xs font-medium text-app-muted">Cor</label>
        {showSuggest && onSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            className="text-xs text-app-muted hover:text-brand-600 inline-flex items-center gap-1"
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
            className={`w-9 h-9 rounded-full transition shrink-0 ${
              value?.toLowerCase() === c.toLowerCase()
                ? "scale-110 shadow-md outline outline-2 outline-offset-2 outline-slate-800 dark:outline-white"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
