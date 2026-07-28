/* historical_tail_v1: dozbyrach 195803..195909 - banzuke povni, yusho evrystykoiu max-wins */
import fs from 'node:fs'
const WIN = ['win', 'fusen win']
const LOSS = ['loss', 'fusen loss']
const TAIL = ['195803','195805','195807','195809','195811','195901','195903','195905','195907','195909']

async function fetchJson(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json() } catch {}
    await new Promise(res => setTimeout(res, 1000 * (i + 1)))
  }
  return null
}

const hist = JSON.parse(fs.readFileSync('src/app/lib/historicalRikishi.json'))
const yushoF = JSON.parse(fs.readFileSync('src/app/lib/bashoYusho.json'))
const yokF = JSON.parse(fs.readFileSync('src/app/lib/yokozunaData.json'))
const R = {}  // акумулюємо хвіст окремо, потім домішуємо

function ensure(id, name) {
  if (!R[id]) R[id] = { name, first: null, last: null, mkBasho: 0, wins: 0, losses: 0, yusho: 0, kinboshi: 0, hiRankValue: 9999, hiRank: '', yokozunaFirst: null, yokozunaLast: null }
  if (name) R[id].name = name
  return R[id]
}

for (const bid of TAIL) {
  const bz = await fetchJson(`https://sumo-api.com/api/basho/${bid}/banzuke/Makuuchi`)
  const all = [...((bz && bz.east) || []), ...((bz && bz.west) || [])]
  if (!all.length) { console.log(`${bid}: EMPTY`); continue }
  const rankById = {}
  for (const r of all) rankById[String(r.rikishiID)] = r.rank || ''
  let best = null
  for (const r of all) {
    const id = String(r.rikishiID)
    const p = ensure(id, r.shikonaEn)
    if (!p.first) p.first = bid
    p.last = bid
    p.mkBasho++
    if (typeof r.rankValue === 'number' && r.rankValue < p.hiRankValue) { p.hiRankValue = r.rankValue; p.hiRank = r.rank || '' }
    const rank = r.rank || ''
    if (rank.startsWith('Yokozuna')) { if (!p.yokozunaFirst) p.yokozunaFirst = bid; p.yokozunaLast = bid }
    const isMaeg = rank.startsWith('Maegashira')
    let w = 0
    for (const m of (r.record || [])) {
      if (WIN.includes(m.result)) { p.wins++; w++ }
      else if (LOSS.includes(m.result)) p.losses++
      if (isMaeg && m.result === 'win' && (rankById[String(m.opponentID ?? '')] || '').startsWith('Yokozuna')) p.kinboshi++
    }
    if (!best || w > best.w) best = { id, name: r.shikonaEn, w }
  }
  if (best) {
    yushoF.yusho[bid] = { id: best.id, name: best.name, location: '', approx: true }
    ensure(best.id, best.name).yusho++
    console.log(`${bid}: ok, yusho~ ${best.name} (${best.w})`)
  }
  await new Promise(res => setTimeout(res, 150))
}

/* мердж хвоста в основні акумулятори */
function mergeInto(target, id, p) {
  const t = target[id]
  if (!t) { target[id] = p; return }
  t.wins += p.wins; t.losses += p.losses; t.mkBasho += p.mkBasho; t.yusho += p.yusho; t.kinboshi += p.kinboshi
  if (p.first && (!t.first || p.first < t.first)) t.first = p.first
  if (p.last && (!t.last || p.last > t.last)) t.last = p.last
  if (p.hiRankValue < t.hiRankValue) { t.hiRankValue = p.hiRankValue; t.hiRank = p.hiRank }
  if (p.yokozunaFirst && (!t.yokozunaFirst || p.yokozunaFirst < t.yokozunaFirst)) t.yokozunaFirst = p.yokozunaFirst
  if (p.yokozunaLast && (!t.yokozunaLast || p.yokozunaLast > t.yokozunaLast)) t.yokozunaLast = p.yokozunaLast
}
for (const [id, p] of Object.entries(R)) {
  const sig = p.yusho > 0 || p.hiRankValue < 500 || p.mkBasho >= 3 || hist.rikishi[id]
  if (sig) mergeInto(hist.rikishi, id, p)
  if (p.yokozunaFirst || yokF.yokozuna[id]) mergeInto(yokF.yokozuna, id, p)
}
hist.base = '195803'
fs.writeFileSync('src/app/lib/historicalRikishi.json', JSON.stringify(hist))
fs.writeFileSync('src/app/lib/bashoYusho.json', JSON.stringify(yushoF))
fs.writeFileSync('src/app/lib/yokozunaData.json', JSON.stringify(yokF))
console.log(`\nTail merged. rikishi: ${Object.keys(hist.rikishi).length}, yokozuna: ${Object.keys(yokF.yokozuna).length}`)
