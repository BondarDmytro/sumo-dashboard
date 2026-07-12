/* bashoData_v1: vyneseno z page.js dlia division-parametryzatsii */
import { applyBashoRules, prevBashoId } from './bashoRules'
import { currentBashoId, bashoInfo, bashoStatus } from './bashoCalendar'
const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

export async function getBashoData(division = 'Makuuchi') {
  const bashoStart = new Date('2026-07-12') /*nagoya_switch_v1*/
  const today = new Date()
  const diffDays = Math.floor((today - bashoStart) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(diffDays + 1, 1), 15)

  const [banzukeRes, torikumiRes, bashoInfoRes, prevBanzukeRes] = await Promise.all([
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}/banzuke/${division}`, { next: { revalidate: 300 } }),
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}/torikumi/${division}/${currentDay}`, { next: { revalidate: 300 } }),
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}`, { next: { revalidate: 300 } }),
    fetch(`https://sumo-api.com/api/basho/${prevBashoId(currentBashoId())}/banzuke/${division}`, { next: { revalidate: 3600 } }),
  ])

  const banzuke = await banzukeRes.json()
  const torikumiData = await torikumiRes.json()
  const bashoInfo = await bashoInfoRes.json()
  const prevBanzuke = await prevBanzukeRes.json().catch(() => null)
  let prevYusho = null  /* prev_champion_v1 */
  if (bashoStatus(currentBashoId()) === 'upcoming') {
    try {
      const pInfoRes = await fetch(`https://sumo-api.com/api/basho/${prevBashoId(currentBashoId())}`, { next: { revalidate: 86400 } })
      const pInfo = await pInfoRes.json()
      const y = (pInfo.yusho || []).find(v => v.division === division || v.type === division) || (pInfo.yusho || [])[0] || null
      if (y) prevYusho = { id: y.rikishiId || y.rikishiID, name: y.shikonaEn, nameJp: y.shikonaJp || null }  /* champ_lookup_v1: Jp дошиється нижче з normalized */
    } catch (e) {}
  }
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
      nameJp: r.shikonaJp,  /* kanji_names_v1 */
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

  const processedEd = applyBashoRules(processed, prevBanzuke) /* basho_rules_v1 */
  const withChances = processedEd.map(r => {
    if (r.kyujo) return { ...r, yushoChance: 0, chanceDelta: 0 }
    const played = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).length
    const remaining = 15 - played
    const maxWins = r.wins + remaining

    if (currentDay >= 15) {
      const maxW = Math.max(...processedEd.filter(x => !x.kyujo).map(x => x.wins))
      const leaders = processedEd.filter(x => x.wins === maxW && !x.kyujo)
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
        { next: { revalidate: 300 } }
      )
      const playoffData = await playoffRes.json()
      const playoffMatch = playoffData.records?.find(m =>
        m.bashoId === currentBashoId() && m.day >= 16
      )
      if (playoffMatch) {
        playoffWinner = normalized.find(r => String(r._id) === String(playoffMatch.winnerId)) || null
        const loserId = playoffMatch.winnerId === playoffMatch.eastId ? playoffMatch.westId : playoffMatch.eastId  /* ja_loser_v1 */
        const loserObj = normalized.find(r => String(r._id) === String(loserId))
        const loserName = playoffMatch.winnerId === playoffMatch.eastId
          ? playoffMatch.westShikona
          : playoffMatch.eastShikona
        playoff = { loser: loserName, loserJp: loserObj?.nameJp || null, kimarite: playoffMatch.kimarite }
      }
    } catch(e) {}
  }

  const officialWinner = yushoData.find(y => y.type === division)  /* bashoData_v1 */
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

  if (prevYusho && !prevYusho.nameJp) {  /* champ_lookup_v2 */
    const c = normalized.find(r => String(r._id) === String(prevYusho.id))
    if (c?.nameJp) prevYusho.nameJp = c.nameJp
  }
  return { prevYusho, rikishi: normalized, leaders, chasers, currentDay, maxWins, h2h, winner, playoff, isFinished, showPlayoffBanner, specialPrizes, yushoData }
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

