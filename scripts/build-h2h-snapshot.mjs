/* Знімок career h2h з тренувального датасета -> src/app/lib/h2hSnapshot.json
   Перегенеровувати щобасьо разом із rikishiMeta */
import fs from 'fs'
const RESULTS_WIN = ['win', 'fusen win']
const files = fs.readdirSync('data/training').filter(f => /^\d{6}\.json$/.test(f)).sort()
const h2h = {}
for (const f of files) {
  const { banzuke } = JSON.parse(fs.readFileSync(`data/training/${f}`))
  for (const r of [...(banzuke.east||[]), ...(banzuke.west||[])]) {
    for (const m of (r.record || [])) {
      if (!RESULTS_WIN.includes(m.result) || !m.opponentID) continue
      const k = `${r.rikishiID}|${m.opponentID}`
      h2h[k] = (h2h[k] || 0) + 1
    }
  }
}
fs.writeFileSync('src/app/lib/h2hSnapshot.json', JSON.stringify(h2h))
console.log(`pairs: ${Object.keys(h2h).length}, size: ${(JSON.stringify(h2h).length/1024).toFixed(0)}K`)
