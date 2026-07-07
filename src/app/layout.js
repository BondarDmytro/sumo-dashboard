/* sanity_removed_v1 */
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BiosProvider } from './components/BiosProvider'
import NavBar from './components/NavBar'
import { LangProvider } from './components/LangProvider'
import { Analytics } from '@vercel/analytics/react'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {  /* seo_meta_v2: en-base + ja, canonical на prod-домен */
  metadataBase: new URL('https://sumo.dohyo-legends.com'),
  title: "Grand Sumo 2026 — Live Yusho Race, Banzuke & Stats | 大相撲 優勝予想",
  description: "Live sumo tournament tracker: yusho race forecasts, banzuke predictions, rikishi profiles, head-to-head stats and full basho archive since 1958. 大相撲本場所の優勝レースと番付予想をライブで。",
  keywords: "sumo, grand sumo, basho, yusho, banzuke, rikishi, sumo results, sumo stats, 大相撲, 優勝予想, 番付, Nagoya Basho 2026",
  alternates: { canonical: 'https://sumo.dohyo-legends.com' },
  openGraph: {
    title: "Grand Sumo 2026 — Live Yusho Race & Stats",
    description: "Live forecasts, banzuke predictions and full basho archive. 大相撲優勝予想ライブ。",
    url: "https://sumo.dohyo-legends.com",
    siteName: "Dohyo Legends — Sumo Dashboard",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Grand Sumo Live Dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Grand Sumo 2026 — Live Yusho Race & Stats",
    description: "Live forecasts, banzuke predictions and full basho archive.",
    images: ["/og.png"],
  },
};

import GlobalSalt from './components/GlobalSalt' /* global_salt_v1 */

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <LangProvider>
          <BiosProvider>
            <NavBar />
            {children}<GlobalSalt />
          </BiosProvider>
        </LangProvider>
        
        <Analytics />
      </body>
    </html>
  );
}