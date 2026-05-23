export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const day = searchParams.get('day') || 14
  const bashoId = searchParams.get('basho') || '202605'

  const res = await fetch(
    `https://sumo-api.com/api/basho/${bashoId}/torikumi/Makuuchi/${day}`,
    { next: { revalidate: 60 } }
  )
  const data = await res.json()
  return Response.json(data.torikumi || [])
}