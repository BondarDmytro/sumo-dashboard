/* Чи виграє важчий/вищий? Всі бої датасета, бакети по різниці габаритів */
import fs from 'fs'
const meta = JSON.parse(fs.readFileSync('src/app/lib/rikishiMeta.json'))
const byId = new Map(meta.map(m => [m.id, m]))
const files = fs.readdirSync('data/training').filter(f => /^\d{6}\.json$/.test(f))
const WIN = ['win'], LOSS = ['loss']  // fusen виключаємо - там габарити ні до чого
let bouts = 0
const wBuckets = {}, hBuckets = {}
const bucket = (v, step) => `${Math.floor(v/step)*step}..${Math.floor(v/step)*step+step}`
for (const f of files) {
  const { banzuke } = JSON.parse(fs.readFileSync(`data/training/${f}`))
  const all = [...(banzuke.east||[]), ...(banzuke.west||[])]
  for (const r of all) {
    const me = byId.get(r.rikishiID)
    if (!me?.weight || !me?.height) continue
    for (const m of (r.record || [])) {
      if (!WIN.includes(m.result)) continue  // кожен бій рахуємо один раз - з боку переможця
      const opp = byId.get(m.opponentID)
      if (!opp?.weight || !opp?.height) continue
      bouts++
      const dw = me.weight - opp.weight   // переможець важчий на dw
      const dh = me.height - opp.height
      const wb = bucket(Math.abs(dw), 10), hb = bucket(Math.abs(dh), 5)
      ;(wBuckets[wb] ||= { heavierWins: 0, n: 0 })
      wBuckets[wb].n++; if (dw > 0) wBuckets[wb].heavierWins++
      ;(hBuckets[hb] ||= { tallerWins: 0, n: 0 })
      hBuckets[hb].n++; if (dh > 0) hBuckets[hb].tallerWins++
    }
  }
}
console.log(`bouts analyzed: ${bouts}`)
console.log('\n=== Δвага: як часто виграє ВАЖЧИЙ ===')
Object.keys(wBuckets).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(k => {
  const b = wBuckets[k]
  if (b.n > 100) console.log(`Δ ${k}кг: важчий виграє ${(b.heavierWins/b.n*100).toFixed(1)}% (n=${b.n})`)
})
console.log('\n=== Δзріст: як часто виграє ВИЩИЙ ===')
Object.keys(hBuckets).sort((a,b)=>parseInt(a)-parseInt(b)).forEach(k => {
  const b = hBuckets[k]
  if (b.n > 100) console.log(`Δ ${k}см: вищий виграє ${(b.tallerWins/b.n*100).toFixed(1)}% (n=${b.n})`)
})
