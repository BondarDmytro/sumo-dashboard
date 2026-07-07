import { currentBashoId } from '../../lib/bashoCalendar' /* auto_current_v3 */
const SUMO_API = 'https://sumo-api.com/api'
const COUNTRY_FLAGS = {
  'Mongolia': { flag: '🇲🇳', name: 'Монголія' },
  'Ukraine': { flag: '🇺🇦', name: 'Україна' },
  'Georgia': { flag: '🇬🇪', name: 'Грузія' },
  'Bulgaria': { flag: '🇧🇬', name: 'Болгарія' },
  'Russia': { flag: '🇷🇺', name: 'Росія' },
  'China': { flag: '🇨🇳', name: 'Китай' },
  'Brazil': { flag: '🇧🇷', name: 'Бразилія' },
  'Kazakhstan': { flag: '🇰🇿', name: 'Казахстан' },
  'Kyrgyzstan': { flag: '🇰🇬', name: 'Киргизстан' },
  'Czech Republic': { flag: '🇨🇿', name: 'Чехія' },
  'Tonga': { flag: '🇹🇴', name: 'Тонга' },
  'Uzbekistan': { flag: '🇺🇿', name: 'Узбекистан' },
  'Philippines': { flag: '🇵🇭', name: 'Філіппіни' },
  'Egypt': { flag: '🇪🇬', name: 'Єгипет' },
}

function getCountry(shusshin) {
  if (!shusshin) return { flag: '🇯🇵', name: 'Японія' }

  // Roga — народився в Монголії але виступає за Росію
  if (shusshin.includes('- Russia')) return { flag: '🏳️', name: 'Росія (нейтральний)' }

  const isJapan = shusshin.includes('-ken') || shusshin.includes('-to') ||
                  shusshin.includes('-do') || shusshin.includes('-fu') ||
                  shusshin.includes('Tokyo') || shusshin.includes('Osaka') ||
                  shusshin.includes('Hokkaido') || shusshin.includes('Okinawa') ||
                  shusshin.includes('Aichi') || shusshin.includes('Fukuoka') ||
                  shusshin.includes('Hyogo') || shusshin.includes('Miyagi') ||
                  shusshin.includes('Niigata') || shusshin.includes('Nagano') ||
                  shusshin.includes('Kumamoto') || shusshin.includes('Kagoshima') ||
                  shusshin.includes('Hiroshima') || shusshin.includes('Kyoto')
  if (isJapan) return { flag: '🇯🇵', name: 'Японія' }
  const country = Object.keys(COUNTRY_FLAGS).find(c => shusshin.startsWith(c))
  return country ? COUNTRY_FLAGS[country] : { flag: '🌍', name: shusshin.split(',')[0] }
}
const CURRENT_BASHO = currentBashoId()
/* forecast_rules_v1: попередні басьо обчислюються, не хардкодяться */
function prevBashoId(bashoId) {
  const y = parseInt(String(bashoId).slice(0, 4), 10)
  const m = parseInt(String(bashoId).slice(4, 6), 10)
  const pm = m === 1 ? 11 : m - 2
  const py = m === 1 ? y - 1 : y
  return String(py) + String(pm).padStart(2, '0')
}
const PREV_BASHOS = [prevBashoId(CURRENT_BASHO)]
PREV_BASHOS.push(prevBashoId(PREV_BASHOS[0]))
PREV_BASHOS.push(prevBashoId(PREV_BASHOS[1]))

async function getRikishiMatches(id) {
  const res = await fetch(`${SUMO_API}/rikishi/${id}/matches?limit=60`, {
    next: { revalidate: 3600 }
  })
  const data = await res.json()
  const records = data.records || []

  const byBasho = {}
  records.forEach(m => {
    const b = m.bashoId
    if (!byBasho[b]) byBasho[b] = { wins: 0, losses: 0, division: m.division }
    if (m.winnerId === id) byBasho[b].wins++
    else byBasho[b].losses++
  })
  return byBasho
}

function getRankType(rank) {
  if (!rank) return 'other'
  if (rank.includes('Yokozuna')) return 'yokozuna'
  if (rank.includes('Ozeki')) return 'ozeki'
  if (rank.includes('Sekiwake')) return 'sekiwake'
  if (rank.includes('Komusubi')) return 'komusubi'
  if (rank.includes('Maegashira')) return 'maegashira'
  return 'other'
}

function getMaegashiraNum(rank) {
  const m = rank?.match(/Maegashira (\d+)/)
  return m ? parseInt(m[1]) : 99
}

