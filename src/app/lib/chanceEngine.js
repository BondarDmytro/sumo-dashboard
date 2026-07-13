/* chance_engine_v1: chysta funktsiia standings na dovilnyi den - vyneseno z bashoData */
const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

// rikishiList: [{ name, rankValue, record, kyujo }], day: 1..15
// opts.todayOpponent: { [name]: oppName } - tilky dlia potochnoho dnia (retro: null -> scheduleBonus=1)
export function computeStandings(rikishiList, day, opts = {}) {
  const todayOpponent = opts.todayOpponent || {}
  const sliced = rikishiList.map(r => {
    const rec = (r.record || []).slice(0, day)
    const wins = rec.filter(m => RESULTS_WIN.includes(m.result)).length
    const losses = rec.filter(m => RESULTS_LOSS.includes(m.result)).length
    return { ...r, record: rec, wins, losses }
  })

  const withChances = sliced.map(r => {
    if (r.kyujo) return { ...r, yushoChance: 0 }
    const played = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).length
    const remaining = 15 - played
    const maxWinsSelf = r.wins + remaining

    if (day >= 15) {
      const maxW = Math.max(...sliced.filter(x => !x.kyujo).map(x => x.wins))
      const leaders = sliced.filter(x => x.wins === maxW && !x.kyujo)
      const hasPlayoff = leaders.length > 1
      if (maxWinsSelf < maxW) return { ...r, yushoChance: 0 }
      const base = r.wins === maxW ? (hasPlayoff ? 90 / leaders.length : 90)
        : r.wins >= maxW - 1 ? 30 : r.wins >= maxW - 2 ? 5 : 0
      const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
      const recent = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).slice(-5)
      const rw = recent.filter(m => RESULTS_WIN.includes(m.result)).length
      const formBonus = recent.length > 0 ? 0.9 + (rw / recent.length) * 0.2 : 1.0
      return { ...r, yushoChance: Math.round(base * rankBonus * formBonus * 10) / 10 }
    }

    if (r.losses >= 5 || maxWinsSelf < 11) return { ...r, yushoChance: 0 }
    let base = r.losses === 0 ? 85 : r.losses === 1 ? 55 : r.losses === 2 ? 25 : r.losses === 3 ? 8 : 2
    if (maxWinsSelf < 13) base *= 0.6
    const rankBonus = r.rankValue <= 103 ? 1.3 : r.rankValue <= 201 ? 1.15 : r.rankValue <= 401 ? 1.05 : 1.0
    const recent = r.record.filter(m => RESULTS_PLAYED.includes(m.result)).slice(-5)
    const rw = recent.filter(m => RESULTS_WIN.includes(m.result)).length
    const formBonus = recent.length > 0 ? 0.9 + (rw / recent.length) * 0.2 : 1.0
    const oppName = todayOpponent[r.name]
    const opp = oppName ? sliced.find(x => x.name === oppName) : null
    const oppRankValue = opp?.rankValue || null
    const scheduleBonus = oppRankValue == null ? 1.0 : oppRankValue <= 200 ? 0.85 : oppRankValue <= 400 ? 1.0 : 1.15
    return { ...r, yushoChance: Math.round(base * rankBonus * formBonus * scheduleBonus * 10) / 10 }
  })

  const total = withChances.reduce((s, r) => s + r.yushoChance, 0)
  const normalized = withChances.map(r => ({ ...r, yushoChance: total > 0 ? Math.round(r.yushoChance / total * 1000) / 10 : 0 }))
  normalized.sort((a, b) => b.yushoChance - a.yushoChance || b.wins - a.wins)
  const maxWins = Math.max(...normalized.filter(r => !r.kyujo).map(r => r.wins))
  normalized.forEach(r => {
    if (r.kyujo) { r.status = 'kyujo'; return }
    r.status = r.wins === maxWins ? 'lead' : r.wins === maxWins - 1 ? 'chase' : 'out'
  })
  return { rikishi: normalized, maxWins,
    leaders: normalized.filter(r => r.wins === maxWins && !r.kyujo),
    chasers: normalized.filter(r => r.wins === maxWins - 1 && !r.kyujo) }
}
