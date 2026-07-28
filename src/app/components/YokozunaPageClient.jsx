'use client'
/* yokozuna_page_v1: khronolohiia vsikh yokodzun 1-75 z trokh dzherel */
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import RikishiLink from './RikishiLink'
import legacy from '../lib/yokozunaLegacy.json'
import rikishiMeta from '../lib/rikishiMeta.json'  /* yok_final_polish_v1 */
import histData from '../lib/yokozunaData.json'
import eloData from '../lib/eloRatings.json'
import bashoYusho from '../lib/bashoYusho.json'
import { ukrName } from '../lib/translit'  /* yokozuna_page_v1 */

function t3l(lang, uk, en, ja, fr) { return t3(lang, uk, en, ja, fr) }

function fmtBasho(bid) {
  return bid ? bid.slice(0, 4) + '/' + bid.slice(4) : ''
}

/* yusho po id z povnoi mapy (195803..2026) */
const yushoById = {}
for (const y of Object.values(bashoYusho.yusho || {})) {
  yushoById[y.id] = (yushoById[y.id] || 0) + 1
}

export default function YokozunaPageClient() {
  const { lang } = useLang()

  /* API-era (195911-2019) + elo-era (2020+), dedup po id, merge terms */
  const apiEra = {}
  for (const [id, p] of Object.entries(histData.yokozuna || {})) {
    apiEra[id] = { id, name: p.name, first: p.yokozunaFirst, last: p.yokozunaLast, wins: p.wins, losses: p.losses }
  }
  for (const [id, p] of Object.entries(eloData.ratings || {})) {
    if (!p.yokozunaFirst) continue
    if (apiEra[id]) {
      if (p.yokozunaLast > apiEra[id].last) apiEra[id].last = p.yokozunaLast
    } else {
      apiEra[id] = { id, name: null, first: p.yokozunaFirst, last: p.yokozunaLast, wins: null, losses: null }
    }
  }
  /* imena elo-novachkiv nevidomi v eloRatings - vismykuiemo z bashoYusho abo lyshaiemo id; bios dorohyi. Praktychno: Terunofuji/Hoshoryu/Onosato ye v yusho-mapi */
  const nameById = {}
  for (const y of Object.values(bashoYusho.yusho || {})) nameById[y.id] = y.name
  for (const e of Object.values(apiEra)) { if (!e.name) e.name = nameById[e.id] || ('#' + e.id); e.name = String(e.name).split(' ')[0] }  /* yok_polish_v1: shikona bez given name */

  const modern = Object.values(apiEra).sort((a, b) => (a.first < b.first ? -1 : 1))
  /* dedup z legacy: Chiyonoyama #41, Tochinishiki #44 - API-kartky otrymuiut legacy-nomer */
  const LEGACY_OVERLAP = { 'Chiyonoyama': 41, 'Tochinishiki': 44 }
  let num = 44
  const numbered = modern.map(e => {
    const base = e.name.split(' ')[0]
    const ln = LEGACY_OVERLAP[base]
    if (ln) { const leg = legacy.list.find(l => l.n === ln); return { ...e, n: ln, overlap: true, legacyYusho: leg ? leg.yusho : null } }
    num += 1
    return { ...e, n: num }
  })
  const legacyPure = legacy.list.filter(l => !numbered.some(m => m.overlap && m.n === l.n))
  const totalYok = legacyPure.length + numbered.length  /* yok_dynamic_count_v1 */

  const card = { background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', gap: 14 }
  const numStyle = { fontFamily: 'Georgia,serif', fontSize: '1.6rem', fontWeight: 800, color: '#b8860b', minWidth: 52, textAlign: 'center' }

  return (
    <main style={{ fontFamily: "'Noto Sans JP',sans-serif", background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)', marginBottom: 6 }}>
          {t3l(lang, '\u0419\u043e\u043a\u043e\u0434\u0437\u0443\u043d\u0438 \u2014 \u0432\u0435\u043b\u0438\u043a\u0456 \u0447\u0435\u043c\u043f\u0456\u043e\u043d\u0438', 'Yokozuna \u2014 Grand Champions', '\u6a2a\u7db1\u4e00\u89a7', 'Yokozuna \u2014 Grands Champions')}
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', fontWeight: 800, margin: '0 0 0.5rem' }}>
          {t3l(lang, '\u0419\u043e\u043a\u043e\u0434\u0437\u0443\u043d\u0430 \u2014 \u043d\u0430\u0439\u0432\u0438\u0449\u0438\u0439 \u0442\u0438\u0442\u0443\u043b \u0443 \u0441\u0443\u043c\u043e', 'Yokozuna \u2014 the Highest Title in Sumo', '\u6b74\u4ee3\u6a2a\u7db1\u5168\u4e00\u89a7', 'Yokozuna \u2014 le titre supr\u00eame du sumo')}
        </h1>
        <p style={{ color: 'var(--mid)', fontSize: '0.85rem', lineHeight: 1.6, maxWidth: 640, marginBottom: '2rem' }}>
          {t3l(lang,
            '\u0419\u043e\u043a\u043e\u0434\u0437\u0443\u043d\u0430 \u2014 \u0446\u0435 \u043d\u0430\u0439\u0432\u0438\u0449\u0438\u0439 \u0440\u0430\u043d\u0433 \u0431\u043e\u0440\u0446\u044f \u0441\u0443\u043c\u043e, \u0439\u043e\u0433\u043e \u043d\u0435\u043c\u043e\u0436\u043b\u0438\u0432\u043e \u0432\u0442\u0440\u0430\u0442\u0438\u0442\u0438 \u2014 \u043b\u0438\u0448\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0442\u0438 \u043a\u0430\u0440\u2019\u0454\u0440\u0443. \u0417\u0430 \u0432\u0441\u044e \u0456\u0441\u0442\u043e\u0440\u0456\u044e \u0439\u043e\u0433\u043e \u043e\u0442\u0440\u0438\u043c\u0443\u0432\u0430\u043b\u0438 \u043b\u0456\u0447\u0435\u043d\u0456 \u0431\u043e\u0440\u0446\u0456 \u2014 \u043a\u043e\u0436\u0435\u043d \u0437 \u043d\u0438\u0445 \u043d\u0438\u0436\u0447\u0435 \u0432 \u0446\u044c\u043e\u043c\u0443 \u0441\u043f\u0438\u0441\u043a\u0443. \u0417 1958 \u0440\u043e\u043a\u0443 \u2014 \u043f\u043e\u0432\u043d\u0430 \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043a\u0430; \u043f\u0440\u043e \u0434\u0430\u0432\u043d\u0456\u0448\u0438\u0445 \u2014 \u0456\u043c\u2019\u044f, \u0440\u043e\u043a\u0438 \u0442\u0430 \u0442\u0438\u0442\u0443\u043b\u0438.',
            'Yokozuna is the highest rank in sumo \u2014 it can never be taken away, only retired with. Only a select few have ever earned it \u2014 every one of them is on this list. Full statistics since 1958; for earlier champions \u2014 name, years and titles.',
            '\u6a2a\u7db1\u306f\u76f8\u64b2\u306e\u6700\u9ad8\u4f4d\u3002\u964d\u683c\u306f\u306a\u304f\u3001\u5f15\u9000\u3067\u306e\u307f\u305d\u306e\u5730\u4f4d\u3092\u96e2\u308c\u308b\u3002\u6b74\u53f2\u4e0a\u308f\u305a\u304b75\u4eba\u30021958\u5e74\u4ee5\u964d\u306f\u5b8c\u5168\u306a\u7d71\u8a08\u3002',
            'Le yokozuna est le rang supr\u00eame du sumo \u2014 on ne peut le perdre, seulement prendre sa retraite avec. Seule une poign\u00e9e de lutteurs l\u2019ont jamais obtenu \u2014 chacun figure sur cette liste. Statistiques compl\u00e8tes depuis 1958.')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...numbered].sort((a, b) => b.n - a.n).map(e => (
            <div key={e.n} style={card}>
              <div style={numStyle}>{e.n}</div>
              <img src={'/rikishi/' + e.id + '.webp'} alt="" style={{ width: 44, height: 56, objectFit: 'cover', objectPosition: 'top', borderRadius: 3, flexShrink: 0, background: 'var(--bg)' }} onError={ev => { ev.target.outerHTML = '<div style="width:44px;height:56px;border-radius:3px;background:var(--bg);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:1.2rem;color:var(--mid);flex-shrink:0">\u6a2a</div>' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{rikishiMeta.some(m => String(m.id) === String(e.id)) ? <RikishiLink id={e.id}>{lang === 'uk' ? ukrName(e.name) : e.name}</RikishiLink> : (lang === 'uk' ? ukrName(e.name) : e.name)}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', marginTop: 2 }}>
                  {t3l(lang, '\u041d\u0430 \u0440\u0430\u043d\u0437\u0456', 'Reign', '\u5728\u4f4d', 'R\u00e8gne')}: {fmtBasho(e.first)}{' — '}{fmtBasho(e.last)}
                  {e.wins != null && <>{' · '}{e.wins}{'–'}{e.losses}</>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 800, color: '#b8860b' }}>{String.fromCodePoint(0x1F3C6)} {e.legacyYusho ?? (yushoById[e.id] || 0)}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.52rem', color: 'var(--mid)', textTransform: 'uppercase' }}>{t3l(lang, '\u044e\u0448\u043e', 'yusho', '\u512a\u52dd', 'yusho')}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--mid)', margin: '2.5rem 0 1rem' }}>
          {t3l(lang, '\u0420\u0430\u043d\u043d\u0456 \u0439\u043e\u043a\u043e\u0434\u0437\u0443\u043d\u0438 \u2014 \u21161\u201340 (\u0434\u043e 1958 \u0440\u043e\u043a\u0443)', 'Early yokozuna \u2014 #1\u201340 (before 1958)', '\u521d\u671f\u306e\u6a2a\u7db1 \u2014 #1\u201340\uff081958\u5e74\u4ee5\u524d\uff09', 'Premiers yokozuna \u2014 n\u00b01\u201340 (avant 1958)')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
          {[...legacyPure].reverse().map(l => (
            <div key={l.n} style={{ ...card, padding: '0.6rem 0.9rem', gap: 10 }}>
              <div style={{ ...numStyle, fontSize: '1.1rem', minWidth: 34 }}>{l.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lang === 'ja' ? l.ja : lang === 'uk' ? ukrName(l.en).replace(/ \u0456\u0456\u0456$/, ' III').replace(/ \u0456\u0456$/, ' II').replace(/ \u0456$/, ' I') : l.en}  {/* yok_roman_fix_v1 */}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--mid)' }}>{l.years}{l.yusho != null && <>{' · '}{String.fromCodePoint(0x1F3C6)}{' '}{l.yusho}</>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/* yok_jsx_escape_fix_v1 */
