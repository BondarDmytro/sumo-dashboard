import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const BASE = 'https://sports.japantimes.co.jp/sumo/images/techniques/'

const KIMARITE_URLS = {
  'yorikiri':         'sumo_waza3-2.jpg',
  'kekaeshi':         'sumo_waza3-1.jpg',
  'oshidashi':        'sumo_waza6-1.png',
  'hatakikomi':       'sumo_waza5-2.png',
  'uwatenage':        'sumo_waza2-3.jpg',
  'uwatehineri':      'sumo_waza5-3.png',
  'shitatenage':      'sumo_waza4-1.jpg',
  'shitatehineri':    'sumo_waza5-4.png',
  'yoritaoshi':       'sumo_waza6-5.png',
  'hikiotoshi':       'sumo_waza7-1.png',
  'tsukiotoshi':      'sumo_waza2-6.jpg',
  'oshitaoshi':       'sumo_waza2-5.jpg',
  'okuridashi':       'sumo_waza2-4.jpg',
  'kotenage':         'sumo_waza5-5.png',
  'sukuinage':        'sumo_waza6-2.png',
  'tsukidashi':       'sumo_waza5-1.png',
  'uwatedashinage':   'sumo_waza5-6.png',
  'shitatedashinage': 'sumo_waza5-7.png',
  'sotogake':         'sumo_waza4-6.jpg',
  'uchigake':         'sumo_waza4-5.jpg',
  'katasukashi':      'sumo_waza4-2.jpg',
  'kubinage':         'sumo_waza2-2.jpg',
  'tottari':          'sumo_waza8-8.jpg',
  'kimedashi':        'sumo_waza8-3.jpg',
  'amiuchi':          'sumo_waza10-8.jpg',
  'tsuridashi':       'sumo_waza4-3.jpg',
  'tsuriotoshi':      'sumo_waza8-4.jpg',
  'kawazugake':       'sumo_waza4-8.jpg',
  'ipponzeoi':        'sumo_waza4-7.jpg',
  'chongake':         'sumo_waza9-4.jpg',
  'makiotoshi':       'sumo_waza9-3.jpg',
  'mitokorozeme':     'sumo_waza9-2.jpg',
  'watashikomi':      'sumo_waza10-2.jpg',
  'kirikaeshi':       'sumo_waza10-4.jpg',
  'uchimuso':         'sumo_waza6-3.png',
  'ashitori':         'sumo_waza5-8.png',
  'okurinage':        'sumo_waza8-5.jpg',
  'okuritsuriotoshi': 'sumo_waza13-4.jpg',
  'fumidashi':        'sumo_waza13-1.jpg',
  'isamiashi':        'sumo_waza12-5.jpg',
  'koshikudake':      'sumo_waza12-2.jpg',
  'haritaoshi':       null,
}

const OUT_DIR = './public/kimarite'
mkdirSync(OUT_DIR, { recursive: true })

for (const [name, file] of Object.entries(KIMARITE_URLS)) {
  if (!file) { console.log(`SKIP ${name}: no image`); continue }
  const url = BASE + file
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://sports.japantimes.co.jp/sumo/techniques.html',
      }
    })
    if (!res.ok) { console.log(`FAIL ${name}: ${res.status}`); continue }
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 500) { console.log(`EMPTY ${name}: ${buf.byteLength} bytes`); continue }
    const ext = file.split('.').pop()
    writeFileSync(path.join(OUT_DIR, `${name}.${ext}`), Buffer.from(buf))
    console.log(`OK ${name}: ${buf.byteLength} bytes`)
  } catch(e) {
    console.log(`ERR ${name}: ${e.message}`)
  }
}