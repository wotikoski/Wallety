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
  // metadataBase is required for Next.js to resolve the opengraph-image route
  // to an absolute URL. Without it, the og:image tag is empty when the page
  // is served from www.wallety.qzz.io or any other variant.
  metadataBase: new URL("https://wallety.qzz.io"),
  title: {
    default: "Wallety — Sua vida financeira, simplificada.",
    template: "Wallety",
  },
  description: "Sua vida financeira, simplificada. Gerencie receitas, despesas, metas e finanças em grupo com clareza total.",
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
    title: "Wallety — Sua vida financeira, simplificada.",
    description: "Sua vida financeira, simplificada. Gerencie receitas, despesas, metas e finanças em grupo com clareza total.",
    url: "https://wallety.qzz.io",
    siteName: "Wallety",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Wallety — Sua vida financeira, simplificada.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wallety — Sua vida financeira, simplificada.",
    description: "Sua vida financeira, simplificada. Gerencie receitas, despesas, metas e finanças em grupo com clareza total.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://wallety.qzz.io",
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
