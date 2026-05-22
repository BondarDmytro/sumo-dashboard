import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SanityLive } from '@/sanity/lib/live'
import { BiosProvider } from './components/BiosProvider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Натсу Басьо 2026 — Прогноз Юшо",
  description: "Математично-статистичний прогноз переможця травневого турніру сумо 2026. Аналіз рікіші, очні зустрічі, поточні результати.",
  keywords: "сумо, натсу басьо, юшо, 2026, Kirishima, Tobizaru, Kotoeiho, прогноз",
  openGraph: {
    title: "Натсу Басьо 2026 — Прогноз Юшо",
    description: "Математично-статистичний прогноз переможця травневого турніру сумо 2026",
    url: "https://sumo-dashboard-beta.vercel.app",
    siteName: "Sumo Dashboard",
    locale: "uk_UA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Натсу Басьо 2026 — Прогноз Юшо",
    description: "Математично-статистичний прогноз переможця травневого турніру сумо 2026",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <BiosProvider>
          {children}
        </BiosProvider>
        <SanityLive />
      </body>
    </html>
  );
}