import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Capriola, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-inter", // keeps the same CSS var so Tailwind picks it up
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const brandFont = Capriola({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brand",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
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
      <body className={`${plusJakarta.variable} ${brandFont.variable} ${ibmPlexMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
