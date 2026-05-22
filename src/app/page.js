import H2HTable from './components/H2HTable'
import ChartWrapper from './components/ChartWrapper'
import RikishiCard from './components/RikishiCard'
import FlagName from './components/FlagName'
import TournamentHeader from './components/TournamentHeader'

export const revalidate = 300

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

async function getBashoData() {
  const res = await fetch('https://sumo-api.com/api/basho/202605/banzuke/Makuuchi', {
    next: { revalidate: 300 }
  })
  const banzuke = await res.json()
  const all = [...(banzuke.east || []), ...(banzuke.west || [])]

  const bashoStart = new Date('2026-05-10')
  const today = new Date()
  const diffDays = Math.floor((today - bashoStart) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(diffDays + 1, 1), 15)

  const processed = all.map(r => {
    const record = r.record || []
    const wins = record.filter(m => RESULTS_WIN.includes(m.result)).length
    const losses = record.filter(m => RESULTS_LOSS.includes(m.result)).length
    const absentCount = record.filter(m => m.result === 'absent').length
    const hasLateAbsent = record.some((m, i) => m.result === 'absent' && i >= 5)
    const kyujo = absentCount > 5 || (absentCount > 0 && hasLateAbsent)
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
        kimarite: m.kimarite,
      }))
    }
  })

  const withChances = processed.map(r => {
    if (r.kyujo) return { ...r, yushoChance: 0, chanceDelta: 0 }
    const played = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).length
    const remaining = 15 - played
    const maxWins = r.wins + remaining

    if (currentDay >= 15) {
      const maxW = Math.max(...processed.filter(x => !x.kyujo).map(x => x.wins))
      const leaders = processed.filter(x => x.wins === maxW && !x.kyujo)
      const hasPlayoff = leaders.length > 1
      // Якщо плей-оф — ділимо шанси порівну між лідерами з бонусом за ранг
      const base = r.wins === maxW
        ? (hasPlayoff ? 90 / leaders.length : 90)
        : r.wins >= maxW - 1 ? 30 : r.wins >= maxW - 2 ? 5 : 0
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
      if (RESULTS_PLAYED.includes(m.result)) {
        const exists = h2h.find(x =>
          (x.fighter1 === r.name && x.fighter2 === m.opponent) ||
          (x.fighter1 === m.opponent && x.fighter2 === r.name)
        )
        if (!exists && m.opponent) {
          h2h.push({
            fighter1: r.name,
            fighter2: m.opponent,
            winner: RESULTS_WIN.includes(m.result) ? r.name : m.opponent,
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

function MatchDots({ record, currentDay }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:2,flexWrap:'wrap',maxWidth:200}}>
      {record.map((m, idx) => {
        const isWin = RESULTS_WIN.includes(m.result)
        const isLoss = RESULTS_LOSS.includes(m.result)
        const isFusen = m.kimarite === 'fusen'
        const isToday = m.day === currentDay
        return (
          <span key={idx}
            title={`День ${m.day}${m.opponent ? ': ' + m.opponent : ''}${isFusen ? ' (fusen)' : ''}`}
            style={{
              width:13, height:13, borderRadius:'50%',
              background: isWin ? 'var(--ink)' : m.result==='absent' ? '#aaa' : 'transparent',
              border: isLoss ? '1.5px solid var(--ink)' :
                      m.result==='absent' ? '1.5px solid #aaa' :
                      isWin ? 'none' : '1px dashed var(--light)',
              display:'inline-block', flexShrink:0,
              opacity: isFusen ? 0.5 : 1,
              outline: isToday ? '2px solid #b8860b' : 'none',
              outlineOffset: 1,
            }}
          />
        )
      })}
      {Array.from({length: Math.max(0, 15 - record.length)}).map((_, idx) => (
        <span key={`e-${idx}`} style={{width:13,height:13,borderRadius:'50%',background:'transparent',border:'1px dashed var(--light)',display:'inline-block',flexShrink:0}} />
      ))}
      <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginLeft:4}}>
        {record.filter(m => RESULTS_PLAYED.includes(m.result)).length}/15
      </span>
    </div>
  )
}

function TodayCell({ record, currentDay }) {
  const todayMatch = record.find(m => m.day === currentDay)
  const todayWin = todayMatch && RESULTS_WIN.includes(todayMatch.result)
  const todayLoss = todayMatch && RESULTS_LOSS.includes(todayMatch.result)
  if (!todayMatch || !todayMatch.result) {
    return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>очікується</span>
  }
  if (todayWin) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'var(--ink)',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>
        {todayMatch.kimarite==='fusen'?'✦ ':''}{todayMatch.opponent}
      </span>
    </div>
  )
  if (todayLoss) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'transparent',border:'1.5px solid var(--ink)',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>{todayMatch.opponent}</span>
    </div>
  )
  return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>—</span>
}

