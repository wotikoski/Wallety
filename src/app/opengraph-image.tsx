import { ImageResponse } from "next/og";

export const alt = "Wallety — Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f172a",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "40px 52px 36px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: 60,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              💚
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>
              Wallety
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "6px 16px",
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            Maio de 2026
          </div>
        </div>

        {/* Top metric cards */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
          {/* Saldo */}
          <div
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              SALDO ATUAL
            </div>
            <div style={{ color: "white", fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>
              R$ 12.450,00
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>↑ +8,2%</div>
              <div style={{ color: "#475569", fontSize: 13 }}>vs. mês anterior</div>
            </div>
          </div>

          {/* Receitas */}
          <div
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              RECEITAS
            </div>
            <div style={{ color: "#22c55e", fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>
              R$ 8.750,00
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>↑ +12,4%</div>
              <div style={{ color: "#475569", fontSize: 13 }}>3 lançamentos</div>
            </div>
          </div>

          {/* Despesas */}
          <div
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              DESPESAS
            </div>
            <div style={{ color: "#f87171", fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>
              R$ 3.280,00
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: "#f87171", fontSize: 13, fontWeight: 600 }}>↓ −4,1%</div>
              <div style={{ color: "#475569", fontSize: 13 }}>12 lançamentos</div>
            </div>
          </div>

          {/* Economias */}
          <div
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6, fontWeight: 500 }}>
              ECONOMIAS
            </div>
            <div style={{ color: "#a78bfa", fontSize: 30, fontWeight: 700, letterSpacing: "-0.5px" }}>
              R$ 5.470,00
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
              <div style={{ color: "#a78bfa", fontSize: 13, fontWeight: 600 }}>62,5%</div>
              <div style={{ color: "#475569", fontSize: 13 }}>da renda guardada</div>
            </div>
          </div>
        </div>

        {/* Bottom section: chart + transactions */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Bar chart */}
          <div
            style={{
              flex: 3,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "18px 24px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              Visão geral — últimos 6 meses
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flex: 1, paddingBottom: 8 }}>
              {/* Dec */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 62, background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                  <div style={{ width: 14, height: 28, background: "#f87171", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>Dez</div>
              </div>
              {/* Jan */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 74, background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                  <div style={{ width: 14, height: 35, background: "#f87171", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>Jan</div>
              </div>
              {/* Fev */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 55, background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                  <div style={{ width: 14, height: 42, background: "#f87171", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>Fev</div>
              </div>
              {/* Mar */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 80, background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                  <div style={{ width: 14, height: 30, background: "#f87171", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>Mar</div>
              </div>
              {/* Abr */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 68, background: "#22c55e", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                  <div style={{ width: 14, height: 38, background: "#f87171", borderRadius: "3px 3px 0 0", opacity: 0.85 }} />
                </div>
                <div style={{ color: "#475569", fontSize: 11 }}>Abr</div>
              </div>
              {/* Mai (highlighted) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 90 }}>
                  <div style={{ width: 14, height: 90, background: "#22c55e", borderRadius: "3px 3px 0 0" }} />
                  <div style={{ width: 14, height: 33, background: "#f87171", borderRadius: "3px 3px 0 0" }} />
                </div>
                <div style={{ color: "#6366f1", fontSize: 11, fontWeight: 700 }}>Mai</div>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div
            style={{
              flex: 2,
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
              Últimos lançamentos
            </div>
            {/* Transactions */}
            <div style={{ display: "flex", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid #334155" }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Salário</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Trabalho</div>
              </div>
              <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>+R$ 6.500,00</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #334155" }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Aluguel</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Moradia</div>
              </div>
              <div style={{ color: "#f87171", fontSize: 13, fontWeight: 600 }}>−R$ 1.200,00</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingTop: 10, paddingBottom: 10, borderBottom: "1px solid #334155" }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Supermercado</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Alimentação</div>
              </div>
              <div style={{ color: "#f87171", fontSize: 13, fontWeight: 600 }}>−R$ 480,00</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", paddingTop: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ color: "white", fontSize: 13, fontWeight: 500 }}>Freelance</div>
                <div style={{ color: "#475569", fontSize: 11 }}>Trabalho</div>
              </div>
              <div style={{ color: "#22c55e", fontSize: 13, fontWeight: 600 }}>+R$ 2.250,00</div>
            </div>
          </div>
        </div>

        {/* Footer slogan */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 15,
              color: "#475569",
              fontWeight: 500,
              letterSpacing: "0.3px",
            }}
          >
            Wallety — Sua vida financeira, simplificada.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