function calcRankForecast(rikishi, matchHistory, currentBashoWins, currentBashoLosses, prevRank) {
  const rank = rikishi.rank
  const rankType = getRankType(rank)
  const forecasts = []

  const prev1 = matchHistory[PREV_BASHOS[0]] // минуле басьо
  const prev2 = matchHistory[PREV_BASHOS[1]] // 202601
  const prev3 = matchHistory[PREV_BASHOS[2]] // 3 басьо тому

  if (rankType === 'yokozuna') {
    const makekoshi = currentBashoLosses > currentBashoWins
    const prevMakekoshi = prev1 && prev1.losses > prev1.wins
    if (makekoshi && prevMakekoshi) {
      forecasts.push({ type: 'danger', text: '⚠ Тиск на відставку після 2 маке-коші поспіль' })
    } else if (makekoshi) {
      forecasts.push({ type: 'warning', text: '⚠ Маке-коші — очікується критика' })
    } else {
      forecasts.push({ type: 'info', text: 'Довічний ранг' })
    }
  }

  if (rankType === 'ozeki') {
    const currentWins = currentBashoWins
    const currentLosses = currentBashoLosses
    const prevKachikoshi = prev1 && prev1.wins >= 8  /* forecast_rules_v1: кюджо/часткове басьо = теж кадобан */
    const isKadoban = !prevKachikoshi

    // Кюджо на кадо-бані = автоматичний виліт
    const isKyujoThisBasho = currentWins === 0 && currentLosses === 0
    if (isKadoban && isKyujoThisBasho) {
      forecasts.push({ type: 'danger', text: '🔴 Кюджо на кадо-бані → виліт з Озекі на наступний турнір' })
      return forecasts
    }

    const currentMakekoshi = currentLosses > 7
    const remaining = 15 - currentWins - currentLosses
    const maxWins = currentWins + remaining

    if (isKadoban && currentMakekoshi) {
      forecasts.push({ type: 'danger', text: '🔴 Виліт з Озекі — 2 маке-коші поспіль → Секіваке' })
    } else if (isKadoban) {
      const needed = 8 - currentWins
      if (needed <= 0) {
        forecasts.push({ type: 'good', text: '✓ Кадо-бан знятий — ранг Озекі збережено' })
      } else if (maxWins >= 8) {
        forecasts.push({ type: 'warning', text: `⚠ Кадо-бан — потрібно ще ${needed} перемог` })
      } else {
        forecasts.push({ type: 'danger', text: `🔴 Кадо-бан — виліт неминучий (макс. ${maxWins}/8)` })
      }
    } else if (currentMakekoshi) {
      forecasts.push({ type: 'warning', text: '⚠ Маке-коші → наступний турнір кадо-бан' })
    } else {
      forecasts.push({ type: 'good', text: '✓ Ранг Озекі збережено' })
    }
    if (!isKadoban && prev1 && prev1.wins >= 11) {  /* forecast_rules_v1: йокодзуна-ран */
      forecasts.push({ type: 'info', text: '🏔 Йокодзуна-ран: юшо або еквівалент дає підвищення' })
    }
  }

  if (rankType === 'sekiwake') {
    if (prevRank && prevRank.includes('Ozeki')) {  /* forecast_rules_v1: екс-озекі, правило 10 перемог */
      const needed10 = Math.max(0, 10 - currentBashoWins)
      const played10 = currentBashoWins + currentBashoLosses
      const max10 = currentBashoWins + (15 - played10)
      if (currentBashoWins >= 10) {
        forecasts.push({ type: 'good', text: '✓ 10 перемог — повернення рангу Озекі' })
      } else if (max10 >= 10) {
        forecasts.push({ type: 'info', text: `Екс-озекі: ще ${needed10} перемог до повернення рангу (10 всього)` })
      } else {
        forecasts.push({ type: 'warning', text: '⚠ Повернення озекі за правилом 10 перемог вже недосяжне' })
      }
    }
    const winsThisBasho = currentBashoWins
    const winsPrev1 = prev1?.wins || 0
    const winsPrev2 = prev2?.wins || 0
    const total3 = winsThisBasho + winsPrev1 + winsPrev2
    const needed = Math.max(0, 33 - total3)
    const played = currentBashoWins + currentBashoLosses
    const remaining = 15 - played
    const maxTotal = (winsThisBasho + remaining) + winsPrev1 + winsPrev2

    if (total3 >= 33) {
      forecasts.push({ type: 'good', text: `✓ Озекі-кандидат — ${total3}/33 за 3 басьо в санʼяку` })
    } else if (maxTotal >= 33) {
      forecasts.push({ type: 'info', text: `Озекі-тест: ${total3}/33 — потрібно ще ${needed} перемог` })
    } else {
      forecasts.push({ type: 'info', text: `Озекі-тест: ${total3}/33 (цей цикл недостатній)` })
    }

    if (currentBashoLosses > currentBashoWins && played >= 8) {
      forecasts.push({ type: 'warning', text: '⚠ Маке-коші → можливе пониження до Комусубі' })
    } else if (currentBashoWins >= 8) {
      forecasts.push({ type: 'good', text: '✓ Качі-коші — ранг Секіваке збережено' })
    }
  }

  if (rankType === 'komusubi') {
    const played = currentBashoWins + currentBashoLosses
    if (currentBashoWins >= 10) {
      forecasts.push({ type: 'good', text: `✓ ${currentBashoWins} перемог → підвищення до Секіваке` })
    } else if (currentBashoWins >= 8) {
      forecasts.push({ type: 'good', text: '✓ Качі-коші — ранг Комусубі збережено' })
    } else if (played >= 8 && currentBashoLosses > currentBashoWins) {
      forecasts.push({ type: 'warning', text: '⚠ Маке-коші → пониження до Маєґашіра' })
    } else {
      const needed = 8 - currentBashoWins
      const remaining = 15 - played
      if (remaining > 0) {
        forecasts.push({ type: 'info', text: `Потрібно ще ${needed} перемог для качі-коші` })
      }
    }
  }

  if (rankType === 'maegashira') {
    const num = getMaegashiraNum(rank)
    if (currentBashoWins >= 11) {
      if (num >= 3) {
        forecasts.push({ type: 'good', text: `✓ ${currentBashoWins} перемог → можливе підвищення до Санʼяку` })
      } else {
        forecasts.push({ type: 'good', text: `✓ ${currentBashoWins} перемог → Санʼяку кандидат` })
      }
    } else if (currentBashoLosses > currentBashoWins) {
      forecasts.push({ type: 'warning', text: `⚠ Маке-коші → пониження в банзуке` })
    } else {
      forecasts.push({ type: 'info', text: `Качі-коші — ранг стабільний` })
    }
  }

  return forecasts
}

