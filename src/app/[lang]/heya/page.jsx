/* heya_index_v1: indeks 45 stainei */
import rikishiMeta from '../../lib/rikishiMeta.json'
import { heyaSlug, rankVal } from '../../lib/heya' /* heya_lib_v1 */
import { heyaJa } from '../../lib/heyaJa' /* heya_ja_lib_v1 */

export const revalidate = 3600
const BASE = 'https://sumo.dohyo-legends.com'

export async function generateMetadata({ params }) {
  const { lang } = await params
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const title = { uk: 'Стайні сумо — всі хея, рікіші та ранги', en: 'Sumo stables — all heya, rikishi & ranks', ja: '相撲部屋一覧 — 所属力士と番付' }[L]
  const description = {
    uk: 'Всі стайні професійного сумо: склад, кількість рікіші, топ-ранги, кар\u2019єрна статистика.',
    en: 'All professional sumo stables: rosters, rikishi counts, top ranks and career stats.',
    ja: '大相撲の全部屋一覧。所属力士、最高位、通算成績。',
  }[L]
  return {
    title, description,
    alternates: {
      canonical: `${BASE}/${L}/heya`,
      languages: { uk: `${BASE}/uk/heya`, en: `${BASE}/en/heya`, ja: `${BASE}/ja/heya`, 'x-default': `${BASE}/en/heya` },
    },
  }
}

export default async function HeyaIndex({ params }) {
  const { lang } = await params
  const L = ['uk','en','ja'].includes(lang) ? lang : 'en'
  const map = {}
  rikishiMeta.forEach(r => {
    if (!r.heya) return
    const s = heyaSlug(r.heya)
    map[s] = map[s] || { slug: s, name: r.heya, members: [], yusho: 0 }
    map[s].members.push(r)
    map[s].yusho += r.yusho || 0
  })
  const heyas = Object.values(map)
  heyas.forEach(h => h.members.sort((a, b) => rankVal(a.rank) - rankVal(b.rank)))
  heyas.sort((a, b) => rankVal(a.members[0]?.rank) - rankVal(b.members[0]?.rank))
  const h1 = { uk: 'Стайні сумо', en: 'Sumo stables', ja: '相撲部屋一覧' }[L]
  const sub = {
    uk: `${heyas.length} стаєнь · ${rikishiMeta.length} рікіші`,
    en: `${heyas.length} stables · ${rikishiMeta.length} rikishi`,
    ja: `${heyas.length}部屋 · 力士${rikishiMeta.length}名`,
  }[L]
  const lbl = { uk: ['рікіші', 'юшо'], en: ['rikishi', 'yusho'], ja: ['名', '優勝'] }[L]
  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <h1 style={{fontSize:'1.4rem',fontWeight:800,margin:'0 0 0.3rem'}}>{h1}</h1>
        <p style={{fontFamily:'monospace',fontSize:'0.68rem',color:'var(--mid)',margin:'0 0 1.2rem'}}>{sub}</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:8}}>
          {heyas.map(h => (
            <a key={h.slug} href={`/${L}/heya/${h.slug}`} style={{display:'block',background:'var(--card)',border:'1px solid var(--border)',padding:'0.7rem 0.9rem',borderRadius:3,textDecoration:'none',color:'var(--ink)'}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8}}>
                <span style={{fontWeight:700,fontSize:'0.9rem'}}>{L === 'ja' ? `${heyaJa(h.name)}部屋` : h.name}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{h.members.length} {lbl[0]}</span>
                {h.yusho > 0 && <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'#8a6a00',fontWeight:700}}>{'\ud83c\udfc6'} {h.yusho} {lbl[1]}</span>}{/* heya_visual_v1 */}
              </div>
              {(() => {  /* heya_visual_v1: top-sekitori vydileno */
                const div = String(h.members[0]?.rank || '').split(' ')[0]
                const isMak = ['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira'].includes(div)
                return (
              <div style={{marginTop:4,fontFamily:'monospace',fontSize:'0.62rem',color: isMak ? '#8a6a00' : 'var(--mid)',fontWeight: isMak ? 700 : 400}}>
                {L === 'ja' ? String(h.members[0]?.nameJp || h.members[0]?.name || '').split('\u3000')[0].split('(')[0] : h.members[0]?.name} — {h.members[0]?.rank}
              </div>
                )
              })()}
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}
