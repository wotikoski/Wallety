import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand — Blue scale (handoff canonical accent) ─────────
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",   // accent-soft / brand-hover
          500: "#3b82f6",   // accent-hue — dark-mode primary
          600: "#2563eb",   // accent-deep — light-mode primary
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",   // accent-tint
          950: "#172554",
        },

        // ── Handoff palette extras ────────────────────────────────
        "accent-hue":    "#3b82f6",
        "accent-soft":   "#60a5fa",
        "accent-deep":   "#2563eb",
        "accent-tint":   "#1e3a8a",
        "expense-bar":   "#334155",
        "surface-alt":   "#11161e",

        // ── Semantic colours → CSS vars (auto-switch light/dark) ──
        income:  { DEFAULT: "var(--color-income)",  light: "#D1FAE5", dark: "#34d399" },
        expense: { DEFAULT: "var(--color-expense)", light: "#FEE2E2", dark: "#f87171" },

        "app-bg":      "var(--surface-bg)",
        "app-border":  "var(--color-border)",
        "app-text":    "var(--color-text)",
        "app-muted":   "var(--color-muted)",
        "sidebar-bg":  "var(--surface-sidebar)",
        "text-dim":    "var(--text-dim)",
        "text-faint":  "var(--text-faint)",
        "text-mute":   "var(--text-mute)",
        "border-str":  "var(--border-strong)",

        // ── shadcn / Radix tokens ─────────────────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["var(--font-geist)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "IBM Plex Mono", "monospace"],
      },

      boxShadow: {
        card:    "var(--shadow-card)",
        "card-sm": "0 1px 3px rgba(0,0,0,.05)",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
