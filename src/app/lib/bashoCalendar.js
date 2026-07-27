import { ukrName, ukrRankLong } from './translit'  /* ukr_names_v1 */
// src/app/lib/bashoCalendar.js
// Календар басьо за правилами JSA: 6 турнірів/рік (січ/бер/тра/лип/вер/лис),
// старт = друга неділя місяця, 15 днів. Єдине джерело назв/міст/дат. basho_calendar_v1

const BASHO_MONTHS = [1, 3, 5, 7, 9, 11]

const META = {
  1:  { kanji: '初場所',   uk: 'Хатсу Басьо',  en: 'Hatsu Basho',  ja: '初場所',   cityUk: 'Токіо',   cityEn: 'Tokyo',   cityJa: '東京' },
  3:  { kanji: '春場所',   uk: 'Хару Басьо',   en: 'Haru Basho',   ja: '春場所',   cityUk: 'Осака',   cityEn: 'Osaka',   cityJa: '大阪' },
  5:  { kanji: '夏場所',   uk: 'Натсу Басьо',  en: 'Natsu Basho',  ja: '夏場所',   cityUk: 'Токіо',   cityEn: 'Tokyo',   cityJa: '東京' },
  7:  { kanji: '名古屋場所', uk: 'Наґоя Басьо', en: 'Nagoya Basho', ja: '名古屋場所', cityUk: 'Наґоя',  cityEn: 'Nagoya',  cityJa: '名古屋' },
  9:  { kanji: '秋場所',   uk: 'Акі Басьо',    en: 'Aki Basho',    ja: '秋場所',   cityUk: 'Токіо',   cityEn: 'Tokyo',   cityJa: '東京' },
  11: { kanji: '九州場所', uk: 'Кюшю Басьо',   en: 'Kyushu Basho', ja: '九州場所', cityUk: 'Фукуока', cityEn: 'Fukuoka', cityJa: '福岡' },
}

// День місяця другої неділі
function secondSundayDay(year, month) {
  const dow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay() // 0=нд
  const firstSunday = dow === 0 ? 1 : 8 - dow
  return firstSunday + 7
}

