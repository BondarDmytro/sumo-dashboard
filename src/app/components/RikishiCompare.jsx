'use client'
import { ukrName, ukrDivision } from '../lib/translit'  /* ukr_names_v4 */
/* rikishi_compare_v1: porivniannia dvokh rikishi - bio, kariera, forma, h2h */
import { useEffect, useState, useMemo, useRef } from 'react' /* compare_anim_v1 */
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import meta from '../lib/rikishiMeta.json'
import { HEYA_JA } from '../lib/heyaJa'
import HeyaLink from './HeyaLink'  /* heya_links_v1 */
import { displayRank, shortRank, currentBashoId } from '../lib/bashoCalendar' /* compare_v3 compare_v13 */
import { rankColor } from '../lib/rankColors' /* compare_v4 */
import eloData from '../lib/eloRatings.json' /* compare_ovr_v1 */
const RANK_ORD = { Yokozuna: 0, Ozeki: 1, Sekiwake: 2, Komusubi: 3, Maegashira: 4, Juryo: 5, Makushita: 6, Sandanme: 7, Jonidan: 8, Jonokuchi: 9 }
const rankSortVal = (r) => { const s = String(r || ''); const div = Object.keys(RANK_ORD).find(k => s.startsWith(k)); const num = parseInt((s.match(/\d+/) || [99])[0], 10); return (div !== undefined ? RANK_ORD[div] : 99) * 1000 + num * 2 + (s.includes('West') ? 1 : 0) }

const trimJp = (s) => String(s || '').split('\u3000')[0].split('(')[0]

