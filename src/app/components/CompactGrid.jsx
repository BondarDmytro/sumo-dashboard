'use client'
import { displayRank } from '../lib/bashoCalendar' /* kanji_names_v2 */
import { t3 } from '../i18n' /* ja_batch1 */

import { useLang } from './LangProvider'
import FlagName from './FlagName'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

export default function CompactGrid({ items, isKyujo, currentDay, title: titleProp }) {  /* grid_title_prop_v1 */
  const { lang } = useLang()

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
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding:'0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:1}}>
          {title}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:1,background:'var(--border)'}}>
          {items.map(r => (
            <div key={r._id} style={{background:'var(--card)',padding:'0.5rem 0.75rem',display:'flex',alignItems:'center',gap:8,opacity:0.5}}>
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

  const totalRikishi = items.length
  const cols = [[], [], []]
  const numCols = 3
  const target = Math.ceil(totalRikishi / numCols)
  let colIdx = 0
  let colCount = 0

  groups.forEach(group => {
    if (colIdx < numCols - 1 && colCount >= target * (colIdx + 1)) colIdx++
    cols[colIdx].push(group)
    colCount += group.items.length
  })

  const renderItem = r => {
    return (
      <div key={r._id} style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,padding:'0.15rem 0.5rem',borderBottom:'1px solid var(--border)' /* cg_dense_v1 */}}>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <FlagName id={r._id} name={r.name} size='0.75rem' />
            <span style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',flexShrink:0}}>{displayRank(r.rank, lang)}</span>  {/* dots15_highlight_v1: imia pershe */}
          </div>
          
        </div>
          <div style={{display:'flex',gap:3,flexWrap:'nowrap',marginTop:0}} className="cg-dots">
            {Array.from({ length: 15 }, (_, i) => (r.record || [])[i] || {}).map((m, idx) => {  /* dots15_highlight_v1: zavzhdy 15 */
              const isWin = RESULTS_WIN.includes(m.result)
              const isLoss = RESULTS_LOSS.includes(m.result)
              return (
                <span key={idx} title={(lang === 'ja' ? `${idx+1}日目` : lang === 'en' ? `Day ${idx+1}` : `День ${idx+1}`) + (m.opponent?': '+m.opponent:'')} style={{
                  width:7,height:7,borderRadius:'50%',
                  outline: idx + 1 === currentDay ? '2px solid #b8860b' : 'none', outlineOffset: 1,  /* dot_day_highlight */
                  background: isLoss ? 'var(--ink)' : m.result==='absent' ? '#aaa' : 'transparent',
                  border: isWin ? '1px solid var(--ink)' : m.result==='absent' ? '1px solid #aaa' : isLoss ? 'none' : '1px dashed var(--light)',
                  display:'inline-block',flexShrink:0,
                  opacity: m.kimarite==='fusen' ? 0.5 : 1,
                }} />
              )
            })}
          </div>
        <div style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:600,flexShrink:0,
          color: r.wins >= 8 ? '#1a6b5c' : r.losses >= 8 ? '#c0392b' : 'var(--mid)'}}>
          {r.wins}–{r.losses}
        </div>
      </div>
    )
  }

  const renderCol = (colGroups) => (  /* cg_flow_v2: bez zovnishnoi obhortky - hrupy priami dity cg-flow */
    <>
      {colGroups.map(({ wins, items: groupItems }) => (
        <div key={wins} className="cg-group" style={{background:'var(--card)',border:'1px solid var(--border)',marginBottom:8}}>
          <div className="cg-glue">{/* cg_glue_v1: zaholovok skleienyi z pershoiu kartkoiu - syrit nema */}
            <div className="cg-group-title" style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,color:'var(--ink)',padding:'0.3rem 0.5rem',background:'var(--bg2)',letterSpacing:'0.05em',borderLeft:'3px solid #b8860b',borderBottom:'1px solid var(--border)'}}>
              {winsLabel(wins)}
            </div>
            {groupItems[0] && renderItem(groupItems[0])}
          </div>
          {groupItems.slice(1).map(r => renderItem(r))}
        </div>
      ))}
    </>
  )

  return (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding:'0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:4}}>
        {title}
      </div>
      <div className="cg-flow">{/* cg_flow_v1 */}
        {renderCol(groups)}
      </div>
    </div>
  )
}