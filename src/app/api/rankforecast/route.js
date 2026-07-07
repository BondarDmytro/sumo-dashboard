/* countries_i18n_v1 */
/* forecast_i18n_v1 */
import { currentBashoId } from '../../lib/bashoCalendar' /* auto_current_v3 */
const SUMO_API = 'https://sumo-api.com/api'
const COUNTRY_FLAGS = {
  'Mongolia': { flag: '🇲🇳', name: { uk: 'Монголія', en: 'Mongolia', ja: 'モンゴル' } },
  'Ukraine': { flag: '🇺🇦', name: { uk: 'Україна', en: 'Ukraine', ja: 'ウクライナ' } },
  'Georgia': { flag: '🇬🇪', name: { uk: 'Грузія', en: 'Georgia', ja: 'ジョージア' } },
  'Bulgaria': { flag: '🇧🇬', name: { uk: 'Болгарія', en: 'Bulgaria', ja: 'ブルガリア' } },
  'Russia': { flag: '🇷🇺', name: { uk: 'Росія', en: 'Russia', ja: 'ロシア' } },
  'China': { flag: '🇨🇳', name: { uk: 'Китай', en: 'China', ja: '中国' } },
  'Brazil': { flag: '🇧🇷', name: { uk: 'Бразилія', en: 'Brazil', ja: 'ブラジル' } },
  'Kazakhstan': { flag: '🇰🇿', name: { uk: 'Казахстан', en: 'Kazakhstan', ja: 'カザフスタン' } },
  'Kyrgyzstan': { flag: '🇰🇬', name: { uk: 'Киргизстан', en: 'Kyrgyzstan', ja: 'キルギス' } },
  'Czech Republic': { flag: '🇨🇿', name: { uk: 'Чехія', en: 'Czechia', ja: 'チェコ' } },
  'Tonga': { flag: '🇹🇴', name: { uk: 'Тонга', en: 'Tonga', ja: 'トンガ' } },
  'Uzbekistan': { flag: '🇺🇿', name: { uk: 'Узбекистан', en: 'Uzbekistan', ja: 'ウズベキスタン' } },
  'Philippines': { flag: '🇵🇭', name: { uk: 'Філіппіни', en: 'Philippines', ja: 'フィリピン' } },
  'Egypt': { flag: '🇪🇬', name: { uk: 'Єгипет', en: 'Egypt', ja: 'エジプト' } },
}

