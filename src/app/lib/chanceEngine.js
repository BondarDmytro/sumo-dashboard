/* chance_engine_v2: logistychna model (vahy z train-chance-model.mjs, 36 basho 2020-2026)
   Holdout day10: avgRank 1.63 vs 2.38 heur, top1 50% vs 25%. Fallback: stara evrystyka.
   Formula ta zh sho u features() train-skrypta - MINIATY SYNKHRONNO! */
import weights from './chanceWeights.json'
import h2hSnap from './h2hSnapshot.json' /* chance_engine_v22 */
import rikishiMeta from './rikishiMeta.json'

const metaById = new Map(rikishiMeta.map(m => [m.id, m]))
function ageNow(birthDate) {
  if (!birthDate) return null
  const now = new Date()
  const b = new Date(birthDate)
  return (now - b) / (365.25 * 24 * 3600 * 1000)
}
/* live-obmezhennia: kyujoHist=0 (istoriia mynulykh basho ne v konteksti) - fichi dehraduiut miako */
function extLiveFeatures(r, leaders) {
  let h2hNet = 0
  const myId = Number(r._id ?? r.rikishiID ?? r.id)
  for (const L of leaders) {
    const lId = Number(L._id ?? L.rikishiID ?? L.id)
    if (lId === myId) continue
    const w = h2hSnap[`${myId}|${lId}`] || 0
    const l = h2hSnap[`${lId}|${myId}`] || 0
    if (w + l > 0) h2hNet += (w - l) / (w + l)
  }
  const h2hLeaders = leaders.length ? h2hNet / leaders.length : 0
  const m = metaById.get(myId) || null
  const age = m ? ageNow(m.birthDate) : null
  const ageZ = age == null ? 0 : (age - 28) / 5
  return [h2hLeaders, ageZ, 0 /* kyujoHist */]
}
function pickPhase(day) {
  for (const p of (weights.phases || [])) if (day <= p.maxDay) return p
  return weights.phases ? weights.phases[weights.phases.length - 1] : null
}

function modelFeatures(r, wins, losses, day, maxWinsCtx) {
  const remaining = 15 - wins - losses
  const maxSelf = wins + remaining
  const behind = maxWinsCtx - wins
  const margin = maxSelf - maxWinsCtx
  const dayFrac = day / 15
  const rank = r.rankValue || 999
  const rankTop = rank <= 103 ? 1 : 0
  const rankMid = rank > 103 && rank <= 401 ? 1 : 0
  const rec5 = r.record.slice(-5)
  const rw = rec5.filter(m => RESULTS_WIN.includes(m.result)).length
  const form = rec5.length ? rw / rec5.length : 0.5
  return [1, -losses, -behind, -behind * dayFrac, margin, rankTop, rankMid, form, wins * dayFrac]
}

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

  /* chance_engine_v2: model path */
  const phase = pickPhase(day)  /* chance_engine_v22 */
  if (phase?.w?.length && day < 15) {
    const maxWinsCtx = Math.max(...sliced.filter(x => !x.kyujo).map(x => x.wins), 0)
    const scores = sliced.map(r => {
      if (r.kyujo) return -1e9
      const remaining = 15 - r.wins - r.losses
      if (r.losses >= 8 || r.wins + remaining < maxWinsCtx) return -1e9  // математично вибули
      let fv = modelFeatures(r, r.wins, r.losses, day, maxWinsCtx)
      if (phase.w.length > fv.length) {
        const leadersNow = sliced.filter(x => !x.kyujo && x.wins === maxWinsCtx)
        fv = [...fv, ...extLiveFeatures(r, leadersNow)]
      }
      return fv.reduce((s, x, i) => s + x * phase.w[i], 0)
    })
    const mx = Math.max(...scores)
    const exps = scores.map(s => s <= -1e8 ? 0 : Math.exp(s - mx))
    const Z = exps.reduce((a, b) => a + b, 0) || 1
    const normalized = sliced.map((r, i) => { const p = exps[i] / Z; return { ...r, yushoChance: p > 0 ? Math.max(Math.round(p * 1000) / 10, 0.1) : 0 } })  /* min 0.1% dlia zhyvykh */
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
