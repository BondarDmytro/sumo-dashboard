// build_rikishi_meta_v1: kompaktnyi dataset dlia top-tablytsi (588 x ~100B); zapusk raz na basho
import fs from 'fs'
const API = 'https://sumo-api.com/api'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const res = await fetch(`${API}/rikishis?limit=1000`)
const data = await res.json()
const recs = (data.records || []).filter(r => r.currentRank)
console.log(`rikishi: ${recs.length}`)

/* meta_v4_last9: istoriia 9 poperednikh basho z banzuke (54 fetchi zamist 599) */
const bashoList = (() => {
  const out = []
  let y = 2026, m = 5
  for (let i = 0; i < 39; i++) {  /* history_full_v1: z 2020, syncz elo-hlybynoiu */
    out.push(`${y}${String(m).padStart(2, '0')}`)
    m -= 2
    if (m < 1) { m += 12; y -= 1 }
  }
  return out
})()
const DIVS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']
const hist = {}
/* meta_v5_yusho_mark: khto vziav yusho v kozhnomu z 9 basho (9 deshevykh fetchiv) */
const yushoBy = {}
for (const b of bashoList) {
  try {
    const info = await (await fetch(`${API}/basho/${b}`)).json()
    for (const y of (info.yusho || [])) {
      yushoBy[`${b}:${y.rikishiId}`] = true
    }
  } catch (e) { console.log(`basho skip ${b}: ${e.message}`) }
  await sleep(250)
}
for (const b of bashoList) {
  for (const d of DIVS) {
    try {
      const bz = await (await fetch(`${API}/basho/${b}/banzuke/${d}`)).json()
      for (const side of ['east', 'west']) {
        for (const e of (bz[side] || [])) {
          const rec = e.record || []
          let w = 0, l = 0, a = 0
          rec.forEach(x => {
            const res = String(x.result || '')
            if (res === 'win' || res === 'fusen win') w++
            else if (res === 'loss' || res === 'fusen loss') l++
            else if (res === 'absent') a++
          })
          if (!hist[e.rikishiID]) hist[e.rikishiID] = []
          const entry = { b, w, l, a }
          if (e.rank) entry.r = e.rank  /* meta_v6_rank: rang na moment basho */
          if (yushoBy[`${b}:${e.rikishiID}`]) entry.y = 1  /* meta_v5_yusho_mark */
          hist[e.rikishiID].push(entry)
        }
      }
    } catch (e) { console.log(`banzuke skip ${b}/${d}: ${e.message}`) }
    await sleep(250)
  }
  console.log(`banzuke ${b} done`)
}


const out = []
let done = 0
for (const r of recs) {
  try {
    const stats = await (await fetch(`${API}/rikishi/${r.id}/stats`)).json()
    /* meta_v3: istoriia rangiv -> highest */
    let hiRank = null, hiVal = null
    try {
      const ranks = await (await fetch(`${API}/ranks?rikishiId=${r.id}`)).json()
      if (Array.isArray(ranks) && ranks.length) {
        const ewScore = (x) => (x.rankValue || 9999) * 2 + (String(x.rank || '').includes('East') ? 0 : 1)  /* meta_v7_hirank_ew: East vyshchyi za West pry rivnomu value */
        const best = ranks.reduce((a, b) => (b.rankValue && (!a || ewScore(b) < ewScore(a))) ? b : a, null)
        if (best) { hiRank = best.rank; hiVal = best.rankValue }
      }
    } catch (e) {}
    out.push({
      id: r.id,
      name: r.shikonaEn,
      nameJp: r.shikonaJp || null,
      rank: r.currentRank,
      heya: r.heya || null,
      shusshin: r.shusshin || null,
      birthDate: r.birthDate ? r.birthDate.slice(0, 10) : null,
      height: r.height || null,
      weight: r.weight || null,
      matches: stats.totalMatches || 0,
      wins: stats.totalWins || 0,  /* meta_v2 */
      basho: stats.basho || 0,
      debut: r.debut || null,
      yusho: stats.yusho || 0,
      hiRank, hiVal,
      last9: (hist[r.id] || []).sort((x, y) => x.b.localeCompare(y.b)).slice(-9),  /* meta_v4_last9 history_full_v1 */
    })
  } catch (e) { console.log(`skip ${r.shikonaEn}: ${e.message}`) }
  done++
  if (done % 50 === 0) console.log(`${done}/${recs.length}`)
  await sleep(250)
}
fs.writeFileSync('src/app/lib/rikishiMeta.json', JSON.stringify(out))
const histOut = {}  /* history_full_v1 */
for (const r of recs) {  /* history_full_v1 fix */
  const h = (hist[r.id] || []).sort((x, y) => x.b.localeCompare(y.b))
  if (h.length) histOut[r.id] = h
}
fs.writeFileSync('src/app/lib/rikishiHistory.json', JSON.stringify(histOut))
console.log(`history written: ${Object.keys(histOut).length} rikishi, ${(fs.statSync('src/app/lib/rikishiHistory.json').size/1024).toFixed(0)}K`)
console.log(`written: ${out.length} records, ${(fs.statSync('src/app/lib/rikishiMeta.json').size/1024).toFixed(0)}K`)
