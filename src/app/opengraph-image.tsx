import { ImageResponse } from "next/og";

export const alt = "Wallety — Sua vida financeira, simplificada.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0c29 0%, #1e1b4b 40%, #3730a3 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "0 80px",
        }}
      >
        {/* App name */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-3px",
            marginBottom: 24,
            lineHeight: 1,
          }}
        >
          Wallety
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 36,
            color: "rgba(255,255,255,0.9)",
            marginBottom: 16,
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          Controle suas finanças com facilidade
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 56,
            textAlign: "center",
          }}
        >
          Receitas, despesas e grupos — tudo em um só lugar.
        </div>

        {/* CTA */}
        <div
          style={{
            background: "white",
            color: "#3730a3",
            fontSize: 24,
            fontWeight: 700,
            padding: "16px 48px",
            borderRadius: 14,
          }}
        >
          Acesse gratuitamente →
        </div>
      </div>
    ),
    { ...size }
  );
}
