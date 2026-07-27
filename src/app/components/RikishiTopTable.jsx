'use client'
import { ukrName } from '../lib/translit'  /* ukr_toptable_v1 */
/* rikishi_top_table_v1: top-N z sortuvanniam i filtramy, dani z lokalnogo rikishiMeta.json */
import { useState, useMemo } from 'react'
import meta from '../lib/rikishiMeta.json'
import { useLang } from './LangProvider'
import { displayRank } from '../lib/bashoCalendar' /* ja_toptable_v1 */
import FavStar from './FavStar' /* favorites_v1 */

function t3(lang, uk, en, ja, fr) { return lang === 'en' ? en : lang === 'ja' ? ja : lang === 'fr' ? (fr !== undefined ? fr : en) : uk }  /* fr_local_t3_v1 */

const DIV_ORDER = ['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi']
function divisionOf(rank) {
  const w = (rank || '').split(' ')[0]
  if (['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira'].includes(w)) return 'Makuuchi'
  return w
}
function rankSortValue(rank) {
  const parts = (rank || '').split(' ')
  const di = DIV_ORDER.indexOf(parts[0])
  const num = parseInt(parts[1]) || 0
  const side = parts[2] === 'West' ? 1 : 0
  return (di < 0 ? 99 : di) * 10000 + num * 2 + side
}
function ageOf(birthDate) {
  if (!birthDate) return null
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 864e5))
}
/* sproshchena copy getCountry: klientu treba lyshe prapor */
function flagOf(shusshin) {
  if (!shusshin) return '\u{1F1EF}\u{1F1F5}'
  if (shusshin.includes('- Russia')) return '\u{1F3F3}\u{FE0F}'
  const F = { Mongolia:'\u{1F1F2}\u{1F1F3}', Ukraine:'\u{1F1FA}\u{1F1E6}', Georgia:'\u{1F1EC}\u{1F1EA}', Bulgaria:'\u{1F1E7}\u{1F1EC}', China:'\u{1F1E8}\u{1F1F3}', Brazil:'\u{1F1E7}\u{1F1F7}', Kazakhstan:'\u{1F1F0}\u{1F1FF}', Kyrgyzstan:'\u{1F1F0}\u{1F1EC}', 'Czech Republic':'\u{1F1E8}\u{1F1FF}', Tonga:'\u{1F1F9}\u{1F1F4}', Uzbekistan:'\u{1F1FA}\u{1F1FF}', Philippines:'\u{1F1F5}\u{1F1ED}', Egypt:'\u{1F1EA}\u{1F1EC}' }
  const hit = Object.keys(F).find(c => shusshin.startsWith(c))
  return hit ? F[hit] : '\u{1F1EF}\u{1F1F5}'  /* japan_default_v1 */
}
function countryKey(shusshin) {
  if (!shusshin) return 'Japan'
  const F = ['Mongolia','Ukraine','Georgia','Bulgaria','Russia','China','Brazil','Kazakhstan','Kyrgyzstan','Czech Republic','Tonga','Uzbekistan','Philippines','Egypt']
  const hit = F.find(c => shusshin.includes(c))
  return hit || 'Japan'
}

