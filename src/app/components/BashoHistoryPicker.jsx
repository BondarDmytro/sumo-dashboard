'use client'
/* basho_history_grid_v1: inline-tablytsia rokiv x basho; zghornuta = potochnyi rik */
import { useState } from 'react'
import { t3 } from '../i18n'

const MONTHS = ['01', '03', '05', '07', '09', '11']

export default function BashoHistoryPicker({ hist, value, onChange, lang, current = null }) {  /* history_grid_v2 */
  const [expanded, setExpanded] = useState(false)
  const mShort = { '01': t3(lang,'Хацу','Hatsu','\u521D', 'Hatsu'), '03': t3(lang,'Хару','Haru','\u6625', 'Haru'), '05': t3(lang,'Нацу','Natsu','\u590F', 'Natsu'), '07': t3(lang,'Наґоя','Nagoya','\u540D', 'Nagoya'), '09': t3(lang,'Акі','Aki','\u79CB', 'Aki'), '11': t3(lang,'Кюшю','Kyushu','\u4E5D', 'Kyushu') }
  const byKey = Object.fromEntries((hist || []).map(h => [h.b, h]))
  if (current && current.b && !byKey[current.b]) byKey[current.b] = current
  const years = [...new Set([...(hist || []).map(h => h.b.slice(0, 4)), ...(current && current.b ? [current.b.slice(0, 4)] : [])])].sort((a, b) => b.localeCompare(a))
  if (!years.length) return null
  const shown = expanded ? years : years.slice(0, 1)

  return (
    <div style={{marginBottom:'0.8rem'}}>
      <div onClick={() => setExpanded(e => !e)} style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--mid)',marginBottom:4,userSelect:'none'}}>
        {t3(lang, 'Історія турнірів', 'Tournament history', '\u5834\u6240\u6B74', 'Historique des tournois')} {expanded ? '\u25B4' : '\u25BE'}
      </div>
      <div style={{overflowX:'auto',display:'flex',justifyContent:'center'}}>
        <table style={{borderCollapse:'separate',borderSpacing:4,fontFamily:'monospace',fontSize:'0.62rem',width:'100%',maxWidth:720,tableLayout:'fixed'}}>  {/* history_grid_ui_v1 history_grid_v2 */}
          <thead>
            <tr>
              <th style={{padding:'2px 8px'}}></th>
              {MONTHS.map(m => <th key={m} style={{padding:'2px 8px',color:'var(--mid)',fontWeight:500,textTransform:'uppercase',fontSize:'0.52rem'}}>{mShort[m]}</th>)}
            </tr>
          </thead>
          <tbody>
            {shown.map(y => (
              <tr key={y}>
                <td style={{padding:'3px 8px',color:'var(--mid)',fontWeight:700}}>{y}</td>
                {MONTHS.map(m => {
                  const key = y + m
                  const h = byKey[key]
                  const sel = key === value
                  return (
                    <td key={m} onClick={h ? () => onChange(key) : undefined}
                        style={{padding:'4px 9px',textAlign:'center',cursor: h ? 'pointer' : 'default',whiteSpace:'nowrap',borderRadius:3,
                                background: sel ? '#8a6a00' : h ? (h.w >= 8 ? 'rgba(26,107,92,0.12)' : h.w + h.l >= 8 ? 'rgba(192,57,43,0.10)' : 'var(--bg2)') : 'transparent',
                                color: sel ? '#fff' : h ? (h.w >= 8 ? '#1a6b5c' : h.w + h.l >= 8 ? '#c0392b' : 'var(--mid)') : 'var(--light)',
                                boxShadow: h && h.y && !sel ? 'inset 0 0 0 1.5px #b8860b' : 'none',
                                fontWeight: h && (h.y || sel) ? 700 : 500}}>
                      {h ? <><div>{`${h.w}\u2013${h.l}`}{h.y ? String.fromCodePoint(0x1F3C6) : ''}</div>{h.r && <div style={{fontSize:'0.48rem',opacity:0.75,marginTop:1}}>{h.r.replace('Maegashira','M').replace('Juryo','J').replace('Makushita','Ms').replace('Sandanme','Sd').replace('Jonidan','Jd').replace('Jonokuchi','Jk').replace('Yokozuna','Y').replace('Ozeki','O').replace('Sekiwake','S').replace('Komusubi','K').replace(' East','e').replace(' West','w').replace(' ','')}</div>}</> : '\u00b7'}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* fr_batch4b_v1 */
