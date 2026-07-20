/* bashoData_v1: vyneseno z page.js dlia division-parametryzatsii */
import { applyBashoRules, prevBashoId } from './bashoRules'
import { computeStandings } from './chanceEngine' /* server_engine_v1 */
import { currentBashoId, bashoInfo, bashoStatus } from './bashoCalendar'
const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

export async function getBashoData(division = 'Makuuchi') {
  const bashoStart = Date.UTC(2026, 6, 12) /*nagoya_switch_v1*/
  const nowJst = Date.now() + 9 * 3600 * 1000  /* jst_day_v1: den basho zhyve za yaponskym chasom */
  const diffDays = Math.floor((nowJst - bashoStart) / (1000 * 60 * 60 * 24))
  const currentDay = Math.min(Math.max(diffDays + 1, 1), 15)

  const [banzukeRes, torikumiRes, bashoInfoRes, prevBanzukeRes] = await Promise.all([
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}/banzuke/${division}`, { next: { revalidate: 60 } }),
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}/torikumi/${division}/${currentDay}`, { next: { revalidate: 60 } }),
    fetch(`https://sumo-api.com/api/basho/${currentBashoId()}`, { next: { revalidate: 60 } }),
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
    const playedCount = record.filter(m => RESULTS_PLAYED.includes(m.result)).length
    const kyujo = absentCount > 5 || (absentCount > 0 && hasLateAbsent) || (absentCount > 0 && playedCount === 0)  /* kyujo_zensen_v1 */
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
  /* server_engine_v1: shansy rakhuie chanceEngine - odne dzherelo pravdy z tablytseiu/chartom/retro */
  const engineOut = computeStandings(processedEd, currentDay, { todayOpponent })
  const normalized = engineOut.rikishi.map(r => ({ ...r, chanceDelta: 0 }))
  /* eliminated_day_v1: pershyi den, koly wins_d + (15-d) < maxWins_d */
  {
    const cum = new Map(normalized.map(r => [r.name, 0]))
    const elim = new Map()
    for (let d = 1; d <= currentDay; d++) {
      let dayMax = 0
      normalized.forEach(r => {
        const m = r.record[d - 1]
        if (m && RESULTS_WIN.includes(m.result)) cum.set(r.name, cum.get(r.name) + 1)
        if (!r.kyujo && cum.get(r.name) > dayMax) dayMax = cum.get(r.name)
      })
      normalized.forEach(r => {
        if (r.kyujo || elim.has(r.name)) return
        if (cum.get(r.name) + (15 - d) < dayMax) elim.set(r.name, d)
      })
    }
    normalized.forEach(r => { if (elim.has(r.name)) r.eliminatedDay = elim.get(r.name) })
  }
  const maxWins = engineOut.maxWins
  const leaders = engineOut.leaders
  const chasers = engineOut.chasers

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

