import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Wallety — Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo placeholder W */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          }}
        >
          <span style={{ fontSize: 72, fontWeight: 900, color: "#3730a3" }}>W</span>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          Wallety
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 32,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          Controle suas finanças com facilidade
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.65)",
            marginBottom: 40,
          }}
        >
          Receitas, despesas e grupos — tudo em um só lugar.
        </div>

        {/* CTA */}
        <div
          style={{
            background: "white",
            color: "#3730a3",
            fontSize: 22,
            fontWeight: 700,
            padding: "14px 36px",
            borderRadius: 12,
          }}
        >
          Acesse gratuitamente →
        </div>
      </div>
    ),
    { ...size }
  );
}
