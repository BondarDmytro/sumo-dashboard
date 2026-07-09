/* all_divisions_v1: 6 banzuke-zapytiv zamist 84+ per-rikishi; lehkyi spysok, bio - v /api/rikishi-info */
import { currentBashoId } from '../../lib/bashoCalendar'
const SUMO_API = 'https://sumo-api.com/api'
const CURRENT_BASHO = currentBashoId()
const DIVISIONS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']

export async function GET() {
  try {
    const results = await Promise.all(DIVISIONS.map(async (div, di) => {
      const res = await fetch(`${SUMO_API}/basho/${CURRENT_BASHO}/banzuke/${div}`, { next: { revalidate: 3600 } })
      const banzuke = await res.json()
      const all = [...(banzuke.east || []), ...(banzuke.west || [])]
      return all.map(r => {
        const record = r.record || []
        const wins = record.filter(m => ['win','fusen win'].includes(m.result)).length
        const losses = record.filter(m => ['loss','fusen loss'].includes(m.result)).length
        return {
          id: r.rikishiID,
          name: r.shikonaEn,
          nameJp: r.shikonaJp,
          rank: r.rank,
          rankValue: (di * 10000) + (r.rankValue || 9999),
          division: div,
          wins, losses,
          record: record.map((m, i) => ({
            day: i + 1,
            result: m.result,
            opponent: m.opponentShikonaEn,
            opponentJp: m.opponentShikonaJp || null,
            kimarite: m.kimarite,
          })),
        }
      })
    }))
    const rikishi = results.flat()
    rikishi.sort((a, b) => a.rankValue - b.rankValue)
    return Response.json({ rikishi })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
