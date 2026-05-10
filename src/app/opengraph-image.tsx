import { ImageResponse } from "next/og";
import { OG, OG_FONT } from "@/lib/og-palette";

export const alt = "Wallety - Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Satori-safe rules followed in this file:
 *  1. Every <div> with more than one child has explicit display:flex.
 *  2. Only ASCII characters in text content (no emoji, no arrows,
 *     no em-dashes, no special punctuation).
 *  3. No SVG, no conic-gradient, no inline mixed text+element nodes.
 *  4. All bars/charts done with plain colored <div>s.
 */

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
          padding: "44px 56px",
          position: "relative",
        }}
      >
        {/* Glows */}
        <div style={{ position: "absolute", top: -140, right: -100, width: 480, height: 480, borderRadius: "50%", background: OG.glowAccent }} />
        <div style={{ position: "absolute", bottom: -120, left: 60, width: 380, height: 380, borderRadius: "50%", background: OG.glowGreen }} />

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: OG.iconGrad, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white" }} />
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>Wallety</div>
          <div style={{ flex: 1 }} />
          <div style={{ background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 9, padding: "6px 14px", color: OG.textDim, fontSize: 14, fontWeight: 600 }}>
            Maio 2026
          </div>
        </div>

        {/* ── Hero title ── */}
        <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "white", letterSpacing: "-1.5px", lineHeight: 1.05 }}>
            Sua vida financeira,
          </div>
          <div style={{ fontSize: 52, fontWeight: 800, color: OG.accent, letterSpacing: "-1.5px", lineHeight: 1.05 }}>
            simplificada.
          </div>
          <div style={{ fontSize: 20, color: OG.textDim, marginTop: 8, fontWeight: 500 }}>
            Receitas, despesas, metas e financas em grupo. Tudo em um so lugar.
          </div>
        </div>

        {/* ── Metric cards ── */}
        <div style={{ marginTop: 48, display: "flex", gap: 16 }}>
          {/* Saldo */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>SALDO TOTAL</div>
            <div style={{ color: "white", fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 6 }}>
              R$ 8.647
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div style={{ color: "#22c55e", fontSize: 14, fontWeight: 700 }}>+23,4%</div>
              <div style={{ color: OG.textFaint, fontSize: 13 }}>vs. mes anterior</div>
            </div>
          </div>

          {/* Receitas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>RECEITAS</div>
            <div style={{ color: OG.income, fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 6 }}>
              R$ 12.750
            </div>
            <div style={{ color: OG.textFaint, fontSize: 13, marginTop: 8 }}>no periodo</div>
          </div>

          {/* Despesas */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>DESPESAS</div>
            <div style={{ color: OG.expense, fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 6 }}>
              R$ 4.103
            </div>
            <div style={{ color: OG.textFaint, fontSize: 13, marginTop: 8 }}>77% pago</div>
          </div>

          {/* Poupanca */}
          <div style={{ flex: 1, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 16, padding: "20px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ color: OG.textMute, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em" }}>POUPANCA</div>
            <div style={{ color: "#22c55e", fontSize: 32, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 6 }}>
              68%
            </div>
            <div style={{ color: OG.textFaint, fontSize: 13, marginTop: 8 }}>da renda guardada</div>
          </div>
        </div>

        {/* ── Category bars ── */}
        <div style={{ marginTop: 28, background: OG.surface, border: `1px solid ${OG.border}`, borderRadius: 16, padding: "18px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ color: OG.textDim, fontSize: 14, fontWeight: 700 }}>Onde foi o dinheiro</div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 130, color: "white", fontSize: 13, fontWeight: 600 }}>Moradia</div>
            <div style={{ flex: 1, height: 8, background: "#1e3358", borderRadius: 4, display: "flex" }}>
              <div style={{ width: "42%", height: 8, background: "#f59e0b", borderRadius: 4 }} />
            </div>
            <div style={{ width: 50, color: OG.textMute, fontSize: 13, fontWeight: 700, textAlign: "right" }}>42%</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 130, color: "white", fontSize: 13, fontWeight: 600 }}>Financiamentos</div>
            <div style={{ flex: 1, height: 8, background: "#1e3358", borderRadius: 4, display: "flex" }}>
              <div style={{ width: "24%", height: 8, background: "#3b82f6", borderRadius: 4 }} />
            </div>
            <div style={{ width: 50, color: OG.textMute, fontSize: 13, fontWeight: 700, textAlign: "right" }}>24%</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 130, color: "white", fontSize: 13, fontWeight: 600 }}>Transporte</div>
            <div style={{ flex: 1, height: 8, background: "#1e3358", borderRadius: 4, display: "flex" }}>
              <div style={{ width: "12%", height: 8, background: "#22c55e", borderRadius: 4 }} />
            </div>
            <div style={{ width: 50, color: OG.textMute, fontSize: 13, fontWeight: 700, textAlign: "right" }}>12%</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 130, color: "white", fontSize: 13, fontWeight: 600 }}>Saude</div>
            <div style={{ flex: 1, height: 8, background: "#1e3358", borderRadius: 4, display: "flex" }}>
              <div style={{ width: "7%", height: 8, background: "#f87171", borderRadius: 4 }} />
            </div>
            <div style={{ width: 50, color: OG.textMute, fontSize: 13, fontWeight: 700, textAlign: "right" }}>7%</div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: 14, color: OG.textFaint, fontWeight: 500, letterSpacing: "0.3px" }}>
            wallety.qzz.io
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
