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
  let torikumi = data.torikumi || []
  /* torikumi_synth_v1: fallback - syntez par z banzuke record[], poky ofitsiinyi torikumi ne opublikovano */
  const dayNum = parseInt(day, 10)
  if (torikumi.length === 0 && dayNum >= 1 && dayNum <= 15 && bashoId === currentBashoId()) {
    try {
      const bzRes = await fetch(`https://sumo-api.com/api/basho/${bashoId}/banzuke/${division}`, { next: { revalidate: 300 } })
      const bz = await bzRes.json()
      const all = [...(bz.east || []).map(r => ({ ...r, _side: 'East' })), ...(bz.west || []).map(r => ({ ...r, _side: 'West' }))]
      const byId = Object.fromEntries(all.map(r => [r.rikishiID, r]))
      const seen = new Set()
      const pairs = []
      for (const r of all) {
        const rec = (r.record || [])[dayNum - 1]
        const oppId = rec && rec.opponentID
        if (!oppId) continue
        const key = Math.min(r.rikishiID, oppId) + '-' + Math.max(r.rikishiID, oppId)
        if (seen.has(key)) continue
        seen.add(key)
        const opp = byId[oppId]
        if (!opp) continue  /* synth_reciprocity_v1: opponent poza dyvizionom abo smittia - chekaiemo ofitsiinyi */
        const orec = (opp.record || [])[dayNum - 1]
        if (!orec || orec.opponentID !== r.rikishiID) continue  /* vzaiemnist obov'iazkova */
        const rv = x => x?.rankValue || 999
        const [e, w] = rv(r) <= rv(opp) ? [r, opp] : [opp, r]
        pairs.push({
          id: `synth-${bashoId}-${dayNum}-${key}`,
          bashoId, division, day: dayNum,
          eastId: e?.rikishiID || r.rikishiID,
          eastShikona: e?.shikonaEn || (rec.opponentShikonaEn && e !== r ? r.shikonaEn : r.shikonaEn),
          eastRank: e?.rank || '',
          westId: w?.rikishiID || oppId,
          westShikona: w?.shikonaEn || rec.opponentShikonaEn || String(oppId),
          westRank: w?.rank || '',
          kimarite: '', winnerId: 0, winnerEn: '', winnerJp: '',
          synthetic: true,
          _rv: Math.min(rv(r), rv(opp)),
        })
      }
      pairs.sort((x, y) => y._rv - x._rv)
      torikumi = pairs.map((p, i) => { const { _rv, ...rest } = p; return { ...rest, matchNo: i + 1 } })
    } catch (e) { /* syntez ne vdovsia - viddaiemo porozhnio yak ranishe */ }
  }
  const enriched = torikumi.map(m => ({
    ...m,
    eastJp: JP_BY_ID[m.eastId] || null,  /* torikumi_jp_v1 */
    westJp: JP_BY_ID[m.westId] || null,
  }))
  return Response.json(enriched)
}