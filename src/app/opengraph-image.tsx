import { ImageResponse } from "next/og";
import { OG, OG_FONT } from "@/lib/og-palette";

export const alt = "Wallety - Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori-safe rules followed in this file:
 *  1. Every <div> with more than one child has explicit display:flex.
 *  2. ASCII-only text (no emoji, em-dash, accented vowels, middle dot, arrows).
 *  3. No SVG <text> elements (they trigger dynamic-font fetches that 400 on Vercel).
 *  4. No conic-gradient (Satori does not support the CSS4 double-stop syntax).
 *  5. Inline mixed text+element nodes are split into siblings inside a flex row.
 */

function arcPath(
  cx: number, cy: number,
  r:  number, ri: number,
  startDeg: number, endDeg: number,
): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const s = rad(startDeg);
  const e = rad(endDeg);
  const x1 = cx + r  * Math.cos(s), y1 = cy + r  * Math.sin(s);
  const x2 = cx + r  * Math.cos(e), y2 = cy + r  * Math.sin(e);
  const x3 = cx + ri * Math.cos(e), y3 = cy + ri * Math.sin(e);
  const x4 = cx + ri * Math.cos(s), y4 = cy + ri * Math.sin(s);
  const lg = endDeg - startDeg > 180 ? 1 : 0;
  const f = (n: number) => n.toFixed(2);
  return `M${f(x1)} ${f(y1)} A${r} ${r} 0 ${lg} 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${ri} ${ri} 0 ${lg} 0 ${f(x4)} ${f(y4)}Z`;
}

const SEGMENTS = [
  { color: "#f59e0b", pct: 41 },
  { color: "#3b82f6", pct: 24 },
  { color: "#22c55e", pct: 12 },
  { color: "#f87171", pct: 8  },
  { color: "#a855f7", pct: 7  },
  { color: "#475569", pct: 8  },
];

const CATS = [
  { l: "Moradia",        p: "41%", c: "#f59e0b" },
  { l: "Financiamentos", p: "24%", c: "#3b82f6" },
  { l: "Transporte",     p: "12%", c: "#22c55e" },
  { l: "Saude",          p: "8%",  c: "#f87171" },
  { l: "Assinaturas",    p: "7%",  c: "#a855f7" },
];

const MONTHS = ["dez/25", "jan/26", "fev/26", "mar/26", "abr/26", "mai/26"];

