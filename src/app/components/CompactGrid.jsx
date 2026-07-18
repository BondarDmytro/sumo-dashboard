'use client'
import { displayRank } from '../lib/bashoCalendar' /* kanji_names_v2 */
import { t3 } from '../i18n' /* ja_batch1 */

import { useLang } from './LangProvider'
import { useState, useEffect } from 'react' /* cg_row_v3 */
import FlagName from './FlagName'
import { useFavorites } from './useFavorites' /* fav_row_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

/* cg_shortrank_v1: "Juryo 13 West" -> "J13w"; ja - cherez displayRank */
const RANK_ABBR = { Yokozuna:'Y', Ozeki:'O', Sekiwake:'S', Komusubi:'K', Maegashira:'M', Juryo:'J', Makushita:'Ms', Sandanme:'Sd', Jonidan:'Jd', Jonokuchi:'Jk' }
function shortRank(rank, lang) {
  if (lang === 'ja') return displayRank(rank, lang)
  const m = String(rank || '').match(/^(\w+)\s*(\d*)\s*(East|West)?$/)
  if (!m || !RANK_ABBR[m[1]]) return rank
  return RANK_ABBR[m[1]] + (m[2] || '') + (m[3] ? m[3][0].toLowerCase() : '')
}

export default function CompactGrid({ items, isKyujo, currentDay, title: titleProp }) {  /* grid_title_prop_v1 */
  const { isFav } = useFavorites()  /* fav_row_v1 */
  const { lang } = useLang()
  const [isMobile, setIsMobile] = useState(false)  /* cg_row_v3 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  const title = titleProp || (isKyujo
    ? (t3(lang, 'Кюджо — відсутні', 'Kyujo — absent', '休場'))
    : (t3(lang, 'Вибули з гонки юшо', 'Eliminated from yusho race', '優勝争い脱落')))

  const winsLabel = w => {
    if (lang === 'ja') return w + '勝'  /* ja_gaps_v2 */
    if (lang === 'en') return w + (w === 1 ? ' win' : ' wins')
    if (lang === 'en') return `${w} ${w === 1 ? 'win' : 'wins'}`
    return w === 1 ? '1 перемога' : w >= 2 && w <= 4 ? `${w} перемоги` : `${w} перемог`
  }

  if (!items.length) return null

  if (isKyujo) {
    return (
      <div style={{marginBottom:'1rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding: isMobile ? '0.35rem 0.5rem' : '0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:1}}>{/* kyujo_mobile_v1 */}
          {title}
        </div>
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill,minmax(140px,1fr))',gap:1,background:'var(--border)'}}>{/* kyujo_mobile_v1 */}
          {items.map(r => (
            <div key={r._id} className={isFav(r._id) ? 'fav-row' : undefined} style={{background:'var(--card)',padding: isMobile ? '0.3rem 0.5rem' : '0.5rem 0.75rem',display:'flex',alignItems:'center',gap: isMobile ? 6 : 8,opacity:0.5}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#c0392b',flexShrink:0}} />
              <div style={{flex:1,minWidth:0}}>
                <FlagName id={r._id} name={r.name} size='0.78rem' />
                <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{displayRank(r.rank, lang)} · {r.wins}–{r.losses}</div>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    )
  }

  const byWins = {}
  items.forEach(r => {
    if (!byWins[r.wins]) byWins[r.wins] = []
    byWins[r.wins].push(r)
  })
  const winGroups = Object.keys(byWins).map(Number).sort((a,b) => b - a)
  const groups = winGroups.map(wins => ({
    wins,
    items: byWins[wins].sort((a,b) => (a.rankValue||999) - (b.rankValue||999))
  }))

  const numCols = isMobile ? 1 : 3  /* cg_mob_onecol_v1: na mob odna kolonka - hrupy ne rizhutsia */
  const per = Math.ceil(items.length / numCols)
  const cols = [[], [], []]
  {
    let ci = 0, cnt = 0
    groups.forEach(g => {
      let rest = g.items, cont = false
      while (rest.length) {
        if (cnt >= per && ci < numCols - 1) { ci++; cnt = 0 }
        const take = ci === numCols - 1 ? rest.length : Math.min(rest.length, Math.max(per - cnt, 1))
        cols[ci].push({ wins: g.wins, items: rest.slice(0, take), cont })
        cnt += take
        rest = rest.slice(take)
        cont = true
      }
    })
  }

  const renderItem = r => {
    const dot = isMobile ? 6 : 8   /* cg_dots_fixed_v2: kolonka krapok znovu tochno fiksovana - ni klipu, ni overflow */
    const dgap = isMobile ? 2 : 3
    const dotsW = 15 * dot + 14 * dgap
    return (
      <div key={r._id} className={"cg-row" + (isFav(r._id) ? " fav-row" : "")} style={{display:'grid',gridTemplateColumns: 'minmax(0,1fr) ' + (isMobile ? '30px 34px ' : '36px 40px ') + dotsW + 'px',alignItems:'center',gap: isMobile ? 4 : 6,padding: isMobile ? '0.15rem 0.3rem' : '0.15rem 0.5rem',borderBottom:'1px solid var(--border)'}}>
        <div style={{minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
          <FlagName id={r._id} name={r.name} size='0.6rem'/>
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textAlign:'center'}}>{shortRank(r.rank, lang)}</div>
        <div style={{fontFamily:'monospace',fontSize: isMobile ? '0.6rem' : '0.68rem',fontWeight:600,textAlign:'center',color: r.wins >= 8 ? '#1a6b5c' : r.losses >= 8 ? '#c0392b' : 'var(--mid)'}}>{r.wins}–{r.losses}</div>
        <div className="cg-dots" style={{display:'flex',gap:dgap,alignItems:'center',flexWrap:'nowrap',width:dotsW,flexShrink:0}}>
          {Array.from({ length: 15 }, (_, i) => (r.record || [])[i] || {}).map((m, idx) => {
            const isWin = RESULTS_WIN.includes(m.result)
            const isLoss = RESULTS_LOSS.includes(m.result)
            return (
              <span key={idx} title={(lang === 'ja' ? (idx+1) + '\u65e5\u76ee' : lang === 'en' ? 'Day ' + (idx+1) : '\u0414\u0435\u043d\u044c ' + (idx+1)) + (m.opponent ? ': ' + m.opponent : '')} style={{
                width:dot,height:dot,borderRadius: m.kimarite==='fusen' ? 0 : '50%',boxSizing:'border-box',  /* fusen_squares_v1 */
                outline: idx + 1 === currentDay ? '2px solid #b8860b' : 'none', outlineOffset: 0,
                background: isWin ? '#f5f0e8' : isLoss ? '#0f0e0c' : m.result==='absent' ? '#aaa' : 'transparent',  /* cg_dots_canon_v1: win bila, loss chorna v obokh temakh */
                border: (isWin || isLoss) ? '1px solid var(--ink)' : m.result==='absent' ? '1px solid #aaa' : '1px dashed var(--light)',
                display:'inline-block',flexShrink:0,
              }} />
            )
          })}
        </div>
      </div>
    )
  }

  const renderCol = (segments) => (  /* cg_3cols_v1 */
    <>
      {segments.map((seg, si) => (
        <div key={seg.wins + '_' + si} className="cg-group" style={{background:'var(--card)',border:'1px solid var(--border)',marginBottom:8}}>
          <div className="cg-glue">
            <div className="cg-group-title" style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,color:'var(--ink)',padding:'0.3rem 0.5rem',background:'var(--bg2)',letterSpacing:'0.05em',borderLeft:'3px solid #b8860b',borderBottom:'1px solid var(--border)'}}>
              {winsLabel(seg.wins)}{seg.cont && <span style={{color:'var(--mid)',fontWeight:400}}>{' \u00b7\u00b7\u00b7'}</span>}
            </div>
            {seg.items[0] && renderItem(seg.items[0])}
          </div>
          {seg.items.slice(1).map(r => renderItem(r))}
        </div>
      ))}
    </>
  )

  return (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding:'0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:4}}>
        {title}
      </div>
      <div className="cg-flow" style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0,1fr))',gap:8,alignItems:'start'}}>{/* cg_3cols_v1 */}
        {cols.filter(segs => segs.length).map((segs, i) => <div key={i} style={{minWidth:0}}>{renderCol(segs)}</div>)}
      </div>
    </div>
  )
}