'use client'
/* heya_live_v5: grid - rang pislia imeni, 9 basho-kolonok z nazvamy, potochne basho v zaholovku */
import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { useBios } from './BiosProvider'
import { t3 } from '../i18n'
import { shortRank } from '../lib/bashoCalendar' /* heya_live_v12 */

const BASHO_LIST = (() => {
  const out = []
  let y = 2026, m = 5
  for (let i = 0; i < 9; i++) {
    out.push(`${y}${String(m).padStart(2, '0')}`)
    m -= 2
    if (m < 1) { m += 12; y -= 1 }
  }
  return out.reverse()  /* khronolohichno: 202501 ... 202605 */
})()
const CURRENT = '202607'

const BASHO_NAME = {
  '01': { uk: 'Хацу', en: 'Hatsu', ja: '初' },
  '03': { uk: 'Хару', en: 'Haru', ja: '春' },
  '05': { uk: 'Нацу', en: 'Natsu', ja: '夏' },
  '07': { uk: 'Наґоя', en: 'Nagoya', ja: '名古屋' },
  '09': { uk: 'Акі', en: 'Aki', ja: '秋' },
  '11': { uk: 'Кюшю', en: 'Kyushu', ja: '九州' },
}
function bashoLabel(b, lang) {
  const mm = String(b).slice(4)
  const yy = String(b).slice(2, 4)
  const n = BASHO_NAME[mm]
  return { name: n ? (n[lang] || n.en) : mm, date: `${mm}.${yy}` }
}

const COLS = (n) => `22px 20px 130px 150px repeat(${n}, 48px) 52px minmax(120px,1fr)`  /* heya_live_v6 */
const COLS_M = (n) => `16px 18px minmax(0,1fr) 52px repeat(${n}, 36px) 36px`  /* heya_live_v12 */

