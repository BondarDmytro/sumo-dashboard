/* news_rss_v1: NHK sport RSS, sumo filter, 30min cache */
const FEED = 'https://www3.nhk.or.jp/rss/news/cat7.xml'
const KEYWORDS = ['相撲', '場所', '力士', '横綱', '大関', '関脇', '小結', '幕内']

function pick(tag, s) {
  const m = s.match(new RegExp('<' + tag + '>(.*?)</' + tag + '>', 's'))
  return m ? m[1].replace('<![CDATA[', '').replace(']]>', '').trim() : null
}

export async function GET(request) {  /* news_limit_v1 */
  const limit = Math.min(30, parseInt(new URL(request.url).searchParams.get('limit') || '6', 10) || 6)
  try {
    const res = await fetch(FEED, { next: { revalidate: 1800 } })
    const xml = await res.text()
    const items = [...xml.matchAll(/<item>(.*?)<\/item>/gs)].map(m => m[1])
    const news = items
      .filter(i => KEYWORDS.some(k => i.includes(k)))
      .map(i => ({
        title: pick('title', i),
        link: pick('link', i),
        date: pick('pubDate', i),
      }))
      .filter(n => n.title && n.link)
      .slice(0, limit)
    return Response.json({ news, source: 'NHK' })
  } catch (e) {
    return Response.json({ news: [], source: 'NHK' })
  }
}
