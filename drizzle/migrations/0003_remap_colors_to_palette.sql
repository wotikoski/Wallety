-- Remap any category/bank color that is not in the curated palette to one
-- of the palette colors, distributed deterministically by creation order so
-- adjacent rows don't end up with the same color.

DO $$
DECLARE
  palette text[] := ARRAY[
    '#6173f4', -- brand blue
    '#10b981', -- emerald
    '#f59e0b', -- amber
    '#ef4444', -- red
    '#8b5cf6', -- violet
    '#ec4899', -- pink
    '#14b8a6', -- teal
    '#f97316', -- orange
    '#64748b'  -- slate gray
  ];
BEGIN
  -- Categories: remap any color outside the palette, partitioned by type
  -- so incomes and expenses rotate independently.
  WITH ranked AS (
    SELECT
      id,
      ((ROW_NUMBER() OVER (PARTITION BY type ORDER BY created_at, id) - 1) % 9)::int AS idx
    FROM categories
    WHERE color IS NULL
       OR LOWER(color) NOT IN (
         '#6173f4','#10b981','#f59e0b','#ef4444',
         '#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b'
       )
  )
  UPDATE categories c
  SET color = palette[ranked.idx + 1]
  FROM ranked
  WHERE c.id = ranked.id;

  -- Banks: single rotation by creation order.
  WITH ranked AS (
    SELECT
      id,
      ((ROW_NUMBER() OVER (ORDER BY created_at, id) - 1) % 9)::int AS idx
    FROM banks
    WHERE color IS NULL
       OR LOWER(color) NOT IN (
         '#6173f4','#10b981','#f59e0b','#ef4444',
         '#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b'
       )
  )
  UPDATE banks b
  SET color = palette[ranked.idx + 1]
  FROM ranked
  WHERE b.id = ranked.id;
END $$;
