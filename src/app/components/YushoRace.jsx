'use client'
/* yusho_race_v1: bar chart race honky za yusho po dniakh basho */
import { useEffect, useRef, useState, useMemo } from 'react'
import { useLang } from './LangProvider'
import { t3 } from '../i18n'
import { computeStandings } from '../lib/chanceEngine'
import { rankColor } from '../lib/rankColors'
import meta from '../lib/rikishiMeta.json'

const JP_BY_ID = new Map(meta.map(m => [String(m.id), String(m.nameJp || '').split('\u3000')[0].split('(')[0]]))

export default function YushoRace({ allRikishi = [], currentDay = 1 }) {
  const { lang } = useLang()
  const [day, setDay] = useState(currentDay)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => { setDay(currentDay) }, [currentDay])

  useEffect(() => {
    if (!playing) return
    timerRef.current = setInterval(() => {
      setDay(d => {
        if (d >= currentDay) { setPlaying(false); return currentDay }
        return d + 1
      })
    }, 950)
    return () => clearInterval(timerRef.current)
  }, [playing, currentDay])

  const frame = useMemo(() => {
    if (!allRikishi?.length) return []
    const st = computeStandings(allRikishi, day)
    return (st.rikishi || [])
      .filter(r => !r.kyujo)
      .sort((a, b) => b.wins - a.wins || (a.rankValue || 999) - (b.rankValue || 999))
      .slice(0, 8)
  }, [allRikishi, day])

  if (!allRikishi?.length || currentDay < 2) return null

  const ROW_H = 30
  const maxW = Math.max(1, ...frame.map(r => r.wins))
  const name = (r) => lang === 'ja' ? (JP_BY_ID.get(String(r._id)) || r.name) : r.name

  return (
    <div style={{margin:'1rem 0 1.4rem',border:'1px solid var(--border)',borderRadius:2,background:'var(--card)',padding:'0.8rem 1rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.6rem'}}>
        <span style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--mid)'}}>
          {t3(lang, 'Гонка за юшо', 'Yusho race', '優勝争い')} · {t3(lang, 'день', 'day', '')}{day}{lang === 'ja' ? '日目' : ''}
        </span>
        <button onClick={() => { if (!playing) setDay(1); setPlaying(p => !p) }}
          style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.08em',padding:'0.28rem 0.8rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: playing ? 'var(--bg2)' : '#8a6a00',color: playing ? 'var(--mid)' : '#fff'}}>
          {playing ? t3(lang, '⏸ пауза', '⏸ pause', '⏸ 停止') : t3(lang, '▶ відтворити', '▶ replay', '▶ 再生')}
        </button>
      </div>
      <div style={{position:'relative',height: frame.length * ROW_H}}>
        {frame.map((r, idx) => (
          <div key={r._id} className="race-row" style={{position:'absolute',left:0,right:0,top:0,transform:`translateY(${idx * ROW_H}px)`,height:ROW_H,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,minWidth:110,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name(r)}</span>
            <div style={{flex:1,height:14,background:'var(--bg2)',borderRadius:2,overflow:'hidden'}}>
              <div className="race-bar" style={{height:'100%',width:`${(r.wins / maxW) * 100}%`,background: idx === 0 ? '#1a6b5c' : rankColor(r.rankFull || r.rank),opacity: idx === 0 ? 1 : 0.55,borderRadius:2}} />
            </div>
            <span style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,minWidth:34,textAlign:'right'}}>{r.wins}{'\u2013'}{r.losses}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
