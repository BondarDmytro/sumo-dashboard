'use client'
/* division_select_v1 -> div_modal_v1: popover-modalka yak u BashoSelect */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target) && !(e.target.closest && e.target.closest('[data-division-popover]'))) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const label = (d) => lang === 'ja' ? d.ja : d.id
  const cur = DIVS.find(d => d.id === division) || DIVS[0]
  const btn = { fontFamily: 'monospace', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(240,192,96,0.3)', borderRadius: 2, padding: '4px 10px', cursor: 'pointer' }
  const btnActive = { ...btn, background: '#b8860b', color: '#1a120a', borderColor: '#b8860b', fontWeight: 700 }

  return (
    <div ref={boxRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...btn, padding: '6px 12px', fontSize: '0.72rem' }}>
        {label(cur)} {'\u25be'}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div data-division-popover="1" style={{ position: 'fixed', top: 110, right: 24, zIndex: 9999, width: 240, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
          background: '#161006', border: '1px solid rgba(240,192,96,0.35)', borderRadius: 4, padding: 12, boxShadow: '0 12px 34px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>{/* div_modal_grid_v1 */}
            {DIVS.map(d => (
              <button key={d.id} style={{ ...(division === d.id ? btnActive : btn), width: '100%', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} onClick={() => { setDivision(d.id); setOpen(false) }}>
                {label(d)}{lang !== 'ja' && <span style={{ marginLeft: 6, opacity: 0.55, textTransform: 'none' }}>{d.ja}</span>}
              </button>
            ))}
          </div>
        </div>
      , document.body)}
    </div>
  )
}
