/* countries_i18n_v2 */
import { currentBashoId } from '../../lib/bashoCalendar' /* auto_current_v3 */
const SUMO_API = 'https://sumo-api.com/api'
const CURRENT_BASHO = currentBashoId()

const COUNTRY_FLAGS = {
  'Mongolia': { flag: '🇲🇳', name: { uk: 'Монголія', en: 'Mongolia', ja: 'モンゴル' } },
  'Ukraine': { flag: '🇺🇦', name: { uk: 'Україна', en: 'Ukraine', ja: 'ウクライナ' } },
  'Georgia': { flag: '🇬🇪', name: { uk: 'Грузія', en: 'Georgia', ja: 'ジョージア' } },
  'Bulgaria': { flag: '🇧🇬', name: { uk: 'Болгарія', en: 'Bulgaria', ja: 'ブルガリア' } },
  'Russia': { flag: '🏳️', name: { uk: '404', en: '404', ja: '404' } },
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
  if (shusshin.includes('- Russia')) return { flag: '🏳️', name: '404' }
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

export async function GET() {
  try {
    const banzukeRes = await fetch(
      `${SUMO_API}/basho/${CURRENT_BASHO}/banzuke/Makuuchi`,
      { next: { revalidate: 3600 } }
    )
    const banzuke = await banzukeRes.json()
    const all = [...(banzuke.east || []), ...(banzuke.west || [])]

    const rikishi = await Promise.all(
      all.map(async r => {
        const [infoRes, statsRes] = await Promise.all([
          fetch(`${SUMO_API}/rikishi/${r.rikishiID}`, { next: { revalidate: 86400 } }),
          fetch(`${SUMO_API}/rikishi/${r.rikishiID}/stats`, { next: { revalidate: 3600 } }),
        ])
        const info = await infoRes.json()
        const stats = await statsRes.json()

        const record = r.record || []
        const wins = record.filter(m => ['win','fusen win'].includes(m.result)).length
        const losses = record.filter(m => ['loss','fusen loss'].includes(m.result)).length
        const birthDate = info.birthDate ? new Date(info.birthDate) : null
        const age = birthDate ? Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000)) : null

        return {
          id: r.rikishiID,
          name: r.shikonaEn,
          nameJp: r.shikonaJp,
          rank: r.rank,
          rankValue: r.rankValue || 999,
          wins,
          losses,
          country: getCountry(info.shusshin),
          age,
          height: info.height,
          weight: info.weight,
          debut: info.debut,
          heya: info.heya,
          shusshin: info.shusshin,
          record: record.map((m, i) => ({
            day: i + 1,
            result: m.result,
            opponent: m.opponentShikonaEn,
            opponentJp: m.opponentShikonaJp || null,  /* ja_opponents_v1 */
            kimarite: m.kimarite,
          })),
          stats: {
          totalMatches: stats.totalMatches || 0,
          totalWins: stats.totalWins || 0,
          totalLosses: stats.totalLosses || 0,
          yusho: stats.yusho || 0,
          yushoByDivision: stats.yushoByDivision || {},
          makuuchiMatches: stats.totalByDivision?.Makuuchi || 0,
          makuuchiWins: stats.winsByDivision?.Makuuchi || 0,
          makuuchiBasho: stats.bashoByDivision?.Makuuchi || 0,
          sansho: stats.sansho || {},
        }
        }
      })
    )

    rikishi.sort((a, b) => a.rankValue - b.rankValue)
    return Response.json({ rikishi })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}