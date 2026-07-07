// fetch_rikishi_photos_v1: докачує відсутні фото макуучі з sumo.or.jp за nskId
import fs from 'node:fs'
import path from 'node:path'

const DIR = 'public/rikishi'
const API = 'https://sumo-api.com/api/rikishis?limit=1000'
const PHOTO = (nskId) => `https://www.sumo.or.jp/img/sumo_data/rikishi/270x474/${nskId}.jpg`

const list = await fetch(API).then(r => r.json())
const rikishi = (list.records || list.rikishi || []).filter(r => r.nskId)
console.log(`API records with nskId: ${rikishi.length}`)

let ok = 0, skip = 0, miss = []
for (const r of rikishi) {
  const dest = path.join(DIR, `${r.id}.jpg`)
  if (fs.existsSync(dest)) { skip++; continue }
  const res = await fetch(PHOTO(r.nskId))
  if (!res.ok) { miss.push(`${r.id} ${r.shikonaEn} (nsk ${r.nskId}) -> HTTP ${res.status}`); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 3000) { miss.push(`${r.id} ${r.shikonaEn} -> too small (${buf.length}b, placeholder?)`); continue }
  fs.writeFileSync(dest, buf)
  ok++
  console.log(`+ ${r.id} ${r.shikonaEn}`)
  await new Promise(s => setTimeout(s, 300))
}
console.log(`\ndone: downloaded ${ok}, already had ${skip}, missing ${miss.length}`)
miss.forEach(m => console.log('  MISS: ' + m))
