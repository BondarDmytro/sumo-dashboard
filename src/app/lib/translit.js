/* translit_v1: Hepburn romaji -> ukrainska (shьo/dzh-systema za pobazhanniam) */

/* poriadok: dovshi spoluky PERED korotshymy */
const RULES = [
  /* йотовані з пом'якшенням */
  ['shou', 'шьо'], ['sho', 'шьо'], ['shu', 'шю'], ['sha', 'шя'], ['shi', 'ші'], ['she', 'ше'],
  ['chou', 'чьо'], ['cho', 'чьо'], ['chu', 'чю'], ['cha', 'чя'], ['chi', 'чі'], ['che', 'че'],
  ['jou', 'джьо'], ['jo', 'джьо'], ['ju', 'джю'], ['ja', 'джя'], ['ji', 'джі'], ['je', 'дже'],
  ['tsu', 'цу'], ['tsa', 'ца'], ['tso', 'цо'],
  /* подовження о через ou/oh - ігноруємо довготу */
  ['ou', 'о'],
  /* translit_v2: ai/ei -> глайд; oh -> о лише не перед голосною */

  /* йотовані ya/yu/yo після приголосних */
  ['kya', 'кя'], ['kyu', 'кю'], ['kyo', 'кьо'],
  ['gya', 'ґя'], ['gyu', 'ґю'], ['gyo', 'ґьо'],
  ['nya', 'ня'], ['nyu', 'ню'], ['nyo', 'ньо'],
  ['hya', 'хя'], ['hyu', 'хю'], ['hyo', 'хьо'],
  ['bya', 'бя'], ['byu', 'бю'], ['byo', 'бьо'],
  ['pya', 'пя'], ['pyu', 'пю'], ['pyo', 'пьо'],
  ['mya', 'мя'], ['myu', 'мю'], ['myo', 'мьо'],
  ['rya', 'ря'], ['ryu', 'рю'], ['ryo', 'рьо'],
  /* прості склади */
  ['ka', 'ка'], ['ki', 'кі'], ['ku', 'ку'], ['ke', 'ке'], ['ko', 'ко'],
  ['ga', 'ґа'], ['gi', 'ґі'], ['gu', 'ґу'], ['ge', 'ґе'], ['go', 'ґо'],
  ['sa', 'са'], ['si', 'сі'], ['su', 'су'], ['se', 'се'], ['so', 'со'],
  ['za', 'дза'], ['zu', 'дзу'], ['ze', 'дзе'], ['zo', 'дзо'],
  ['ta', 'та'], ['te', 'те'], ['to', 'то'],
  ['da', 'да'], ['de', 'де'], ['do', 'до'],
  ['na', 'на'], ['ni', 'ні'], ['nu', 'ну'], ['ne', 'не'], ['no', 'но'],
  ['ha', 'ха'], ['hi', 'хі'], ['fu', 'фу'], ['he', 'хе'], ['ho', 'хо'],
  ['ba', 'ба'], ['bi', 'бі'], ['bu', 'бу'], ['be', 'бе'], ['bo', 'бо'],
  ['pa', 'па'], ['pi', 'пі'], ['pu', 'пу'], ['pe', 'пе'], ['po', 'по'],
  ['ma', 'ма'], ['mi', 'мі'], ['mu', 'му'], ['me', 'ме'], ['mo', 'мо'],
  ['ya', 'я'], ['yu', 'ю'], ['yo', 'йо'],
  ['ra', 'ра'], ['ri', 'рі'], ['ru', 'ру'], ['re', 'ре'], ['ro', 'ро'],
  ['wa', 'ва'], ['wo', 'о'],
  /* голосні поодинці */
  ['a', 'а'], ['i', 'і'], ['u', 'у'], ['e', 'е'], ['o', 'о'],
  /* n складове */
  ['n', 'н'],
]

/* vyniatky: nepravylni/ustaleni chytannia */
const EXCEPTIONS = {
  'Aonishiki': 'Аонішікі',
  'Hoshoryu': 'Хошьорю',
  'Takayasu': 'Такаясу',
}

export function ukrName(romaji) {
  if (!romaji) return romaji
  if (EXCEPTIONS[romaji]) return EXCEPTIONS[romaji]
  let s = String(romaji).toLowerCase()
  let out = ''
  let i = 0
  while (i < s.length) {
    /* podvoiena pryholosna (sokuon): kk, tt, ss, pp... - podvoiuiemo ukr */
    if (i + 1 < s.length && s[i] === s[i + 1] && 'kstpcbdgz'.includes(s[i])) {
      /* znaidemo sklad dlia s[i+1..] i podvoimo pershu literu */
      const rest = translitFrom(s, i + 1)
      if (rest) { out += rest.text[0] + rest.text; i = rest.next; continue }
    }
    const m = translitFrom(s, i)
    if (m) { out += m.text; i = m.next }
    else { out += s[i]; i += 1 }
  }
  /* translit_v3: hlaid - 'і' pislia holosnoi -> 'й' */
  out = out.replace(/([аеоу])і/g, '$1й')
  return out.charAt(0).toUpperCase() + out.slice(1)
}

function translitFrom(s, i) {
  if (s.startsWith('oh', i) && (i + 2 >= s.length || !'aiueoy'.includes(s[i + 2]))) return { text: 'о', next: i + 2 }  /* translit_v2 */
  for (const [rom, ukr] of RULES) {
    if (s.startsWith(rom, i)) {
      /* 'n' pered holosnoiu/y - ne skladove n, ale pravyla nyzhche vzhe pokryly na/ni/...; tut n kinceve/pered pryhol. */
      return { text: ukr, next: i + rom.length }
    }
  }
  return null
}

/* ukr_divisions_v1: dyvizioni ta rangy ukrainskoiu */
export const DIVISION_UK = {
  Makuuchi: 'Макуучі',
  Juryo: 'Джюрьо',
  Makushita: 'Макушіта',
  Sandanme: 'Санданме',
  Jonidan: 'Джьонідан',
  Jonokuchi: 'Джьонокучі',
}
export const RANK_UK = {
  Yokozuna: 'Йокодзуна',
  Ozeki: 'Одзекі',
  Sekiwake: 'Секіваке',
  Komusubi: 'Комусубі',
  Maegashira: 'Маеґашіра',
  Juryo: 'Джюрьо',
  Makushita: 'Макушіта',
  Sandanme: 'Санданме',
  Jonidan: 'Джьонідан',
  Jonokuchi: 'Джьонокучі',
}
export function ukrRankLong(rank) {
  const m = String(rank || '').match(/^(\w+)\s*(\d*)\s*(East|West)?$/)
  if (!m || !RANK_UK[m[1]]) return rank
  const side = m[3] === 'East' ? ' Схід' : m[3] === 'West' ? ' Захід' : ''
  return RANK_UK[m[1]] + (m[2] ? ' ' + m[2] : '') + side
}
export function ukrDivision(d) { return DIVISION_UK[d] || d }
