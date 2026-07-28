/* extend_yusho_v1: dolyvaie bashoYusho.json 202001..202607 z API */
import fs from 'node:fs'
async function fetchJson(u, t = 4) { for (let i = 0; i < t; i++) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await new Promise(x => setTimeout(x, 800 * (i + 1))) } return null }
const f = JSON.parse(fs.readFileSync('src/app/lib/bashoYusho.json'))
const list = []
let y = 2020, m = 1
while (y < 2026 || (y === 2026 && m <= 7)) { list.push(String(y) + String(m).padStart(2, '0')); m += 2; if (m > 11) { m = 1; y++ } }
for (const bid of list) {
  if (bid === '202005') continue
  const info = await fetchJson('https://sumo-api.com/api/basho/' + bid)
  const yu = ((info && info.yusho) || []).find(x => x.type === 'Makuuchi')
  if (yu) { f.yusho[bid] = { id: String(yu.rikishiId), name: yu.shikonaEn, location: (info && info.location) || '' }; console.log(bid + ': ' + yu.shikonaEn) }
  await new Promise(x => setTimeout(x, 120))
}
fs.writeFileSync('src/app/lib/bashoYusho.json', JSON.stringify(f))
console.log('Total basho with yusho: ' + Object.keys(f.yusho).length)
