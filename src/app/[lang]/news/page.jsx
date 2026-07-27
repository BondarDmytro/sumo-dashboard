/* news_page_v1 */
import NewsPageClient from '../../components/NewsPageClient'

const LANGS = ['uk', 'en', 'ja', 'fr'] /* fr_locale_v1 */
const TITLES = {
  uk: 'Новини сумо — Dohyo Legends',
  en: 'Sumo News — Dohyo Legends',
  ja: '相撲ニュース — Dohyo Legends',
}
const DESCS = {
  uk: 'Останні новини великого сумо від NHK: результати днів башьо, анонси боїв, події навколо рікіші.',
  en: 'Latest grand sumo news from NHK: basho day results, bout previews, rikishi updates.',
  ja: 'NHKによる大相撲の最新ニュース：場所の結果、取組の見どころ、力士の話題。',
}

export function generateStaticParams() {
  return LANGS.map(lang => ({ lang }))
}

export async function generateMetadata({ params }) {
  const { lang } = await params
  const base = 'https://sumo.dohyo-legends.com'
  return {
    title: TITLES[lang] || TITLES.uk,
    description: DESCS[lang] || DESCS.uk,
    alternates: {
      canonical: `${base}/${lang}/news`,
      languages: Object.fromEntries(LANGS.map(l => [l, `${base}/${l}/news`])),
    },
  }
}

export default async function NewsPage({ params }) {
  const { lang } = await params
  return <NewsPageClient lang={lang} />
}
