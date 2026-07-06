// scripts/prepare-nagoya.mjs
// Підготовка даних під Наґоя Басьо 2026 (12–26 липня, IG Arena).
// Що робить:
//   1. Бекапить поточні rikishi/tournament/match/h2h у JSON (backup-<ts>.json)
//   2. Видаляє всі match та h2h (минулий басьо)
//   3. Оновлює/створює 8 rikishi (санъяку Наґої) з нульовими W-L
//   4. Оновлює/створює документ tournament
//
// Запуск:  SANITY_TOKEN=<write-token> node scripts/prepare-nagoya.mjs
// Dry-run: SANITY_TOKEN=<token> DRY=1 node scripts/prepare-nagoya.mjs
// Токен: sanity.io/manage → проєкт → API → Tokens → Editor.

import { createClient } from '@sanity/client'
import fs from 'node:fs'

// ── конфіг проєкту (звір із sanity.config.js / env) ──
const projectId = process.env.SANITY_PROJECT_ID || ''
const dataset   = process.env.SANITY_DATASET || 'production'
const token     = process.env.SANITY_TOKEN
const DRY       = !!process.env.DRY

if (!projectId) { console.error('❌ Вкажи SANITY_PROJECT_ID (див. sanity.config.js)'); process.exit(1) }
if (!token)     { console.error('❌ Вкажи SANITY_TOKEN (write-токен з sanity.io/manage)'); process.exit(1) }

const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false })

// ── дані Наґоя 2026 ──
const TOURNAMENT = {
  _id: 'tournament-nagoya-2026',
  _type: 'tournament',
  name: 'Наґоя Басьо 2026',
  location: 'Наґоя, IG Arena',
  currentDay: 0,
  totalDays: 15,
  leaders: '',
  kyujoCount: 0,
  updatedNote: 'банзуке опубліковано · старт 12 липня',
}

// order, name, rank, rankFull, yushoChance, note
const RIKISHI = [
  [1, 'Hoshoryu',      'Y1e', 'Йокодзуна',   18, ''],
  [2, 'Onosato',       'Y1w', 'Йокодзуна',   18, ''],
  [3, 'Kirishima',     'O1e', 'Озекі',       15, 'йокодзуна-ран: потрібен титул'],
  [4, 'Kotozakura',    'O1w', 'Озекі',        8, 'кадобан (знявся у травні, спина)'],
  [5, 'Wakatakakage',  'S1e', 'Секіваке',    14, 'чемпіон Натсу (12-3), озекі-ран'],
  [6, 'Atamifuji',     'S1w', 'Секіваке',     9, 'утримав ранг'],
  [7, 'Kotoshoho',     'S2e', 'Секіваке',     8, 'утримав ранг'],
  [8, 'Aonishiki',     'S2w', 'Секіваке',    10, 'екс-озекі: 10 перемог повертають ранг'],
]

const rikishiDoc = ([order, name, rank, rankFull, yushoChance, note]) => ({
  _id: `rikishi-${name.toLowerCase()}`,
  _type: 'rikishi',
  name, rank, rankFull,
  wins: 0, losses: 0,
  yushoChance, chanceDelta: 0,
  status: 'chase',
  nextOpponent: '',
  note,
  order,
})

async function main() {
  console.log(`Sanity: ${projectId}/${dataset}${DRY ? '  [DRY RUN]' : ''}`)

  // 1) бекап
  const backup = {}
  for (const t of ['rikishi', 'tournament', 'match', 'h2h']) {
    backup[t] = await client.fetch(`*[_type == "${t}"]`)
    console.log(`  бекап ${t}: ${backup[t].length} док.`)
  }
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const bfile = `scripts/backup-${ts}.json`
  fs.writeFileSync(bfile, JSON.stringify(backup, null, 2))
  console.log(`✅ Бекап: ${bfile}`)

  // 2) транзакція: видалити match/h2h, оновити rikishi/tournament
  let tx = client.transaction()
  for (const m of backup.match) tx = tx.delete(m._id)
  for (const h of backup.h2h)   tx = tx.delete(h._id)

  // rikishi: createOrReplace для наших 8 (детерміновані _id),
  // видалити зайвих (хто в базі, але не в списку — напр., вибулі з топ-8)
  const keepIds = new Set(RIKISHI.map(r => `rikishi-${r[1].toLowerCase()}`))
  const legacy = backup.rikishi.filter(r => !keepIds.has(r._id))
  for (const r of RIKISHI) tx = tx.createOrReplace(rikishiDoc(r))
  for (const r of legacy)  tx = tx.delete(r._id)

  // tournament: замінюю всі наявні одним новим (щоб не плодити)
  for (const t of backup.tournament) if (t._id !== TOURNAMENT._id) tx = tx.delete(t._id)
  tx = tx.createOrReplace(TOURNAMENT)

  if (DRY) {
    console.log('DRY RUN — транзакцію НЕ виконано. План:')
    console.log(`  видалити match: ${backup.match.length}, h2h: ${backup.h2h.length}`)
    console.log(`  createOrReplace rikishi: ${RIKISHI.length}, видалити legacy rikishi: ${legacy.length} (${legacy.map(r=>r.name||r._id).join(', ')||'—'})`)
    console.log(`  tournament -> "${TOURNAMENT.name}"`)
    return
  }

  await tx.commit()
  console.log('✅ Готово: Наґоя Басьо 2026 (8 санъяку, W-L 0-0, matches/h2h зачищені)')
  console.log('   Далі: 10-11 липня — торікумі дня 1 → nextOpponent + match-документи; currentDay=1 на старті.')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
