'use client'
import { ukrName } from '../lib/translit'  /* ukr_names_v4 */
/* dohyo_rating_tab_v1: tablytsia vsikh rikishi za Dohyo OVR */
import { useState, useMemo, useEffect } from 'react'
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import meta from '../lib/rikishiMeta.json'
import eloData from '../lib/eloRatings.json'
import RikishiLink from './RikishiLink'
import { displayRank, shortRank } from '../lib/bashoCalendar'
import { rankColor } from '../lib/rankColors'

const DIV_FILTERS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi', 'All']
const DIV_OF = (rank) => {  /* rating_ui_v3: povni nazvy pershymy - meta maie povni ranhy */
  const s = String(rank || '')
  if (/^(Yokozuna|Ozeki|Sekiwake|Komusubi|Maegashira)/.test(s)) return 'Makuuchi'
  if (/^Juryo/.test(s)) return 'Juryo'
  if (/^Makushita/.test(s)) return 'Makushita'
  if (/^Sandanme/.test(s)) return 'Sandanme'
  if (/^Jonidan/.test(s)) return 'Jonidan'
  if (/^Jonokuchi/.test(s)) return 'Jonokuchi'
  if (/^Ms/.test(s)) return 'Makushita'
  if (/^Sd/.test(s)) return 'Sandanme'
  if (/^Jd/.test(s)) return 'Jonidan'
  if (/^Jk/.test(s)) return 'Jonokuchi'
  if (/^J/.test(s)) return 'Juryo'
  if (/^[YOSKM]/.test(s)) return 'Makuuchi'
  return null
}

function Bar({ val }) {
  const ticks = []
  for (let t = 10; t < 100; t += 10) ticks.push(t)
  return (
    <div style={{position:'relative',width:'100%',height:8,background:'var(--bg2)',border:'1px solid #b8860b',borderRadius:2,overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,bottom:0,left:0,width:val+'%',background:'linear-gradient(90deg,#b8860b,#d4a017)'}} />
      {ticks.map(t => (
        <div key={t} style={{position:'absolute',top:0,bottom:0,left:t+'%',width:1,background:'rgba(0,0,0,0.25)'}} />
      ))}
    </div>
  )
}

