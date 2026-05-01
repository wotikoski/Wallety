const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return BRL.format(isNaN(num) ? 0 : num);
}

export function parseCurrency(value: string): number {
  // Remove tudo que não seja dígito, vírgula ou ponto
  const s = value.replace(/[^\d,.]/g, "");
  if (!s) return 0;

  const hasComma = s.includes(",");
  const hasDot   = s.includes(".");

  if (hasComma && hasDot) {
    // "1.234,56" → ponto = milhar, vírgula = decimal (pt-BR)
    return parseFloat(s.replace(/\./g, "").replace(",", ".")) || 0;
  }
  if (hasComma) {
    // "24,30" → vírgula = decimal (pt-BR)
    return parseFloat(s.replace(",", ".")) || 0;
  }
  // "24.3" ou "24.30" → ponto = decimal (JavaScript nativo)
  return parseFloat(s) || 0;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
