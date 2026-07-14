'use client'
/* favorites_v1: blok "Moi rikishi" - sohodnishni boi obranykh */
import { useEffect, useState } from 'react'
import { useFavorites } from './useFavorites'
import { useLang } from './LangProvider'
import { currentBashoId, bashoInfo } from '../lib/bashoCalendar'

const DIVS = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']

export default function MyRikishi() {
  const { favs } = useFavorites()
  const { lang } = useLang()
  const [bouts, setBouts] = useState([])

  useEffect(() => {
    if (!favs.length) { setBouts([]); return }
    const bi = bashoInfo(currentBashoId())
    const day = Math.min(15, Math.max(1, Math.floor((Date.now() - bi.startUtcMs) / 86400000) + 1))
    let stop = false
    const load = async (d, day_) => {
      try { return await (await fetch(`/api/torikumi?division=${d}&day=${day_}`, { cache: 'no-store' })).json() } catch { return [] }
    }
    ;(async () => {  /* fav_fallback_v1: yakshcho sohodnishnii torikumi shche ne opublikovanyi - pokazuiemo vchorashnii rezultat */
      const today = (await Promise.all(DIVS.map(d => load(d, day)))).flat().filter(Boolean)
      let mine = today.filter(m => favs.includes(Number(m.eastId)) || favs.includes(Number(m.westId)))
      const missing = favs.filter(f => !mine.some(m => Number(m.eastId) === f || Number(m.westId) === f))
      if (missing.length && day > 1) {
        const yest = (await Promise.all(DIVS.map(d => load(d, day - 1)))).flat().filter(Boolean)
        const extra = yest.filter(m => missing.includes(Number(m.eastId)) || missing.includes(Number(m.westId)))
          .map(m => ({ ...m, _yesterday: true }))
        mine = [...mine, ...extra]
      }
      if (!stop) setBouts(mine)
    })()
    return () => { stop = true }
  }, [favs])

  if (!favs.length || !bouts.length) return null
  const t = (uk, en, ja) => lang === 'en' ? en : lang === 'ja' ? ja : uk
  return (
    <div style={{marginTop:14}}>
      <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.18em',color:'#6b6560',marginBottom:8}}>
        {'\u2605 '}{t('Мої рікіші', 'My rikishi', 'お気に入り')}
      </div>
      {bouts.slice(0, 4).map(m => {
        const iAmEast = favs.includes(Number(m.eastId))
        const me = iAmEast ? m.eastShikona : m.westShikona
        const opp = iAmEast ? m.westShikona : m.eastShikona
        const won = m.winnerEn ? (m.winnerEn === me) : null
        return (
          <div key={m.id} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontFamily:'monospace',fontSize:'0.78rem'}}>
            <span style={{color:'#b8860b'}}>{'\u2605'}</span>
            <span style={{color:'#f5f0e8',fontWeight:700}}>{me}</span>
            <span style={{color:'#8a8a8a'}}>{lang === 'ja' ? '\u5bfe' : 'vs'}</span>
            <span style={{color:'#f5f0e8',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{opp}</span>
            {m._yesterday && <span style={{color:'#6b6560',fontSize:'0.6rem'}}>{t('вчора','yday','昨日')}</span>}
            {won === null
              ? <span style={{color:'#6b6560',fontSize:'0.65rem'}}>{t('очікує','soon','未')}</span>
              : won
                ? <span style={{color:'#1a9b7c',fontWeight:700}}>{'\u25cb'}</span>
                : <span style={{color:'#c0392b',fontWeight:700}}>{'\u25cf'}</span>}
          </div>
        )
      })}
    </div>
  )
}
