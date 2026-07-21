'use client'
/* rikishi_compare_v1: porivniannia dvokh rikishi - bio, kariera, forma, h2h */
import { useEffect, useState, useMemo } from 'react'
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import meta from '../lib/rikishiMeta.json'
import { HEYA_JA } from '../lib/heyaJa'
import { displayRank, shortRank, currentBashoId } from '../lib/bashoCalendar' /* compare_v3 compare_v13 */
import { rankColor } from '../lib/rankColors' /* compare_v4 */
const RANK_ORD = { Yokozuna: 0, Ozeki: 1, Sekiwake: 2, Komusubi: 3, Maegashira: 4, Juryo: 5, Makushita: 6, Sandanme: 7, Jonidan: 8, Jonokuchi: 9 }
const rankSortVal = (r) => { const s = String(r || ''); const div = Object.keys(RANK_ORD).find(k => s.startsWith(k)); const num = parseInt((s.match(/\d+/) || [99])[0], 10); return (div !== undefined ? RANK_ORD[div] : 99) * 1000 + num * 2 + (s.includes('West') ? 1 : 0) }

const trimJp = (s) => String(s || '').split('\u3000')[0].split('(')[0]
function Avatar({ m, tall, mirror }) {  /* compare_v14 */  /* compare_photo_v1: foto z /public/rikishi, kandzi-kolo yak folbek */
  const [imgOk, setImgOk] = useState(true)
  const ch = String(m?.nameJp || m?.name || '?').split('\u3000')[0].split('(')[0].charAt(0)
  if (imgOk) return (
    <img src={`/rikishi/${m?.id}.webp`} alt={m?.name || ''}
      onError={() => setImgOk(false)}
      style={tall ? {width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',display:'block',transform: mirror ? 'scaleX(-1)' : 'none'} : {width:52,height:70,objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',flexShrink:0,display:'block'}} />
  )
  return (
    <span style={{width:44,height:44,borderRadius:'50%',flexShrink:0,display:'inline-flex',alignItems:'center',justifyContent:'center',background:rankColor(m?.rank),color:'#f5f0e8',fontSize:'1.25rem',fontWeight:700,fontFamily:"'Noto Sans JP',sans-serif"}}>
      {ch}
    </span>
  )
}
const dispName = (m, lang) => lang === 'ja' && m?.nameJp ? trimJp(m.nameJp) : (m?.name || '')
const ageOf = (bd) => bd ? Math.floor((Date.now() - new Date(bd)) / (365.25 * 24 * 3600 * 1000)) : null

function BashoMini({ hist, cur }) {  /* compare_v13 */
  const cells = (hist || []).slice(-9)
  return (
    <div style={{display:'flex',gap:4,justifyContent:'space-between',flexWrap:'wrap',width:'100%'}}>{/* compare_v11 */}
      {cells.map(h => {
        const kyujo = (h.w + h.l) === 0
        const kk = !kyujo && h.w > h.l
        return (
          <div key={h.b} style={{textAlign:'center',minWidth:34}}>
            <div style={{fontFamily:'monospace',fontSize:'0.46rem',color:'var(--light)'}}>{String(h.b).slice(2,4)}/{String(h.b).slice(4)}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.66rem',fontWeight:600,color: kyujo ? 'var(--light)' : kk ? 'var(--ink)' : '#c0392b'}}>{kyujo ? '\u4f11' : h.w + '\u2013' + h.l}{h.y ? '\ud83c\udfc6' : ''}</div>
          </div>
        )
      })}
      {cur && (
        <div style={{textAlign:'center',minWidth:34,borderLeft:'1px solid var(--border)',paddingLeft:6}}>
          <div style={{fontFamily:'monospace',fontSize:'0.46rem',color:'#1a6b5c'}}>{String(cur.b).slice(2,4)}/{String(cur.b).slice(4)}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.66rem',fontWeight:700,color: (cur.w + cur.l) === 0 ? 'var(--light)' : 'var(--ink)'}}>{(cur.w + cur.l) === 0 ? '\u4f11' : cur.w + '\u2013' + cur.l}</div>
        </div>
      )}
    </div>
  )
}

