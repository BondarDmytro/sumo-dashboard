/* build-historical.mjs (historical_v1): odnorazovyi prokhid 195911..201911.
   Vykhody: historicalRikishi.json (porohovani), bashoYusho.json, yokozunaData.json. */
import fs from 'node:fs'

const BASE = '195911'
const END = '201911'
const WIN = ['win', 'fusen win']
const LOSS = ['loss', 'fusen loss']
/* historical_v2_elo_history: ta sama mekhanika, shcho build-elo (ovr_scale_v2) */
const SEED = { Yokozuna: 1750, Ozeki: 1650, Sekiwake: 1580, Komusubi: 1550, Maegashira: 1500 }
const K_FAST = 32, K_SLOW = 20, K_BOUT_THRESHOLD = 60
const OVR = elo => Math.round(Math.min(99, Math.max(1, (elo - 850) / 12)))
function seedFor(rank) {
  for (const k of Object.keys(SEED)) if ((rank || '').startsWith(k)) return SEED[k]
  return 1500
}

function bashoListRange(from, to) {
  const out = []
  let y = parseInt(from.slice(0, 4)), m = parseInt(from.slice(4))
  const ey = parseInt(to.slice(0, 4)), em = parseInt(to.slice(4))
  while (y < ey || (y === ey && m <= em)) {
    out.push(String(y) + String(m).padStart(2, '0'))
    m += 2
    if (m > 11) { m = 1; y++ }
  }
  return out
}

async function fetchJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch {}
    await new Promise(res => setTimeout(res, 1000 * (i + 1)))
  }
  return null
}

const bashos = bashoListRange(BASE, END)
console.log('Historical range: ' + bashos[0] + ' .. ' + bashos[bashos.length - 1] + ' (' + bashos.length + ')')

const R = {}
const bashoYusho = {}

function ensure(id, name) {
  if (!R[id]) R[id] = { name, first: null, last: null, mkBasho: 0, wins: 0, losses: 0, yusho: 0, kinboshi: 0, hiRankValue: 9999, hiRank: '', yokozunaFirst: null, yokozunaLast: null, elo: 0, peak: 0, bouts: 0, hist: [] }  /* historical_v2 */
  if (name) R[id].name = name
  return R[id]
}

for (const bid of bashos) {
  const [info, bz] = await Promise.all([
    fetchJson('https://sumo-api.com/api/basho/' + bid),
    fetchJson('https://sumo-api.com/api/basho/' + bid + '/banzuke/Makuuchi'),
  ])
  const all = [...((bz && bz.east) || []), ...((bz && bz.west) || [])]
  if (!all.length) { console.log(bid + ': EMPTY banzuke, skipped'); continue }

  const rankById = {}
  for (const r of all) rankById[String(r.rikishiID)] = r.rank || ''

  for (const r of all) {
    const id = String(r.rikishiID)
    const p = ensure(id, r.shikonaEn)
    if (!p.first) p.first = bid
    p.last = bid
    p.mkBasho++
    if (typeof r.rankValue === 'number' && r.rankValue < p.hiRankValue) { p.hiRankValue = r.rankValue; p.hiRank = r.rank || '' }
    const rank = r.rank || ''
    if (rank.startsWith('Yokozuna')) {
      if (!p.yokozunaFirst) p.yokozunaFirst = bid
      p.yokozunaLast = bid
    }
    const isMaeg = rank.startsWith('Maegashira')
    if (!p.elo) p.elo = seedFor(rank)  /* historical_v2 */
    let bw = 0, bl = 0, ba = 0
    for (const m of (r.record || [])) {
      if (WIN.includes(m.result)) { p.wins++; bw++ }
      else if (LOSS.includes(m.result)) { p.losses++; bl++ }
      else if (m.result === 'absent') ba++
      if (isMaeg && m.result === 'win' && (rankById[String(m.opponentID ?? '')] || '').startsWith('Yokozuna')) p.kinboshi++
    }
    p.hist.push({ b: bid, w: bw, l: bl, a: ba, r: rank })  /* historical_v2: istoriia basho */
  }

  /* historical_v2: elo-prokhid po boiakh (dedup po pari+dniu) */
  const bouts = new Map()
  for (const r of all) {
    const id = String(r.rikishiID)
    ;(r.record || []).forEach((m, idx) => {
      if (!WIN.includes(m.result) && !LOSS.includes(m.result)) return
      if (String(m.result).startsWith('fusen')) return
      const oppId = String(m.opponentID ?? '')
      if (!oppId || oppId === '0' || oppId === 'undefined') return
      const key = (idx + 1) + '-' + [id, oppId].sort().join('-')
      if (!bouts.has(key)) bouts.set(key, { day: idx + 1, winId: WIN.includes(m.result) ? id : oppId, loseId: WIN.includes(m.result) ? oppId : id })
    })
  }
  for (const b of [...bouts.values()].sort((x, y) => x.day - y.day)) {
    const w = R[b.winId], l = R[b.loseId]
    if (!w || !l || !w.elo || !l.elo) continue
    const exp = 1 / (1 + Math.pow(10, (l.elo - w.elo) / 400))
    const kw = w.bouts < K_BOUT_THRESHOLD ? K_FAST : K_SLOW
    const kl = l.bouts < K_BOUT_THRESHOLD ? K_FAST : K_SLOW
    w.elo += kw * (1 - exp); l.elo -= kl * (1 - exp)
    w.bouts++; l.bouts++
    if (w.elo > w.peak) w.peak = w.elo
    if (l.elo > l.peak) l.peak = l.elo
  }

  const yu = ((info && info.yusho) || []).find(x => x.type === 'Makuuchi')
  if (yu) {
    bashoYusho[bid] = { id: String(yu.rikishiId), name: yu.shikonaEn, location: (info && info.location) || '' }
    ensure(String(yu.rikishiId), yu.shikonaEn).yusho++
  }
  console.log(bid + ': ok, roster ' + all.length + ', yusho ' + (yu ? yu.shikonaEn : '-'))
  await new Promise(res => setTimeout(res, 150))
}

const significant = {}
for (const [id, p] of Object.entries(R)) {
  const sanyaku = p.hiRankValue < 500
  if (p.yusho > 0 || sanyaku || p.mkBasho >= 15) { p.peakOvr = OVR(Math.max(p.peak, p.elo || 0)); significant[id] = p }  /* historical_v2 */
}

fs.writeFileSync('src/app/lib/historicalRikishi.json', JSON.stringify({ generated: new Date().toISOString(), base: BASE, end: END, rikishi: significant }))
fs.writeFileSync('src/app/lib/bashoYusho.json', JSON.stringify({ generated: new Date().toISOString(), yusho: bashoYusho }))
const yok = Object.fromEntries(Object.entries(R).filter(([, p]) => p.yokozunaFirst))
fs.writeFileSync('src/app/lib/yokozunaData.json', JSON.stringify({ generated: new Date().toISOString(), yokozuna: yok }))

console.log('\nDone. significant: ' + Object.keys(significant).length + ', yokozuna: ' + Object.keys(yok).length + ', basho with yusho: ' + Object.keys(bashoYusho).length)
