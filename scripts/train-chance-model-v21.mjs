/* train-chance-model-v21.mjs: модель 2.1 — базові фічі v2.0 + h2h/вік/BMI/кадобан/досвід/тиск
   Порівняльний holdout: v2.0 (9 фіч) vs v2.1 (16 фіч). У прод їде переможець. */
import fs from 'fs'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const meta = JSON.parse(fs.readFileSync('src/app/lib/rikishiMeta.json'))
const metaById = new Map(meta.map(m => [m.id, m]))
const files = fs.readdirSync('data/training').filter(f => /^\d{6}\.json$/.test(f)).sort() // хронологічно!
console.log(`basho: ${files.length}, meta: ${meta.length}`)

function firstWord(s) { return (s || '').split(/\s+/)[0] }
const W = r => (r.record || []).filter(m => RESULTS_WIN.includes(m.result)).length

// --- ПРОХІД 1: хронологічна історія для h2h/досвіду/кюджо-історії ---
// h2hAll: Map "idA|idB" -> wins A over B (накопичено ДО поточного басьо)
// mkHistory: Map id -> [чи був make-koshi в кожному минулому басьо], appearances: Map id -> count
const h2hAll = new Map()
const appearances = new Map()
const lastTwoKyujo = new Map() // id -> [bool, bool] останні 2 басьо
const prevMakeKoshi = new Map() // id -> чи був MK у попередньому басьо (для кадобана)
const prevRank = new Map() // id -> rankValue в попередньому басьо

const bashoData = files.map(f => {
  const d = JSON.parse(fs.readFileSync(`data/training/${f}`))
  d.all = [...(d.banzuke.east || []), ...(d.banzuke.west || [])].map(r => ({ ...r, record: r.record || [] })).filter(r => r.record.length > 0)
  return d
})

function snapshotFeatureState() {
  return { h2h: new Map(h2hAll), app: new Map(appearances), kyu: new Map(lastTwoKyujo), mk: new Map(prevMakeKoshi), pr: new Map(prevRank) }
}

const snapshots = [] // стан ПЕРЕД кожним басьо
for (const b of bashoData) {
  snapshots.push(snapshotFeatureState())
  // оновлюємо історію ПІСЛЯ снапшота
  for (const r of b.all) {
    appearances.set(r.rikishiID, (appearances.get(r.rikishiID) || 0) + 1)
    const wins = W(r)
    const losses = r.record.filter(m => RESULTS_LOSS.includes(m.result)).length
    const absent = r.record.filter(m => m.result === 'absent').length
    const arr = lastTwoKyujo.get(r.rikishiID) || []
    lastTwoKyujo.set(r.rikishiID, [absent > 3, ...arr].slice(0, 2))
    prevMakeKoshi.set(r.rikishiID, losses >= 8)
    prevRank.set(r.rikishiID, r.rankValue || 999)
    // h2h з record (opponentID є? перевіримо - якщо нема, матчимо по shikona)
    for (const m of r.record) {
      if (!RESULTS_WIN.includes(m.result)) continue
      const oppId = m.opponentID
      if (oppId) {
        const k = `${r.rikishiID}|${oppId}`
        h2hAll.set(k, (h2hAll.get(k) || 0) + 1)
      }
    }
  }
}
// контроль: чи record має opponentID
const sample = bashoData[0].all[0].record[0]
console.log('record sample keys:', Object.keys(sample || {}))
console.log(`h2h pairs accumulated: ${h2hAll.size}`)

// --- ПРОХІД 2: фічі ---
function ageAt(birthDate, bashoId) {
  if (!birthDate) return null
  const by = +birthDate.slice(0,4), bm = +birthDate.slice(5,7)
  const y = +bashoId.slice(0,4), m = +bashoId.slice(4)
  return y - by + (m - bm) / 12
}

const F20 = ['bias','negLosses','negBehind','negBehindXday','margin','rankTop','rankMid','form5','winsXday']
const F21 = [...F20, 'h2hLeaders','ageZ','kyujoHist']  /* v2.15 */

function baseFeatures(r, wins, losses, d, maxWinsCtx) {
  const remaining = 15 - wins - losses
  const behind = maxWinsCtx - wins
  const dayFrac = d / 15
  const rank = r.rankValue || 999
  const rec5 = r.record.slice(0, d).slice(-5)
  const rw = rec5.filter(m => RESULTS_WIN.includes(m.result)).length
  return [1, -losses, -behind, -behind*dayFrac, (wins+remaining)-maxWinsCtx,
    rank<=103?1:0, rank>103&&rank<=401?1:0, rec5.length?rw/rec5.length:0.5, wins*dayFrac]
}

