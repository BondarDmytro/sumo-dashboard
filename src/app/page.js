import TournamentHeader from './components/TournamentHeader'
import TournamentStatus from './components/TournamentStatus'
import CompactGrid from './components/CompactGrid'
import TournamentFooter from './components/TournamentFooter'
import TournamentTabsWrapper from './components/TournamentTabsWrapper'
import RikishiCard from './components/RikishiCard'
import YushoWinner from './components/YushoWinner'

export const revalidate = 60

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

async function getBashoData() {
  const bashoStart = new Date('2026-05-10')
  const today = new Date()
  const diffDays = Math.floor((today - bashoStart) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(diffDays + 1, 1), 15)

  const [banzukeRes, torikumiRes, bashoInfoRes] = await Promise.all([
    fetch('https://sumo-api.com/api/basho/202605/banzuke/Makuuchi', { next: { revalidate: 60 } }),
    fetch(`https://sumo-api.com/api/basho/202605/torikumi/Makuuchi/${currentDay}`, { next: { revalidate: 60 } }),
    fetch('https://sumo-api.com/api/basho/202605', { next: { revalidate: 60 } }),
  ])

  const banzuke = await banzukeRes.json()
  const torikumiData = await torikumiRes.json()
  const bashoInfo = await bashoInfoRes.json()
  const specialPrizes = bashoInfo.specialPrizes || []
  const yushoData = bashoInfo.yusho || []
  const todayMatches = torikumiData.torikumi || []

  const todayOpponent = {}
  todayMatches.forEach(m => {
    todayOpponent[m.eastShikona] = m.westShikona
    todayOpponent[m.westShikona] = m.eastShikona
  })

  const all = [...(banzuke.east || []), ...(banzuke.west || [])]

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
      status: 'out',
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
      const myMax = r.wins + remaining
      if (myMax < maxW) return { ...r, yushoChance: 0, chanceDelta: 0 }
      const base = r.wins === maxW
        ? (hasPlayoff ? 90 / leaders.length : 90)
        : r.wins >= maxW - 1 ? 30 : r.wins >= maxW - 2 ? 5 : 0
      const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
      const recentMatches = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).slice(-5)
      const recentWins = recentMatches.filter(m => RESULTS_WIN.includes(m.result)).length
      const formBonus = recentMatches.length > 0 ? 0.9 + (recentWins / recentMatches.length) * 0.2 : 1.0
      const todayOppName = todayOpponent[r.name]
      const todayOppRikishi = todayOppName ? processed.find(x => x.name === todayOppName) : null
      const oppRankValue = todayOppRikishi?.rankValue || 500
      const scheduleBonus = oppRankValue <= 200 ? 0.85 : oppRankValue <= 400 ? 1.0 : 1.15
      return { ...r, yushoChance: Math.round(base * rankBonus * formBonus * scheduleBonus * 10) / 10, chanceDelta: 0 }
    }

    if (r.losses >= 5 || maxWins < 11) return { ...r, yushoChance: 0, chanceDelta: 0 }
    let base = r.losses === 0 ? 85 : r.losses === 1 ? 55 : r.losses === 2 ? 25 : r.losses === 3 ? 8 : 2
    if (maxWins < 13) base *= 0.6
    const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
    const recentMatches = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).slice(-5)
    const recentWins = recentMatches.filter(m => RESULTS_WIN.includes(m.result)).length
    const formBonus = recentMatches.length > 0 ? 0.9 + (recentWins / recentMatches.length) * 0.2 : 1.0
    const todayOppName = todayOpponent[r.name]
    const todayOppRikishi = todayOppName ? processed.find(x => x.name === todayOppName) : null
    const oppRankValue = todayOppRikishi?.rankValue || 500
    const scheduleBonus = oppRankValue <= 200 ? 0.85 : oppRankValue <= 400 ? 1.0 : 1.15
    const finalChance = base * rankBonus * formBonus * scheduleBonus
    return { ...r, yushoChance: Math.round(finalChance * 10) / 10, chanceDelta: 0 }
  })

  const total = withChances.reduce((s, r) => s + r.yushoChance, 0)
  const normalized = withChances.map(r => ({
    ...r,
    yushoChance: total > 0 ? Math.round(r.yushoChance / total * 1000) / 10 : 0
  }))

  normalized.sort((a, b) => b.yushoChance - a.yushoChance)

  const maxWins = Math.max(...normalized.filter(r => !r.kyujo).map(r => r.wins))

  normalized.forEach(r => {
    if (r.kyujo) { r.status = 'kyujo'; return }
    if (r.wins === maxWins) r.status = 'lead'
    else if (r.wins === maxWins - 1) r.status = 'chase'
    else r.status = 'out'
  })

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

  const allPlayed = normalized.filter(r => !r.kyujo).every(r =>
    r.record.filter(m => RESULTS_PLAYED.includes(m.result)).length >= 15
  )

  const topWinsCheck = Math.max(...normalized.filter(r => !r.kyujo).map(r => r.wins))
  const tiedCheck = normalized.filter(r => r.wins === topWinsCheck && !r.kyujo)
  const needsPlayoff = tiedCheck.length > 1

  let playoffWinner = null
  let playoff = null

  if (allPlayed && needsPlayoff) {
    try {
      const playoffRes = await fetch(
        `https://sumo-api.com/api/rikishi/${tiedCheck[0]._id}/matches?limit=20`,
        { next: { revalidate: 60 } }
      )
      const playoffData = await playoffRes.json()
      const playoffMatch = playoffData.records?.find(m =>
        m.bashoId === '202605' && m.day >= 16
      )
      if (playoffMatch) {
        playoffWinner = normalized.find(r => String(r._id) === String(playoffMatch.winnerId)) || null
        const loserName = playoffMatch.winnerId === playoffMatch.eastId
          ? playoffMatch.westShikona
          : playoffMatch.eastShikona
        playoff = { loser: loserName, kimarite: playoffMatch.kimarite }
      }
    } catch(e) {}
  }

  const officialWinner = yushoData.find(y => y.type === 'Makuuchi')
  const isFinished = currentDay >= 15 && allPlayed && (
    officialWinner || playoffWinner || !needsPlayoff
  )

  let winner = null
  if (isFinished) {
    if (playoffWinner) {
      winner = playoffWinner
    } else if (officialWinner) {
      winner = normalized.find(r => String(r._id) === String(officialWinner.rikishiId)) || null
      if (winner && needsPlayoff) {
        const playoffMatch = winner.record.find(m => m.day >= 16 && RESULTS_WIN.includes(m.result))
        if (playoffMatch) {
          playoff = { loser: playoffMatch.opponent, kimarite: playoffMatch.kimarite }
        }
      }
    } else {
      winner = tiedCheck[0] || null
    }
  }

  const showPlayoffBanner = allPlayed && needsPlayoff && !isFinished

  return { rikishi: normalized, leaders, chasers, currentDay, maxWins, h2h, winner, playoff, isFinished, showPlayoffBanner, specialPrizes, yushoData }
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
  const { rikishi, leaders, chasers, currentDay, maxWins, h2h, winner, playoff, isFinished, showPlayoffBanner, specialPrizes, yushoData } = await getBashoData()
  const contenders = rikishi.filter(r => r.yushoChance > 0)
    .sort((a,b) => b.wins - a.wins || b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
  const hasPlayoff = currentDay >= 15 && leaders.length > 1 && !isFinished
  const others = rikishi.filter(r => r.yushoChance === 0 && !r.kyujo)
  const kyujo = rikishi.filter(r => r.kyujo)

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <TournamentHeader
        currentDay={currentDay}
        daysLeft={15 - currentDay}
        contendersCount={contenders.length}
        hasPlayoff={hasPlayoff}
        isFinished={isFinished}
      />

      {showPlayoffBanner && (
        <div style={{maxWidth:1100,margin:'0 auto',padding:'1.25rem 1.5rem 0'}}>
          <div style={{background:'var(--bg2)',border:'2px solid #b8860b',borderRadius:4,padding:'1.5rem 2rem',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',right:'1rem',top:'50%',transform:'translateY(-50%)',fontSize:'5rem',opacity:0.08,pointerEvents:'none'}}>⚡</div>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#b8860b',marginBottom:'0.75rem'}}>
              Плей-оф — визначення переможця юшо
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap'}}>
              {leaders.map((r, i) => (
                <div key={r._id} style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                  {i > 0 && (
                    <span style={{fontFamily:'Georgia,serif',fontSize:'1.8rem',color:'#b8860b',fontWeight:800}}>vs</span>
                  )}
                  <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'0.75rem 1.25rem',borderRadius:2,textAlign:'center',minWidth:120}}>
                    <div style={{fontWeight:800,fontSize:'1rem'}}>{r.name}</div>
                    <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:2}}>{r.rankFull}</div>
                    <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,color:'#b8860b',marginTop:6}}>{r.wins}–{r.losses}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:'0.75rem',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>
              Очікується додатковий бій для визначення переможця
            </div>
          </div>
        </div>
      )}

      {isFinished && winner && (
        <div style={{maxWidth:1100,margin:'0 auto',padding:'1.25rem 1.5rem 0'}}>
          <YushoWinner winner={winner} playoff={playoff} bashoLabel="Натсу Басьо 2026" bashoLabelEn="Natsu Basho 2026" />
        </div>
      )}

      <div style={{maxWidth:1100,margin:'0 auto',padding:'1.25rem 1.5rem 4rem'}}>
        <TournamentStatus
          leaders={leaders}
          chasers={chasers}
          currentDay={currentDay}
          maxWins={maxWins}
          kyujoCount={kyujo.length}
          contendersCount={contenders.length}
          isFinished={isFinished || showPlayoffBanner}
        />
        <TournamentTabsWrapper
          contenders={contenders}
          currentDay={currentDay}
          allRikishi={rikishi}
          isFinished={isFinished}
          specialPrizes={specialPrizes}
          yushoData={yushoData}
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