export async function GET() {
  try {
    const banzukeRes = await fetch(
      `${SUMO_API}/basho/${CURRENT_BASHO}/banzuke/Makuuchi`,
      { next: { revalidate: 3600 } }
    )
    const banzuke = await banzukeRes.json()
    const prevBanzukeRes = await fetch(`${SUMO_API}/basho/${PREV_BASHOS[0]}/banzuke/Makuuchi`, { next: { revalidate: 3600 } })  /* forecast_rules_v1 */
    const prevBanzuke = await prevBanzukeRes.json().catch(() => null)
    const prevRankById = {}
    ;[...((prevBanzuke && prevBanzuke.east) || []), ...((prevBanzuke && prevBanzuke.west) || [])].forEach(r => { prevRankById[String(r.rikishiID)] = r.rank })
    const all = [...(banzuke.east || []), ...(banzuke.west || [])]

    const sanyaku = all.filter(r => {
      const rv = r.rankValue || 999
      return rv <= 401
    })

    const results = await Promise.all(
      sanyaku.map(async r => {
        const record = r.record || []
        const wins = record.filter(m => ['win','fusen win'].includes(m.result)).length
        const losses = record.filter(m => ['loss','fusen loss'].includes(m.result)).length

        const [history, infoRes] = await Promise.all([
          getRikishiMatches(r.rikishiID),
          fetch(`${SUMO_API}/rikishi/${r.rikishiID}`, { next: { revalidate: 86400 } })
        ])
        const info = await infoRes.json()
        const forecasts = calcRankForecast(r, history, wins, losses, prevRankById[String(r.rikishiID)])

        const birthDate = info.birthDate ? new Date(info.birthDate) : null
        const age = birthDate ? Math.floor((new Date() - birthDate) / (1000 * 60 * 60 * 24 * 365.25)) : null
        const country = getCountry(info.shusshin)

        return {
          id: r.rikishiID,
          name: r.shikonaEn,
          rank: r.rank,
          rankValue: r.rankValue,
          wins,
          losses,
          prevBashos: PREV_BASHOS.map(b => ({
            bashoId: b,
            wins: history[b]?.wins || 0,
            losses: history[b]?.losses || 0,
          })),
          forecasts,
          bio: {
            age,
            height: info.height || null,
            weight: info.weight || null,
            debut: info.debut || null,
            heya: info.heya || null,
            country,
          }
        }
      })
    )
    

    results.sort((a, b) => (a.rankValue || 999) - (b.rankValue || 999))

    return Response.json({ rikishi: results })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
