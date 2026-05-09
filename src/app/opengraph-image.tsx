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
          padding: "40px 52px 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div style={{ position: "absolute", top: -120, right: -80, width: 480, height: 480, borderRadius: "50%", background: OG.glowAccent }} />
        <div style={{ position: "absolute", bottom: -100, left: 60, width: 360, height: 360, borderRadius: "50%", background: OG.glowGreen }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: OG.iconGrad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              💙
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>
              Wallety
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 8, padding: "6px 16px", color: OG.textDim, fontSize: 14 }}>
            Maio de 2026
          </div>
        </div>

        {/* Top metric cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {/* Saldo */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>SALDO ATUAL</div>
            <div style={{ color: "white", fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>R$ 12.450,00</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: OG.income, fontSize: 13, fontWeight: 600 }}>↑ +8,2%</div>
              <div style={{ color: OG.textFaint, fontSize: 13 }}>vs. mês anterior</div>
            </div>
          </div>

          {/* Receitas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>RECEITAS</div>
            <div style={{ color: OG.income, fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>R$ 8.750,00</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: OG.income, fontSize: 13, fontWeight: 600 }}>↑ +12,4%</div>
              <div style={{ color: OG.textFaint, fontSize: 13 }}>3 lançamentos</div>
            </div>
          </div>

          {/* Despesas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>DESPESAS</div>
            <div style={{ color: OG.expense, fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>R$ 3.280,00</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: OG.expense, fontSize: 13, fontWeight: 600 }}>↓ −4,1%</div>
              <div style={{ color: OG.textFaint, fontSize: 13 }}>12 lançamentos</div>
            </div>
          </div>

          {/* Economias */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>ECONOMIAS</div>
            <div style={{ color: OG.savings, fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>R$ 5.470,00</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: OG.savings, fontSize: 13, fontWeight: 600 }}>62,5%</div>
              <div style={{ color: OG.textFaint, fontSize: 13 }}>da renda guardada</div>
            </div>
          </div>
        </div>

        {/* Bottom section: chart + transactions */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Bar chart */}
          <div style={{ flex: 3, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "18px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textDim, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Visão geral — últimos 6 meses
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flex: 1, paddingBottom: 8 }}>
              {[
                { label: "Dez", h1: 62, h2: 28 },
                { label: "Jan", h1: 74, h2: 35 },
                { label: "Fev", h1: 55, h2: 42 },
                { label: "Mar", h1: 80, h2: 30 },
                { label: "Abr", h1: 68, h2: 38 },
                { label: "Mai", h1: 90, h2: 33, current: true },
              ].map(({ label, h1, h2, current }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                    <div style={{ width: 14, height: h1, background: OG.income, borderRadius: "3px 3px 0 0", opacity: current ? 1 : 0.85 }} />
                    <div style={{ width: 14, height: h2, background: OG.expense, borderRadius: "3px 3px 0 0", opacity: current ? 1 : 0.85 }} />
                  </div>
                  <div style={{ color: current ? OG.accent : OG.textFaint, fontSize: 11, fontWeight: current ? 700 : 400 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent transactions */}
          <div style={{ flex: 2, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 0 }}>
            <div style={{ color: OG.textDim, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Últimos lançamentos</div>
            {[
              { desc: "Salário",      cat: "Trabalho",    val: "+R$ 6.500,00", col: OG.income  },
              { desc: "Aluguel",      cat: "Moradia",     val: "−R$ 1.200,00", col: OG.expense },
              { desc: "Supermercado", cat: "Alimentação", val: "−R$ 480,00",   col: OG.expense },
              { desc: "Freelance",    cat: "Trabalho",    val: "+R$ 2.250,00", col: OG.income  },
            ].map(({ desc, cat, val, col }, i, arr) => (
              <div key={desc} style={{ display: "flex", alignItems: "center", paddingTop: i > 0 ? 10 : 0, paddingBottom: i < arr.length - 1 ? 10 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${OG.border}` : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>{desc}</div>
                  <div style={{ color: OG.textFaint, fontSize: 11 }}>{cat}</div>
                </div>
                <div style={{ color: col, fontSize: 13, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer slogan */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 15, color: OG.textFaint, fontWeight: 500, letterSpacing: "0.3px" }}>
            Wallety — Sua vida financeira, simplificada.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
