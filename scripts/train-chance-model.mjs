/* train-chance-model.mjs: логістична (softmax) модель шансів на юшо
   Фічі на (рікіші, день) -> ваги -> src/app/lib/chanceWeights.json + бек-тест vs евристика */
import fs from 'fs'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const files = fs.readdirSync('data/training').filter(f => f.endsWith('.json'))
console.log(`basho files: ${files.length}`)

function firstWord(s) { return (s || '').split(/\s+/)[0] }

// --- фічі для рікіші r на день d (record зрізаний до d) ---
function features(r, d, ctx) {
  const rec = r.record.slice(0, d)
  const wins = rec.filter(m => RESULTS_WIN.includes(m.result)).length
  const losses = rec.filter(m => RESULTS_LOSS.includes(m.result)).length
  const remaining = 15 - wins - losses
  const maxSelf = wins + remaining
  const behind = ctx.maxWins - wins                    // відставання від лідера
  const margin = maxSelf - ctx.maxWins                 // запас стелі над лідером
  const dayFrac = d / 15
  const rank = r.rankValue || 999
  const rankTop = rank <= 103 ? 1 : 0                  // Y/O
  const rankMid = rank > 103 && rank <= 401 ? 1 : 0    // S/K/M верх
  const recent = rec.slice(-5)
  const rw = recent.filter(m => RESULTS_WIN.includes(m.result)).length
  const form = recent.length ? rw / recent.length : 0.5
  return [
    1,                        // bias
    -losses,                  // менше поразок = краще
    -behind,                  // відставання
    -behind * dayFrac,        // відставання болючіше пізніше
    margin,                   // запас стелі
    rankTop, rankMid,
    form,
    wins * dayFrac,           // накопичені перемоги вагоміші пізніше
  ]
}
const NF = 9

function buildExamples() {
  const examples = [] // { feats: [[...] x rikishi], winnerIdx }
  for (const f of files) {
    const { yushoWinner, banzuke } = JSON.parse(fs.readFileSync(`data/training/${f}`))
    const all = [...(banzuke.east || []), ...(banzuke.west || [])]
      .map(r => ({ ...r, record: r.record || [] }))
      .filter(r => r.record.length > 0)
    const wName = firstWord(yushoWinner)
    const wIdx = all.findIndex(r => firstWord(r.shikonaEn) === wName)
    if (wIdx === -1) { console.log(`WARN ${f}: winner ${wName} not in banzuke`); continue }
    for (let d = 3; d <= 14; d++) {   // дні 3-14 (день 1-2 майже шум, день 15 тривіальний)
      const winsArr = all.map(r => r.record.slice(0, d).filter(m => RESULTS_WIN.includes(m.result)).length)
      const ctx = { maxWins: Math.max(...winsArr) }
      examples.push({ feats: all.map(r => features(r, d, ctx)), rikishi: all, winnerIdx: wIdx, day: d, bashoId: f.replace('.json','') })
    }
  }
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

function train(examples, epochs = 300, lr = 0.05, l2 = 1e-4) {
  let w = new Array(NF).fill(0)
  for (let ep = 0; ep < epochs; ep++) {
    let totalLoss = 0
    const grad = new Array(NF).fill(0)
    for (const ex of examples) {
      const { probs, loss } = softmaxLoss(w, ex)
      totalLoss += loss
      ex.feats.forEach((fv, j) => {
        const coef = probs[j] - (j === ex.winnerIdx ? 1 : 0)
        for (let i = 0; i < NF; i++) grad[i] += coef * fv[i]
      })
    }
    for (let i = 0; i < NF; i++) w[i] -= lr * (grad[i] / examples.length + l2 * w[i])
    if (ep % 50 === 0) console.log(`epoch ${ep}: loss=${(totalLoss/examples.length).toFixed(4)}`)
  }
  return w
}

// --- бек-тест: середній ранг чемпіона в прогнозі по днях, модель vs евристика ---
function heuristicChance(r, d) {
  const rec = r.record.slice(0, d)
  const wins = rec.filter(m => RESULTS_WIN.includes(m.result)).length
  const losses = rec.filter(m => RESULTS_LOSS.includes(m.result)).length
  const remaining = 15 - wins - losses
  if (losses >= 5 || wins + remaining < 11) return 0
  let base = losses === 0 ? 85 : losses === 1 ? 55 : losses === 2 ? 25 : losses === 3 ? 8 : 2
  if (wins + remaining < 13) base *= 0.6
  const rank = r.rankValue || 999
  const rankBonus = rank <= 103 ? 1.3 : rank <= 201 ? 1.15 : rank <= 401 ? 1.05 : 1.0
  const recent = rec.slice(-5)
  const rw = recent.filter(m => RESULTS_WIN.includes(m.result)).length
  const formBonus = recent.length ? 0.9 + rw / recent.length * 0.2 : 1.0
  return base * rankBonus * formBonus
}

function backtest(examples, w) {
  const byDay = {}
  for (const ex of examples) {
    const { probs } = softmaxLoss(w, ex)
    const rankModel = probs.filter(p => p > probs[ex.winnerIdx]).length + 1
    const hs = ex.rikishi.map(r => heuristicChance(r, ex.day))
    const rankHeur = hs.filter(h => h > hs[ex.winnerIdx]).length + 1
    if (!byDay[ex.day]) byDay[ex.day] = { model: [], heur: [] }
    byDay[ex.day].model.push(rankModel)
    byDay[ex.day].heur.push(rankHeur)
  }
  console.log('\n=== backtest: середній ранг чемпіона в прогнозі моделі ===')
  for (const d of Object.keys(byDay).sort((a,b)=>a-b)) {
    const m = byDay[d].model, h = byDay[d].heur
    const avgM = m.reduce((a,b)=>a+b,0)/m.length, avgH = h.reduce((a,b)=>a+b,0)/h.length
    const t1M = m.filter(x=>x===1).length/m.length, t1H = h.filter(x=>x===1).length/h.length
    console.log(`day ${d}: MODEL avgRank=${avgM.toFixed(2)} top1=${(t1M*100).toFixed(0)}%  |  HEUR avgRank=${avgH.toFixed(2)} top1=${(t1H*100).toFixed(0)}%`)
  }
}

const examples = buildExamples()
console.log(`examples: ${examples.length}`)
/* HOLDOUT: train < 202503, test >= 202503 (6 останніх басьо) */
const trainEx = examples.filter(e => true)  // повний трен для прод-ваг
const holdTrain = examples.filter(e => e.bashoId < '202503')
const holdTest = examples.filter(e => e.bashoId >= '202503')
console.log(`holdout: train=${holdTrain.length} test=${holdTest.length}`)
const wHold = train(holdTrain, 300, 0.05, 1e-4)
console.log('\n=== HOLDOUT TEST (модель не бачила цих басьо) ===')
backtest(holdTest, wHold)
console.log('\n=== full train (прод-ваги) ===')
const w = train(trainEx)
console.log('weights:', w.map(x => +x.toFixed(4)))
backtest(examples, w)
fs.mkdirSync('src/app/lib', { recursive: true })
fs.writeFileSync('src/app/lib/chanceWeights.json', JSON.stringify({ w, featNames: ['bias','negLosses','negBehind','negBehindXday','margin','rankTop','rankMid','form5','winsXday'], trainedOn: files.length, date: new Date().toISOString().slice(0,10) }, null, 2))
console.log('\nsaved src/app/lib/chanceWeights.json')