export default function RikishiTopTable({ onSelect, lang: langProp }) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)  /* top_table_preview_v1: false = preview 5 riadkiv */
  const [sortKey, setSortKey] = useState('weight')
  const [sortDir, setSortDir] = useState(-1)
  const [fDiv, setFDiv] = useState('')
  const [fHeya, setFHeya] = useState('')
  const [fCountry, setFCountry] = useState('')
  const [limit, setLimit] = useState(10)  /* top_n_free_v1 */
  const effLimit = open ? limit : 5

  const heyas = useMemo(() => [...new Set(meta.map(m => m.heya).filter(Boolean))].sort(), [])
  const countries = useMemo(() => [...new Set(meta.map(m => countryKey(m.shusshin)))].sort(), [])
  const divisions = ['Makuuchi','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi']

  const COLS = [
    { key: 'rank', label: t3(lang,'\u0420\u0430\u043d\u0433','Rank','\u756a\u4ed8', 'Rang'), get: m => displayRank(m.rank, lang), sort: m => rankSortValue(m.rank), asc: true, left: true },
    { key: 'hirank', label: t3(lang,'\u041d\u0430\u0439\u0432\u0438\u0449\u0438\u0439','Highest','\u6700\u9ad8\u4f4d', 'Le plus élevé'), get: m => m.hiRank ? displayRank(m.hiRank, lang) : '\u2014', sort: m => m.hiVal || 99999, asc: true, left: true },  /* cols_v2 + hirank_col_v1 */
    { key: 'winpct', label: t3(lang,'% \u043f\u0435\u0440\u0435\u043c\u043e\u0433','Win %','\u52dd\u7387', '% victoires'), get: m => m.matches ? Math.round(m.wins / m.matches * 100) + '%' : '\u2014', sort: m => m.matches ? m.wins / m.matches : -1 },
    { key: 'basho', label: t3(lang,'\u0422\u0443\u0440\u043d\u0456\u0440\u0438','Basho','\u5834\u6240', 'Basho'), get: m => m.basho || '\u2014', sort: m => m.basho || 0 },
    { key: 'debut', label: t3(lang,'\u0414\u0435\u0431\u044e\u0442','Debut','\u521d\u571f\u4ff5', 'Débuts'), get: m => m.debut ? `${String(m.debut).slice(0,4)}/${String(m.debut).slice(4,6)}` : '\u2014', sort: m => Number(m.debut) || 0 },
    { key: 'age', label: t3(lang,'\u0412\u0456\u043a','Age','\u5e74\u9f62', 'Âge'), get: m => ageOf(m.birthDate) ?? '\u2014', sort: m => ageOf(m.birthDate) ?? -1 },
    { key: 'height', label: t3(lang,'\u0417\u0440\u0456\u0441\u0442','Height','\u8eab\u9577', 'Taille'), get: m => m.height ? `${m.height}` : '\u2014', sort: m => m.height || 0 },
    { key: 'weight', label: t3(lang,'\u0412\u0430\u0433\u0430','Weight','\u4f53\u91cd', 'Poids'), get: m => m.weight ? `${m.weight}` : '\u2014', sort: m => m.weight || 0 },
    { key: 'matches', label: t3(lang,'\u041c\u0430\u0442\u0447\u0456','Matches','\u53d6\u7d44', 'Combats'), get: m => m.matches, sort: m => m.matches },
    { key: 'yusho', label: t3(lang,'\u042e\u0448\u043e','Yusho','\u512a\u52dd', 'Yusho'), get: m => m.yusho || '\u2014', sort: m => m.yusho },
  ]

  const rows = useMemo(() => {
    let arr = meta
    if (fDiv) arr = arr.filter(m => divisionOf(m.rank) === fDiv)
    if (fHeya) arr = arr.filter(m => m.heya === fHeya)
    if (fCountry) arr = arr.filter(m => countryKey(m.shusshin) === fCountry)
    const col = COLS.find(c => c.key === sortKey) || COLS[3]
    const sorted = [...arr].sort((a, b) => (col.sort(a) - col.sort(b)) * (col.asc ? -sortDir : sortDir))
    return sorted.slice(0, effLimit)
  }, [fDiv, fHeya, fCountry, sortKey, sortDir, effLimit, lang])

  const selStyle = { fontFamily:'monospace', fontSize:'0.68rem', padding:'0.35rem 0.5rem', background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--ink)', borderRadius:2 }

  return (
    <div style={{marginTop:'2rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1rem'}}>{/* toggle_btn_v2 */}
        <span>{t3(lang, '\u0422\u043e\u043f \u0440\u0456\u043a\u0456\u0448\u0456', 'Top rikishi', '\u529b\u58eb\u30e9\u30f3\u30ad\u30f3\u30b0', 'Top rikishi')}</span>
        <button onClick={() => setOpen(o => !o)} style={{fontFamily:'monospace',fontSize:'0.62rem',padding:'0.3rem 0.8rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',cursor:'pointer',borderRadius:2,letterSpacing:'normal',textTransform:'none'}}>
          {open
            ? t3(lang,'\u0417\u0433\u043e\u0440\u043d\u0443\u0442\u0438','Show less','\u9589\u3058\u308b', 'Réduire') + ' \u25b4'
            : t3(lang,'\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u0438 \u0431\u0456\u043b\u044c\u0448\u0435','Show more','\u3082\u3063\u3068\u898b\u308b', 'Voir plus') + ' \u25be'}
        </button>
      </div>
      {(
        <>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:'0.75rem'}}>
            <label style={{display:'inline-flex',alignItems:'center',gap:4,fontFamily:'monospace',fontSize:'0.68rem',color:'var(--mid)'}}>
              Top
              <input type="number" min={1} max={999} value={limit}
                onChange={e => { const v = parseInt(e.target.value); setLimit(Number.isFinite(v) && v >= 1 ? v : 1) }}
                style={{...selStyle, width:56, textAlign:'right'}} />
            </label>
            <select value={fDiv} onChange={e => setFDiv(e.target.value)} style={selStyle}>
              <option value="">{t3(lang,'\u0412\u0441\u0456 \u0434\u0438\u0432\u0456\u0437\u0456\u043e\u043d\u0438','All divisions','\u5168\u968e\u7d1a', 'Toutes les divisions')}</option>
              {divisions.map(d => <option key={d} value={d}>{lang === 'ja' ? ({ Makuuchi: '\u5e55\u5185', Juryo: '\u5341\u4e21', Makushita: '\u5e55\u4e0b', Sandanme: '\u4e09\u6bb5\u76ee', Jonidan: '\u5e8f\u4e8c\u6bb5', Jonokuchi: '\u5e8f\u30ce\u53e3' })[d] : d}</option>)}
            </select>
            <select value={fCountry} onChange={e => setFCountry(e.target.value)} style={selStyle}>
              <option value="">{t3(lang,'\u0412\u0441\u0456 \u043a\u0440\u0430\u0457\u043d\u0438','All countries','\u5168\u56fd\u7c4d', 'Tous les pays')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={fHeya} onChange={e => setFHeya(e.target.value)} style={selStyle}>
              <option value="">{t3(lang,'\u0412\u0441\u0456 \u0441\u0442\u0430\u0439\u043d\u0456','All stables','\u5168\u90e8\u5c4b', 'Toutes les écuries')}</option>
              {heyas.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.78rem'}}>
              <thead>
                <tr style={{borderBottom:'2px solid var(--ink)'}}>
                  <th style={{fontFamily:'monospace',fontSize:'0.58rem',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 0.5rem',textAlign:'left'}}>#</th>
                  <th style={{fontFamily:'monospace',fontSize:'0.58rem',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 0.5rem',textAlign:'left'}}>{t3(lang,'\u0420\u0456\u043a\u0456\u0448\u0456','Rikishi','\u529b\u58eb', 'Rikishi')}</th>
                  {COLS.map(c => (
                    <th key={c.key} onClick={() => { if (sortKey === c.key) setSortDir(d => -d); else { setSortKey(c.key); setSortDir(-1) } }}
                      style={{fontFamily:'monospace',fontSize:'0.58rem',textTransform:'uppercase',color: sortKey===c.key ? '#b8860b' : 'var(--mid)',padding:'0.4rem 0.5rem',textAlign:'center',cursor:'pointer',whiteSpace:'nowrap'}}>
                      {c.label}{sortKey === c.key ? (sortDir === -1 ? ' \u2193' : ' \u2191') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((m, i) => (
                  <tr key={m.id} onClick={() => onSelect?.(m.id)} style={{borderBottom:'1px solid var(--border)',cursor:'pointer'}}>
                    <td style={{padding:'0.45rem 0.5rem',fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)'}}>{i + 1}</td>
                    <td style={{padding:'0.45rem 0.5rem',fontWeight:700,whiteSpace:'nowrap'}}><FavStar id={m.id} size={13} /> {flagOf(m.shusshin)} {lang === 'ja' && m.nameJp ? m.nameJp.split(/\s/)[0] : lang === 'uk' ? ukrName(m.name) : m.name}</td>
                    {COLS.map(c => (
                      <td key={c.key} style={{padding:'0.45rem 0.5rem',textAlign: c.left ? 'left' : 'center',fontFamily:'monospace',fontSize:'0.7rem',whiteSpace:'nowrap'}}>{c.get(m)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          
        </>
      )}
    </div>
  )
}

/* fr_batch2_rtt_v1 */
