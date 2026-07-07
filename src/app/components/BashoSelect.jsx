'use client'
/* basho_history_select_v1: дворівневий вибір басьо 1958-сьогодні.
   Режим "За роком": декада -> рік -> басьо. Режим "За басьо": назва -> рік. */
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom' /* select_portal_v1 */
import { useLang } from './LangProvider'
import { bashoInfo, bashoIdsOfYear, HISTORY_START_YEAR } from '../lib/bashoCalendar'
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext'

const MONTHS = [1, 3, 5, 7, 9, 11]

export default function BashoSelect() {
  const { lang } = useLang()
  const { selBasho, setSelBasho } = useBashoFilter()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('year')      // 'year' | 'basho'
  const [decade, setDecade] = useState(2020)
  const [year, setYear] = useState(null)        // обраний рік у режимі year
  const [month, setMonth] = useState(null)      // обраний місяць у режимі basho
  const boxRef = useRef(null)

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target) && !(e.target.closest && e.target.closest('[data-basho-popover]'))) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const L = (id) => bashoInfo(id).label[lang === 'en' ? 'en' : 'uk']
  const nowYear = new Date().getFullYear()
  const decades = []
  for (let d = Math.floor(nowYear / 10) * 10; d >= Math.floor(HISTORY_START_YEAR / 10) * 10; d -= 10) decades.push(d)
  const yearsOfDecade = (d) => {
    const ys = []
    for (let y = Math.min(d + 9, nowYear); y >= Math.max(d, HISTORY_START_YEAR); y--) ys.push(y)
    return ys
  }
  const allYearsDesc = (() => { const ys = []; for (let y = nowYear; y >= HISTORY_START_YEAR; y--) ys.push(y); return ys })()
  const bashoName = (m) => bashoInfo('2026' + String(m).padStart(2, '0')).label[lang === 'en' ? 'en' : 'uk'].replace(/\s*\d{4}$/, '')
  const pick = (id) => { setSelBasho(id); setOpen(false) }
  const idsForYear = (y) => {
    const ids = bashoIdsOfYear(y)
    if (String(CURRENT_BASHO).startsWith(String(y)) && !ids.includes(CURRENT_BASHO)) ids.push(CURRENT_BASHO)
    return ids
  }

  const btn = { fontFamily: 'monospace', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.06)', color: '#f5f0e8', borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(240,192,96,0.3)', borderRadius: 2, padding: '4px 10px', cursor: 'pointer' }  /* border_longhand_v1 */
  const btnActive = { ...btn, background: '#b8860b', color: '#1a120a', borderColor: '#b8860b', fontWeight: 700 }  // longhand-only, конфлікту нема

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ ...btn, padding: '6px 12px', fontSize: '0.72rem' }}>
        {L(selBasho)} ▾
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div data-basho-popover="1" style={{ position: 'fixed', top: 110, right: 24, zIndex: 9999,  /* select_fix_v3 */ width: 340, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',  /* select_fix_v2 */
          background: '#161006', border: '1px solid rgba(240,192,96,0.35)', borderRadius: 4, padding: 12, boxShadow: '0 12px 34px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button style={mode === 'year' ? btnActive : btn} onClick={() => setMode('year')}>{lang === 'en' ? 'By year' : 'За роком'}</button>
            <button style={mode === 'basho' ? btnActive : btn} onClick={() => setMode('basho')}>{lang === 'en' ? 'By basho' : 'За басьо'}</button>
          </div>

          {mode === 'year' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {decades.map(d => (
                  <button key={d} style={{ ...(decade === d ? btnActive : btn), textTransform: 'none' }} onClick={() => { setDecade(d); setYear(null) }}>{d}{lang === 'en' ? 's' : '-\u0456'}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {yearsOfDecade(decade).map(y => (
                  <button key={y} style={year === y ? btnActive : btn} onClick={() => setYear(y)}>{y}</button>
                ))}
              </div>
              {year && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, borderTop: '1px solid rgba(240,192,96,0.2)', paddingTop: 10 }}>
                  {idsForYear(year).map(id => (
                    <button key={id} style={selBasho === id ? btnActive : btn} onClick={() => pick(id)}>{L(id)}</button>
                  ))}
                  {idsForYear(year).length === 0 && <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#8a8378' }}>{lang === 'en' ? 'No data' : 'Нема даних'}</span>}
                </div>
              )}
            </div>
          )}

          {mode === 'basho' && (
            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {MONTHS.map(m => (
                  <button key={m} style={month === m ? btnActive : btn} onClick={() => setMonth(m)}>{bashoName(m)}</button>
                ))}
              </div>
              {month && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5, borderTop: '1px solid rgba(240,192,96,0.2)', paddingTop: 10 }}>
                  {allYearsDesc.map(y => {
                    const id = String(y) + String(month).padStart(2, '0')
                    const ok = idsForYear(y).includes(id)
                    return (
                      <button key={y} disabled={!ok} style={{ ...(selBasho === id ? btnActive : btn), opacity: ok ? 1 : 0.3, cursor: ok ? 'pointer' : 'default', padding: '4px 2px', fontSize: '0.62rem' }}
                        onClick={() => ok && pick(id)}>{y}</button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      , document.body)}
    </div>
  )
}
