/* rikishi_hub_v1: vichnozeleni SEO-profili /uk|en|ja/rikishi/[slug] */
import { notFound } from 'next/navigation'
import rikishiMeta from '../../../lib/rikishiMeta.json'
import RikishiHubClient from '../../../components/RikishiHubClient'

export const revalidate = 3600

const BASE = 'https://sumo.dohyo-legends.com'
const SLUGS = {
  aonishiki: {
    id: 8854,
    name: { uk: 'Аонішікі (Данило Явгусишин)', en: 'Aonishiki (Danylo Yavhusishyn)', ja: '安青錦 新大' },
    title: {
      uk: 'Аонішікі (Данило Явгусишин) — профіль, результати, статистика сумо',
      en: 'Aonishiki (Danylo Yavhusishyn) — Sumo Profile, Results & Stats',
      ja: '安青錦 新大 — 力士プロフィール・成績・データ',
    },
    intro: {
      uk: 'Данило Явгусишин, відомий у сумо як Аонішікі Арата — український рікіші з Вінниччини, перший українець, що виграв Кубок імператора.',
      en: 'Danylo Yavhusishyn, known in sumo as Aonishiki Arata, is a Ukrainian rikishi from Vinnytsia Oblast and the first Ukrainian to win the Emperor\u2019s Cup.',
      ja: '安青錦 新大はウクライナ・ヴィンニツャ州出身の力士。ウクライナ出身力士として初めて幕内最高優勝を果たした。',
    },
  },
  shishi: {
    id: 86,
    name: { uk: 'Шіші (Сергій Соколовський)', en: 'Shishi (Serhii Sokolovskyi)', ja: '獅司 大' },
    title: {
      uk: 'Шіші (Сергій Соколовський) — профіль, результати, статистика сумо',
      en: 'Shishi (Serhii Sokolovskyi) — Sumo Profile, Results & Stats',
      ja: '獅司 大 — 力士プロフィール・成績・データ',
    },
    intro: {
      uk: 'Сергій Соколовський, відомий у сумо як Шіші — український рікіші із Запоріжжя, виступає в найвищому дивізіоні макуучі.',
      en: 'Serhii Sokolovskyi, known in sumo as Shishi, is a Ukrainian rikishi from Zaporizhzhia competing in the top makuuchi division.',
      ja: '獅司 大はウクライナ・ザポリージャ出身の力士。幕内で活躍している。',
    },
  },
}

export function generateStaticParams() {
  return Object.keys(SLUGS).map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params
  const s = SLUGS[slug]
  if (!s) return {}
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const m = rikishiMeta.find(x => x.id === s.id) || {}
  const desc = {
    uk: `${s.intro.uk} Ранг: ${m.rank || ''}. Юшо: ${m.yusho || 0}. Живі результати, статистика боїв, архів турнірів.`,
    en: `${s.intro.en} Rank: ${m.rank || ''}. Yusho: ${m.yusho || 0}. Live results, bout stats and basho archive.`,
    ja: `${s.intro.ja} 現在の番付、優勝${m.yusho || 0}回。取組結果と場所アーカイブ。`,
  }
  return {
    title: s.title[L],
    description: desc[L],
    alternates: {
      canonical: `${BASE}/${L}/rikishi/${slug}`,
      languages: {
        uk: `${BASE}/uk/rikishi/${slug}`,
        en: `${BASE}/en/rikishi/${slug}`,
        ja: `${BASE}/ja/rikishi/${slug}`,
        'x-default': `${BASE}/en/rikishi/${slug}`,
      },
    },
  }
}

export default async function RikishiHubPage({ params }) {
  const { lang, slug } = await params
  const s = SLUGS[slug]
  if (!s) notFound()
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const m = rikishiMeta.find(x => x.id === s.id) || {}
  const age = m.birthDate ? Math.floor((Date.now() - new Date(m.birthDate).getTime()) / (365.25*24*3600*1000)) : null
  const label = {
    uk: { rank: 'Поточний ранг', hi: 'Найвищий ранг', yusho: 'Юшо', debut: 'Дебют', hw: 'Зріст / вага', age: 'Вік', career: 'Кар\u2019єра (перемоги/боїв)' },
    en: { rank: 'Current rank', hi: 'Highest rank', yusho: 'Yusho', debut: 'Debut', hw: 'Height / weight', age: 'Age', career: 'Career (wins/bouts)' },
    ja: { rank: '番付', hi: '最高位', yusho: '優勝', debut: '初土俵', hw: '身長・体重', age: '年齢', career: '通算成績' },
  }[L]
  const facts = [
    [label.rank, m.rank || '—'],
    [label.hi, m.hiRank || '—'],
    [label.yusho, String(m.yusho ?? 0)],
    [label.debut, m.debut ? `${String(m.debut).slice(0,4)}/${String(m.debut).slice(4)}` : '—'],
    [label.hw, m.height && m.weight ? `${m.height} cm / ${m.weight} kg` : '—'],
    [label.age, age ? String(age) : '—'],
    [label.career, m.wins && m.matches ? `${m.wins}/${m.matches}` : '—'],
  ]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: s.name[L],
    alternateName: [s.name.uk, s.name.en, s.name.ja],
    birthDate: m.birthDate || undefined,
    height: m.height ? `${m.height} cm` : undefined,
    weight: m.weight ? `${m.weight} kg` : undefined,
    nationality: 'Ukraine',
    jobTitle: 'Professional sumo wrestler',
    url: `${BASE}/${L}/rikishi/${slug}`,
  }
  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <h1 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 0.5rem'}}>{s.name[L]}</h1>
        <p style={{fontSize:'0.85rem',lineHeight:1.7,color:'var(--mid)',maxWidth:720,margin:'0 0 1rem'}}>{s.intro[L]}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:6,marginBottom:'1.5rem'}}>
          {facts.map(([k, v]) => (
            <div key={k} style={{background:'var(--bg2)',padding:'0.5rem 0.6rem',borderRadius:2}}>
              <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{k}</div>
              <div style={{fontWeight:600,fontSize:'0.8rem'}}>{v}</div>
            </div>
          ))}
        </div>
        <RikishiHubClient id={s.id} />
      </div>
    </main>
  )
}