export default function RikishiCompare() {
  const { lang } = useLang()
  const [id1, setId1] = useState('')
  const [id2, setId2] = useState('')
  const [h2h, setH2h] = useState(null)
  const [boutsOpen, setBoutsOpen] = useState(false)  /* compare_v6 */
  const [liveRec, setLiveRec] = useState({})  /* compare_v13: potochne basho z rikishi-list */
  useEffect(() => {
    fetch('/api/rikishi-list').then(x => x.json()).then(d => {
      const map = {}
      ;(d.rikishi || []).forEach(r => { map[String(r._id || r.id)] = { w: r.wins, l: r.losses } })
      setLiveRec(map)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('vs')
    if (p) { const [a, b] = p.split(','); if (a) setId1(a); if (b) setId2(b) }
  }, [])

  const byId = useMemo(() => new Map(meta.map(m => [String(m.id), m])), [])
  const r1 = byId.get(String(id1))
  const r2 = byId.get(String(id2))

  useEffect(() => {
    setH2h(null)
    if (!r1 || !r2) return
    const url = new URL(window.location.href)
    url.searchParams.set('vs', `${r1.id},${r2.id}`)
    window.history.replaceState(null, '', url)
    fetch(`/api/h2h?id1=${r1.id}&id2=${r2.id}`).then(x => x.json()).then(setH2h).catch(() => {})
  }, [r1?.id, r2?.id])

  const options = useMemo(() =>
    [...meta].sort((a, b) => (a.rank && b.rank ? 0 : a.rank ? -1 : 1) || String(a.name).localeCompare(b.name)),
  [])

  const DIVS = ['', 'Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']
  const Sel = ({ val, set, other }) => {  /* compare_v2: kombobox z poshukom i filtrom dyvizionu */
    const [q, setQ] = useState('')
    const [div, setDiv] = useState('')
    const [open, setOpen] = useState(false)
    const cur = byId.get(String(val))
    const hits = options.filter(m => {
      if (String(m.id) === String(other)) return false
      if (div) {  /* compare_v4: Makuuchi = sanyaku + maegashira */
        const r = String(m.rank || '')
        const inMak = ['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira'].some(p => r.startsWith(p))
        if (div === 'Makuuchi' ? !inMak : !r.startsWith(div)) return false
      }
      if (!q) return !!div  /* compare_v3: obranyi dyvizion - pokazuiemo vsikh bez druku */
      const needle = q.toLowerCase()
      return String(m.name || '').toLowerCase().includes(needle) || String(m.nameJp || '').includes(q)
    }).sort((a, b) => rankSortVal(a.rank) - rankSortVal(b.rank)).slice(0, div && !q ? 200 : 30)
    return (
      <div style={{position:'relative'}}>
        <div style={{display:'flex',gap:6}}>
          <input value={open ? q : (cur ? dispName(cur, lang) + ' \u00b7 ' + (cur.rank || '') : q)}
            onFocus={() => { setOpen(true); setQ('') }}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            onChange={e => { setQ(e.target.value); setOpen(true) }}
            placeholder={t3(lang, 'Пошук рікіші...', 'Search rikishi...', '力士を検索...')}
            style={{flex:1,fontFamily:'monospace',fontSize:'0.72rem',padding:'0.5rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',borderRadius:2,minWidth:0}} />
          <select value={div} onChange={e => { setDiv(e.target.value); setOpen(true) }} style={{fontFamily:'monospace',fontSize:'0.66rem',padding:'0.5rem 0.3rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',borderRadius:2}}>
            {DIVS.map(d => <option key={d} value={d}>{d || t3(lang, 'всі', 'all', '全て')}</option>)}
          </select>
        </div>
        {open && hits.length > 0 && (
          <div style={{position:'absolute',top:'100%',left:0,maxWidth:340,minWidth:240,zIndex:20,background:'var(--card)',border:'1px solid var(--border)',borderRadius:2,maxHeight:280,overflowY:'auto',boxShadow:'0 4px 14px rgba(0,0,0,0.25)'}}>
            {hits.map(m => (
              <div key={m.id} onMouseDown={() => { set(String(m.id)); setOpen(false); setQ('') }}
                style={{padding:'0.4rem 0.6rem',cursor:'pointer',fontFamily:'monospace',fontSize:'0.7rem',borderBottom:'1px solid var(--border)'}}>
                <span style={{color:'var(--mid)',fontSize:'0.6rem',display:'inline-block',minWidth:44}}>{shortRank(m.rank, lang)}</span> {dispName(m, lang)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const winPct = (m) => m?.matches ? Math.round((m.wins / m.matches) * 100) : null
  const rows = (r1 && r2) ? [
    { l: t3(lang, 'Ранг', 'Rank', '番付'), v: m => lang === 'ja' ? displayRank(m.rank, 'ja') : (m.rank || '—'), cmp: null },
    { l: t3(lang, 'Найвищий ранг', 'Highest rank', '最高位'), v: m => lang === 'ja' ? displayRank(m.hiRank, 'ja') : (m.hiRank || '—'), cmp: m => -(m.hiVal || 9999) },
    { l: t3(lang, 'Вік', 'Age', '年齢'), v: m => ageOf(m.birthDate) ?? '—', cmp: m => -(ageOf(m.birthDate) ?? 99) },  /* compare_v2: menshyi vik = krashchyi */
    { l: t3(lang, 'Зріст', 'Height', '身長'), v: m => m.height ? m.height + ' cm' : '—', cmp: m => m.height || 0 },
    { l: t3(lang, 'Вага', 'Weight', '体重'), v: m => m.weight ? m.weight + ' kg' : '—', cmp: m => m.weight || 0 },
    { l: t3(lang, 'Стайня', 'Stable', '部屋'), v: m => lang === 'ja' ? (HEYA_JA[m.heya] || m.heya || '—') : (m.heya || '—'), cmp: null },
    { l: t3(lang, 'Дебют', 'Debut', '初土俵'), v: m => m.debut ? `${String(m.debut).slice(0,4)}/${String(m.debut).slice(4)}` : '—', cmp: null },
    { l: t3(lang, 'Басьо', 'Basho', '場所数'), v: m => m.basho ?? '—', cmp: m => m.basho || 0 },
    { l: t3(lang, 'Боїв', 'Bouts', '取組数'), v: m => m.matches ?? '—', cmp: m => m.matches || 0 },
    { l: t3(lang, 'Перемог', 'Wins', '勝利数'), v: m => m.wins ?? '—', cmp: m => m.wins || 0 },
    { l: t3(lang, 'Вінрейт', 'Win rate', '勝率'), v: m => winPct(m) !== null ? winPct(m) + '%' : '—', cmp: m => winPct(m) || 0 },
    { l: t3(lang, 'Юшо', 'Yusho', '優勝'), v: m => m.yusho || 0, cmp: m => m.yusho || 0 },
  ] : []

  return (
    <div style={{marginTop:'1rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
        <Sel val={id1} set={setId1} other={id2} />
        <Sel val={id2} set={setId2} other={id1} />
      </div>
      {r1 && r2 && (
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:2}}>{/* compare_v7: foto vseredyni riadkovoi zony */}
          <div style={{minWidth:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,padding:'0.9rem 1rem',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
            <div style={{fontWeight:800,fontSize:'1.05rem',textAlign:'right'}}>{dispName(r1, lang)}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>vs</div>
            <div style={{fontWeight:800,fontSize:'1.05rem'}}>{dispName(r2, lang)}</div>
          </div>
          {h2h && h2h.total > 0 && (
            <div onClick={() => setBoutsOpen(o => !o)} title={t3(lang, 'клік — історія зустрічей', 'click — bout history', 'クリックで対戦履歴')} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,padding:'0.6rem 1rem',borderBottom:'1px solid var(--border)',alignItems:'center',background:'rgba(184,134,11,0.06)',cursor:'pointer'}}>
              <div style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.95rem',textAlign:'right',color: h2h.wins1 > h2h.wins2 ? '#1a6b5c' : 'var(--ink)'}}>{h2h.wins1}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)'}}>{t3(lang, 'очні зустрічі', 'head-to-head', '対戦成績')} ({h2h.total}) {boutsOpen ? '\u25be' : '\u25b8'}  {/* compare_v6_chevron */}</div>
              <div style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.95rem',color: h2h.wins2 > h2h.wins1 ? '#1a6b5c' : 'var(--ink)'}}>{h2h.wins2}</div>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'minmax(140px,240px) 1fr auto 1fr minmax(140px,240px)',columnGap:10,alignItems:'stretch'}}>{/* compare_v9: 5-kolonkovyi hrid, foto = koloni z row-span */}
            <div style={{gridRow: `1 / span ${rows.length}`,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.6rem 0 0.6rem 0.75rem'}}><Avatar key={r1.id} m={r1} tall /></div>
            {rows.map((row, i) => {
              const v1 = row.v(r1), v2 = row.v(r2)
              const c1 = row.cmp ? row.cmp(r1) : null, c2 = row.cmp ? row.cmp(r2) : null
              const b1 = row.cmp && c1 !== c2 && c1 > c2
              const b2 = row.cmp && c1 !== c2 && c2 > c1
              const cell = { display:'flex',alignItems:'center',borderBottom:'1px solid var(--border)',padding:'0.45rem 0' }
              return [
                <div key={i + 'a'} style={{...cell,justifyContent:'flex-end',gridColumn:2,fontFamily:'monospace',fontSize:'0.78rem',fontWeight: (b1 || b2) ? 700 : 400,color: b1 ? '#1a6b5c' : b2 ? '#c0392b' : 'var(--ink)'}}>{v1}</div>,
                <div key={i + 'b'} style={{...cell,justifyContent:'center',gridColumn:3,fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',minWidth:100}}>{row.l}</div>,
                <div key={i + 'c'} style={{...cell,gridColumn:4,fontFamily:'monospace',fontSize:'0.78rem',fontWeight: (b1 || b2) ? 700 : 400,color: b2 ? '#1a6b5c' : b1 ? '#c0392b' : 'var(--ink)'}}>{v2}</div>,
              ]
            })}
            <div style={{gridRow: `1 / span ${rows.length}`,gridColumn:5,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.6rem 0.75rem 0.6rem 0'}}><Avatar key={r2.id} m={r2} tall mirror /></div>
            <div style={{gridColumn:'1 / 3',padding:'0.7rem 0 0.7rem 0.75rem',borderTop:'1px solid var(--border)'}}><BashoMini hist={r1.last9} cur={liveRec[String(r1.id)] ? { b: currentBashoId(), ...liveRec[String(r1.id)] } : null} /></div>{/* compare_v12 */}
            <div style={{gridColumn:3,borderTop:'1px solid var(--border)'}} />
            <div style={{gridColumn:'4 / 6',padding:'0.7rem 0.75rem 0.7rem 0',borderTop:'1px solid var(--border)'}}><BashoMini hist={r2.last9} cur={liveRec[String(r2.id)] ? { b: currentBashoId(), ...liveRec[String(r2.id)] } : null} /></div>
          </div>

          {boutsOpen && h2h && h2h.bouts && h2h.bouts.length > 0 && (  /* compare_v7_matrix */
            <div style={{borderTop:'1px solid var(--border)',padding:'0.7rem 1rem',overflowX:'auto'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',marginBottom:8}}>
                {t3(lang, 'Очні зустрічі', 'Head-to-head bouts', '対戦履歴')} ({h2h.total})
              </div>
              {(() => {
                const byBasho = []
                const seen = new Map()
                for (const b of [...h2h.bouts].reverse()) {
                  if (!seen.has(b.b)) { seen.set(b.b, []); byBasho.push({ b: b.b, list: seen.get(b.b) }) }
                  seen.get(b.b).push(b)
                }
                const dot = (won) => <span style={{width:11,height:11,borderRadius:'50%',display:'inline-block',boxSizing:'border-box',background: won ? '#f5f0e8' : '#0f0e0c',border:'1.5px solid var(--ink)',marginRight:3}} />
                return (
                  <div style={{display:'grid',gridTemplateColumns:`110px repeat(${byBasho.length}, minmax(48px, 1fr))`,gap:4,alignItems:'center'}}>{/* compare_v8 */}
                    <div />
                    {byBasho.map(col => <div key={col.b} style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--light)',textAlign:'center',whiteSpace:'nowrap'}}>{String(col.b).slice(0,4)}/{String(col.b).slice(4)}</div>)}
                    <div style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dispName(r1, lang)}</div>
                    {byBasho.map(col => {
                      const rk = col.list[0]?.r1Rank  /* compare_v10: rang z samoho boiu */
                      return <div key={col.b} style={{textAlign:'center'}}><div>{col.list.map((b, k) => <span key={k}>{dot(b.winnerId === Number(r1.id))}</span>)}</div>{rk ? <div style={{fontFamily:'monospace',fontSize:'0.46rem',color:'var(--mid)'}}>{shortRank(rk, lang)}</div> : null}</div>
                    })}
                    <div style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dispName(r2, lang)}</div>
                    {byBasho.map(col => {
                      const rk = col.list[0]?.r2Rank
                      return <div key={col.b} style={{textAlign:'center'}}><div>{col.list.map((b, k) => <span key={k}>{dot(b.winnerId === Number(r2.id))}</span>)}</div>{rk ? <div style={{fontFamily:'monospace',fontSize:'0.46rem',color:'var(--mid)'}}>{shortRank(rk, lang)}</div> : null}</div>
                    })}
                  </div>
                )
              })()}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
