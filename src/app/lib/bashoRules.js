/* ja_batch4b */
// src/app/lib/bashoRules.js
// Автоматичні контекст-бейджі з правил сумо, обчислені з даних sumo-api
// (поточне + попереднє басьо). Без ручних списків. basho_rules_v1

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

// 202607 -> '202605'; 202601 -> '202511'
export function prevBashoId(bashoId) {
  const y = parseInt(String(bashoId).slice(0, 4), 10)
  const m = parseInt(String(bashoId).slice(4, 6), 10)
  const pm = m === 1 ? 11 : m - 2
  const py = m === 1 ? y - 1 : y
  return String(py) + String(pm).padStart(2, '0')
}

function isOzeki(rank) { return /^Ozeki/i.test(rank || '') }
function isSekiwake(rank) { return /^Sekiwake/i.test(rank || '') }

function summarizeRecord(record) {
  const rec = record || []
  const wins = rec.filter(m => RESULTS_WIN.includes(m.result)).length
  const losses = rec.filter(m => RESULTS_LOSS.includes(m.result)).length
  const absent = rec.filter(m => m.result === 'absent').length
  return { wins, losses, absent, played: wins + losses }
}

// prevBanzuke — сирий JSON banzuke попереднього басьо з sumo-api
export function applyBashoRules(rikishiList, prevBanzuke) {
  const prevAll = [...((prevBanzuke && prevBanzuke.east) || []), ...((prevBanzuke && prevBanzuke.west) || [])]
  const prevById = {}
  prevAll.forEach(r => { prevById[String(r.rikishiID)] = r })

  return rikishiList.map(r => {
    const prev = prevById[r._id]
    if (!prev) return r
    const p = summarizeRecord(prev.record)
    const badges = []
    let note = null

    // Повернення після повного кюджо
    if (p.played === 0 && p.absent > 0) {
      badges.push('returning')
      note = { uk: 'Повернення після пропущеного басьо', en: 'Returning after missed basho', ja: '休場明けの復帰' }
    }

    // Кадобан: озекі зараз, маке-коші (або кюджо) як озекі минулого разу
    if (isOzeki(r.rankFull) && isOzeki(prev.rank) && (p.losses > p.wins || p.played === 0)) {
      badges.push('kadoban')
      note = { uk: 'Кадобан: 8 перемог, щоб зберегти озекі', en: 'Kadoban: needs 8 wins to keep ozeki', ja: '角番: 大関防衛に8勝必要' }
    }

    // Повернення озекі: секіваке зараз, озекі минулого разу -> 10 перемог
    if (isSekiwake(r.rankFull) && isOzeki(prev.rank)) {
      badges.push('ozekiReturn')
      note = { uk: 'Екс-озекі: 10 перемог повертають ранг', en: 'Ex-ozeki: 10 wins restore the rank', ja: '元大関: 10勝で復帰' }
    }

    // Йокодзуна-ран (евристика): озекі зараз, >=12 перемог минулого басьо
    if (isOzeki(r.rankFull) && isOzeki(prev.rank) && p.wins >= 11) {  /* run_threshold_11 */
      badges.push('yokozunaRun')
      note = { uk: 'Йокодзуна-ран: юшо-результат дає підвищення', en: 'Yokozuna run: yusho-level result earns promotion', ja: '綱取り: 優勝相当の成績で昇進' }
    }

    if (badges.length === 0) return r
    return { ...r, badges, editorialNote: note }
  })
}
