import ThemeToggle from './components/ThemeToggle'
import H2HTable from './components/H2HTable'
import ChartWrapper from './components/ChartWrapper'
import RikishiCard from './components/RikishiCard'

export const revalidate = 300

async function getBashoData() {
  const res = await fetch('https://sumo-api.com/api/basho/202605/banzuke/Makuuchi', {
    next: { revalidate: 300 }
  })
  const banzuke = await res.json()
  const all = [...(banzuke.east || []), ...(banzuke.west || [])]

  const processed = all.map(r => {
    const record = r.record || []
    const wins = record.filter(m => m.result === 'win').length
    const losses = record.filter(m => m.result === 'loss').length
    const kyujo = record.filter(m => m.result === 'absent').length > 5
    const rankValue = r.rankValue || 999
    return {
      _id: String(r.rikishiID),
      name: r.shikonaEn,
      rank: getRankShort(r.rank),
      rankFull: r.rank,
      rankValue,
      wins,
      losses,
      kyujo,
      status: kyujo ? 'kyujo' : losses <= 2 ? 'lead' : losses <= 3 ? 'chase' : 'out',
      record: record.map((m, i) => ({
        day: i + 1,
        result: m.result,
        opponent: m.opponentShikonaEn,
      }))
    }
  })

  const apiDay = processed[0]?.record?.length || 0
  const bashoStart = new Date('2026-05-10')
  const today = new Date()
  const diffDays = Math.floor((today - bashoStart) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(diffDays + 1, 1), 15)

  const withChances = processed.map(r => {
    if (r.kyujo) return { ...r, yushoChance: 0, chanceDelta: 0 }
    const remaining = Math.max(0, 15 - currentDay)
    const maxWins = r.wins + remaining

    if (currentDay >= 15) {
      const maxW = Math.max(...processed.filter(x => !x.kyujo).map(x => x.wins))
      const base = r.wins === maxW ? 90 : r.wins >= maxW - 1 ? 30 : r.wins >= maxW - 2 ? 5 : 0
      const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
      return { ...r, yushoChance: Math.round(base * rankBonus * 10) / 10, chanceDelta: 0 }
    }

    if (r.losses >= 5 || maxWins < 11) return { ...r, yushoChance: 0, chanceDelta: 0 }
    let base = r.losses === 0 ? 85 : r.losses === 1 ? 55 : r.losses === 2 ? 25 : r.losses === 3 ? 8 : 2
    const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
    if (maxWins < 13) base *= 0.6
    return { ...r, yushoChance: Math.round(base * rankBonus * 10) / 10, chanceDelta: 0 }
  })

  const total = withChances.reduce((s, r) => s + r.yushoChance, 0)
  const normalized = withChances.map(r => ({
    ...r,
    yushoChance: total > 0 ? Math.round(r.yushoChance / total * 1000) / 10 : 0
  }))

  normalized.sort((a, b) => b.yushoChance - a.yushoChance)

  const maxWins = Math.max(...normalized.filter(r => !r.kyujo).map(r => r.wins))
  const leaders = normalized.filter(r => r.wins === maxWins && !r.kyujo)
  const chasers = normalized.filter(r => r.wins === maxWins - 1 && !r.kyujo)

  const h2h = []
  normalized.forEach(r => {
    r.record.forEach(m => {
      if (m.result === 'win' || m.result === 'loss') {
        const exists = h2h.find(x =>
          (x.fighter1 === r.name && x.fighter2 === m.opponent) ||
          (x.fighter1 === m.opponent && x.fighter2 === r.name)
        )
        if (!exists && m.opponent) {
          h2h.push({
            fighter1: r.name,
            fighter2: m.opponent,
            winner: m.result === 'win' ? r.name : m.opponent,
            day: m.day
          })
        }
      }
    })
  })

  return { rikishi: normalized, leaders, chasers, currentDay, maxWins, h2h }
}

function getRankShort(rank) {
  if (!rank) return '?'
  if (rank.includes('Yokozuna')) return rank.replace('Yokozuna ', 'Y').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Ozeki')) return rank.replace('Ozeki ', 'O').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Sekiwake')) return rank.replace('Sekiwake ', 'S').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Komusubi')) return rank.replace('Komusubi ', 'K').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Maegashira')) {
    const num = rank.match(/\d+/)?.[0] || ''
    return `M${num}${rank.includes('East') ? 'e' : 'w'}`
  }
  return rank
}

