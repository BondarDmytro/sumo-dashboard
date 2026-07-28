/* build-elo.mjs — dynamic Elo/OVR rating (elo_v1)
   Variant B: seeds at 202401, forward pass over banzuke records only, zero extra fetches beyond banzuke. */

import fs from 'fs'

const BASE_BASHO = '202001'  /* elo_depth_2020 */
const DIVISIONS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']

const SEED = {
  yo_oz: 1750, sanyaku: 1650, maegashira: 1550,
  Juryo: 1450, Makushita: 1300, Sandanme: 1200, Jonidan: 1100, Jonokuchi: 1000,
}
const K_FAST = 32, K_SLOW = 20, K_BOUT_THRESHOLD = 60
const OVR = elo => Math.round(Math.min(99, Math.max(1, (elo - 850) / 12)))  /* ovr_scale_v2 */

const WIN = ['win', 'fusen win']
const LOSS = ['loss', 'fusen loss']

function bashoList(from) {
  const months = [1, 3, 5, 7, 9, 11]
  const out = []
  const now = new Date()
  const endY = now.getUTCFullYear(), endM = now.getUTCMonth() + 1
  let y = +from.slice(0, 4), mi = months.indexOf(+from.slice(4, 6))
  while (y < endY || (y === endY && months[mi] <= endM)) {
    out.push(`${y}${String(months[mi]).padStart(2, '0')}`)
    mi++
    if (mi === 6) { mi = 0; y++ }
  }
  return out
}

function seedFor(rank, division) {
  if (division === 'Makuuchi') {
    if (/^(Yokozuna|Ozeki)/.test(rank || '')) return SEED.yo_oz
    if (/^(Sekiwake|Komusubi)/.test(rank || '')) return SEED.sanyaku
    return SEED.maegashira
  }
  return SEED[division] ?? 1200
}

async function fetchJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return await r.json()
    } catch {}
    await new Promise(res => setTimeout(res, 800 * (i + 1)))
  }
  return null
}

const R = {}  // id -> { elo, peak, bouts, name, division, lastBashoStartElo }

function ensure(id, name, rank, division) {
  if (!R[id]) R[id] = { elo: seedFor(rank, division), peak: 0, bouts: 0, name, division }
  R[id].name = name
  R[id].division = division
  return R[id]
}

function kFor(p, division) {
  if (!['Makuuchi', 'Juryo'].includes(division)) return K_FAST
  return p.bouts < K_BOUT_THRESHOLD ? K_FAST : K_SLOW
}

const bashos = bashoList(BASE_BASHO)
console.log(`Basho range: ${bashos[0]} .. ${bashos[bashos.length - 1]} (${bashos.length})`)

let latestBashoWithBouts = null

