'use client'
import { useState } from 'react' /* table_timetravel_v1 */
import { displayRank } from '../lib/bashoCalendar' /* kanji_names_v2 */

import { useLang } from './LangProvider'
import FlagName from './FlagName'
import { computeStandings } from '../lib/chanceEngine' /* table_timetravel_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

function TodayCell({ record, currentDay, t, lang }) {
  const todayMatch = record.find(m => m.day === currentDay)
  const todayWin = todayMatch && RESULTS_WIN.includes(todayMatch.result)
  const todayLoss = todayMatch && RESULTS_LOSS.includes(todayMatch.result)
  if (!todayMatch || !todayMatch.result) {
    return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>{t3(lang,'очікується','upcoming','予定')}</span>
  }
  if (todayWin) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid #0f0e0c',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>
        {todayMatch.kimarite==='fusen'?'✦ ':''}{todayMatch.opponent}
      </span>
    </div>
  )
  if (todayLoss) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'#0f0e0c',border:'1.5px solid #f5f0e8',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>{todayMatch.opponent}</span>
    </div>
  )
  return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>—</span>
}

function MatchDots({ record, currentDay }) {
  return (
    <div className="tt-dots" style={{display:'flex',alignItems:'center',gap:2,flexWrap:'nowrap',maxWidth:240}}>
      {Array.from({length:15}).map((_, idx) => {
        const m = record[idx]
        const isWin = m && RESULTS_WIN.includes(m.result)
        const isLoss = m && RESULTS_LOSS.includes(m.result)
        const isAbsent = m?.result === 'absent'
        const isFusen = m?.kimarite === 'fusen'
        const noResult = !m || !RESULTS_WIN.concat(RESULTS_LOSS, ['absent']).includes(m.result)
        const isToday = m?.day === currentDay
        return (
          <span key={idx} style={{
            width:11,height:11,borderRadius:'50%',
            background: noResult ? 'transparent' : isWin ? '#f5f0e8' : isLoss ? '#0f0e0c' : isAbsent ? '#888' : 'transparent',
            border: noResult ? '1px dashed var(--light)' : '1.5px solid var(--ink)',
            boxSizing:'border-box',
            display:'inline-block',flexShrink:0,
            opacity: isFusen ? 0.5 : 1,
            outline: isToday ? '2px solid #b8860b' : 'none',
            outlineOffset: 1,
          }} />
        )
      })}
      <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginLeft:4}}>
        {record.filter(m => RESULTS_WIN.concat(RESULTS_LOSS).includes(m.result)).length}/15
      </span>
    </div>
  )
}

export default function TournamentTable({ contenders, currentDay, allRikishi = null }) {
  const { t, lang } = useLang()
  const [viewDay, setViewDay] = useState(currentDay)  /* table_timetravel_v1 */
  const retro = viewDay !== currentDay && allRikishi?.length
    ? computeStandings(allRikishi, viewDay)
    : null
  const shown = retro
    ? retro.rikishi.filter(r => r.yushoChance > 0)
    : contenders

  const dayLabel = t3(lang, `День ${viewDay}`, `Day ${viewDay}`, `${viewDay}日目`)
  const headers = [
    dayLabel,
    '#',
    t3(lang, 'Рікіші', 'Rikishi', '力士'),
    t3(lang, 'Ранг', 'Rank', '番付'),
    t3(lang, 'Рекорд', 'Record', '成績'),
    t3(lang, 'Матчі', 'Matches', '取組'),
    t3(lang, 'Статус', 'Status', '状態'),
    t3(lang, 'Шанс на юшо', 'Yusho chance', '優勝確率'),
    'Δ',
  ]

  return (
    <>
      <div className="anim-2" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
        {t3(lang, 'Турнірна таблиця — всі рікіші макуучі', 'Standings — all Makuuchi rikishi', '幕内力士 全員成績表')}
      </div>
      <div className="tt-slider" style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.5rem'}}>{/* table_timetravel_v1 */}
        <button onClick={() => setViewDay(d => Math.max(1, d - 1))} disabled={viewDay <= 1}
          style={{fontFamily:'monospace',padding:'2px 10px',cursor:'pointer',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:2,color:'var(--ink)'}}>{'\u2039'}</button>
        <input type="range" min={1} max={currentDay} value={viewDay} onChange={e => setViewDay(parseInt(e.target.value, 10))}
          style={{flex:1,minWidth:120,accentColor:'#b8860b'}} />
        <button onClick={() => setViewDay(d => Math.min(currentDay, d + 1))} disabled={viewDay >= currentDay}
          style={{fontFamily:'monospace',padding:'2px 10px',cursor:'pointer',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:2,color:'var(--ink)'}}>{'\u203a'}</button>
        <span style={{fontFamily:'monospace',fontSize:'0.7rem',fontWeight:700,whiteSpace:'nowrap'}}>{t3(lang,'\u0414\u0435\u043d\u044c','Day','\u65e5\u76ee')} {viewDay}/{currentDay}</span>
      </div>
      <div className="tt-days" style={{display:'flex',gap:3,marginBottom:'0.6rem'}}>{/* table_timetravel_v1 */}
        {Array.from({length:15},(_,k)=>k+1).map(d => (
          <div key={d} onClick={() => d <= currentDay && setViewDay(d)}
            style={{flex:1,height:20,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',
              cursor: d > currentDay ? 'default' : 'pointer', opacity: d > currentDay ? 0.35 : 1,
              background: d === viewDay ? '#b8860b' : d <= currentDay ? 'rgba(184,134,11,0.18)' : 'var(--bg2)',
              border: '1px solid ' + (d === viewDay ? '#b8860b' : d <= currentDay ? 'rgba(184,134,11,0.4)' : 'var(--border)'),
              fontFamily:'monospace',fontSize:'0.55rem',fontWeight:700,color: d === viewDay ? '#1a120a' : 'var(--mid)'}}>
            {d}
          </div>
        ))}
      </div>
      <div className="anim-3 desktop-table" style={{overflowX:'auto',marginBottom:'1rem'}}>
        <table className="tt-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--ink)'}}>
              {headers.map(h => (
                <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 0.75rem',textAlign:'left',fontWeight:500 /* tt_compact_v1 */}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const rankColors = ['#b8860b','#888','#a0522d']
              const bgColor = i < 3 ? rankColors[i] : 'var(--bg2)'
              const textColor = i < 3 ? '#fff' : 'var(--mid)'
              const barColor = i===0?'#1a6b5c':i===1?'#1a4a7a':i===2?'#c0392b':'#888'
              const statusLabel = r.status === 'lead'
                ? t3(lang, 'лідер', 'leader', 'トップ')
                : r.status === 'chase'
                ? '-1'
                : `${r.wins}–${r.losses}`
              return (
                <tr key={r._id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'0.35rem 0.75rem',textAlign:'center',minWidth:90}}>
                    <TodayCell record={r.record} currentDay={viewDay} t={t} lang={lang}/>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace'}}>{i+1}</div>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <FlagName id={r._id} name={r.name} />
                    {r.editorialNote && <div style={{fontSize:'0.65rem',color:'#b8860b',marginTop:2}}>{r.editorialNote[typeof lang !== 'undefined' ? lang : 'uk'] || r.editorialNote.uk /* ja_batch4b */}</div>} {/* badge_render_v1 */}
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <span style={{fontFamily:'monospace',fontSize:'0.62rem',background:'var(--bg2)',padding:'2px 6px',borderRadius:2,color:'var(--mid)'}}>{displayRank(r.rank, lang)}</span>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',fontFamily:'monospace',fontWeight:500}}>{r.wins}–{r.losses}</td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <MatchDots record={r.record} currentDay={currentDay} />
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <span style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'3px 8px',borderRadius:2,
                      background:r.status==='lead'?'#1a6b5c':r.status==='chase'?'#b8860b':'var(--bg2)',
                      color:r.status==='lead'?'#fff':r.status==='chase'?'#fff':'var(--mid)'}}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',minWidth:180}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="tt-chancebar" style={{flex:1,height:5,background:'var(--bg2)'}}>
                        <div style={{height:'100%',width:`${Math.min(r.yushoChance,100)}%`,background:barColor}} />
                      </div>
                      <span style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:600,color:barColor,minWidth:40,textAlign:'right'}}>{r.yushoChance}%</span>
                    </div>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>—</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
