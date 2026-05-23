import H2HTable from './components/H2HTable'
import ChartWrapper from './components/ChartWrapper'
import RikishiCard from './components/RikishiCard'
import FlagName from './components/FlagName'
import TournamentHeader from './components/TournamentHeader'
import TournamentTable from './components/TournamentTable'
import TournamentStatus from './components/TournamentStatus'
import CompactGrid from './components/CompactGrid'
import TournamentFooter from './components/TournamentFooter'
import TorikumiView from './components/TorikumiView'
import TournamentTabsWrapper from './components/TournamentTabsWrapper'

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



export default async function Home() {
  const { rikishi, leaders, chasers, currentDay, maxWins, h2h } = await getBashoData()
  const contenders = rikishi.filter(r => r.yushoChance > 0)
    .sort((a,b) => b.wins - a.wins || b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
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

       <TournamentStatus
          leaders={leaders}
          chasers={chasers}
          currentDay={currentDay}
          maxWins={maxWins}
          kyujoCount={kyujo.length}
          contendersCount={contenders.length}
        />

       <TournamentTabsWrapper
          contenders={contenders}
          currentDay={currentDay}
          h2h={h2h}
        />
        

        <CompactGrid items={others} isKyujo={false} currentDay={currentDay} />
        <CompactGrid items={kyujo} isKyujo={true} currentDay={currentDay} />

        <div className="anim-3 mobile-cards" style={{marginBottom:'2rem'}}>
          {contenders.map((r,i) => <RikishiCard key={r._id} r={r} index={i} />)}
        </div>

        <TournamentFooter contenders={contenders} h2h={h2h} />

      </div>
    </main>
  )
}