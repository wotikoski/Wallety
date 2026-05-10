import { ImageResponse } from "next/og";
import { OG, OG_FONT } from "@/lib/og-palette";

export const alt = "Wallety — Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          padding: "28px 44px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glows */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 420, height: 420, borderRadius: "50%", background: OG.glowAccent }} />
        <div style={{ position: "absolute", bottom: -80, left: 60, width: 320, height: 320, borderRadius: "50%", background: OG.glowGreen }} />

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: OG.iconGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>💙</div>
            <div style={{ fontSize: 21, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Wallety</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: OG.textMute, fontSize: 12 }}>domingo, 10 de maio</div>
          <div style={{ width: 1, height: 14, background: OG.border, margin: "0 12px" }} />
          <div style={{ background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 7, padding: "3px 11px", color: OG.textDim, fontSize: 12 }}>Maio · 2026</div>
        </div>

        {/* ── Page title ── */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Dashboard</div>
          <div style={{ fontSize: 13, color: OG.textMute }}>Visão geral das suas finanças</div>
        </div>

        {/* ── Insight banner ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 10, padding: "7px 14px", marginBottom: 11 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: OG.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>✦</div>
          <div style={{ fontSize: 12, color: "#93c5fd" }}>
            <span style={{ fontWeight: 700 }}>Insight do mês · </span>
            Sua taxa de poupança é de 68% — acima da média. Continue assim!
          </div>
        </div>

        {/* ── Row 1: Saldo | Receitas | Despesas ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 9 }}>
          {/* Saldo Total */}
          <div style={{ flex: 1.35, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
              <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em" }}>SALDO TOTAL</div>
              <div style={{ background: OG.accent, color: "white", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>ATUAL</div>
            </div>
            <div style={{ color: "white", fontSize: 30, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.1 }}>
              R$ 8.647<span style={{ fontSize: 18, fontWeight: 600 }}>,00</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
              <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 600 }}>↑ 23,4%</div>
              <div style={{ color: OG.textFaint, fontSize: 11 }}>vs. mês anterior</div>
            </div>
          </div>

          {/* Receitas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 3 }}>RECEITAS</div>
            <div style={{ color: OG.income, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              R$ 12.750<span style={{ fontSize: 16 }}>,00</span>
            </div>
            <div style={{ color: OG.textFaint, fontSize: 11, marginTop: 5 }}>no período</div>
          </div>

          {/* Despesas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 13, padding: "14px 18px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 10, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 3 }}>DESPESAS</div>
            <div style={{ color: OG.expense, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              R$ 4.103<span style={{ fontSize: 16 }}>,00</span>
            </div>
            <div style={{ color: OG.textFaint, fontSize: 11, marginTop: 5 }}>77% pago</div>
          </div>
        </div>

        {/* ── Row 2: Taxa Poupança | Dias Restantes | Gasto Médio/Dia ── */}
        <div style={{ display: "flex", gap: 10, marginBottom: 11 }}>
          {/* Taxa de Poupança */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 11, padding: "10px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 9, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 3 }}>TAXA DE POUPANÇA</div>
            <div style={{ color: "#22c55e", fontSize: 20, fontWeight: 700 }}>68%</div>
            <div style={{ color: OG.textFaint, fontSize: 10, marginTop: 2 }}>da renda guardada</div>
          </div>

          {/* Dias Restantes */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 11, padding: "10px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 9, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 3 }}>DIAS RESTANTES</div>
            <div style={{ color: "white", fontSize: 20, fontWeight: 700 }}>21 dias</div>
            <div style={{ height: 3, background: "#1e3a5f", borderRadius: 2, marginTop: 5 }}>
              <div style={{ height: 3, width: "32%", background: OG.accent, borderRadius: 2 }} />
            </div>
          </div>

          {/* Gasto Médio/Dia */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 11, padding: "10px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 9, fontWeight: 600, letterSpacing: "0.07em", marginBottom: 3 }}>GASTO MÉDIO/DIA</div>
            <div style={{ color: OG.expense, fontSize: 20, fontWeight: 700 }}>R$ 273,53</div>
            <div style={{ color: OG.textFaint, fontSize: 10, marginTop: 2 }}>projeção: R$ 8,2k</div>
          </div>
        </div>

        {/* ── Bottom: Line chart + Donut chart ── */}
        <div style={{ display: "flex", gap: 10, flex: 1 }}>

          {/* Receitas e despesas — line chart */}
          <div style={{ flex: 3, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 13, padding: "13px 18px 10px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ color: OG.textDim, fontSize: 13, fontWeight: 600 }}>Receitas e despesas</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: OG.accent }} />
                  <div style={{ color: OG.textFaint, fontSize: 10 }}>Receita</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: OG.expense }} />
                  <div style={{ color: OG.textFaint, fontSize: 10 }}>Despesa</div>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ color: OG.textFaint, fontSize: 10 }}>Últimos 6 meses · em R$</div>
            </div>

            {/* SVG line chart */}
            <svg width="100%" height="100%" viewBox="0 0 520 110" preserveAspectRatio="none" style={{ flex: 1 }}>
              {/* Horizontal grid */}
              <line x1="0" y1="15" x2="520" y2="15" stroke="#1e3358" strokeWidth="1" />
              <line x1="0" y1="45" x2="520" y2="45" stroke="#1e3358" strokeWidth="1" />
              <line x1="0" y1="75" x2="520" y2="75" stroke="#1e3358" strokeWidth="1" />

              {/* Y labels */}
              <text x="0" y="12" fill="#334155" fontSize="9">4k</text>
              <text x="0" y="42" fill="#334155" fontSize="9">3k</text>
              <text x="0" y="72" fill="#334155" fontSize="9">1k</text>

              {/* Income area fill */}
              <polygon
                points="30,95 110,82 200,66 290,46 380,28 480,10 480,100 30,100"
                fill="rgba(59,130,246,0.07)"
              />
              {/* Income line */}
              <polyline
                points="30,95 110,82 200,66 290,46 380,28 480,10"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Expense area fill */}
              <polygon
                points="30,100 110,98 200,94 290,90 380,87 480,84 480,100 30,100"
                fill="rgba(248,113,113,0.07)"
              />
              {/* Expense line */}
              <polyline
                points="30,100 110,98 200,94 290,90 380,87 480,84"
                fill="none"
                stroke="#f87171"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Current month dot */}
              <circle cx="480" cy="10" r="4" fill="#3b82f6" />
              <circle cx="480" cy="84" r="4" fill="#f87171" />

              {/* Month labels */}
              <text x="18"  y="110" fill="#475569" fontSize="9">dez/25</text>
              <text x="96"  y="110" fill="#475569" fontSize="9">jan/26</text>
              <text x="186" y="110" fill="#475569" fontSize="9">fev/26</text>
              <text x="276" y="110" fill="#475569" fontSize="9">mar/26</text>
              <text x="366" y="110" fill="#475569" fontSize="9">abr/26</text>
              <text x="464" y="110" fill="#3b82f6" fontSize="9" fontWeight="bold">mai/</text>
            </svg>
          </div>

          {/* Onde foi o dinheiro — donut */}
          <div style={{ flex: 2, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 13, padding: "13px 16px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ color: OG.textDim, fontSize: 13, fontWeight: 600 }}>Onde foi o dinheiro</div>
              <div style={{ color: OG.accent, fontSize: 11 }}>detalhes →</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}>
              {/* Donut */}
              <div style={{ width: 96, height: 96, borderRadius: "50%", flexShrink: 0, background: "conic-gradient(#f59e0b 0deg 151deg, #3b82f6 151deg 237deg, #22c55e 237deg 280deg, #f87171 280deg 306deg, #8b5cf6 306deg 331deg, #475569 331deg 360deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: OG.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ color: OG.textMute, fontSize: 8, fontWeight: 600, letterSpacing: "0.05em" }}>GASTO</div>
                  <div style={{ color: "white", fontSize: 12, fontWeight: 700, lineHeight: 1.2 }}>R$ 4,1k</div>
                </div>
              </div>

              {/* Category list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                {[
                  { label: "Moradia",        pct: "42%", color: "#f59e0b" },
                  { label: "Financiamentos", pct: "24%", color: "#3b82f6" },
                  { label: "Transporte",     pct: "12%", color: "#22c55e" },
                  { label: "Saúde",          pct: "7%",  color: "#f87171" },
                  { label: "Assinaturas",    pct: "7%",  color: "#8b5cf6" },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <div style={{ color: "white", fontSize: 12, flex: 1 }}>{label}</div>
                    <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 600 }}>{pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer slogan ── */}
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 13, color: OG.textFaint, fontWeight: 500, letterSpacing: "0.2px" }}>
            Wallety — Sua vida financeira, simplificada.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
