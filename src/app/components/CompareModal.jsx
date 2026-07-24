'use client'
/* compare_modal_v1: mini-porivniannia pary z torikumi */
import meta from '../lib/rikishiMeta.json'
import eloData from '../lib/eloRatings.json'
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import { displayRank } from '../lib/bashoCalendar'
import RikishiLink from './RikishiLink'

const tierColor = (ovr) => ovr >= 90 ? '#c0392b' : ovr >= 75 ? '#7d3c98' : ovr >= 60 ? '#1a4a7a' : ovr >= 40 ? '#1a6b5c' : '#5a544a'
const age = (bd) => { if (!bd) return null; const d = new Date(bd); const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a }

export default function CompareModal({ eastId, westId, h2hWins, h2hTotal, onClose }) {
  const { lang } = useLang()
  const m1 = meta.find(x => String(x.id) === String(eastId))
  const m2 = meta.find(x => String(x.id) === String(westId))
  if (!m1 || !m2) return null
  const e1 = eloData.ratings[String(eastId)] || {}
  const e2 = eloData.ratings[String(westId)] || {}
  const wr = (m) => m.matches ? Math.round(m.wins / m.matches * 100) : null

  const rows = [
    { l: t3(lang, 'Ранг', 'Rank', String.fromCharCode(0x756A) + String.fromCharCode(0x4ED8)), v1: displayRank(m1.rank, lang), v2: displayRank(m2.rank, lang) },
    { l: t3(lang, 'Вік', 'Age', String.fromCharCode(0x5E74) + String.fromCharCode(0x9F62)), v1: age(m1.birthDate), v2: age(m2.birthDate), num: true },
    { l: t3(lang, 'Зріст', 'Height', 'cm'), v1: m1.height, v2: m2.height, num: true },
    { l: t3(lang, 'Вага', 'Weight', 'kg'), v1: m1.weight, v2: m2.weight, num: true },
    { l: t3(lang, 'Вінрейт', 'Win rate', '%'), v1: wr(m1), v2: wr(m2), num: true },
    { l: t3(lang, 'Юшо', 'Yusho', String.fromCharCode(0x512A) + String.fromCharCode(0x52DD)), v1: m1.yusho || 0, v2: m2.yusho || 0, num: true },
    { l: t3(lang, 'Стайня', 'Stable', String.fromCharCode(0x90E8) + String.fromCharCode(0x5C4B)), v1: m1.heya, v2: m2.heya },
    { l: t3(lang, 'Дебют', 'Debut', String.fromCharCode(0x521D)), v1: m1.debut ? m1.debut.slice(0,4) + '/' + m1.debut.slice(4) : null, v2: m2.debut ? m2.debut.slice(0,4) + '/' + m2.debut.slice(4) : null },
    { l: t3(lang, 'Басьо', 'Basho', String.fromCharCode(0x5834) + String.fromCharCode(0x6240)), v1: m1.basho, v2: m2.basho, num: true },
    { l: t3(lang, 'Боїв', 'Bouts', String.fromCharCode(0x53D6) + String.fromCharCode(0x7D44)), v1: m1.matches, v2: m2.matches, num: true },
    { l: t3(lang, 'Перемог', 'Wins', String.fromCharCode(0x767D) + String.fromCharCode(0x661F)), v1: m1.wins, v2: m2.wins, num: true },
  ]  /* compare_modal_v2 */

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div onClick={e => e.stopPropagation()} style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:6,maxWidth:680,width:'100%',padding:'1rem 1.2rem',boxShadow:'0 8px 30px rgba(0,0,0,0.3)',maxHeight:'90vh',overflowY:'auto'}}>
        <div style={{position:'relative',textAlign:'center',marginBottom:10}}>  {/* compare_modal_v4 */}
          <div style={{fontWeight:800,fontSize:'0.95rem',display:'inline-block'}}>
            <RikishiLink id={String(eastId)}>{m1.name}</RikishiLink>
            <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',margin:'0 6px'}}>vs</span>
            <RikishiLink id={String(westId)}>{m2.name}</RikishiLink>
          </div>
          <button onClick={onClose} style={{position:'absolute',right:0,top:0,background:'none',border:'none',fontSize:'1.1rem',cursor:'pointer',color:'var(--mid)',padding:'0 4px'}}>{String.fromCharCode(0x2715)}</button>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'stretch'}}>  {/* compare_modal_v3 */}
          <img src={`/rikishi/${eastId}.webp`} alt={m1.name} onError={e => { e.target.style.display = 'none' }} style={{width:150,height:'auto',alignSelf:'stretch',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',flexShrink:0 /* compare_modal_v5 */}} />
          <div style={{flex:1,minWidth:0}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:4,alignItems:'center',marginBottom:8}}>
          <div style={{textAlign:'right'}}><span style={{fontFamily:'monospace',fontWeight:800,fontSize:'1.1rem',color:'#fff',background:tierColor(e1.ovr || 0),padding:'2px 10px',borderRadius:4}}>{e1.ovr ?? String.fromCharCode(0x2014)}</span></div>
          <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',padding:'0 8px'}}>{t3(lang, 'Рейтинг Dohyo', 'Dohyo Rating', '')}</div>
          <div style={{textAlign:'left'}}><span style={{fontFamily:'monospace',fontWeight:800,fontSize:'1.1rem',color:'#fff',background:tierColor(e2.ovr || 0),padding:'2px 10px',borderRadius:4}}>{e2.ovr ?? String.fromCharCode(0x2014)}</span></div>
        </div>
        {typeof h2hWins === 'number' && typeof h2hTotal === 'number' && h2hTotal > 0 && (
          <div style={{textAlign:'center',fontFamily:'monospace',fontSize:'0.66rem',color:'var(--mid)',marginBottom:8}}>
            {t3(lang, 'Очні зустрічі', 'Head-to-head', String.fromCharCode(0x5BFE) + String.fromCharCode(0x6226))}: <b style={{color:'var(--ink)'}}>{h2hWins}</b> {String.fromCharCode(0x2013)} <b style={{color:'var(--ink)'}}>{h2hTotal - h2hWins}</b>
          </div>
        )}
        {rows.map(r => {
          const b1 = r.num && r.v1 != null && r.v2 != null && r.v1 > r.v2
          const b2 = r.num && r.v1 != null && r.v2 != null && r.v2 > r.v1
          return (
            <div key={r.l} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:4,padding:'0.3rem 0',borderTop:'1px solid var(--border)',alignItems:'center'}}>
              <div style={{textAlign:'right',fontFamily:'monospace',fontSize:'0.74rem',fontWeight: b1 ? 800 : 500,color: b1 ? '#1a6b5c' : b2 ? '#c0392b' : 'var(--ink)'}}>{r.v1 ?? String.fromCharCode(0x2014)}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.06em',padding:'0 8px',textAlign:'center',minWidth:70}}>{r.l}</div>
              <div style={{textAlign:'left',fontFamily:'monospace',fontSize:'0.74rem',fontWeight: b2 ? 800 : 500,color: b2 ? '#1a6b5c' : b1 ? '#c0392b' : 'var(--ink)'}}>{r.v2 ?? String.fromCharCode(0x2014)}</div>
            </div>
          )
        })}
          </div>
          <img src={`/rikishi/${westId}.webp`} alt={m2.name} onError={e => { e.target.style.display = 'none' }} style={{width:150,height:'auto',alignSelf:'stretch',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',flexShrink:0 /* compare_modal_v5 */}} />
        </div>
      </div>
    </div>
  )
}
