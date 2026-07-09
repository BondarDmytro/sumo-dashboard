/* all_divisions_v1: bio+stats odnoho rikishi po kliku; COUNTRY_FLAGS pereikhaly siudy zi spysku */
const SUMO_API = 'https://sumo-api.com/api'

const COUNTRY_FLAGS = {
  'Mongolia': { flag: '\u{1F1F2}\u{1F1F3}', name: { uk: '\u041c\u043e\u043d\u0433\u043e\u043b\u0456\u044f', en: 'Mongolia', ja: '\u30e2\u30f3\u30b4\u30eb' } },
  'Ukraine': { flag: '\u{1F1FA}\u{1F1E6}', name: { uk: '\u0423\u043a\u0440\u0430\u0457\u043d\u0430', en: 'Ukraine', ja: '\u30a6\u30af\u30e9\u30a4\u30ca' } },
  'Georgia': { flag: '\u{1F1EC}\u{1F1EA}', name: { uk: '\u0413\u0440\u0443\u0437\u0456\u044f', en: 'Georgia', ja: '\u30b8\u30e7\u30fc\u30b8\u30a2' } },
  'Bulgaria': { flag: '\u{1F1E7}\u{1F1EC}', name: { uk: '\u0411\u043e\u043b\u0433\u0430\u0440\u0456\u044f', en: 'Bulgaria', ja: '\u30d6\u30eb\u30ac\u30ea\u30a2' } },
  'Russia': { flag: '\u{1F3F3}\u{FE0F}', name: { uk: '404', en: '404', ja: '404' } },
  'China': { flag: '\u{1F1E8}\u{1F1F3}', name: { uk: '\u041a\u0438\u0442\u0430\u0439', en: 'China', ja: '\u4e2d\u56fd' } },
  'Brazil': { flag: '\u{1F1E7}\u{1F1F7}', name: { uk: '\u0411\u0440\u0430\u0437\u0438\u043b\u0456\u044f', en: 'Brazil', ja: '\u30d6\u30e9\u30b8\u30eb' } },
  'Kazakhstan': { flag: '\u{1F1F0}\u{1F1FF}', name: { uk: '\u041a\u0430\u0437\u0430\u0445\u0441\u0442\u0430\u043d', en: 'Kazakhstan', ja: '\u30ab\u30b6\u30d5\u30b9\u30bf\u30f3' } },
  'Kyrgyzstan': { flag: '\u{1F1F0}\u{1F1EC}', name: { uk: '\u041a\u0438\u0440\u0433\u0438\u0437\u0441\u0442\u0430\u043d', en: 'Kyrgyzstan', ja: '\u30ad\u30eb\u30ae\u30b9' } },
  'Czech Republic': { flag: '\u{1F1E8}\u{1F1FF}', name: { uk: '\u0427\u0435\u0445\u0456\u044f', en: 'Czechia', ja: '\u30c1\u30a7\u30b3' } },
  'Tonga': { flag: '\u{1F1F9}\u{1F1F4}', name: { uk: '\u0422\u043e\u043d\u0433\u0430', en: 'Tonga', ja: '\u30c8\u30f3\u30ac' } },
  'Uzbekistan': { flag: '\u{1F1FA}\u{1F1FF}', name: { uk: '\u0423\u0437\u0431\u0435\u043a\u0438\u0441\u0442\u0430\u043d', en: 'Uzbekistan', ja: '\u30a6\u30ba\u30d9\u30ad\u30b9\u30bf\u30f3' } },
  'Philippines': { flag: '\u{1F1F5}\u{1F1ED}', name: { uk: '\u0424\u0456\u043b\u0456\u043f\u043f\u0456\u043d\u0438', en: 'Philippines', ja: '\u30d5\u30a3\u30ea\u30d4\u30f3' } },
  'Egypt': { flag: '\u{1F1EA}\u{1F1EC}', name: { uk: '\u0404\u0433\u0438\u043f\u0435\u0442', en: 'Egypt', ja: '\u30a8\u30b8\u30d7\u30c8' } },
}
const JAPAN = { flag: '\u{1F1EF}\u{1F1F5}', name: { uk: '\u042f\u043f\u043e\u043d\u0456\u044f', en: 'Japan', ja: '\u65e5\u672c' } }

function getCountry(shusshin) {
  if (!shusshin) return JAPAN
  if (shusshin.includes('- Russia')) return { flag: '\u{1F3F3}\u{FE0F}', name: '404' }
  /* japan_default_v1: vse, shcho ne inozemna kraina zi spysku - Yaponiia (47 prefektur, riznyi format) */
  const country = Object.keys(COUNTRY_FLAGS).find(c => shusshin.startsWith(c))
  return country ? COUNTRY_FLAGS[country] : JAPAN
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id || !/^\d+$/.test(id)) return Response.json({ error: 'bad id' }, { status: 400 })
  try {
    const [infoRes, statsRes] = await Promise.all([
      fetch(`${SUMO_API}/rikishi/${id}`, { next: { revalidate: 86400 } }),
      fetch(`${SUMO_API}/rikishi/${id}/stats`, { next: { revalidate: 3600 } }),
    ])
    const info = await infoRes.json()
    const stats = await statsRes.json()
    const birthDate = info.birthDate ? new Date(info.birthDate) : null
    const age = birthDate ? Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000)) : null
    return Response.json({
      country: getCountry(info.shusshin),
      age,
      height: info.height,
      weight: info.weight,
      debut: info.debut,
      heya: info.heya,
      shusshin: info.shusshin,
      stats: {
        totalMatches: stats.totalMatches || 0,
        totalWins: stats.totalWins || 0,
        totalLosses: stats.totalLosses || 0,
        yusho: stats.yusho || 0,
        yushoByDivision: stats.yushoByDivision || {},
        makuuchiMatches: stats.totalByDivision?.Makuuchi || 0,
        makuuchiWins: stats.winsByDivision?.Makuuchi || 0,
        makuuchiBasho: stats.bashoByDivision?.Makuuchi || 0,
        sansho: stats.sansho || {},
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