for (const bid of bashos) {
  if (bid === '202005') { console.log('202005: skipped (covid, cancelled)'); continue }  /* elo_depth_2020 */
  // 1) fetch all divisions of this basho
  const banzukes = {}
  for (const div of DIVISIONS) {
    banzukes[div] = await fetchJson(`https://sumo-api.com/api/basho/${bid}/banzuke/${div}`)
  }

  // 2) register rikishi (seed on first appearance) + collect bouts, dedupe globally
  const bouts = new Map()  // key -> { day, winId, loseId, divW, divL }
  let anyBout = false
  /* elo_kinboshi_v1: rang kozhnoho uchasnyka TSOHO basho (dlia zirok) */
  const rankThisBasho = {}
  for (const div of DIVISIONS) {
    const bz0 = banzukes[div]
    if (!bz0) continue
    for (const r0 of [...(bz0.east || []), ...(bz0.west || [])]) rankThisBasho[String(r0.rikishiID)] = r0.rank || ''
  }
  for (const div of DIVISIONS) {
    const bz = banzukes[div]
    if (!bz) continue
    const all = [...(bz.east || []), ...(bz.west || [])]
    for (const r of all) {
      const id = String(r.rikishiID)
      ensure(id, r.shikonaEn, r.rank, div)
      const record = r.record || []
      const isMaeg = (r.rank || '').startsWith('Maegashira')  /* elo_kinboshi_v1 */
      if ((r.rank || '').startsWith('Yokozuna')) { if (!R[id].yokozunaFirst) R[id].yokozunaFirst = bid; R[id].yokozunaLast = bid; R[id].yusho = R[id].yusho || 0 }  /* elo_yokozuna_terms_v1 */
      record.forEach((m, i) => {
        const day = i + 1
        if (!WIN.includes(m.result) && !LOSS.includes(m.result)) return
        if (isMaeg && m.result === 'win' && (rankThisBasho[String(m.opponentID ?? m.opponentId ?? '')] || '').startsWith('Yokozuna')) {
          R[id].kinboshi = (R[id].kinboshi || 0) + 1  /* elo_kinboshi_v1 */
        }
        /* elo_yokozuna_terms_v1: terminy na ranzi (raz na basho dosyt, ale idempotentno) */
        if (m.result.startsWith('fusen')) return  /* fusen: zero information */
        const oppId = String(m.opponentID ?? m.opponentId ?? '')
        if (!oppId || oppId === 'undefined' || oppId === '0') return
        const winId = WIN.includes(m.result) ? id : oppId
        const loseId = WIN.includes(m.result) ? oppId : id
        const key = `${day}-${[id, oppId].sort().join('-')}`
        if (!bouts.has(key)) bouts.set(key, { day, winId, loseId })
        anyBout = true
      })
    }
  }
  if (anyBout) latestBashoWithBouts = bid

  // 3) snapshot start-of-basho elo (for delta of the latest basho)
  for (const id in R) R[id].lastBashoStartElo = R[id].elo

  // 4) apply bouts chronologically by day
  const sorted = [...bouts.values()].sort((a, b) => a.day - b.day)
  let skipped = 0
  for (const b of sorted) {
    const w = R[b.winId], l = R[b.loseId]
    if (!w || !l) { skipped++; continue }  /* opponent outside computed universe */
    const eW = 1 / (1 + Math.pow(10, (l.elo - w.elo) / 400))
    const kW = kFor(w, w.division), kL = kFor(l, l.division)
    w.elo += kW * (1 - eW)
    l.elo += kL * (0 - (1 - eW))
    w.bouts++; l.bouts++
    if (w.elo > w.peak) w.peak = w.elo
    if (l.elo > l.peak) l.peak = l.elo
  }
  console.log(`${bid}: ${sorted.length} bouts, ${skipped} skipped, roster ${Object.keys(R).length}`)
}

// 5) output
const ratings = {}
for (const [id, p] of Object.entries(R)) {
  ratings[id] = {
    elo: Math.round(p.elo),
    ovr: OVR(p.elo),
    peak: OVR(Math.max(p.peak, p.elo)),
    delta: OVR(p.elo) - OVR(p.lastBashoStartElo ?? p.elo),
    bouts: p.bouts,
    kinboshi: p.kinboshi || 0,  /* elo_kinboshi_v1 */
    yokozunaFirst: p.yokozunaFirst || null,
    yokozunaLast: p.yokozunaLast || null,  /* elo_yokozuna_terms_v1 */
  }
}
const out = { generated: new Date().toISOString(), baseBasho: BASE_BASHO, lastBasho: latestBashoWithBouts, ratings }
fs.writeFileSync('src/app/lib/eloRatings.json', JSON.stringify(out))
console.log(`\nWrote src/app/lib/eloRatings.json (${Object.keys(ratings).length} rikishi)`)

// 6) sanity: histogram per division + top-15
console.log('\nOVR histogram by division:')
for (const div of DIVISIONS) {
  const vals = Object.values(R).filter(p => p.division === div && p.bouts > 0).map(p => OVR(p.elo))
  if (!vals.length) continue
  const buckets = {}
  vals.forEach(v => { const b = Math.floor(v / 10) * 10; buckets[b] = (buckets[b] || 0) + 1 })
  const line = Object.keys(buckets).sort((a, b) => a - b).map(b => `${b}s:${buckets[b]}`).join(' ')
  const med = vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)]
  console.log(`  ${div.padEnd(10)} n=${String(vals.length).padStart(3)} median=${med}  ${line}`)
}
console.log('\nTop 15:')
Object.entries(R).filter(([, p]) => p.bouts > 0)
  .sort((a, b) => b[1].elo - a[1].elo).slice(0, 15)
  .forEach(([id, p], i) => console.log(`  ${String(i + 1).padStart(2)}. ${p.name.padEnd(16)} ${p.division.padEnd(10)} elo=${Math.round(p.elo)} ovr=${OVR(p.elo)} bouts=${p.bouts}`))
