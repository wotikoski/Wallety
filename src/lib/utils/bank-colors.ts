/**
 * Pick a palette color matching a bank's brand identity. Returns null if
 * the name doesn't match any known bank — caller can then fall back to a
 * generated suggestion.
 *
 * Keep this in sync with the SQL CASE block in
 * `drizzle/migrations/0004_bank_brand_colors.sql`.
 */
const BANK_BRAND_COLORS: Array<{ match: RegExp; color: string }> = [
  { match: /\binter\b/i, color: "#f97316" },                 // orange
  { match: /picpay/i, color: "#10b981" },                     // green
  { match: /nubank|\bnu\b/i, color: "#8b5cf6" },              // violet
  { match: /ita[uú]/i, color: "#f97316" },                    // orange
  { match: /bradesco/i, color: "#ef4444" },                   // red
  { match: /santander/i, color: "#ef4444" },                  // red
  { match: /caixa/i, color: "#6173f4" },                      // blue
  { match: /banco do brasil|^bb$/i, color: "#f59e0b" },       // amber/yellow
  { match: /btg/i, color: "#64748b" },                        // slate
  { match: /c6/i, color: "#64748b" },                         // slate
  { match: /\bxp\b/i, color: "#f59e0b" },                     // amber
  { match: /neon/i, color: "#14b8a6" },                       // teal
  { match: /mercado\s*pago/i, color: "#6173f4" },             // blue
  { match: /pag(bank|seguro)/i, color: "#6173f4" },           // blue
  { match: /sicredi/i, color: "#10b981" },                    // green
  { match: /sicoob/i, color: "#14b8a6" },                     // teal
  { match: /safra/i, color: "#6173f4" },                      // blue
  { match: /original/i, color: "#14b8a6" },                   // teal
  { match: /will/i, color: "#ef4444" },                       // red
  { match: /next/i, color: "#ec4899" },                       // pink
  { match: /outros?|others?|outras?|nenhum|n[ãa]o informado/i, color: "#64748b" }, // gray
];

export function getBankBrandColor(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  for (const { match, color } of BANK_BRAND_COLORS) {
    if (match.test(trimmed)) return color;
  }
  return null;
}
