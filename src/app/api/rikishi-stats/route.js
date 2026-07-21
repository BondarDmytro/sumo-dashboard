/* rikishi_stats_v1: per-division stats dlia compare */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({})
  try {
    const res = await fetch(`https://sumo-api.com/api/rikishi/${id}/stats`, { next: { revalidate: 3600 } })
    const d = await res.json()
    const div = 'Makuuchi'
    const bouts = d.totalByDivision?.[div] || 0
    const losses = d.lossByDivision?.[div] || 0
    const wins = d.winsByDivision?.[div] ?? Math.max(0, bouts - losses)
    return Response.json({
      makuuchi: {
        basho: d.bashoByDivision?.[div] || 0,
        bouts, wins,
        yusho: d.yushoByDivision?.[div] ?? null,
      },
      sansho: d.sansho || {},
    })
  } catch {
    return Response.json({})
  }
}
