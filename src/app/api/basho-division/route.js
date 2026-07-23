/* division_api_v1: povnyi propc-paket dlia dovilnoho dyvizionu */
import { getBashoData } from '../../lib/bashoData'

const DIVISIONS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const division = searchParams.get('division')
  const basho = searchParams.get('basho')  /* basho_param_v1 */
  if (!DIVISIONS.includes(division)) {
    return Response.json({ error: 'bad division' }, { status: 400 })
  }
  try {
    const data = await getBashoData(division, basho && /^[0-9]{6}$/.test(basho) ? basho : null)  /* basho_param_v1 */
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: 'fetch failed' }, { status: 502 })
  }
}
