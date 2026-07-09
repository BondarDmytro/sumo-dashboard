// build_rikishi_meta_v1: kompaktnyi dataset dlia top-tablytsi (588 x ~100B); zapusk raz na basho
import fs from 'fs'
const API = 'https://sumo-api.com/api'
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const res = await fetch(`${API}/rikishis?limit=1000`)
const data = await res.json()
const recs = (data.records || []).filter(r => r.currentRank)
console.log(`rikishi: ${recs.length}`)

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
        const best = ranks.reduce((a, b) => (b.rankValue && (!a || b.rankValue < a.rankValue)) ? b : a, null)
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
    })
  } catch (e) { console.log(`skip ${r.shikonaEn}: ${e.message}`) }
  done++
  if (done % 50 === 0) console.log(`${done}/${recs.length}`)
  await sleep(250)
}
fs.writeFileSync('src/app/lib/rikishiMeta.json', JSON.stringify(out))
console.log(`written: ${out.length} records, ${(fs.statSync('src/app/lib/rikishiMeta.json').size/1024).toFixed(0)}K`)
