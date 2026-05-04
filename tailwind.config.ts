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
        // ── Brand — Violet Haze scale (Origin Financial) ─────────
        brand: {
          50:  "#f5f4ff",
          100: "#ece9ff",
          200: "#d5d0ff",
          300: "#b5adff",
          400: "#a09bff",   // brand-hover
          500: "#847dff",   // Violet Haze — dark-mode primary
          600: "#6b62f0",
          700: "#4b49aa",   // Deep Indigo — light-mode primary
          800: "#3a3990",
          900: "#2c2b72",
          950: "#1a1950",
        },

        // ── Origin Financial accent palette ───────────────────────
        "ocean-glimmer":    "#00b3dd",
        "violet-haze":      "#847dff",
        "lavender-mist":    "#d1c9ff",
        "soft-rose":        "#dd90d8",
        "deep-indigo":      "#4b49aa",
        "sky-tint":         "#90b8f0",
        "midnight-ink":     "#0f1011",
        "elevated-charcoal":"#2e2e2e",

        // ── Semantic colours → CSS vars (auto-switch light/dark) ──
        income:  { DEFAULT: "var(--color-income)",  light: "#D1FAE5", dark: "#34d399" },
        expense: { DEFAULT: "var(--color-expense)", light: "#FEE2E2", dark: "#f87171" },

        "app-bg":     "var(--surface-bg)",
        "app-border": "var(--color-border)",
        "app-text":   "var(--color-text)",
        "app-muted":  "var(--color-muted)",
        "sidebar-bg": "var(--surface-sidebar)",

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
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "IBM Plex Mono", "monospace"],
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