function CompactGrid({ items, title, isKyujo, currentDay }) {
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
              <span style={{background:'#fde8e8',color:'#c0392b',padding:'1px 5px',borderRadius:2,fontSize:'0.55rem',fontFamily:'monospace',flexShrink:0}}>КЮД</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Групуємо по перемогах
  const byWins = {}
  items.forEach(r => {
    if (!byWins[r.wins]) byWins[r.wins] = []
    byWins[r.wins].push(r)
  })
  const winGroups = Object.keys(byWins).map(Number).sort((a,b) => b - a)

  // Розбиваємо на 3 колонки — рівномірно по блоках
  // Групи як об'єкти {wins, items}
  const groups = winGroups.map(wins => ({
    wins,
    items: byWins[wins].sort((a,b) => (a.rankValue||999) - (b.rankValue||999))
  }))

  // Розподіляємо групи по 3 колонках — не розбиваючи групи
  const totalRikishi = items.length
  const perCol = Math.ceil(totalRikishi / 3)


 const cols = [[], [], []]
  const numCols = 3
  // Рахуємо ідеальну кількість рікіші на колонку
  const target = Math.ceil(totalRikishi / numCols)
  let colIdx = 0
  let colCount = 0

  groups.forEach(group => {
    // Переходимо в наступну колонку коли досягли цілі
    // але не розбиваємо групу — переходимо тільки перед початком нової групи
    if (colIdx < numCols - 1 && colCount >= target * (colIdx + 1)) {
      colIdx++
    }
    cols[colIdx].push(group)
    colCount += group.items.length
  })

  const renderItem = r => {
    const todayMatch = r.record?.find(m => m.day === currentDay)
    const todayWin = todayMatch && RESULTS_WIN.includes(todayMatch.result)
    const todayLoss = todayMatch && RESULTS_LOSS.includes(todayMatch.result)
    return (
      <div key={r._id} style={{display:'flex',alignItems:'center',gap:6,padding:'0.4rem 0.5rem',borderBottom:'1px solid var(--border)'}}>
        <div style={{flexShrink:0,width:11,height:11,borderRadius:'50%',
          background: todayWin ? 'var(--ink)' : 'transparent',
          border: todayLoss ? '1.5px solid var(--ink)' : todayWin ? 'none' : '1px dashed var(--light)',
        }} />
        <div style={{minWidth:0,flex:1}}>
          <div style={{display:'flex',alignItems:'baseline',gap:4}}>
            <span style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',flexShrink:0}}>{r.rank}</span>
            <FlagName id={r._id} name={r.name} size='0.75rem' />
          </div>
          <div style={{display:'flex',gap:1.5,flexWrap:'nowrap',marginTop:2}}>
            {r.record?.slice(0, currentDay).map((m, idx) => {
              const isWin = RESULTS_WIN.includes(m.result)
              const isLoss = RESULTS_LOSS.includes(m.result)
              return (
                <span key={idx} title={`День ${m.day}${m.opponent?': '+m.opponent:''}`} style={{
                  width:8,height:8,borderRadius:'50%',
                  background: isWin ? 'var(--ink)' : m.result==='absent' ? '#aaa' : 'transparent',
                  border: isLoss ? '1px solid var(--ink)' : m.result==='absent' ? '1px solid #aaa' : isWin ? 'none' : '1px dashed var(--light)',
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

  const winsLabel = w => w === 1 ? '1 перемога' : w >= 2 && w <= 4 ? `${w} перемоги` : `${w} перемог`

  const renderCol = (colGroups) => (
    <div style={{flex:1,minWidth:0,background:'var(--card)',border:'1px solid var(--border)'}}>
      {colGroups.map(({ wins, items: groupItems }) => (
        <div key={wins}>
          <div style={{
            fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,
            color:'var(--ink)',padding:'0.3rem 0.5rem',
            background:'var(--bg2)',letterSpacing:'0.05em',
            borderLeft:'3px solid #b8860b',
            borderBottom:'1px solid var(--border)',
          }}>
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

  return (
    <div style={{marginBottom:'1.5rem'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--light)',padding:'0.5rem 0.75rem',background:'var(--bg2)',borderTop:'2px solid var(--border)',marginBottom:4}}>
        {title}
      </div>
      <div style={{display:'flex',gap:4,alignItems:'stretch'}}>
        {cols.map((col, i) => (
          <div key={i} style={{flex:1,minWidth:0}}>
            {renderCol(col)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function Home() {
  const { rikishi, leaders, chasers, currentDay, maxWins, h2h } = await getBashoData()
  const contenders = rikishi.filter(r => r.yushoChance > 0)
    .sort((a,b) => b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
  const hasPlayoff = currentDay >= 15 && leaders.length > 1
  const others = rikishi.filter(r => r.yushoChance === 0 && !r.kyujo)
  const kyujo = rikishi.filter(r => r.kyujo)

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>

      <TournamentHeader
        currentDay={currentDay}
        daysLeft={15 - currentDay}
        contendersCount={contenders.length}
        hasPlayoff={hasPlayoff}
      />

      <div style={{maxWidth:1100,margin:'0 auto',padding:'1.25rem 1.5rem 4rem'}}>

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
          Турнірна таблиця — всі рікіші макуучі
        </div>
        <div className="anim-3 desktop-table" style={{overflowX:'auto',marginBottom:'1rem'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ink)'}}>
                {[`День ${currentDay}`,'#','Рікіші','Ранг','Рекорд','Матчі','Статус','Шанс на юшо','Δ'].map(h=>(
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
                return(
                  <tr key={r._id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'0.85rem 0.75rem',textAlign:'center',minWidth:90}}>
                      <TodayCell record={r.record} currentDay={currentDay} />
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
                        {r.status==='lead'?'лідер':r.status==='chase'?'-1':`${r.wins}–${r.losses}`}
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

        <CompactGrid items={others} title="Вибули з гонки юшо" isKyujo={false} currentDay={currentDay} />
        <CompactGrid items={kyujo} title="Кюджо — відсутні" isKyujo={true} currentDay={currentDay} />

        <div className="anim-3 mobile-cards" style={{marginBottom:'2rem'}}>
          {contenders.map((r,i) => <RikishiCard key={r._id} r={r} index={i} />)}
        </div>

        <div className="anim-4" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
          Графік ймовірностей юшо
        </div>
        <div className="anim-4" style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
          <ChartWrapper rikishi={contenders.slice(0,10)} />
        </div>


        <div className="anim-5" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
          Очні зустрічі — цей турнір (топ претенденти)
        </div>
        <div className="anim-5">
          <H2HTable rikishi={contenders.slice(0,8)} h2h={h2h} />
        </div>

        <div className="anim-6" style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
          <b style={{color:'var(--ink)'}}>Дані:</b> sumo-api.com · оновлення кожні 5 хвилин · <b style={{color:'var(--ink)'}}>Методологія:</b> поточний рекорд (60%), ранг (15%), розклад (15%), форма (10%). Fusen (✦) — перемога через знімання суперника. Не є ставкою.
        </div>

      </div>
    </main>
  )
}