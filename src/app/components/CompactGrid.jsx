'use client'

import { useLang } from './LangProvider'
import FlagName from './FlagName'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

export default function CompactGrid({ items, isKyujo, currentDay }) {
  const { lang } = useLang()

  const title = isKyujo
    ? (lang === 'en' ? 'Kyujo — absent' : 'Кюджо — відсутні')
    : (lang === 'en' ? 'Eliminated from yusho race' : 'Вибули з гонки юшо')

  const winsLabel = w => {
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
                <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{r.rank} · {r.wins}–{r.losses}</div>
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
      <div key={r._id} style={{display:'flex',alignItems:'center',gap:6,padding:'0.4rem 0.5rem',borderBottom:'1px solid var(--border)'}}>
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',flexShrink:0}}>{r.rank}</span>
            <FlagName id={r._id} name={r.name} size='0.75rem' />
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'nowrap',marginTop:4}}>
            {r.record?.slice(0, 15).map((m, idx) => {
              const isWin = RESULTS_WIN.includes(m.result)
              const isLoss = RESULTS_LOSS.includes(m.result)
              return (
                <span key={idx} title={`День ${idx+1}${m.opponent?': '+m.opponent:''}`} style={{
                  width:9,height:9,borderRadius:'50%',
                  background: isLoss ? 'var(--ink)' : m.result==='absent' ? '#aaa' : 'transparent',
                  border: isWin ? '1px solid var(--ink)' : m.result==='absent' ? '1px solid #aaa' : isLoss ? 'none' : '1px dashed var(--light)',
                  display:'inline-block',flexShrink:0,
                  opacity: m.kimarite==='fusen' ? 0.5 : 1,
                }} />
              )
            })}
          </div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:600,flexShrink:0,color:'var(--mid)'}}>
          {r.wins}–{r.losses}
        </div>
      </div>
    )
  }

  const renderCol = (colGroups) => (
    <div style={{flex:1,minWidth:0,background:'var(--card)',border:'1px solid var(--border)'}}>
      {colGroups.map(({ wins, items: groupItems }) => (
        <div key={wins}>
          <div style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,color:'var(--ink)',padding:'0.3rem 0.5rem',background:'var(--bg2)',letterSpacing:'0.05em',borderLeft:'3px solid #b8860b',borderBottom:'1px solid var(--border)'}}>
            {winsLabel(wins)}
          </div>
          {groupItems.map(r => renderItem(r))}
        </div>
      ))}
    </div>
  )

  return (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding:'0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:4}}>
        {title}
      </div>
      <div className="compact-cols" style={{display:'flex',gap:4,alignItems:'stretch'}}>
        {cols.filter(c => c.length > 0).map((col, i) => (
          <div key={i} style={{flex:1,minWidth:0}}>
            {renderCol(col)}
          </div>
        ))}
      </div>
    </div>
  )
}