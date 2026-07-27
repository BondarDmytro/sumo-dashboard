/* countries_i18n_v2 */
import { currentBashoId } from '../../lib/bashoCalendar' /* auto_current_v4 */
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

export async function GET() {
  try {
    const cur = currentBashoId()  /* bios_fallback_v1: mizhsezonnia - probe current, fallback prev */
    let banzukeRes = await fetch(
      `${SUMO_API}/basho/${cur}/banzuke/Makuuchi`,  /* auto_current_v4 */
      { next: { revalidate: 86400 } }
    )
    let banzuke = await banzukeRes.json().catch(() => ({}))
    if (!(banzuke.east || []).length && !(banzuke.west || []).length) {
      const py = cur.slice(4) === '01' ? String(Number(cur.slice(0,4)) - 1) : cur.slice(0,4)
      const pm = cur.slice(4) === '01' ? '11' : String(Number(cur.slice(4)) - 2).padStart(2, '0')
      banzukeRes = await fetch(
        `${SUMO_API}/basho/${py + pm}/banzuke/Makuuchi`,
        { next: { revalidate: 86400 } }
      )
      banzuke = await banzukeRes.json()
    }
    const rikishiIds = [
      ...(banzuke.east || []),
      ...(banzuke.west || [])
    ].map(r => r.rikishiID)

    const infoList = await Promise.all(
      rikishiIds.map(id =>
        fetch(`${SUMO_API}/rikishi/${id}`, { next: { revalidate: 86400 } })
          .then(r => r.json())
      )
    )

    const bios = {}
    infoList.forEach(r => {
      if (r.id) {
        bios[r.id] = {
          nameJp: r.shikonaJp || null,  /* bios_namejp_v1 */
          country: getCountry(r.shusshin),
          height: r.height || null,
          weight: r.weight || null,
        }
      }
    })

    return Response.json(bios)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}