/* fetch-training-data.mjs: тягне архівні басьо для тренування моделі шансів
   Використання: node scripts/fetch-training-data.mjs 36   (кількість басьо назад від поточного) */
import fs from 'fs'
import path from 'path'

const N = parseInt(process.argv[2] || '36', 10)
const OUT = 'data/training'
fs.mkdirSync(OUT, { recursive: true })

function prevBashoId(id) {
  let y = +id.slice(0, 4), m = +id.slice(4)
  m -= 2
  if (m < 1) { m += 12; y -= 1 }
  return `${y}${String(m).padStart(2, '0')}`
}

// стартуємо з попереднього завершеного (поточний 202607 ще йде)
let id = '202605'
const ids = []
for (let i = 0; i < N; i++) { ids.push(id); id = prevBashoId(id) }

const sleep = ms => new Promise(r => setTimeout(r, ms))

for (const bashoId of ids) {
  const f = path.join(OUT, `${bashoId}.json`)
  if (fs.existsSync(f)) { console.log(`skip ${bashoId} (cached)`); continue }
  try {
    const [bRes, banRes] = await Promise.all([
      fetch(`https://sumo-api.com/api/basho/${bashoId}`),
      fetch(`https://sumo-api.com/api/basho/${bashoId}/banzuke/Makuuchi`),
    ])
    if (!bRes.ok || !banRes.ok) { console.log(`FAIL ${bashoId}: ${bRes.status}/${banRes.status}`); continue }
    const basho = await bRes.json()
    const banzuke = await banRes.json()
    const yushoM = (basho.yusho || []).find(y => y.type === 'Makuuchi')
    if (!yushoM) { console.log(`FAIL ${bashoId}: no Makuuchi yusho`); continue }
    fs.writeFileSync(f, JSON.stringify({ bashoId, yushoWinner: yushoM.shikonaEn, banzuke }, null, 0))
    console.log(`OK ${bashoId}: yusho=${yushoM.shikonaEn}`)
  } catch (e) {
    console.log(`ERR ${bashoId}: ${e.message}`)
  }
  await sleep(600)
}
console.log('done')
