/**
 * Serializes an array of records to a CSV string.
 * Values are quoted; internal quotes are escaped by doubling.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; label: string; format?: (v: unknown, row: T) => string }[],
): string {
  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = row[c.key];
        const formatted = c.format ? c.format(raw, row) : raw ?? "";
        return escape(String(formatted));
      })
      .join(","),
  );
  // BOM so Excel (pt-BR) detects UTF-8 correctly.
  return "\uFEFF" + [header, ...lines].join("\r\n");
}

function escape(value: string): string {
  if (/[",\r\n;]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