/* rating_ui_v2: hradatsiia ridkosti yak v ihrakh */
const tierColor = (ovr) => ovr >= 90 ? '#c0392b' : ovr >= 75 ? '#7d3c98' : ovr >= 60 ? '#1a4a7a' : ovr >= 40 ? '#1a6b5c' : '#5a544a'
export default function DohyoRating() {
  const [isMobile, setIsMobile] = useState(false)  /* rating_mobile_v1 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const { lang } = useLang()
  const [div, setDiv] = useState('Makuuchi')
  const [sortBy, setSortBy] = useState('score')  /* rating_sort_v1 */
  const [sortDir, setSortDir] = useState(1)
  const clickSort = (key) => {
    if (sortBy === key) setSortDir(d => -d)
    else { setSortBy(key); setSortDir(1) }
  }
  const RANK_ORD2 = { Yokozuna: 0, Ozeki: 1, Sekiwake: 2, Komusubi: 3, Maegashira: 4, Juryo: 5, Makushita: 6, Sandanme: 7, Jonidan: 8, Jonokuchi: 9 }
  const rankVal = (r) => {
    const s = String(r || '')
    const dv = Object.keys(RANK_ORD2).find(k => s.startsWith(k))
    const num = parseInt((s.match(/\d+/) || [99])[0], 10)
    return (dv !== undefined ? RANK_ORD2[dv] : 99) * 1000 + num * 2 + (s.includes('West') ? 1 : 0)
  }
  const arrow = (key) => sortBy === key ? (sortDir === 1 ? ' \u25BE' : ' \u25B4') : ''

  const list = useMemo(() => {
    const joined = meta
      .map(m => ({ m, e: eloData.ratings[String(m.id)] }))
      .filter(x => x.e && x.e.bouts > 0)
      .filter(x => div === 'All' ? true : DIV_OF(x.m.rank) === div)
    joined.sort((a, b) => {
      if (sortBy === 'rank') return sortDir * (rankVal(a.m.rank) - rankVal(b.m.rank))
      if (sortBy === 'delta') return sortDir * ((b.e.delta || 0) - (a.e.delta || 0))
      return sortDir * (b.e.elo - a.e.elo)
    })  /* rating_sort_v1 */
    return joined
  }, [div, sortBy, sortDir])

  const dName = (m) => lang === 'ja' ? String(m.nameJp || m.name).split('\u3000')[0].split('(')[0] : lang === 'uk' ? ukrName(m.name) : m.name  /* ukr_names_v4 */

  return (
    <div style={{marginTop:'1rem'}}>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:'0.9rem'}}>
        {DIV_FILTERS.map(d => (
          <button key={d} onClick={() => setDiv(d)} style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.3rem 0.7rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: div === d ? '#8a6a00' : 'var(--bg2)',color: div === d ? '#fff' : 'var(--mid)'}}>
            {d === 'All' ? t3(lang, 'Всі', 'All', '全体', 'Tous') : d}
          </button>
        ))}
      </div>
      <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',marginBottom:'0.7rem'}}>
        {t3(lang,
          'Dohyo OVR — власний рейтинг сили сайту (0–99) на основі Elo: враховує кожен бій і силу суперника. Оновлюється щодня.',
          'Dohyo OVR is our in-house strength rating (0-99) based on Elo: every bout counts, weighted by opponent strength. Updated daily.',
          'Dohyo OVR' + String.fromCharCode(0x306F) + String.fromCharCode(0x5F53) + String.fromCharCode(0x30B5) + String.fromCharCode(0x30A4) + String.fromCharCode(0x30C8) + String.fromCharCode(0x72EC) + String.fromCharCode(0x81EA) + String.fromCharCode(0x306E) + String.fromCharCode(0x5B9F) + String.fromCharCode(0x529B) + String.fromCharCode(0x30EC) + String.fromCharCode(0x30FC) + String.fromCharCode(0x30C6) + String.fromCharCode(0x30A3) + String.fromCharCode(0x30F3) + String.fromCharCode(0x30B0) + String.fromCharCode(0xFF08) + '0-99' + String.fromCharCode(0xFF09), 'Dohyo OVR est notre cote de force maison (0–99) basée sur Elo : chaque combat compte, pondéré par la force de l\u2019adversaire. Mise à jour quotidienne.')}
      </div>
      <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:2}}>
        <div style={{display:'grid',gridTemplateColumns: isMobile ? '28px minmax(0,1fr) 52px 48px 34px' : '34px minmax(120px,190px) 64px 56px 40px minmax(0,2fr)'  /* rating_mobile_v1 */  /* rating_ui_v3 */,gap:8,alignItems:'center',padding:'0.4rem 0.8rem',borderBottom:'2px solid var(--border)',fontFamily:'monospace',fontSize:'0.52rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--mid)'}}>  {/* rating_ui_v2: khedery */}
          <div style={{textAlign:'center'}}>#</div>
          <div>{t3(lang, 'Рікіші', 'Rikishi', String.fromCharCode(0x529B) + String.fromCharCode(0x58EB), 'Rikishi')}</div>
          <div onClick={() => clickSort('rank')} style={{textAlign:'center',cursor:'pointer',userSelect:'none'}}>{t3(lang, 'Ранг', 'Rank', String.fromCharCode(0x756A) + String.fromCharCode(0x4ED8), 'Rang')}{arrow('rank')}</div>
          <div onClick={() => clickSort('score')} style={{textAlign:'center',cursor:'pointer',userSelect:'none'}}>{t3(lang, 'Бал', 'Score', String.fromCharCode(0x70B9), 'Cote')}{arrow('score')}</div>
          <div onClick={() => clickSort('delta')} style={{textAlign:'center',cursor:'pointer',userSelect:'none'}}>{String.fromCharCode(0x0394)}{arrow('delta')}</div>
          {!isMobile && <div>{t3(lang, 'Рейтинг', 'Rating', String.fromCharCode(0x30EC) + String.fromCharCode(0x30FC) + String.fromCharCode(0x30C6) + String.fromCharCode(0x30A3) + String.fromCharCode(0x30F3) + String.fromCharCode(0x30B0), 'Cote')}</div>}
        </div>
        {list.map((x, i) => {
          const { m, e } = x
          return (
            <div key={m.id} style={{display:'grid',gridTemplateColumns: isMobile ? '28px minmax(0,1fr) 52px 48px 34px' : '34px minmax(120px,190px) 64px 56px 40px minmax(0,2fr)'  /* rating_mobile_v1 */  /* rating_ui_v3 */  /* rating_ui_v2 */,gap:8,alignItems:'center',padding:'0.45rem 0.8rem',borderBottom:'1px solid var(--border)'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',textAlign:'center'}}>{i + 1}</div>
              <div style={{fontWeight:600,fontSize:'0.82rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}><RikishiLink id={String(m.id)}>{dName(m)}</RikishiLink></div>
              <div style={{textAlign:'center'}}><span style={{fontFamily:'monospace',fontSize:'0.56rem',color:rankColor(m.rank),fontWeight:700,background:rankColor(m.rank)+'2e',padding:'1px 4px',borderRadius:2,whiteSpace:'nowrap'}}>{shortRank(m.rank, lang)}</span></div>
              <div style={{textAlign:'center'}}><span style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:800,color:'#fff',background:tierColor(e.ovr),padding:'2px 8px',borderRadius:3,display:'inline-block',minWidth:34,textAlign:'center'}}>{e.ovr}</span></div>
              <div style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,textAlign:'center',color: e.delta > 0 ? '#1a6b5c' : e.delta < 0 ? '#c0392b' : 'var(--light)'}}>{e.delta > 0 ? String.fromCharCode(0x2191) + e.delta : e.delta < 0 ? String.fromCharCode(0x2193) + Math.abs(e.delta) : String.fromCharCode(0x2013)}</div>  {/* rating_ui_v2 */}
              {!isMobile && <Bar val={e.ovr} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* rating_ui_v4_align */

/* fr_batch4b_v1 */
