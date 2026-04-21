import type { Metadata, Viewport } from "next";
import { Inter, Capriola } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const brandFont = Capriola({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brand",
  display: "swap",
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
      <body className={`${inter.variable} ${brandFont.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