function extFeatures(r, wins, losses, d, ctx, snap, bashoId) {
  const dayFrac = d / 15
  // h2h проти поточних ко-лідерів (career wins - losses, нормовано)
  let h2hNet = 0
  for (const L of ctx.leaders) {
    if (L.rikishiID === r.rikishiID) continue
    const w = snap.h2h.get(`${r.rikishiID}|${L.rikishiID}`) || 0
    const l = snap.h2h.get(`${L.rikishiID}|${r.rikishiID}`) || 0
    if (w + l > 0) h2hNet += (w - l) / (w + l)
  }
  const h2hLeaders = ctx.leaders.length ? h2hNet / ctx.leaders.length : 0
  const m = metaById.get(r.rikishiID)
  const age = m ? ageAt(m.birthDate, bashoId) : null
  const ageZ = age == null ? 0 : (age - 28) / 5           // z-score навколо 28р
  const bmi = m?.height && m?.weight ? m.weight / ((m.height/100)**2) : null
  const bmiZ = bmi == null ? 0 : (bmi - 47) / 6           // сумо-BMI ~47 середній
  // кадобан: озекі (200-299) + MK минулого басьо; тиск росте пізніми днями поки не набрав 8
  const isOzeki = (r.rankValue || 999) >= 200 && (r.rankValue || 999) < 300
  const kadoban = isOzeki && snap.mk.get(r.rikishiID) === true
  const kadobanPress = kadoban && wins < 8 ? dayFrac * (8 - wins) / 8 : 0
  // крок до качі-коші: близькість 8-ї перемоги (позитивний тиск) пізно
  const stepKachi = wins === 7 ? dayFrac : 0
  const exp = snap.app.get(r.rikishiID) || 0
  const expLog = Math.log(1 + exp)
  const debutLeading = exp === 0 && ctx.maxWinsCtx - wins === 0 ? 1 : 0
  const kyuArr = snap.kyu.get(r.rikishiID) || []
  const kyujoHist = kyuArr.filter(Boolean).length / 2
  return [h2hLeaders, ageZ, kyujoHist]  /* v2.15: tilky zhyvi fichi */
}

function buildExamples(version) {
  const examples = []
  bashoData.forEach((b, bi) => {
    const snap = snapshots[bi]
    const wName = firstWord(b.yushoWinner)
    const wIdx = b.all.findIndex(r => firstWord(r.shikonaEn) === wName)
    if (wIdx === -1) return
    for (let d = 3; d <= 14; d++) {
      const winsArr = b.all.map(r => r.record.slice(0, d).filter(m => RESULTS_WIN.includes(m.result)).length)
      const maxWinsCtx = Math.max(...winsArr)
      const leaders = b.all.filter((r, i) => winsArr[i] === maxWinsCtx)
      const ctx = { maxWinsCtx, leaders }
      const feats = b.all.map((r, i) => {
        const wins = winsArr[i]
        const losses = r.record.slice(0, d).filter(m => RESULTS_LOSS.includes(m.result)).length
        const base = baseFeatures(r, wins, losses, d, maxWinsCtx)
        return version === 21 ? [...base, ...extFeatures(r, wins, losses, d, ctx, snap, b.bashoId)] : base
      })
      examples.push({ feats, winnerIdx: wIdx, day: d, bashoId: b.bashoId })
    }
  })
  return examples
}

function softmaxLoss(w, ex) {
  const scores = ex.feats.map(fv => fv.reduce((s, x, i) => s + x * w[i], 0))
  const mx = Math.max(...scores)
  const exps = scores.map(s => Math.exp(s - mx))
  const Z = exps.reduce((a, b) => a + b, 0)
  const probs = exps.map(e => e / Z)
  return { probs, loss: -Math.log(Math.max(probs[ex.winnerIdx], 1e-12)) }
}
function train(examples, NF, epochs = 400, lr = 0.05, l2 = 1e-4) {
  let w = new Array(NF).fill(0)
  for (let ep = 0; ep < epochs; ep++) {
    const grad = new Array(NF).fill(0)
    for (const ex of examples) {
      const { probs } = softmaxLoss(w, ex)
      ex.feats.forEach((fv, j) => {
        const c = probs[j] - (j === ex.winnerIdx ? 1 : 0)
        for (let i = 0; i < NF; i++) grad[i] += c * fv[i]
      })
    }
    for (let i = 0; i < NF; i++) w[i] -= lr * (grad[i] / examples.length + l2 * w[i])
  }
  return w
}
function evalDay(examples, w) {
  const byDay = {}
  for (const ex of examples) {
    const { probs } = softmaxLoss(w, ex)
    const rank = probs.filter(p => p > probs[ex.winnerIdx]).length + 1
    ;(byDay[ex.day] ||= []).push(rank)
  }
  return byDay
}

for (const [name, ver] of [['v2.0', 20], ['v2.1', 21]]) {
  const ex = buildExamples(ver)
  const NF = ex[0].feats[0].length
  const tr = ex.filter(e => e.bashoId < '202503'), te = ex.filter(e => e.bashoId >= '202503')
  const w = train(tr, NF)
  const res = evalDay(te, w)
  console.log(`\n=== ${name} (${NF} фіч) HOLDOUT ===`)
  for (const d of Object.keys(res).sort((a,b)=>a-b)) {
    const arr = res[d]
    console.log(`day ${d}: avgRank=${(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2)} top1=${(arr.filter(x=>x===1).length/arr.length*100).toFixed(0)}%`)
  }
  if (ver === 21) {
    const wFull = train(ex, NF)
    console.log('v2.1 ваги (full):')
    F21.forEach((n, i) => console.log(`  ${n}: ${wFull[i].toFixed(3)}`))
    fs.writeFileSync('data/training/v21-weights-candidate.json', JSON.stringify({ w: wFull, featNames: F21 }, null, 2))
  }
}
