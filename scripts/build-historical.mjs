/* build-historical.mjs (historical_v1): odnorazovyi prokhid 195911..201911.
   Vykhody: historicalRikishi.json (porohovani), bashoYusho.json, yokozunaData.json. */
import fs from 'node:fs'

const BASE = '195911'
const END = '201911'
const WIN = ['win', 'fusen win']
const LOSS = ['loss', 'fusen loss']

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
  if (!R[id]) R[id] = { name, first: null, last: null, mkBasho: 0, wins: 0, losses: 0, yusho: 0, kinboshi: 0, hiRankValue: 9999, hiRank: '', yokozunaFirst: null, yokozunaLast: null }
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
    for (const m of (r.record || [])) {
      if (WIN.includes(m.result)) p.wins++
      else if (LOSS.includes(m.result)) p.losses++
      if (isMaeg && m.result === 'win' && (rankById[String(m.opponentID ?? '')] || '').startsWith('Yokozuna')) p.kinboshi++
    }
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
  if (p.yusho > 0 || sanyaku || p.mkBasho >= 15) significant[id] = p
}

fs.writeFileSync('src/app/lib/historicalRikishi.json', JSON.stringify({ generated: new Date().toISOString(), base: BASE, end: END, rikishi: significant }))
fs.writeFileSync('src/app/lib/bashoYusho.json', JSON.stringify({ generated: new Date().toISOString(), yusho: bashoYusho }))
const yok = Object.fromEntries(Object.entries(R).filter(([, p]) => p.yokozunaFirst))
fs.writeFileSync('src/app/lib/yokozunaData.json', JSON.stringify({ generated: new Date().toISOString(), yokozuna: yok }))

console.log('\nDone. significant: ' + Object.keys(significant).length + ', yokozuna: ' + Object.keys(yok).length + ', basho with yusho: ' + Object.keys(bashoYusho).length)
