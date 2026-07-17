import { currentBashoId } from '../../lib/bashoCalendar' /* auto_current_v3 */
import rikishiMeta from '../../lib/rikishiMeta.json' /* torikumi_jp_v1 */
const JP_BY_ID = Object.fromEntries(rikishiMeta.map(r => [r.id, r.nameJp]))
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const day = searchParams.get('day') || 14
  const division = ['Makuuchi','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi'].includes(searchParams.get('division')) ? searchParams.get('division') : 'Makuuchi'  /* division_torikumi_v1 */
  const bashoId = searchParams.get('basho') || currentBashoId()

  const res = await fetch(
    `https://sumo-api.com/api/basho/${bashoId}/torikumi/${division}/${day}`,
    { next: { revalidate: 60 } }
  )
  const data = await res.json()
  const enriched = (data.torikumi || []).map(m => ({
    ...m,
    eastJp: JP_BY_ID[m.eastId] || null,  /* torikumi_jp_v1 */
    westJp: JP_BY_ID[m.westId] || null,
  }))
  return Response.json(enriched)
}