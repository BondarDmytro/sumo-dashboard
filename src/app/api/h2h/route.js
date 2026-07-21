export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')
  if (!id1 || !id2) return Response.json({ wins1: 0, wins2: 0, total: 0 })

  try {
    const res = await fetch(
      `https://sumo-api.com/api/rikishi/${id1}/matches?limit=2000`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const matches = data.records || []
    const vsMatches = matches.filter(m =>
      (m.eastId === parseInt(id2) || m.westId === parseInt(id2))
    )
    const wins1 = vsMatches.filter(m => m.winnerId === parseInt(id1)).length
    const wins2 = vsMatches.filter(m => m.winnerId === parseInt(id2)).length
    const bouts = vsMatches
      .map(m => {
        const r1IsEast = m.eastId === parseInt(id1)  /* h2h_ranks_v1 */
        return { b: m.bashoId, day: m.day, division: m.division || '', kimarite: m.kimarite || '', winnerId: m.winnerId,
          r1Rank: r1IsEast ? m.eastRank : m.westRank, r2Rank: r1IsEast ? m.westRank : m.eastRank }
      })
      .sort((x, y) => String(y.b).localeCompare(String(x.b)) || (y.day - x.day))
      .slice(0, 30)  /* h2h_bouts_v1 */
    return Response.json({ wins1, wins2, total: vsMatches.length, bouts })
  } catch {
    return Response.json({ wins1: 0, wins2: 0, total: 0 })
  }
}