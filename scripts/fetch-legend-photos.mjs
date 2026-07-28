/* fetch_legend_photos_v1: sumodb pics dlia significant legend + yokozuna.
   sumodbId cherez sumo-api /rikishi/{id}. Zberihaie public/rikishi/{id}.jpg (webp ne konvertuiemo). */
import fs from 'node:fs'
const DIR = 'public/rikishi'
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchJson(u, t = 3) { for (let i = 0; i < t; i++) { try { const r = await fetch(u); if (r.ok) return await r.json() } catch {} await sleep(700 * (i + 1)) } return null }

const hist = JSON.parse(fs.readFileSync('src/app/lib/historicalRikishi.json')).rikishi
const yok = JSON.parse(fs.readFileSync('src/app/lib/yokozunaData.json')).yokozuna
const ids = [...new Set([...Object.keys(hist), ...Object.keys(yok)])]
console.log('legend ids:', ids.length)

let got = 0, had = 0, noSdb = 0, noPic = 0, failed = 0
for (const id of ids) {
  const jp = DIR + '/' + id + '.jpg'
  const wp = DIR + '/' + id + '.webp'
  if (fs.existsSync(wp) || (fs.existsSync(jp) && fs.statSync(jp).size > 3000)) { had++; continue }
  const info = await fetchJson('https://sumo-api.com/api/rikishi/' + id)
  const sdb = info && info.sumodbId
  if (!sdb) { noSdb++; continue }
  try {
    const r = await fetch('https://sumodb.sumogames.de/pics/' + sdb + '.jpg')
    if (!r.ok) { noPic++; await sleep(250); continue }
    const buf = Buffer.from(await r.arrayBuffer())
    if (buf.length < 3000) { noPic++; await sleep(250); continue }
    fs.writeFileSync(jp, buf)
    got++
    if (got % 25 === 0) console.log('got:', got)
  } catch { failed++ }
  await sleep(300)
}
console.log('Done. got:', got, '| already had:', had, '| no sumodbId:', noSdb, '| no pic:', noPic, '| failed:', failed)
