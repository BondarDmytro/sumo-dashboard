// yt_videos_fetch_v1: parsyt nazvy video kanalu @sumo-video u mapu bashoId/day/pair -> videoId
// zapusk: YT_API_KEY=xxx node scripts/fetch-yt-videos.mjs 202605
import fs from 'node:fs'

const KEY = process.env.YT_API_KEY
const TARGET = process.argv[2] || '202605'
const OUT = 'src/app/lib/ytVideos.json'
const MAX_PAGES = 60
if (!KEY) { console.error('YT_API_KEY env required'); process.exit(1) }

const KANJI_NUM = { '\u4e00':1,'\u4e8c':2,'\u4e09':3,'\u56db':4,'\u4e94':5,'\u516d':6,'\u4e03':7,'\u516b':8,'\u4e5d':9 }
function numFrom(s) {
  // povnoshyrynni tsyfry
  let t = s.replace(/[\uff10-\uff19]/g, c => String(c.charCodeAt(0) - 0xff10))
  if (/^\d+$/.test(t)) return parseInt(t)
  // kandzi: 十一 = 11, 十 = 10, 一 = 1
  if (t === '\u5341') return 10
  if (t.startsWith('\u5341')) return 10 + (KANJI_NUM[t[1]] || 0)
  if (t.endsWith('\u5341')) return (KANJI_NUM[t[0]] || 1) * 10
  if (t.includes('\u5341')) return (KANJI_NUM[t[0]] || 1) * 10 + (KANJI_NUM[t[2]] || 0)
  return KANJI_NUM[t] || null
}
function parseDay(s) {
  if (s === '\u521d\u65e5') return 1
  if (s === '\u4e2d\u65e5') return 8
  if (s === '\u5343\u79cb\u697d') return 15
  if (s === '\u512a\u52dd\u6c7a\u5b9a\u6226') return 16
  const m = s.match(/^(.+?)\u65e5\u76ee$/)
  return m ? numFrom(m[1]) : null
}
// zahalnyi shablon: ...NAMEAーNAMEB＜令和N年M月場所・DAY＞...
const RE = /(\S+?)\u30fc(\S+?)\uff1c\u4ee4\u548c(.+?)\u5e74(.+?)\u6708\u5834\u6240\u30fb(.+?)\uff1e/

async function yt(url) {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  return r.json()
}

const ch = await yt(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=sumo-video&key=${KEY}`)
const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
if (!uploads) { console.error('uploads playlist not found'); process.exit(1) }
console.log('uploads playlist:', uploads)

const cutoff = new Date(parseInt(TARGET.slice(0,4)), parseInt(TARGET.slice(4)) - 1, 1)
const found = {}
let pageToken = '', pages = 0, scanned = 0, done = false

while (!done && pages < MAX_PAGES) {
  const data = await yt(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploads}&maxResults=50${pageToken ? '&pageToken=' + pageToken : ''}&key=${KEY}`)
  pages++
  for (const it of data.items || []) {
    scanned++
    const title = it.snippet?.title || ''
    const published = new Date(it.snippet?.publishedAt || 0)
    if (published < cutoff) { done = true; break }
    const m = title.match(RE)
    if (!m) continue
    const year = 2018 + (numFrom(m[3]) || 0)
    const month = numFrom(m[4])
    if (!month) continue
    const bashoId = `${year}${String(month).padStart(2,'0')}`
    const day = parseDay(m[5])
    if (!day || bashoId !== TARGET) continue
    const dayKey = String(day)
    found[dayKey] = found[dayKey] || []
    found[dayKey].push({ a: m[1], b: m[2], v: it.snippet.resourceId?.videoId })
  }
  pageToken = data.nextPageToken
  if (!pageToken) done = true
}

const total = Object.values(found).reduce((s, arr) => s + arr.length, 0)
console.log(`scanned ${scanned} videos in ${pages} pages; matched ${total} bouts for ${TARGET}`)

let existing = {}
try { existing = JSON.parse(fs.readFileSync(OUT, 'utf-8')) } catch {}
existing[TARGET] = found
fs.writeFileSync(OUT, JSON.stringify(existing))
console.log(`written ${OUT}: days ${Object.keys(found).sort((a,b)=>a-b).join(',')}`)
