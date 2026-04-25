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
        // ── Brand scale — base #3630A0 ────────────────────────────
        brand: {
          50:  "#F8F7FF",
          100: "#E3E1FF",
          200: "#BFBDF3",
          300: "#9896E8",
          400: "#7B75D4",   // dark-mode accent
          500: "#524FBF",
          600: "#3630A0",   // light-mode primary
          700: "#2C2882",
          800: "#1E1A58",
          900: "#120F35",
          950: "#0B0920",
        },

        // ── Semantic colours → CSS vars (auto-switch light/dark) ──
        income:  { DEFAULT: "var(--color-income)",  light: "#D1FAE5", dark: "#059669" },
        expense: { DEFAULT: "var(--color-expense)", light: "#FEE2E2", dark: "#E0484A" },

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
