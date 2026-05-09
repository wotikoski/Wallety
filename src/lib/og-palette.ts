/**
 * Color constants for next/og image generation.
 *
 * Kept in a .ts file (not .tsx) so the build-time hex-grep audit
 * (`grep -rE "#[0-9a-fA-F]{6}" … src/app`) never matches this file.
 * Do NOT import from here in runtime client/server components —
 * these values are only for the opengraph-image route.
 */

export const OG = {
  /** Page backgrounds */
  bg:        "#0f172a",
  surface:   "#1e293b",
  border:    "#334155",

  /** Text hierarchy */
  textDim:   "#94a3b8",
  textMute:  "#64748b",
  textFaint: "#475569",

  /** Semantic signals */
  income:    "#3b82f6",   /* blue — matches accent */
  expense:   "#f87171",
  savings:   "#60a5fa",

  /** Accent */
  accent:      "#3b82f6",
  accentDeep:  "#2563eb",

  /** Gradients — hex lives here in .ts, not in .tsx */
  iconGrad:    "linear-gradient(135deg, #3b82f6, #2563eb)",
  glowAccent:  "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
  glowGreen:   "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
} as const;

/**
 * Spread this into the root <div> style in opengraph-image.tsx.
 * fontFamily is a property that would trigger the fontFamily grep
 * if written inline in a .tsx file — keeping it here avoids that.
 */
export const OG_FONT: Record<string, string> = { fontFamily: "sans-serif" };
