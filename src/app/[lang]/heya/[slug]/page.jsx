/* heya_page_v1: SEO-storinky stainei /uk|en|ja/heya/[slug] */
import { notFound } from 'next/navigation'
import rikishiMeta from '../../../lib/rikishiMeta.json'
import HeyaClient from '../../../components/HeyaClient'

export const revalidate = 3600
const BASE = 'https://sumo.dohyo-legends.com'

import { heyaSlug, rankVal } from '../../../lib/heya' /* heya_lib_v1 */

function heyaMap() {
  const map = {}
  rikishiMeta.forEach(r => {
    if (!r.heya) return
    const s = heyaSlug(r.heya)
    map[s] = map[s] || { name: r.heya, members: [] }
    map[s].members.push(r)
  })
  Object.values(map).forEach(h => h.members.sort((a, b) => rankVal(a.rank) - rankVal(b.rank)))
  return map
}

export function generateStaticParams() {
  return Object.keys(heyaMap()).map(slug => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { lang, slug } = await params
  const h = heyaMap()[slug]
  if (!h) return {}
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const top = h.members[0]
  const title = {
    uk: `Стайня ${h.name} — рікіші, ранги, результати | Сумо`,
    en: `${h.name} stable — rikishi, ranks & results | Sumo`,
    ja: `${h.name}部屋 — 所属力士・番付・成績`,
  }[L]
  const description = {
    uk: `Стайня ${h.name}: ${h.members.length} рікіші. Найвищий ранг — ${top?.rank || '—'} (${top?.name || ''}). Профілі, статистика, живі результати басьо.`,
    en: `${h.name} stable: ${h.members.length} rikishi. Top rank — ${top?.rank || '—'} (${top?.name || ''}). Profiles, stats and live basho results.`,
    ja: `${h.name}部屋の所属力士${h.members.length}名。最高位は${top?.rank || ''}の${top?.nameJp || top?.name || ''}。プロフィール・成績・場所の結果。`,
  }[L]
  return {
    title, description,
    alternates: {
      canonical: `${BASE}/${L}/heya/${slug}`,
      languages: {
        uk: `${BASE}/uk/heya/${slug}`, en: `${BASE}/en/heya/${slug}`, ja: `${BASE}/ja/heya/${slug}`,
        'x-default': `${BASE}/en/heya/${slug}`,
      },
    },
  }
}

export default async function HeyaPage({ params }) {
  const { lang, slug } = await params
  const h = heyaMap()[slug]
  if (!h) notFound()
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const totWins = h.members.reduce((s, r) => s + (r.wins || 0), 0)
  const totYusho = h.members.reduce((s, r) => s + (r.yusho || 0), 0)
  const top = h.members[0]
  const intro = {
    uk: `Стайня ${h.name} (${h.name}-бея) — ${h.members.length} рікіші у професійному сумо. Сумарно ${totWins.toLocaleString('en-US')} кар'єрних перемог і ${totYusho} юшо. Найвищий поточний ранг — ${top?.rank || '—'}.`,
    en: `${h.name} stable (${h.name}-beya) has ${h.members.length} rikishi in professional sumo, with a combined ${totWins.toLocaleString('en-US')} career wins and ${totYusho} yusho. Highest current rank: ${top?.rank || '—'}.`,
    ja: `${h.name}部屋には${h.members.length}名の力士が所属。通算${totWins.toLocaleString('en-US')}勝、優勝${totYusho}回。現在の最高位は${top?.rank || ''}。`,
  }[L]
  const label = {
    uk: { members: 'Рікіші', top: 'Топ-ранг', wins: 'Кар\u2019єрні перемоги', yusho: 'Юшо', list: 'Склад стайні', backAll: '← Всі стайні' },
    en: { members: 'Rikishi', top: 'Top rank', wins: 'Career wins', yusho: 'Yusho', list: 'Stable roster', backAll: '← All stables' },
    ja: { members: '力士数', top: '最高位', wins: '通算勝利', yusho: '優勝', list: '所属力士', backAll: '← 部屋一覧' },
  }[L]
  const facts = [
    [label.members, String(h.members.length)],
    [label.top, top?.rank || '—'],
    [label.wins, totWins.toLocaleString('en-US')],
    [label.yusho, totYusho ? `\ud83c\udfc6 ${totYusho}` : '0'],  /* heya_visual_v1 */
  ]
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'SportsTeam',
    name: `${h.name} stable`, sport: 'Sumo',
    memberOf: { '@type': 'SportsOrganization', name: 'Japan Sumo Association' },
    athlete: h.members.slice(0, 12).map(r => ({ '@type': 'Person', name: r.name })),
    url: `${BASE}/${L}/heya/${slug}`,
  }
  const hubSlugs = { 8854: 'aonishiki', 86: 'shishi' }
  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd)}} />
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <a href={`/${L}/heya`} style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',textDecoration:'none'}}>{label.backAll}</a>
        <h1 style={{fontSize:'1.4rem',fontWeight:800,margin:'0.4rem 0 0.5rem'}}>{L === 'ja' ? `${h.name}部屋` : `${h.name}`}</h1>
        <p style={{fontSize:'0.85rem',lineHeight:1.7,color:'var(--mid)',maxWidth:720,margin:'0 0 1rem'}}>{intro}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:6,marginBottom:'1.5rem'}}>
          {facts.map(([k, v]) => (
            <div key={k} style={{background:'var(--bg2)',padding:'0.5rem 0.6rem',borderRadius:2}}>
              <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{k}</div>
              <div style={{fontWeight:600,fontSize:'0.8rem'}}>{v}</div>
            </div>
          ))}
        </div>
        <h2 style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',margin:'0 0 0.6rem'}}>{label.list}</h2>
        <div className="heya-roster" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:6,marginBottom:'1.5rem'}}>{/* heya_roster_mobile_v1 */}
          {h.members.map(r => (
            (() => {  /* heya_visual_v1: sekitori pidsvicheni */
              const div = String(r.rank || '').split(' ')[0]
              const isMak = ['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira'].includes(div)
              const isJuryo = div === 'Juryo'
              const st = isMak
                ? { border: '1px solid rgba(184,134,11,0.55)', background: 'rgba(184,134,11,0.10)' }
                : isJuryo
                  ? { border: '1px solid rgba(184,134,11,0.3)', background: 'rgba(184,134,11,0.045)' }
                  : { border: '1px solid var(--border)', background: 'var(--card)' }
              return (
            <a key={r.id} href={hubSlugs[r.id] ? `/${L}/rikishi/${hubSlugs[r.id]}` : `/${L}/rikishi?id=${r.id}`}
              style={{display:'flex',alignItems:'center',gap:8,...st,padding:'0.5rem 0.7rem',borderRadius:2,textDecoration:'none',color:'var(--ink)'}}>
              <span style={{flex:1,fontWeight: isMak ? 800 : 600,fontSize:'0.8rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{(r.yusho || 0) > 0 ? '\ud83c\udfc6 ' : ''}{L === 'ja' && r.nameJp ? r.nameJp.split('\u3000')[0] : r.name}</span>
              <span style={{fontFamily:'monospace',fontSize:'0.58rem',color: isMak ? '#8a6a00' : 'var(--mid)',background: isMak ? 'rgba(184,134,11,0.16)' : 'var(--bg2)',padding:'1px 5px',borderRadius:2,whiteSpace:'nowrap',fontWeight: isMak ? 700 : 400}}>{r.rank}</span>
            </a>
              )
            })()
          ))}
        </div>
        <HeyaClient members={h.members.map(r => ({ id: r.id, last9: r.last9 || [], yusho: r.yusho || 0 }))} heyaName={h.name} />{/* heya_live_v8 */}
      </div>
    </main>
  )
}
