'use client'
/* division_select_v1: peremykach dyvizionu v navbari, poruch iz basho */
import { useBashoFilter } from './BashoFilterContext'
import { useLang } from './LangProvider'

const DIVS = [
  { id: 'Makuuchi', ja: '\u5e55\u5185' },
  { id: 'Juryo', ja: '\u5341\u4e21' },
  { id: 'Makushita', ja: '\u5e55\u4e0b' },
  { id: 'Sandanme', ja: '\u4e09\u6bb5\u76ee' },
  { id: 'Jonidan', ja: '\u5e8f\u4e8c\u6bb5' },
  { id: 'Jonokuchi', ja: '\u5e8f\u30ce\u53e3' },
]

export default function DivisionSelect() {
  const { division, setDivision } = useBashoFilter()
  const { lang } = useLang()
  return (
    <select value={division} onChange={e => setDivision(e.target.value)} style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--ink)',background:'var(--card)',border:'1px solid var(--border)',borderRadius:2,padding:'2px 6px'}}>
      {DIVS.map(d => <option key={d.id} value={d.id}>{lang === 'ja' ? d.ja : d.id}</option>)}
    </select>
  )
}
