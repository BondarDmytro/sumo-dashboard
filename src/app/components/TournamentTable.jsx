'use client'

import { useLang } from './LangProvider'
import FlagName from './FlagName'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

function TodayCell({ record, currentDay, t }) {
  const todayMatch = record.find(m => m.day === currentDay)
  const todayWin = todayMatch && RESULTS_WIN.includes(todayMatch.result)
  const todayLoss = todayMatch && RESULTS_LOSS.includes(todayMatch.result)
  if (!todayMatch || !todayMatch.result) {
    return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>{t?.misc?.expected || 'очікується'}</span>
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
    <div style={{display:'flex',alignItems:'center',gap:2,flexWrap:'nowrap',maxWidth:240}}>
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

export default function TournamentTable({ contenders, currentDay }) {
  const { t, lang } = useLang()

  const headers = lang === 'en'
    ? [`Day ${currentDay}`, '#', 'Rikishi', 'Rank', 'Record', 'Matches', 'Status', 'Yusho chance', 'Δ']
    : [`День ${currentDay}`, '#', 'Рікіші', 'Ранг', 'Рекорд', 'Матчі', 'Статус', 'Шанс на юшо', 'Δ']

  return (
    <>
      <div className="anim-2" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
        {lang === 'en' ? 'Standings — all Makuuchi rikishi' : 'Турнірна таблиця — всі рікіші макуучі'}
      </div>
      <div className="anim-3 desktop-table" style={{overflowX:'auto',marginBottom:'1rem'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--ink)'}}>
              {headers.map(h => (
                <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.6rem 0.75rem',textAlign:'left',fontWeight:500}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contenders.map((r, i) => {
              const rankColors = ['#b8860b','#888','#a0522d']
              const bgColor = i < 3 ? rankColors[i] : 'var(--bg2)'
              const textColor = i < 3 ? '#fff' : 'var(--mid)'
              const barColor = i===0?'#1a6b5c':i===1?'#1a4a7a':i===2?'#c0392b':'#888'
              const statusLabel = r.status === 'lead'
                ? (lang === 'en' ? 'leader' : 'лідер')
                : r.status === 'chase'
                ? '-1'
                : `${r.wins}–${r.losses}`
              return (
                <tr key={r._id} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'0.85rem 0.75rem',textAlign:'center',minWidth:90}}>
                    <TodayCell record={r.record} currentDay={currentDay} t={t} />
                  </td>
                  <td style={{padding:'0.85rem 0.75rem'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace'}}>{i+1}</div>
                  </td>
                  <td style={{padding:'0.85rem 0.75rem'}}>
                    <FlagName id={r._id} name={r.name} />
                    <div style={{fontSize:'0.72rem',color:'var(--mid)',fontStyle:'italic',marginTop:2}}>{r.rankFull}</div>
                  </td>
                  <td style={{padding:'0.85rem 0.75rem'}}>
                    <span style={{fontFamily:'monospace',fontSize:'0.62rem',background:'var(--bg2)',padding:'2px 6px',borderRadius:2,color:'var(--mid)'}}>{r.rank}</span>
                  </td>
                  <td style={{padding:'0.85rem 0.75rem',fontFamily:'monospace',fontWeight:500}}>{r.wins}–{r.losses}</td>
                  <td style={{padding:'0.85rem 0.75rem'}}>
                    <MatchDots record={r.record} currentDay={currentDay} />
                  </td>
                  <td style={{padding:'0.85rem 0.75rem'}}>
                    <span style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'3px 8px',borderRadius:2,
                      background:r.status==='lead'?'#1a6b5c':r.status==='chase'?'#b8860b':'var(--bg2)',
                      color:r.status==='lead'?'#fff':r.status==='chase'?'#fff':'var(--mid)'}}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{padding:'0.85rem 0.75rem',minWidth:180}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:5,background:'var(--bg2)'}}>
                        <div style={{height:'100%',width:`${Math.min(r.yushoChance,100)}%`,background:barColor}} />
                      </div>
                      <span style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:600,color:barColor,minWidth:40,textAlign:'right'}}>{r.yushoChance}%</span>
                    </div>
                  </td>
                  <td style={{padding:'0.85rem 0.75rem',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>—</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}