export default function HeyaClient({ members = [], memberIds, heyaName }) {
  const { lang } = useLang()
  const bios = useBios()
  const [isMobile, setIsMobile] = useState(false)  /* heya_live_v12 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const [data, setData] = useState(null)
  useEffect(() => {
    fetch('/api/rikishi-list').then(r => r.json()).then(d => setData(d)).catch(() => setData({}))
  }, [])
  if (!data) return null
  const list = members.length ? members : (memberIds || []).map(id => ({ id, last9: [] }))
  const byId = {}
  list.forEach(m => { byId[String(m.id)] = m })
  const ids = new Set(list.map(m => String(m.id)))
  const live = (data?.rikishi || []).filter(x => ids.has(String(x.id)) || ids.has(String(x._id)))
  if (!live.length) return null
  live.sort((a, b) => (a.rankValue || 99999) - (b.rankValue || 99999))  /* heya_live_v9: sort za rangom vid naivyshchoho */
  const cur = bashoLabel(CURRENT, lang)
  const cellBase = { fontFamily:'monospace', fontSize:'0.56rem', padding:'1px 0', borderRadius:2, textAlign:'center', whiteSpace:'nowrap' }
  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1rem 1.25rem',overflowX:'auto'}}>
      <h2 style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',margin:'0 0 0.6rem'}}>
        {t3(lang, `${heyaName} у поточному басьо`, `${heyaName} in the current basho`, `今場所の${heyaName}部屋`)}
      </h2>
      <div style={{minWidth: isMobile ? 0 : 940}}>{/* heya_live_v12 */}
        <div style={{display:'grid',gridTemplateColumns: isMobile ? COLS_M(3) : COLS(BASHO_LIST.length),gap: isMobile ? 2 : 4,alignItems:'end',padding:'2px 2px 4px',borderBottom:'2px solid var(--border)',fontFamily:'monospace',fontSize:'0.53rem',letterSpacing:'0.05em',textTransform:'uppercase',color:'var(--mid)'}}>
          <span />
          <span />
          <span>{t3(lang, 'Рікіші', 'Rikishi', '力士')}</span>
          <span>{t3(lang, 'Ранг', 'Rank', '番付')}</span>
          {(isMobile ? BASHO_LIST.slice(-3) : BASHO_LIST).map(b => {
            const L = bashoLabel(b, lang)
            return (
              <span key={b} style={{textAlign:'center',lineHeight:1.25}}>
                <span style={{display:'block'}}>{L.name}</span>
                <span style={{display:'block',color:'var(--light)'}}>{L.date}</span>
              </span>
            )
          })}
          <span style={{textAlign:'center',lineHeight:1.25,color:'#8a6a00',fontWeight:700}}>
            <span style={{display:'block'}}>{cur.name}</span>
            <span style={{display:'block'}}>{cur.date}</span>
          </span>
          {!isMobile && <span>{t3(lang, 'Бої', 'Bouts', '取組')}</span>}{/* heya_live_v12 */}
        </div>
        {live.map((r, i) => {
          const m = byId[String(r.id)] || byId[String(r._id)] || {}
          const flag = bios?.[String(r._id || r.id)]?.country?.flag || '\ud83c\uddef\ud83c\uddf5'
          const histBy = {}
          ;(m.last9 || []).forEach(h => { histBy[h.b] = h })
          return (
            <div key={r._id || r.id} style={{display:'grid',gridTemplateColumns: isMobile ? COLS_M(3) : COLS(BASHO_LIST.length),gap: isMobile ? 2 : 4,alignItems:'center',padding:'4px 2px',borderBottom:'1px solid var(--border)',fontFamily:'monospace',fontSize: isMobile ? '0.66rem' : '0.72rem'}}>
              <span style={{textAlign:'right',color:'var(--mid)',fontSize:'0.62rem'}}>{i + 1}.</span>
              <span style={{textAlign:'center',fontSize:'0.8rem'}}>{flag}</span>
              <span style={{fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.name}</span>{/* heya_live_v10 */}
              <span style={{color:'var(--mid)',fontSize:'0.62rem',whiteSpace:'nowrap'}}>{isMobile ? shortRank(r.rank, lang) : r.rank}</span>{/* heya_live_v12 */}
              {(isMobile ? BASHO_LIST.slice(-3) : BASHO_LIST).map(b => {
                const h = histBy[b]
                if (!h) return <span key={b} style={{...cellBase,color:'var(--light)'}}>{'\u2014'}</span>
                const kyujo = (h.w + h.l) === 0
                const kachi = !kyujo && h.w > h.l
                return (
                  <span key={b} title={`${bashoLabel(b, lang).name} ${bashoLabel(b, lang).date}: ${h.w}-${h.l}${h.a ? '-' + h.a : ''}${h.y ? ' \ud83c\udfc6' : ''}`}
                    style={{...cellBase,
                      background: h.y ? 'rgba(184,134,11,0.18)' : kyujo ? 'var(--bg2)' : kachi ? 'rgba(26,107,92,0.14)' : 'rgba(192,57,43,0.10)',
                      boxShadow: h.y ? 'inset 0 0 0 1px #b8860b' : 'none',
                      color: h.y ? '#8a6a00' : kyujo ? 'var(--light)' : kachi ? '#1a6b5c' : '#c0392b',
                      fontWeight: h.y ? 700 : 400}}>{/* heya_live_v11: yusho-klitynka */}
                    {kyujo ? '\u4f11' : `${h.y ? '\ud83c\udfc6' : ''}${h.w}-${h.l}`}
                  </span>
                )
              })}
              <span style={{textAlign:'center',fontWeight:700,color: (r.wins || 0) >= (r.losses || 0) ? '#1a6b5c' : '#c0392b'}}>{(r.wins ?? 0) + '\u2013' + (r.losses ?? 0)}</span>
              {!isMobile && <span style={{display:'flex',alignItems:'center',justifyContent:'space-between',minWidth:0}}>{/* heya_live_v7 heya_live_v12 */}
                {(() => {  /* heya_live_v8: sekitori - 15 dniv za dnem, nyzhchi - 7 boiovykh slotiv */
                  const isSekitori = ['Makuuchi', 'Juryo'].includes(r.division)
                  const slots = isSekitori ? 15 : 7
                  const rec = (r.record || [])
                  const played = rec.filter(b => String(b.result || '').trim() !== '' && b.result !== 'absent')
                  return Array.from({ length: slots }, (_, j) => {
                    const b = isSekitori ? rec.find(x => x.day === j + 1 && String(x.result || '').trim() !== '' && x.result !== 'absent') : played[j]
                    if (!b) return <span key={j} style={{fontSize:'0.62rem',color:'var(--light)',lineHeight:1}}>{'\u25e6'}</span>  /* heya_live_v10: vydymyi placeholder dnia */
                    const res = String(b.result)
                    const win = res === 'win' || res === 'fusen win'
                    const fusen = res.startsWith('fusen')
                    const ch = fusen ? (win ? '\u25a1' : '\u25a0') : (win ? '\u25cb' : '\u25cf')
                    return (
                      <span key={j} title={`d${b.day}: ${res}${b.opponent ? ' vs ' + b.opponent : ''}${b.kimarite && !fusen ? ' (' + b.kimarite + ')' : ''}`}
                        style={{fontSize:'0.62rem',color:'var(--ink)',lineHeight:1}}>
                        {ch}
                      </span>
                    )
                  })
                })()}
              </span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