export default function Image() {
  let cursor = 0;
  const arcs = SEGMENTS.map(({ color, pct }) => {
    const start = cursor;
    const end = cursor + pct * 3.6;
    cursor = end;
    return { color, d: arcPath(60, 60, 56, 36, start, end) };
  });

  return new ImageResponse(
    (
      <div
        style={{
          ...OG_FONT,
          background: OG.bg,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "26px 38px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glows */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 420, height: 420, borderRadius: "50%", background: OG.glowAccent }} />
        <div style={{ position: "absolute", bottom: -100, left: 60, width: 320, height: 320, borderRadius: "50%", background: OG.glowGreen }} />

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: OG.iconGrad, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white" }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Wallety</div>
          <div style={{ marginLeft: 10, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 9, padding: "5px 14px", display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: OG.textMute }} />
            <div style={{ color: OG.textDim, fontSize: 13, fontWeight: 600 }}>Pessoal</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: OG.textMute, fontSize: 13 }}>domingo, 10 de maio</div>
        </div>

        {/* ── TITLE BAR ── */}
        <div style={{ display: "flex", alignItems: "flex-end", marginTop: 18 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.8px" }}>Dashboard</div>
            <div style={{ fontSize: 13, color: OG.textMute, marginTop: 2 }}>Visao geral das suas financas</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 9, padding: "6px 16px", color: "white", fontSize: 13, fontWeight: 700 }}>Maio</div>
            <div style={{ background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 9, padding: "6px 16px", color: "white", fontSize: 13, fontWeight: 700 }}>2026</div>
          </div>
        </div>

        {/* ── INSIGHT BANNER ── */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 11, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 11, padding: "10px 16px" }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: OG.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>Insight do mes</div>
            <div style={{ color: "#93c5fd", fontSize: 13 }}>- Despesas acima da renda esse mes. Revise os gastos para voltar ao azul.</div>
          </div>
        </div>

        {/* ── ROW 1 ── */}
        <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
          {/* Saldo Total */}
          <div style={{ flex: 1.4, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "14px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ color: OG.textMute, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>SALDO TOTAL</div>
              <div style={{ background: "rgba(59,130,246,0.2)", color: OG.accent, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4 }}>ATUAL</div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, color: "white" }}>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1.5px" }}>R$ 8.647</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>,00</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 700 }}>+23,4%</div>
              <div style={{ color: OG.textFaint, fontSize: 12 }}>vs. mes anterior</div>
            </div>
          </div>

          {/* Receitas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "14px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>RECEITAS</div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, color: OG.income }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.7px" }}>R$ 12.750</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>,00</div>
            </div>
            <div style={{ color: OG.income, fontSize: 12, marginTop: 8 }}>no periodo</div>
          </div>

          {/* Despesas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "14px 20px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" }}>DESPESAS</div>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 6, color: OG.expense }}>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.7px" }}>R$ 4.103</div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>,00</div>
            </div>
            <div style={{ color: OG.expense, fontSize: 12, marginTop: 8 }}>77% pago</div>
          </div>
        </div>

        {/* ── ROW 2 ── */}
        <div style={{ marginTop: 10, display: "flex", gap: 12 }}>
          {/* Taxa de Poupanca */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(248,113,113,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f87171" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>TAXA DE POUPANCA</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                <div style={{ color: "#f87171", fontSize: 17, fontWeight: 700 }}>-1%</div>
                <div style={{ color: OG.textFaint, fontSize: 11 }}>Gastos acima da renda</div>
              </div>
            </div>
          </div>

          {/* Dias Restantes */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 12, padding: "12px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>DIAS RESTANTES</div>
            <div style={{ color: "white", fontSize: 18, fontWeight: 700, marginTop: 4 }}>21 dias</div>
            <div style={{ marginTop: 6, height: 4, background: "#1e3a5f", borderRadius: 2, display: "flex" }}>
              <div style={{ width: "32%", height: 4, background: OG.accent, borderRadius: 2 }} />
            </div>
          </div>

          {/* Gasto Medio/Dia */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 12, padding: "12px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em" }}>GASTO MEDIO/DIA</div>
            <div style={{ color: OG.expense, fontSize: 18, fontWeight: 700, marginTop: 4 }}>R$ 273,53</div>
            <div style={{ color: OG.textFaint, fontSize: 11, marginTop: 2 }}>projecao: R$ 8,2k</div>
          </div>
        </div>

        {/* ── BOTTOM: Line chart + Donut ── */}
        <div style={{ marginTop: 12, display: "flex", gap: 12, flex: 1 }}>

          {/* Line chart card */}
          <div style={{ flex: 3, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "14px 20px 12px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>Receitas e despesas</div>
                <div style={{ color: OG.textFaint, fontSize: 11, marginTop: 1 }}>Ultimos 6 meses - em R$</div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: OG.accent }} />
                  <div style={{ color: OG.textFaint, fontSize: 11 }}>Receita</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#94a3b8" }} />
                  <div style={{ color: OG.textFaint, fontSize: 11 }}>Despesa</div>
                </div>
              </div>
            </div>

            <svg width="100%" height="100%" viewBox="0 0 540 130" preserveAspectRatio="none" style={{ flex: 1, marginTop: 10 }}>
              <line x1="0" y1="20"  x2="540" y2="20"  stroke="#1e3358" strokeWidth="1" />
              <line x1="0" y1="55"  x2="540" y2="55"  stroke="#1e3358" strokeWidth="1" />
              <line x1="0" y1="90"  x2="540" y2="90"  stroke="#1e3358" strokeWidth="1" />

              <polygon points="0,115 90,112 180,108 270,90 360,38 450,15 540,5 540,130 0,130" fill="rgba(59,130,246,0.08)" />
              <polyline points="0,115 90,112 180,108 270,90 360,38 450,15 540,5" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

              <polygon points="0,118 90,116 180,112 270,98 360,55 450,32 540,20 540,130 0,130" fill="rgba(148,163,184,0.06)" />
              <polyline points="0,118 90,116 180,112 270,98 360,55 450,32 540,20" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

              <circle cx="540" cy="5"  r="4" fill="#3b82f6" />
              <circle cx="540" cy="20" r="4" fill="#94a3b8" />
            </svg>

            {/* Month labels — HTML row, equal-width tracks (avoids SVG <text> font fetch) */}
            <div style={{ display: "flex", marginTop: 4 }}>
              {MONTHS.map((m) => (
                <div key={m} style={{ flex: 1, color: OG.textFaint, fontSize: 10, textAlign: "center" }}>{m}</div>
              ))}
            </div>
          </div>

          {/* Donut card */}
          <div style={{ flex: 2, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: "white", fontSize: 14, fontWeight: 700 }}>Onde foi o dinheiro</div>
                <div style={{ color: OG.textFaint, fontSize: 11, marginTop: 1 }}>R$ 4,0k</div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ color: OG.accent, fontSize: 11, fontWeight: 600 }}>detalhes</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, marginTop: 8 }}>
              {/* Donut wrapper — needs display:flex (2 children: svg + center label) */}
              <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0, display: "flex" }}>
                <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: "absolute", top: 0, left: 0 }}>
                  {arcs.map(({ color, d }, i) => (
                    <path key={i} d={d} fill={color} />
                  ))}
                </svg>
                {/* Center label — explicit top/left avoids transform usage */}
                <div style={{ position: "absolute", top: 35, left: 35, width: 50, height: 50, borderRadius: "50%", background: OG.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: OG.textFaint, fontSize: 8, fontWeight: 700, letterSpacing: "0.05em" }}>GASTO</div>
                  <div style={{ color: "white", fontSize: 12, fontWeight: 700, marginTop: 1 }}>R$ 4,0k</div>
                </div>
              </div>

              {/* Category list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {CATS.map(({ l, p, c }) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <div style={{ color: "white", fontSize: 12, flex: 1 }}>{l}</div>
                    <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 700 }}>{p}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
