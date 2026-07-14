'use client'
/* votes_v1: rukhomyi riadok "Narodnyi vybir" - top holosiv naonline */
import { useVotes } from './useVotes'
import { useLang } from './LangProvider'
import { useBios } from './BiosProvider'
import meta from '../lib/rikishiMeta.json' /* name fallback */

export default function VoteTicker() {
  const { votes, total } = useVotes()
  const { lang } = useLang()
  const bios = useBios()
  if (total < 3) return null  // ne pokazuiemo pustku - z 3 holosiv maie sens

  const t = (uk, en, ja) => lang === 'en' ? en : lang === 'ja' ? ja : uk
  const top = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => {
      const bio = bios[String(id)]
      const m = meta.find(x => Number(x.id) === Number(id))
      const name = lang === 'ja'
        ? ((bio?.nameJp || m?.nameJp || '').split(/\s/)[0] || `#${id}`)
        : (bio?.name || m?.name || `#${id}`)
      return { id, name, n, pct: Math.round((n / total) * 100) }
    })

  const items = top.map((r, i) => (
    <span key={r.id} style={{marginRight:28,whiteSpace:'nowrap'}}>
      <span style={{color: i === 0 ? '#b8860b' : 'var(--mid)',fontWeight: i === 0 ? 700 : 400}}>{i + 1}.</span>{' '}
      <span style={{color:'var(--ink)',fontWeight:600}}>{r.name}</span>{' '}
      <span style={{color:'#b8860b',fontWeight:700}}>{r.pct}%</span>{' '}
      <span style={{color:'var(--mid)',fontSize:'0.62rem'}}>({r.n})</span>
    </span>
  ))

  return (
    <div className="vt-bar" style={{display:'flex',alignItems:'center',padding:'6px 0',fontFamily:'monospace',fontSize:'0.72rem'}}>{/* vt_label_fixed vt_style_v2 */}
      <span style={{flexShrink:0,padding:'0 14px',color:'var(--mid)',letterSpacing:'0.12em',textTransform:'uppercase',whiteSpace:'nowrap',borderRight:'1px solid rgba(184,134,11,0.35)'}}>
        {'🗳️ '}{t('Народний вибір', "Fans' pick", 'ファン予想')} · {total} {t('голосів', 'votes', '票')}
      </span>
      <div style={{flex:1,overflow:'hidden',minWidth:0}}>
        <div className="vt-track" style={{display:'inline-flex',whiteSpace:'nowrap',animation:'vtScroll2 25s linear infinite',willChange:'transform',paddingLeft:'100%'}}>
          {items}
        </div>
      </div>
    </div>
  )
}
