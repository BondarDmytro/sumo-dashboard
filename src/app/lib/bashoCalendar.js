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
  }
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
