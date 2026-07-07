/* rikishi_matches_route_v1: matchi rikishi za dovilnyi basho (dlia selektora na /rikishi) */
const SUMO_API = 'https://sumo-api.com/api'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const rikishiId = searchParams.get('rikishiId')
  const bashoId = searchParams.get('bashoId')
  if (!rikishiId || !bashoId) {
    return Response.json({ error: 'rikishiId and bashoId required' }, { status: 400 })
  }
  try {
    const res = await fetch(`${SUMO_API}/rikishi/${rikishiId}/matches?bashoId=${bashoId}`, {
      next: { revalidate: 3600 }
    })
    if (!res.ok) return Response.json({ record: [] })
    const data = await res.json()
    const matches = (data.records || []).sort((a, b) => (a.day || 0) - (b.day || 0))
    const record = matches.map(m => {
      const isEast = String(m.eastId) === String(rikishiId)
      const won = String(m.winnerId) === String(rikishiId)
      return {
        day: m.day,
        result: m.kimarite === 'fusen' ? (won ? 'fusen win' : 'fusen loss') : (won ? 'win' : 'loss'),
        opponent: isEast ? m.westShikona : m.eastShikona,
        opponentJp: null,
        kimarite: m.kimarite,
      }
    })
    const wins = record.filter(m => ['win','fusen win'].includes(m.result)).length
    const losses = record.filter(m => ['loss','fusen loss'].includes(m.result)).length
    return Response.json({ record, wins, losses })
  } catch (e) {
    return Response.json({ record: [] })
  }
}
