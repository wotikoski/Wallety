-- Assign palette colors to banks based on their brand identity.
-- Keep in sync with src/lib/utils/bank-colors.ts.

UPDATE banks SET color = CASE
  WHEN name ~* '\minter\M'                  THEN '#f97316'  -- Banco Inter: orange
  WHEN name ~* 'picpay'                      THEN '#10b981'  -- PicPay: green
  WHEN name ~* 'nubank|\mnu\M'               THEN '#8b5cf6'  -- Nubank: violet
  WHEN name ~* 'ita[uú]'                     THEN '#f97316'  -- Itaú: orange
  WHEN name ~* 'bradesco'                    THEN '#ef4444'  -- Bradesco: red
  WHEN name ~* 'santander'                   THEN '#ef4444'  -- Santander: red
  WHEN name ~* 'caixa'                       THEN '#6173f4'  -- Caixa: blue
  WHEN name ~* 'banco do brasil' OR name ~* '^bb$' THEN '#f59e0b'  -- BB: amber
  WHEN name ~* 'btg'                         THEN '#64748b'  -- BTG: slate
  WHEN name ~* 'c6'                          THEN '#64748b'  -- C6: slate
  WHEN name ~* '\mxp\M'                      THEN '#f59e0b'  -- XP: amber
  WHEN name ~* 'neon'                        THEN '#14b8a6'  -- Neon: teal
  WHEN name ~* 'mercado\s*pago'              THEN '#6173f4'  -- Mercado Pago: blue
  WHEN name ~* 'pag(bank|seguro)'            THEN '#6173f4'  -- PagBank: blue
  WHEN name ~* 'sicredi'                     THEN '#10b981'  -- Sicredi: green
  WHEN name ~* 'sicoob'                      THEN '#14b8a6'  -- Sicoob: teal
  WHEN name ~* 'safra'                       THEN '#6173f4'  -- Safra: blue
  WHEN name ~* 'original'                    THEN '#14b8a6'  -- Original: teal
  WHEN name ~* 'will'                        THEN '#ef4444'  -- Willbank: red
  WHEN name ~* 'next'                        THEN '#ec4899'  -- Next: pink
  WHEN name ~* 'outros?|outras?|others?|nenhum|n[ãa]o informado' THEN '#64748b' -- Outros: gray
  ELSE color
END;
