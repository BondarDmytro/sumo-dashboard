export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')
  if (!id1 || !id2) return Response.json({ wins1: 0, wins2: 0, total: 0 })

  try {
    const res = await fetch(
      `https://sumo-api.com/api/rikishi/${id1}/matches?limit=500`,
      { next: { revalidate: 3600 } }
    )
    const data = await res.json()
    const matches = data.records || []
    const vsMatches = matches.filter(m =>
      (m.eastId === parseInt(id2) || m.westId === parseInt(id2))
    )
    const wins1 = vsMatches.filter(m => m.winnerId === parseInt(id1)).length
    const wins2 = vsMatches.filter(m => m.winnerId === parseInt(id2)).length
    return Response.json({ wins1, wins2, total: vsMatches.length })
  } catch {
    return Response.json({ wins1: 0, wins2: 0, total: 0 })
  }
}