const VENUES = {  /* venue_v1 + venue_credits_v1: фото з Wikimedia Commons */
  1:  { name: 'Ryogoku Kokugikan',      img: '/images/venues/venue-kokugikan.webp', credit: { author: null, license: 'Public Domain (1909)', licenseUrl: null, fileUrl: 'https://commons.wikimedia.org/wiki/File:Ryogoku_Kokugikan_1909.jpg' } },
  3:  { name: 'EDION Arena Osaka',      img: '/images/venues/venue-haru.webp', credit: { author: 'KishujiRapid', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', fileUrl: 'https://commons.wikimedia.org/wiki/File:Osaka_Prefectural_Gymnasium_20191129.jpg' } },
  5:  { name: 'Ryogoku Kokugikan',      img: '/images/venues/venue-kokugikan.webp', credit: { author: null, license: 'Public Domain (1909)', licenseUrl: null, fileUrl: 'https://commons.wikimedia.org/wiki/File:Ryogoku_Kokugikan_1909.jpg' } },
  7:  { name: 'IG Arena',               img: '/images/venues/venue-nagoya.webp', credit: { author: '\u5186\u5468\u7387\uff13\u30d1\u30fc\u30bb\u30f3\u30c8', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0', fileUrl: 'https://commons.wikimedia.org/wiki/File:NGO_Kita_Meijokoen_20250712_1446a.jpg' } },
  9:  { name: 'Ryogoku Kokugikan',      img: '/images/venues/venue-kokugikan.webp', credit: { author: null, license: 'Public Domain (1909)', licenseUrl: null, fileUrl: 'https://commons.wikimedia.org/wiki/File:Ryogoku_Kokugikan_1909.jpg' } },
  11: { name: 'Fukuoka Kokusai Center', img: '/images/venues/venue-kyushu.webp', credit: { author: 'Auximines', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/', fileUrl: 'https://commons.wikimedia.org/wiki/File:Fukuoka_International_Center.jpg' } },
}

const START_HOUR_JST = 8   // початок боїв дня 1 (нижні дивізіони), JST
const START_MIN_JST = 30

export function bashoInfo(bashoId) {
  const year = parseInt(String(bashoId).slice(0, 4), 10)
  const month = parseInt(String(bashoId).slice(4, 6), 10)
  const m = META[month]
  const day = secondSundayDay(year, month)
  // JST = UTC+9: старт у UTC — це (START_HOUR-9) година тієї ж/попер. доби
  const startUtcMs = Date.UTC(year, month - 1, day, START_HOUR_JST - 9, START_MIN_JST)
  const endUtcMs = startUtcMs + 15 * 24 * 3600 * 1000 // кінець сеншюраку (день 15)
  return {
    id: String(bashoId), year, month,
    startDay: day,
    startUtcMs, endUtcMs,
    startIso: new Date(startUtcMs).toISOString(),
    kanji: m.kanji,
    label:  { uk: m.uk + ' ' + year,  en: m.en + ' ' + year,  ja: m.ja + ' ' + year },
    city:   { uk: m.cityUk, en: m.cityEn, ja: m.cityJa },
    venue:  VENUES[month],
  }
}

export function currentBashoId(now = new Date()) {  /* auto_current_v1: live, інакше найближчий upcoming, інакше останній finished */
  const year = now.getFullYear()
  const candidates = []
  for (const y of [year - 1, year, year + 1]) {
    for (const m of BASHO_MONTHS) {
      const id = String(y) + String(m).padStart(2, '0')
      if (!CANCELLED_BASHO.has(id)) candidates.push(id)
    }
  }
  let lastFinished = null
  for (const id of candidates) {
    const st = bashoStatus(id, now)  /* auto_current_v2 */
    if (st === 'live') return id
    if (st === 'upcoming') return id  // кандидати відсортовані хронологічно: перший upcoming = найближчий
    if (st === 'finished') lastFinished = id
  }
  return lastFinished
}

export function displayName(r, lang) {  /* kanji_names_v1 ukr_names_v1 */
  if (lang === 'ja' && (r?.nameJp || r?.shikonaJp)) return r.nameJp || r.shikonaJp
  const en = r?.name || r?.shikonaEn || ''
  if (lang === 'uk' && en) return ukrName(en)
  return en
}

const RANK_JA = { Yokozuna: '横綱', Ozeki: '大関', Sekiwake: '関脇', Komusubi: '小結', Maegashira: '前頭', Juryo: '十両' , Makushita: '幕下', Sandanme: '三段目', Jonidan: '序二段', Jonokuchi: '序ノ口' /* rank_ja_lower_v1 */ }
/* cg_shortrank_v2: universalnyi korotkyi rang "Juryo 13 West" -> "J13w" */
const RANK_ABBR = { Yokozuna:'Y', Ozeki:'O', Sekiwake:'S', Komusubi:'K', Maegashira:'M', Juryo:'J', Makushita:'Ms', Sandanme:'Sd', Jonidan:'Jd', Jonokuchi:'Jk' }
export function shortRank(rank, lang) {
  if (lang === 'ja') return displayRank(rank, lang)
  const m = String(rank || '').match(/^(\w+)\s*(\d*)\s*(East|West)?$/)
  if (!m || !RANK_ABBR[m[1]]) return rank
  return RANK_ABBR[m[1]] + (m[2] || '') + (m[3] ? m[3][0].toLowerCase() : '')
}

export function displayRank(rank, lang) {
  if (lang === 'uk') return ukrRankLong(rank)  /* ukr_ranks_v1 */
  // "Sekiwake 2 East" -> ja: "東 関脇 2"; інші мови — як є
  if (lang !== 'ja' || !rank) return rank
  const m = String(rank).match(/^(\w+)\s*(\d*)\s*(East|West)?$/)
  if (!m || !RANK_JA[m[1]]) return rank
  const side = m[3] === 'East' ? '東' : m[3] === 'West' ? '西' : ''
  return (side ? side + ' ' : '') + RANK_JA[m[1]] + (m[2] ? ' ' + m[2] : '')
}

/* basho_list_shared_v1: spilnyi spysok bashо dlia arkhivu ta storinky rikishi; onovliuvaty pislia kozhnoho turniru */
export const BASHO_LIST = [
  { id: '202607', label: 'Наґоя 2026', labelEn: 'Nagoya 2026', labelJa: '名古屋場所 2026', location: 'Наґоя', locationEn: 'Nagoya' },  /* basho_list_nagoya_v1 */
  { id: '202605', label: 'Натсу 2026', labelEn: 'Natsu 2026', labelJa: '夏場所 2026', location: 'Токіо', locationEn: 'Tokyo' },
  { id: '202603', label: 'Хару 2026', labelEn: 'Haru 2026', labelJa: '春場所 2026', location: 'Осака', locationEn: 'Osaka' },
  { id: '202601', label: 'Хацу 2026', labelEn: 'Hatsu 2026', labelJa: '初場所 2026', location: 'Токіо', locationEn: 'Tokyo' },
  { id: '202511', label: 'Кюшу 2025', labelEn: 'Kyushu 2025', labelJa: '九州場所 2025', location: 'Фукуока', locationEn: 'Fukuoka' },
  { id: '202509', label: 'Акі 2025', labelEn: 'Aki 2025', labelJa: '秋場所 2025', location: 'Токіо', locationEn: 'Tokyo' },  /* basho_list_2025_v1 */
  { id: '202507', label: 'Наґоя 2025', labelEn: 'Nagoya 2025', labelJa: '名古屋場所 2025', location: 'Наґоя', locationEn: 'Nagoya' },
  { id: '202505', label: 'Натсу 2025', labelEn: 'Natsu 2025', labelJa: '夏場所 2025', location: 'Токіо', locationEn: 'Tokyo' },
  { id: '202503', label: 'Хару 2025', labelEn: 'Haru 2025', labelJa: '春場所 2025', location: 'Осака', locationEn: 'Osaka' },
]

export const HISTORY_START_YEAR = 1958  /* history_range_v1: 6 басьо/рік з 1958 */
export const CANCELLED_BASHO = new Set(['202005'])  // COVID; додавати за потреби

export function bashoIdsOfYear(year) {
  // Всі басьо року, що вже завершились або live (мають дані), без скасованих.
  const out = []
  for (const m of BASHO_MONTHS) {
    const id = String(year) + String(m).padStart(2, '0')
    if (CANCELLED_BASHO.has(id)) continue
    const st = bashoStatus(id)
    if (st === 'finished' || st === 'live') out.push(id)
  }
  return out
}

export function bashoListOfYear(year, includeUpcomingCurrent = true) {
  // Басьо року, що вже стартували (мають дані в API) + опційно найближчий upcoming.
  const now = new Date()
  const out = []
  for (const m of BASHO_MONTHS) {
    const id = String(year) + String(m).padStart(2, '0')
    const st = bashoStatus(id)
    if (st === 'finished' || st === 'live') out.push(id)
    else if (st === 'upcoming' && includeUpcomingCurrent && out.length < 6) {
      out.push(id); break  // перший upcoming = поточний у хедері, далі не йдемо
    }
  }
  return out
}

export function prevBashoIdOf(bashoId) {
  const year = parseInt(String(bashoId).slice(0, 4), 10)
  const month = parseInt(String(bashoId).slice(4, 6), 10)
  const idx = BASHO_MONTHS.indexOf(month)
  const pm = BASHO_MONTHS[(idx + 5) % 6]
  const py = pm === 11 && month === 1 ? year - 1 : year
  return String(py) + String(pm).padStart(2, '0')
}

export function nextBashoId(bashoId) {
  const year = parseInt(String(bashoId).slice(0, 4), 10)
  const month = parseInt(String(bashoId).slice(4, 6), 10)
  const idx = BASHO_MONTHS.indexOf(month)
  const nm = BASHO_MONTHS[(idx + 1) % 6]
  const ny = nm === 1 ? year + 1 : year
  return String(ny) + String(nm).padStart(2, '0')
}

// Статус басьо відносно моменту (Date або ms)
export function bashoStatus(bashoId, now) {
  const t = now instanceof Date ? now.getTime() : (now || Date.now())
  const b = bashoInfo(bashoId)
  if (t < b.startUtcMs) return 'upcoming'
  if (t <= b.endUtcMs) return 'live'
  return 'finished'
}