export default async function Home() {
  const { rikishi, leaders, chasers, currentDay, maxWins, h2h } = await getBashoData()
  const contenders = rikishi.filter(r => r.yushoChance > 0).slice(0, 12)
  const kyujo = rikishi.filter(r => r.kyujo).slice(0, 6)

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>

      <header className="anim-header" style={{background:'var(--header)',color:'#f5f0e8',padding:'3rem 2rem 2rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'-0.05em',top:'-0.15em',fontSize:'clamp(8rem,20vw,18rem)',fontWeight:800,opacity:0.06,lineHeight:1,pointerEvents:'none'}}>相撲</div>
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:'0.7rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'#c8c3b8',marginBottom:'0.75rem'}}>
            Великий турнір сумо · Токіо · 2026
          </div>
          <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:800,lineHeight:1.1,marginBottom:'0.5rem'}}>
            夏場所 — Натсу Басьо 2026<br/>
            <span style={{color:'#b8860b'}}>Прогноз Юшо</span>
          </h1>
          <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginTop:'1rem',fontSize:'0.9rem',color:'#c8c3b8'}}>
            <span><b style={{color:'#f5f0e8'}}>День {currentDay}</b> завершено</span>
            <span><b style={{color:'#f5f0e8'}}>{15 - currentDay}</b> днів залишилось</span>
            <span><b style={{color:'#f5f0e8'}}>{contenders.length}</b> претендентів</span>
            <span><b style={{color:'#f5f0e8'}}>Кокуґікан, Токіо</b></span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginTop:'1rem',flexWrap:'wrap'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#1a6b5c',color:'#fff',fontFamily:'monospace',fontSize:'0.65rem',letterSpacing:'0.1em',padding:'4px 10px',borderRadius:2}}>
              ↻ дані: sumo-api.com · оновлено після дня {currentDay}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>

        <div className="anim-1" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2.5rem'}}>
          Стан турніру
        </div>
        <div className="anim-1" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:1,background:'var(--border)',border:'1px solid var(--border)',marginBottom:'2rem'}}>
          {[
            {num:leaders.length,label:'Лідери',sub:`рекорд ${maxWins}-${leaders[0]?.losses ?? '?'}`,color:'#1a6b5c'},
            {num:chasers.length,label:'Переслідувачі',sub:`рекорд ${maxWins-1}-${chasers[0]?.losses ?? '?'}`},
            {num:15-currentDay,label:'Днів залишилось',sub:'до фіналу',color:'#c0392b'},
            {num:kyujo.length,label:'Кюджо',sub:'відсутні',color:'#b8860b'},
            {num:contenders.length,label:'Претендентів',sub:'шанс > 0%'},
          ].map((s,i)=>(
            <div key={i} style={{background:'var(--card)',padding:'1.25rem 1rem',textAlign:'center'}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'2.8rem',fontWeight:800,lineHeight:1,color:s.color||'var(--ink)'}}>{s.num}</div>
              <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:'0.4rem'}}>{s.label}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',marginTop:'0.2rem'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="anim-2" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Математичний прогноз юшо
        </div>
        <div className="anim-3 desktop-table" style={{overflowX:'auto',marginBottom:'2rem'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ink)'}}>
                {['День '+currentDay,'#','Рікіші','Ранг','Рекорд','Матчі','Статус','Шанс на юшо','Δ'].map(h=>(
                  <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.6rem 0.75rem',textAlign:'left',fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contenders.map((r,i)=>{
                const rankColors=['#b8860b','#888','#a0522d']
                const bgColor=i<3?rankColors[i]:'var(--bg2)'
                const textColor=i<3?'#fff':'var(--mid)'
                const barColor=i===0?'#1a6b5c':i===1?'#1a4a7a':i===2?'#c0392b':'#888'
                const todayMatch = r.record.find(m => m.day === currentDay)
                return(
                  <tr key={r._id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'0.85rem 0.75rem',textAlign:'center',minWidth:90}}>
                      {!todayMatch ? (
                        <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>очікується</span>
                      ) : todayMatch.result === 'win' ? (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{width:16,height:16,borderRadius:'50%',background:'var(--ink)',display:'inline-block'}} />
                          <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>{todayMatch.opponent}</span>
                        </div>
                      ) : todayMatch.result === 'loss' ? (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                          <span style={{width:16,height:16,borderRadius:'50%',background:'transparent',border:'1.5px solid var(--ink)',display:'inline-block'}} />
                          <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>{todayMatch.opponent}</span>
                        </div>
                      ) : (
                        <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>—</span>
                      )}
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace'}}>{i+1}</div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <div style={{fontWeight:700,fontSize:'0.95rem'}}>{r.name}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--mid)',fontStyle:'italic',marginTop:2}}>{r.rankFull}</div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <span style={{fontFamily:'monospace',fontSize:'0.62rem',background:'var(--bg2)',padding:'2px 6px',borderRadius:2,color:'var(--mid)'}}>{r.rank}</span>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem',fontFamily:'monospace',fontWeight:500}}>{r.wins}–{r.losses}</td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:3,flexWrap:'wrap',maxWidth:200}}>
                        {r.record.map((m,idx) => (
                          <span
                            key={idx}
                            title={`День ${m.day}${m.opponent ? ': ' + m.opponent : ''}`}
                            style={{
                              width:13,height:13,borderRadius:'50%',
                              background: m.result==='win' ? 'var(--ink)' :
                                          m.result==='absent' ? '#aaa' : 'transparent',
                              border: m.result==='loss' ? '1.5px solid var(--ink)' :
                                      m.result==='absent' ? '1.5px solid #aaa' :
                                      m.result==='win' ? 'none' : '1px dashed var(--light)',
                              display:'inline-block',flexShrink:0,
                            }}
                          />
                        ))}
                        {Array.from({length: Math.max(0, 15 - r.record.length)}).map((_,idx) => (
                          <span key={`e-${idx}`} style={{width:13,height:13,borderRadius:'50%',background:'transparent',border:'1px dashed var(--light)',display:'inline-block',flexShrink:0}} />
                        ))}
                        <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginLeft:4}}>
                          {r.record.filter(m=>m.result==='win'||m.result==='loss').length}/15
                        </span>
                      </div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <span style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'3px 8px',borderRadius:2,background:r.status==='lead'?'#d4edda':r.status==='chase'?'#fff3cd':'var(--bg2)',color:r.status==='lead'?'#155724':r.status==='chase'?'#856404':'var(--mid)'}}>
                        {r.status==='lead'?'лідер':r.status==='chase'?'-1':'вибув'}
                      </span>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem',minWidth:180}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:5,background:'var(--bg2)'}}>
                          <div style={{height:'100%',width:`${Math.min(r.yushoChance,100)}%`,background:barColor}}></div>
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

        <div className="anim-3 mobile-cards" style={{marginBottom:'2rem'}}>
          {contenders.map((r,i) => <RikishiCard key={r._id} r={r} index={i} />)}
        </div>

        <div className="anim-4" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Графік ймовірностей юшо
        </div>
        <div className="anim-4" style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
          <ChartWrapper rikishi={contenders.slice(0,10)} />
        </div>

        <div className="anim-5" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Очні зустрічі — цей турнір (топ претенденти)
        </div>
        <div className="anim-5">
          <H2HTable rikishi={contenders.slice(0,8)} h2h={h2h} />
        </div>

        {kyujo.length > 0 && (
          <div className="anim-6">
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
              Відсутні — кюджо
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:1,background:'var(--border)',marginBottom:'2rem'}}>
              {kyujo.map(k=>(
                <div key={k._id} style={{background:'var(--card)',padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#c0392b',flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:'0.9rem'}}>{k.name}</div>
                    <div style={{fontSize:'0.72rem',color:'var(--mid)'}}>{k.rankFull}</div>
                  </div>
                  <span style={{fontFamily:'monospace',fontSize:'0.58rem',letterSpacing:'0.08em',background:'#fde8e8',color:'#c0392b',padding:'3px 7px',borderRadius:2}}>КЮДЖО</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="anim-6" style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
          <b style={{color:'var(--ink)'}}>Дані:</b> sumo-api.com · оновлення кожні 5 хвилин · <b style={{color:'var(--ink)'}}>Методологія:</b> поточний рекорд (60%), ранг (15%), розклад (15%), форма (10%). Не є ставкою.
        </div>

      </div>
    </main>
  )
}