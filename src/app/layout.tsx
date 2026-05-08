import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// GeistSans — primary display font served locally via official Vercel package.
// CSS variable: --font-geist-sans
// GeistMono — financial figures, technical data (tabular-nums).
// CSS variable: --font-geist-mono

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Wallety",
    template: "Wallety",
  },
  description: "Gerencie suas finanças pessoais e em grupo com facilidade e clareza.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wallety",
  },
  openGraph: {
    title: "Wallety — Controle suas finanças pessoais e em grupo",
    description: "Gerencie receitas, despesas e finanças em grupo com facilidade e clareza. Visualize tudo em dashboards intuitivos e relatórios detalhados.",
    url: "https://wallety.qzz.io",
    siteName: "Wallety",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallety — Controle suas finanças pessoais e em grupo",
    description: "Gerencie receitas, despesas e finanças em grupo com facilidade e clareza. Visualize tudo em dashboards intuitivos e relatórios detalhados.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      {/* Anti-flicker: applies dark class before first paint.
          Priority: manual override in localStorage → system preference → light (default). */}
      <head>
        {/* Anti-flicker: dark is the default; only stay light if user explicitly chose it. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')!=='light'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