function getCountry(shusshin) {
  if (!shusshin) return { flag: '🇯🇵', name: { uk: 'Японія', en: 'Japan', ja: '日本' } }

  // Roga — народився в Монголії але виступає за Росію
  if (shusshin.includes('- Russia')) return { flag: '🏳️', name: { uk: 'Росія (нейтральний)', en: 'Russia (neutral)', ja: 'ロシア（中立）' } }

  const isJapan = shusshin.includes('-ken') || shusshin.includes('-to') ||
                  shusshin.includes('-do') || shusshin.includes('-fu') ||
                  shusshin.includes('Tokyo') || shusshin.includes('Osaka') ||
                  shusshin.includes('Hokkaido') || shusshin.includes('Okinawa') ||
                  shusshin.includes('Aichi') || shusshin.includes('Fukuoka') ||
                  shusshin.includes('Hyogo') || shusshin.includes('Miyagi') ||
                  shusshin.includes('Niigata') || shusshin.includes('Nagano') ||
                  shusshin.includes('Kumamoto') || shusshin.includes('Kagoshima') ||
                  shusshin.includes('Hiroshima') || shusshin.includes('Kyoto')
  if (isJapan) return { flag: '🇯🇵', name: { uk: 'Японія', en: 'Japan', ja: '日本' } }
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
      forecasts.push({ type: 'danger', text: { uk: '⚠ Тиск на відставку після 2 маке-коші поспіль', en: '⚠ Retirement pressure after 2 straight make-koshi', ja: '⚠ 2場所連続負け越しで引退圧力' } })
    } else if (makekoshi) {
      forecasts.push({ type: 'warning', text: { uk: '⚠ Маке-коші — очікується критика', en: '⚠ Make-koshi — criticism expected', ja: '⚠ 負け越し — 批判必至' } })
    } else {
      forecasts.push({ type: 'info', text: { uk: 'Довічний ранг', en: 'Rank for life', ja: '終身地位' } })
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
      forecasts.push({ type: 'danger', text: { uk: '🔴 Кюджо на кадо-бані → виліт з Озекі на наступний турнір', en: '🔴 Kyujo while kadoban → loses Ozeki next basho', ja: '🔴 角番で休場 → 来場所大関陥落' } })
      return forecasts
    }

    const currentMakekoshi = currentLosses > 7
    const remaining = 15 - currentWins - currentLosses
    const maxWins = currentWins + remaining

    if (isKadoban && currentMakekoshi) {
      forecasts.push({ type: 'danger', text: { uk: '🔴 Виліт з Озекі — 2 маке-коші поспіль → Секіваке', en: '🔴 Ozeki demotion — 2 straight make-koshi → Sekiwake', ja: '🔴 2場所連続負け越しで大関陥落 → 関脇' } })
    } else if (isKadoban) {
      const needed = 8 - currentWins
      if (needed <= 0) {
        forecasts.push({ type: 'good', text: { uk: '✓ Кадо-бан знятий — ранг Озекі збережено', en: '✓ Kadoban cleared — Ozeki rank retained', ja: '✓ 角番脱出 — 大関防衛' } })
      } else if (maxWins >= 8) {
        forecasts.push({ type: 'warning', text: { uk: `⚠ Кадо-бан — потрібно ще ${needed} перемог`, en: `⚠ Kadoban — ${needed} more wins needed`, ja: `⚠ 角番 — あと${needed}勝必要` } })
      } else {
        forecasts.push({ type: 'danger', text: { uk: `🔴 Кадо-бан — виліт неминучий (макс. ${maxWins}/8)`, en: `🔴 Kadoban — demotion inevitable (max ${maxWins}/8)`, ja: `🔴 角番 — 陥落確定（最大${maxWins}/8）` } })
      }
    } else if (currentMakekoshi) {
      forecasts.push({ type: 'warning', text: { uk: '⚠ Маке-коші → наступний турнір кадо-бан', en: '⚠ Make-koshi → kadoban next basho', ja: '⚠ 負け越し → 来場所角番' } })
    } else {
      forecasts.push({ type: 'good', text: { uk: '✓ Ранг Озекі збережено', en: '✓ Ozeki rank retained', ja: '✓ 大関防衛' } })
    }
    if (!isKadoban && prev1 && prev1.wins >= 11) {  /* forecast_rules_v1: йокодзуна-ран */
      forecasts.push({ type: 'info', text: { uk: '🏔 Йокодзуна-ран: юшо або еквівалент дає підвищення', en: '🏔 Yokozuna run: yusho or equivalent earns promotion', ja: '🏔 綱取り: 優勝または同等成績で昇進' } })
    }
  }

  if (rankType === 'sekiwake') {
    if (prevRank && prevRank.includes('Ozeki')) {  /* forecast_rules_v1: екс-озекі, правило 10 перемог */
      const needed10 = Math.max(0, 10 - currentBashoWins)
      const played10 = currentBashoWins + currentBashoLosses
      const max10 = currentBashoWins + (15 - played10)
      if (currentBashoWins >= 10) {
        forecasts.push({ type: 'good', text: { uk: '✓ 10 перемог — повернення рангу Озекі', en: '✓ 10 wins — Ozeki rank regained', ja: '✓ 10勝で大関復帰' } })
      } else if (max10 >= 10) {
        forecasts.push({ type: 'info', text: { uk: `Екс-озекі: ще ${needed10} перемог до повернення рангу (10 всього)`, en: `Ex-Ozeki: ${needed10} more wins to regain rank (10 total)`, ja: `元大関: 復帰まであと${needed10}勝（合計10勝）` } })
      } else {
        forecasts.push({ type: 'warning', text: { uk: '⚠ Повернення озекі за правилом 10 перемог вже недосяжне', en: '⚠ 10-win Ozeki return no longer possible', ja: '⚠ 10勝での大関復帰は不可能' } })
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
      forecasts.push({ type: 'good', text: { uk: `✓ Озекі-кандидат — ${total3}/33 за 3 басьо в санʼяку`, en: `✓ Ozeki candidate — ${total3}/33 over 3 basho in san'yaku`, ja: `✓ 大関候補 — 三役で3場所${total3}/33` } })
    } else if (maxTotal >= 33) {
      forecasts.push({ type: 'info', text: { uk: `Озекі-тест: ${total3}/33 — потрібно ще ${needed} перемог`, en: `Ozeki test: ${total3}/33 — ${needed} more wins needed`, ja: `大関取り: ${total3}/33 — あと${needed}勝必要` } })
    } else {
      forecasts.push({ type: 'info', text: { uk: `Озекі-тест: ${total3}/33 (цей цикл недостатній)`, en: `Ozeki test: ${total3}/33 (this cycle insufficient)`, ja: `大関取り: ${total3}/33（今回は不十分）` } })
    }

    if (currentBashoLosses > currentBashoWins && played >= 8) {
      forecasts.push({ type: 'warning', text: { uk: '⚠ Маке-коші → можливе пониження до Комусубі', en: '⚠ Make-koshi → possible demotion to Komusubi', ja: '⚠ 負け越し → 小結陥落の可能性' } })
    } else if (currentBashoWins >= 8) {
      forecasts.push({ type: 'good', text: { uk: '✓ Качі-коші — ранг Секіваке збережено', en: '✓ Kachi-koshi — Sekiwake rank retained', ja: '✓ 勝ち越し — 関脇防衛' } })
    }
  }

  if (rankType === 'komusubi') {
    const played = currentBashoWins + currentBashoLosses
    if (currentBashoWins >= 10) {
      forecasts.push({ type: 'good', text: { uk: `✓ ${currentBashoWins} перемог → підвищення до Секіваке`, en: `✓ ${currentBashoWins} wins → promotion to Sekiwake`, ja: `✓ ${currentBashoWins}勝 → 関脇昇進` } })
    } else if (currentBashoWins >= 8) {
      forecasts.push({ type: 'good', text: { uk: '✓ Качі-коші — ранг Комусубі збережено', en: '✓ Kachi-koshi — Komusubi rank retained', ja: '✓ 勝ち越し — 小結防衛' } })
    } else if (played >= 8 && currentBashoLosses > currentBashoWins) {
      forecasts.push({ type: 'warning', text: { uk: '⚠ Маке-коші → пониження до Маєґашіра', en: '⚠ Make-koshi → demotion to Maegashira', ja: '⚠ 負け越し → 前頭陥落' } })
    } else {
      const needed = 8 - currentBashoWins
      const remaining = 15 - played
      if (remaining > 0) {
        forecasts.push({ type: 'info', text: { uk: `Потрібно ще ${needed} перемог для качі-коші`, en: `${needed} more wins needed for kachi-koshi`, ja: `勝ち越しまであと${needed}勝` } })
      }
    }
  }

  if (rankType === 'maegashira') {
    const num = getMaegashiraNum(rank)
    if (currentBashoWins >= 11) {
      if (num >= 3) {
        forecasts.push({ type: 'good', text: { uk: `✓ ${currentBashoWins} перемог → можливе підвищення до Санʼяку`, en: `✓ ${currentBashoWins} wins → possible San'yaku promotion`, ja: `✓ ${currentBashoWins}勝 → 三役昇進の可能性` } })
      } else {
        forecasts.push({ type: 'good', text: { uk: `✓ ${currentBashoWins} перемог → Санʼяку кандидат`, en: `✓ ${currentBashoWins} wins → San'yaku candidate`, ja: `✓ ${currentBashoWins}勝 → 三役候補` } })
      }
    } else if (currentBashoLosses > currentBashoWins) {
      forecasts.push({ type: 'warning', text: { uk: `⚠ Маке-коші → пониження в банзуке`, en: `⚠ Make-koshi → banzuke demotion`, ja: `⚠ 負け越し → 番付降下` } })
    } else {
      forecasts.push({ type: 'info', text: { uk: `Качі-коші — ранг стабільний`, en: `Kachi-koshi — rank stable`, ja: `勝ち越し — 地位安定` } })
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
          nameJp: r.shikonaJp,
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