function CountUp({ value }) {  /* compare_anim_v1 */
  const [disp, setDisp] = useState(value)
  const fromRef = useRef(value)
  useEffect(() => {
    const from = fromRef.current
    if (from === value || typeof value !== 'number') { setDisp(value); fromRef.current = value; return }
    const t0 = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / 500)
      const e = 1 - Math.pow(1 - p, 3)
      setDisp(Math.round(from + (value - from) * e))
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{disp}</>
}

function numPart(v) {
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? null : n
}

/* ovr_bar_v1: progres-bar 0-100 z podilkamy po 10 */
function OvrBar({ val, mirror, better }) {
  const ticks = []
  for (let t = 10; t < 100; t += 10) ticks.push(t)
  return (
    <div style={{display:'flex',flexDirection: mirror ? 'row' : 'row-reverse',gap:8,alignItems:'center',minWidth:0,width:'100%'}}>  {/* ovr_bar_v3_inline */}  {/* ovr_bar_v2_fullwidth */}
      <span style={{fontWeight:800,fontSize:'0.95rem',fontFamily:'monospace',color: better === true ? '#1a6b5c' : better === false ? '#c0392b' : 'var(--ink)',flexShrink:0}}>{val}</span>
      <div style={{position:'relative',width:'100%',height:8  /* ovr_bar_v2_fullwidth */,background:'var(--bg2)',border:'1px solid #b8860b',borderRadius:2,overflow:'hidden'}}>
        <div style={{position:'absolute',top:0,bottom:0,[mirror ? 'right' : 'left']:0,width:val+'%',background:'linear-gradient(90deg,#b8860b,#d4a017)'}} />
        {ticks.map(t => (
          <div key={t} style={{position:'absolute',top:0,bottom:0,[mirror ? 'right' : 'left']:t+'%',width:1,background:'rgba(0,0,0,0.25)'}} />
        ))}
      </div>
    </div>
  )
}
/* indicator_final_v1: gunbai znialy, tug-rope yedynyi */

function TugLine({ c1, c2 }) {  /* tug_rope_v1 tug_cmp_v1: syla z cmp-znachen riadka (napriamok i semantyka korektni) */
  if (typeof c1 !== 'number' || typeof c2 !== 'number' || (c1 === 0 && c2 === 0)) return null
  const span = Math.abs(c1) + Math.abs(c2)
  if (!span) return null
  const shift = Math.max(-40, Math.min(40, ((c2 - c1) / span) * 100))
  return (
    <div style={{position:'relative',width:'100%',height:10,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <svg width="80%" height="7" viewBox="0 0 100 7" preserveAspectRatio="none" style={{opacity:0.55}}>
        <defs>
          <pattern id="ropeWeave" width="7" height="7" patternUnits="userSpaceOnUse">
            <path d="M0 5.5 Q1.75 1 3.5 3.5 T7 1.5" fill="none" stroke="#8a8578" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M0 1.5 Q1.75 6 3.5 3.5 T7 5.5" fill="none" stroke="#a89f8d" strokeWidth="1.5" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="7" fill="url(#ropeWeave)" />
      </svg>
      <div style={{position:'absolute',left:'50%',top:0,width:3,height:10,borderRadius:2,background:'#b8860b',boxShadow:'0 0 3px rgba(184,134,11,0.6)',transform:`translateX(${shift}px)`,transition:'transform 0.7s cubic-bezier(0.34,1.56,0.64,1)'}} />
    </div>
  )
}
function Avatar({ m, tall, mirror, big }) {  /* compare_v14 compare_mobile_v1 */  /* compare_photo_v1: foto z /public/rikishi, kandzi-kolo yak folbek */
  const [imgOk, setImgOk] = useState(true)
  const ch = String(m?.nameJp || m?.name || '?').split('\u3000')[0].split('(')[0].charAt(0)
  if (imgOk) return (
    <img src={`/rikishi/${m?.id}.webp`} alt={m?.name || ''}
      onError={() => setImgOk(false)}
      style={tall ? {width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',display:'block',transform: mirror ? 'scaleX(-1)' : 'none'} : big ? {width:96,height:134,objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',display:'block',transform: mirror ? 'scaleX(-1)' : 'none'} : {width:52,height:70,objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',flexShrink:0,display:'block'}} />
  )
  return (
    <span style={{width:44,height:44,borderRadius:'50%',flexShrink:0,display:'inline-flex',alignItems:'center',justifyContent:'center',background:rankColor(m?.rank),color:'#f5f0e8',fontSize:'1.25rem',fontWeight:700,fontFamily:"'Noto Sans JP',sans-serif"}}>
      {ch}
    </span>
  )
}
const dispName = (m, lang) => lang === 'ja' && m?.nameJp ? trimJp(m.nameJp) : lang === 'uk' ? ukrName(m?.name || '') : (m?.name || '')  /* ukr_names_v4 */
const ageOf = (bd) => bd ? Math.floor((Date.now() - new Date(bd)) / (365.25 * 24 * 3600 * 1000)) : null

function BashoMini({ hist, cur, dimNonMak, lang }) {  /* compare_v13 compare_scope_last9_v1 */
  const cells = (hist || []).slice(-9)
  return (
    <div style={{display:'flex',gap:4,justifyContent:'space-between',flexWrap:'wrap',width:'100%'}}>{/* compare_v11 */}
      {cells.map(h => {
        const kyujo = (h.w + h.l) === 0
        const kk = !kyujo && h.w > h.l
        return (
          <div key={h.b} style={{textAlign:'center',minWidth:34,opacity: dimNonMak && !(h.r && ['Yokozuna','Ozeki','Sekiwake','Komusubi','Maegashira'].some(p => String(h.r).startsWith(p))) ? 0.35 : 1}}>
            <div style={{fontFamily:'monospace',fontSize:'0.46rem',color:'var(--light)'}}>{String(h.b).slice(2,4)}/{String(h.b).slice(4)}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.66rem',fontWeight:600,color: kyujo ? 'var(--light)' : kk ? 'var(--ink)' : '#c0392b'}}>{kyujo ? '\u4f11' : h.w + '\u2013' + h.l}{h.y ? '\ud83c\udfc6' : ''}</div>
            {h.r ? <div style={{fontFamily:'monospace',fontSize:'0.44rem',color:'var(--mid)',whiteSpace:'nowrap'}}>{shortRank(h.r, lang)}</div> : null}
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
  const [isMobile, setIsMobile] = useState(false)  /* compare_mobile_v1 */
  const [scope, setScope] = useState('career')  /* compare_scope_v1 */
  const [mkStats, setMkStats] = useState({})
  /* compare_scope_v2_moved: effect pereikhav nyzhche r1/r2 */
  const eff = (m, key, careerVal) => scope === 'makuuchi' ? (mkStats[String(m.id)]?.[key] ?? null) : careerVal
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
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
  const h2hView = (() => {  /* compare_scope_h2h_v1: h2h u scope-rezhymi */
    if (!h2h) return null
    if (scope !== 'makuuchi') return h2h
    const bouts = (h2h.bouts || []).filter(b => b.division === 'Makuuchi')
    return {
      bouts,
      total: bouts.length,
      wins1: bouts.filter(b => b.winnerId === Number(id1)).length,
      wins2: bouts.filter(b => b.winnerId === Number(id2)).length,
    }
  })()
  useEffect(() => {
    if (!r1 || !r2 || scope !== 'makuuchi') return
    ;[r1.id, r2.id].forEach(id => {
      if (mkStats[String(id)]) return
      fetch(`/api/rikishi-stats?id=${id}`).then(x => x.json()).then(d => {
        if (d.makuuchi) setMkStats(s => ({ ...s, [String(id)]: d.makuuchi }))
      }).catch(() => {})
    })
  }, [scope, r1?.id, r2?.id])

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
            {DIVS.map(d => <option key={d} value={d}>{d ? (lang === 'uk' ? ukrDivision(d) : d) : t3(lang, 'всі', 'all', '全て')}</option>)}
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

  const winPct = (m) => {
    if (scope === 'makuuchi') { const s = mkStats[String(m.id)]; return s?.bouts ? Math.round((s.wins / s.bouts) * 100) : null }
    return m?.matches ? Math.round((m.wins / m.matches) * 100) : null
  }
  const rows = (r1 && r2) ? [
    { l: t3(lang, 'Ранг', 'Rank', '番付'), v: m => m.rank ? displayRank(m.rank, lang) : '—', cmp: null },  /* ukr_ranks_v2 */
    { l: t3(lang, 'Найвищий ранг', 'Highest rank', '最高位'), v: m => m.hiRank ? displayRank(m.hiRank, lang) : '—', cmp: m => -(m.hiVal || 9999) },
    { l: t3(lang, 'Рейтинг Dohyo', 'Dohyo Rating', '土俵レーティング'),  /* dohyo_rating_wire_v1 */ v: m => {
        const e = eloData.ratings[String(m.id)]
        if (e === undefined || e.bouts === 0) return '—'
        return e.ovr  /* compare_ovr_v2_plainnum: delta vynesena z compare - lamala CountUp-parsing */
      }, cmp: m => (eloData.ratings[String(m.id)] || {}).ovr || 0, hl: true },  /* compare_ovr_v1 */
    { l: t3(lang, 'Вік', 'Age', '年齢'), v: m => ageOf(m.birthDate) ?? '—', cmp: m => -(ageOf(m.birthDate) ?? 99) },  /* compare_v2: menshyi vik = krashchyi */
    { l: t3(lang, 'Зріст', 'Height', '身長'), v: m => m.height ? m.height + ' cm' : '—', cmp: m => m.height || 0 },
    { l: t3(lang, 'Вага', 'Weight', '体重'), v: m => m.weight ? m.weight + ' kg' : '—', cmp: m => m.weight || 0 },
    { l: t3(lang, 'Стайня', 'Stable', '部屋'), v: m => m.heya ? <HeyaLink heya={m.heya} lang={lang} /> : '—', cmp: null },
    { l: t3(lang, 'Дебют', 'Debut', '初土俵'), v: m => m.debut ? `${String(m.debut).slice(0,4)}/${String(m.debut).slice(4)}` : '—', cmp: null },
    { l: t3(lang, 'Башьо', 'Basho', '場所数'), v: m => eff(m, 'basho', m.basho) ?? '—', cmp: m => eff(m, 'basho', m.basho) || 0 },
    { l: t3(lang, 'Боїв', 'Bouts', '取組数'), v: m => eff(m, 'bouts', m.matches) ?? '—', cmp: m => eff(m, 'bouts', m.matches) || 0 },
    { l: t3(lang, 'Перемог', 'Wins', '勝利数'), v: m => eff(m, 'wins', m.wins) ?? '—', cmp: m => eff(m, 'wins', m.wins) || 0 },
    { l: t3(lang, 'Вінрейт', 'Win rate', '勝率'), v: m => winPct(m) !== null ? winPct(m) + '%' : '—', cmp: m => winPct(m) || 0 },
    { l: t3(lang, 'Юшо', 'Yusho', '優勝'), v: m => eff(m, 'yusho', m.yusho || 0) ?? 0, cmp: m => eff(m, 'yusho', m.yusho || 0) || 0 },
  ] : []

  return (
    <div style={{marginTop:'1rem'}}>
      <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',gap:12,marginBottom:'1rem'}}>
        <Sel val={id1} set={setId1} other={id2} />
        <Sel val={id2} set={setId2} other={id1} />
      </div>
      {r1 && r2 && (
        <div style={{display:'flex',gap:8,marginBottom:'0.8rem'}}>
          {['career','makuuchi'].map(s => (
            <button key={s} onClick={() => setScope(s)} style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.3rem 0.8rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: scope === s ? '#8a6a00' : 'var(--bg2)',color: scope === s ? '#fff' : 'var(--mid)'}}>
              {s === 'career' ? t3(lang, 'Вся кар\u2019єра', 'Full career', '全キャリア') : t3(lang, 'Макуучі', 'Makuuchi', '幕内')}
            </button>
          ))}
        </div>
      )}
      {r1 && r2 && (
        <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:2}}>{/* compare_v7: foto vseredyni riadkovoi zony */}
          <div style={{minWidth:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,padding:'0.9rem 1rem',borderBottom:'1px solid var(--border)',alignItems:'center'}}>
            <div style={{fontWeight:800,fontSize:'1.05rem',textAlign:'right'}}>{dispName(r1, lang)}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>vs</div>
            <div style={{fontWeight:800,fontSize:'1.05rem'}}>{dispName(r2, lang)}</div>
          </div>
          {h2hView && h2hView.total > 0 && (
            <div onClick={() => setBoutsOpen(o => !o)} title={t3(lang, 'клік — історія зустрічей', 'click — bout history', 'クリックで対戦履歴')} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:8,padding:'0.6rem 1rem',borderBottom:'1px solid var(--border)',alignItems:'center',background:'rgba(184,134,11,0.06)',cursor:'pointer'}}>
              <div style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.95rem',textAlign:'right',color: h2hView.wins1 > h2hView.wins2 ? '#1a6b5c' : 'var(--ink)'}}>{h2hView.wins1}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)'}}>{t3(lang, 'очні зустрічі', 'head-to-head', '対戦成績')} ({h2hView.total}) {boutsOpen ? '\u25be' : '\u25b8'}  {/* compare_v6_chevron */}</div>
              <div style={{fontFamily:'monospace',fontWeight:700,fontSize:'0.95rem',color: h2hView.wins2 > h2hView.wins1 ? '#1a6b5c' : 'var(--ink)'}}>{h2hView.wins2}</div>
            </div>
          )}
          {isMobile && (
            <div style={{display:'flex',justifyContent:'center',gap:12,padding:'0.7rem 0.75rem 0',alignItems:'flex-start'}}>
              <Avatar key={'m1' + r1.id} m={r1} tall={false} big />
              <Avatar key={'m2' + r2.id} m={r2} tall={false} big mirror />
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns: isMobile ? '1fr auto 1fr' : 'minmax(140px,240px) 1fr auto 1fr minmax(140px,240px)',columnGap:10,alignItems:'stretch'}}>
            {!isMobile && <div style={{gridRow: `1 / span ${rows.length}`,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.6rem 0 0.6rem 0.75rem'}}><Avatar key={r1.id} m={r1} tall /></div>}
            {rows.map((row, i) => {
              const v1 = row.v(r1), v2 = row.v(r2)
              const c1 = row.cmp ? row.cmp(r1) : null, c2 = row.cmp ? row.cmp(r2) : null
              const b1 = row.cmp && c1 !== c2 && c1 > c2
              const b2 = row.cmp && c1 !== c2 && c2 > c1
              const cell = { display:'flex',alignItems:'center',borderBottom:'1px solid var(--border)',padding:'0.45rem 0' }
              const n1c = numPart(v1), n2c = numPart(v2)
              const canCount = row.cmp && typeof n1c === 'number' && String(v1).match(/^[0-9]/)
              return [
                <div key={i + 'a'} style={{...cell,justifyContent:'flex-end',gridColumn: isMobile ? 1 : 2,fontFamily:'monospace',fontSize: isMobile ? '0.72rem' : '0.78rem',fontWeight: (b1 || b2) ? 700 : 400,color: b1 ? '#1a6b5c' : b2 ? '#c0392b' : 'var(--ink)'}}>{row.hl ? <OvrBar val={typeof n1c === 'number' ? n1c : 0} mirror={true} better={b1 ? true : b2 ? false : null} /> : canCount ? <><CountUp value={n1c} />{String(v1).replace(/^[0-9.\-]+/, '')}</> : v1}</div>,  /* ovr_bar_v1 */
                <div key={i + 'b'} style={{...cell,justifyContent:'center',gridColumn: isMobile ? 2 : 3,fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',minWidth:100,flexDirection:'column',gap:3}}><span>{row.l}</span>{row.cmp ? <TugLine c1={c1} c2={c2} /> : null}</div>,  /* ratio_in_label_v1 */
                <div key={i + 'c'} style={{...cell,gridColumn: isMobile ? 3 : 4,fontFamily:'monospace',fontSize: isMobile ? '0.72rem' : '0.78rem',fontWeight: (b1 || b2) ? 700 : 400,color: b2 ? '#1a6b5c' : b1 ? '#c0392b' : 'var(--ink)'}}>{row.hl ? <OvrBar val={typeof n2c === 'number' ? n2c : 0} mirror={false} better={b2 ? true : b1 ? false : null} /> : canCount ? <><CountUp value={n2c} />{String(v2).replace(/^[0-9.\-]+/, '')}</> : v2}</div>,  /* ovr_bar_v1 */
              ]  /* compare_anim_v2 */
            })}
            {!isMobile && <div style={{gridRow: `1 / span ${rows.length}`,gridColumn:5,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.6rem 0.75rem 0.6rem 0'}}><Avatar key={r2.id} m={r2} tall mirror /></div>}
            <div style={{gridColumn: isMobile ? 1 : '1 / 3',padding:'0.7rem 0 0.7rem 0.75rem',borderTop:'1px solid var(--border)'}}><BashoMini lang={lang} dimNonMak={scope === 'makuuchi'} hist={r1.last9} cur={liveRec[String(r1.id)] ? { b: currentBashoId(), ...liveRec[String(r1.id)] } : null} /></div>{/* compare_v12 */}
            <div style={{gridColumn: isMobile ? 2 : 3,borderTop:'1px solid var(--border)'}} />
            <div style={{gridColumn: isMobile ? 3 : '4 / 6',padding:'0.7rem 0.75rem 0.7rem 0',borderTop:'1px solid var(--border)'}}><BashoMini lang={lang} dimNonMak={scope === 'makuuchi'} hist={r2.last9} cur={liveRec[String(r2.id)] ? { b: currentBashoId(), ...liveRec[String(r2.id)] } : null} /></div>
          </div>

          {boutsOpen && h2hView && h2hView.bouts && h2hView.bouts.length > 0 && (  /* compare_v7_matrix */
            <div style={{borderTop:'1px solid var(--border)',padding:'0.7rem 1rem',overflowX:'auto'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',marginBottom:8}}>
                {t3(lang, 'Очні зустрічі', 'Head-to-head bouts', '対戦履歴')} ({h2hView.total})
              </div>
              {(() => {
                const byBasho = []
                const seen = new Map()
                for (const b of [...h2hView.bouts].reverse()) {
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
