'use client'
/* basho_filter_v2: дропдаун вибору басьо (у хедері) */
import { useLang } from './LangProvider'
import { bashoInfo, bashoListOfYear } from '../lib/bashoCalendar'
import { useBashoFilter } from './BashoFilterContext'

export default function BashoSelect() {
  const { lang } = useLang()
  const { selBasho, setSelBasho } = useBashoFilter()
  const options = bashoListOfYear(2026).slice().reverse()
  return (
    <select value={selBasho} onChange={e => setSelBasho(e.target.value)}
      style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.08em',textTransform:'uppercase',
        background:'rgba(255,255,255,0.06)',color:'#f5f0e8',border:'1px solid rgba(240,192,96,0.35)',
        borderRadius:2,padding:'6px 12px',cursor:'pointer'}}>
      {options.map(id => (
        <option key={id} value={id} style={{color:'#1a120a'}}>{bashoInfo(id).label[lang === 'en' ? 'en' : 'uk']}</option>
      ))}
    </select>
  )
}
