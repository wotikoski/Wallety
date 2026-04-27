import type { Metadata, Viewport } from "next";
import { Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";

// Sora is used for both the main UI font and the brand font.
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-inter", // keeps the same CSS var so Tailwind picks it up
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const soraForBrand = Sora({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${sora.variable} ${soraForBrand.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
