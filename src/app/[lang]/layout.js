/* lang_routes_v1: мовні шляхи /en /ja /uk — реекспорти сторінок, мову підхоплює LangProvider з pathname */
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ja' }, { lang: 'uk' }]
}

const META = {
  en: {
    title: "Grand Sumo 2026 — Live Yusho Race, Banzuke & Stats",
    description: "Live sumo tournament tracker: yusho race forecasts, banzuke predictions, rikishi profiles, head-to-head stats and basho archive since 1958.",
  },
  ja: {
    title: "大相撲 2026 — 優勝レース・番付予想・力士データ",
    description: "大相撲本場所の優勝レースをライブで。番付予想、力士プロフィール、対戦成績、1958年以降の場所アーカイブ。",
  },
  uk: {
    title: "Велике сумо 2026 — Гонка юшо, банзуке та статистика",
    description: "Живий трекер турнірів сумо: прогнози юшо, банзуке, профілі рікіші, очні зустрічі та архів башьо з 1958 року.",
  },
}

export async function generateMetadata({ params }) {
  const { lang } = await params
  const m = META[lang] || META.en
  const base = 'https://sumo.dohyo-legends.com'
  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: `${base}/${lang}`,
      languages: { en: `${base}/en`, ja: `${base}/ja`, uk: `${base}/uk`, 'x-default': `${base}/en` },
    },
  }
}

export default async function LangLayout({ children, params }) {
  const { lang } = await params
  if (!['en', 'ja', 'uk'].includes(lang)) notFound()
  return children
}
