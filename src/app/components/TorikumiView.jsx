'use client'

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

const RANK_ORDER = ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi', 'Maegashira']

function getRankValue(rank) {
  if (!rank) return 999
  const idx = RANK_ORDER.findIndex(r => rank.includes(r))
  const num = parseInt(rank.match(/\d+/)?.[0] || '0')
  const side = rank.includes('East') ? 0 : 1
  return idx * 100 + num * 2 + side
}

export default function TorikumiView({ currentDay, bios = {}, rikishi = [] }) {
  const { lang } = useLang()
  const [matches, setMatches] = useState([])
  const [h2hData, setH2hData] = useState({})
  const [loading, setLoading] = useState(true)
  const nextDay = currentDay

  useEffect(() => {
    if (nextDay > 15) { setLoading(false); return }
    fetch(`/api/torikumi?day=${nextDay}`)
      .then(r => r.json())
      .then(async d => {
        setMatches(d)
        // Завантажуємо H2H для всіх пар паралельно
        const h2hResults = {}
        await Promise.all(d.map(async m => {
          try {
            const res = await fetch(`/api/h2h?id1=${m.eastId}&id2=${m.westId}`)
            const data = await res.json()
            h2hResults[`${m.eastId}-${m.westId}`] = data
          } catch {}
        }))
        setH2hData(h2hResults)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [nextDay])

  if (nextDay > 15) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {lang === 'en' ? 'Tournament is over' : 'Турнір завершено'}
    </div>
  )

  if (loading) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {lang === 'en' ? 'Loading...' : 'Завантаження...'}
    </div>
  )

  if (!matches.length) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {lang === 'en' ? `Schedule for day ${nextDay} not yet available` : `Розклад на день ${nextDay} ще не сформовано`}
    </div>
  )

  const rikishiMap = {}
  rikishi.forEach(r => { rikishiMap[r.name] = r })

  const isSanyaku = (rank) =>
    ['Yokozuna','Ozeki','Sekiwake','Komusubi'].some(r => rank?.includes(r))

const getSanyakuRank = (m) => {
    const e = getRankValue(m.eastRank)
    const w = getRankValue(m.westRank)
    if (isSanyaku(m.eastRank) && isSanyaku(m.westRank)) return Math.min(e, w)
    if (isSanyaku(m.eastRank)) return e
    return w
  }

const sanyaku = matches
    .filter(m => isSanyaku(m.eastRank) || isSanyaku(m.westRank))
    .sort((a, b) => b.matchNo - a.matchNo)

  const maegashira = matches
    .filter(m => !isSanyaku(m.eastRank) && !isSanyaku(m.westRank))
    .sort((a, b) => b.matchNo - a.matchNo)

  const renderMatch = (m) => {
    const eastFlag = bios[m.eastId]?.country?.flag || '🇯🇵'
    const westFlag = bios[m.westId]?.country?.flag || '🇯🇵'
    const hasResult = !!m.winnerId
    const eastWon = hasResult && m.winnerId === m.eastId
    const westWon = hasResult && m.winnerId === m.westId

    const eastR = rikishiMap[m.eastShikona]
    const westR = rikishiMap[m.westShikona]

    const h2h = h2hData[`${m.eastId}-${m.westId}`]
    const hasH2H = h2h && h2h.total > 0

    return (
      <div key={m.id} style={{
        display:'grid',
        gridTemplateColumns:'1fr 140px 1fr',
        gap:4,
        padding:'0.6rem 1rem',
        borderBottom:'1px solid var(--border)',
        alignItems:'center',
      }}>
        {/* East */}
        <div style={{
          display:'flex',alignItems:'center',gap:6,justifyContent:'flex-end',
          opacity: hasResult && !eastWon ? 0.4 : 1,
        }}>
          <div style={{textAlign:'right'}}>
            <div style={{fontWeight: eastWon ? 800 : 600, fontSize:'0.88rem'}}>
              {eastFlag} {m.eastShikona}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:2}}>{m.eastRank}</div>
            {eastR && (
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',fontWeight:600,
                color: eastR.wins >= 8 ? '#1a6b5c' : eastR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>
                {eastR.wins}–{eastR.losses}
              </div>
            )}
          </div>
          {hasResult && eastWon && (
            <span style={{width:10,height:10,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid var(--ink)',flexShrink:0,display:'inline-block'}} />
          )}
        </div>

        {/* Center */}
        <div style={{textAlign:'center'}}>
          {hasResult ? (
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:4}}>
              {m.kimarite}
            </div>
          ) : (
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--light)',marginBottom:4}}>vs</div>
          )}
          {hasH2H && (
            <div style={{
              fontFamily:'monospace',fontSize:'0.58rem',
              color:'var(--mid)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:4,
            }}>
              <span style={{color: h2h.wins1 > h2h.wins2 ? '#1a6b5c' : h2h.wins1 < h2h.wins2 ? '#c0392b' : 'var(--mid)',fontWeight:700}}>
                {h2h.wins1}
              </span>
              <span style={{color:'var(--light)'}}>–</span>
              <span style={{color: h2h.wins2 > h2h.wins1 ? '#1a6b5c' : h2h.wins2 < h2h.wins1 ? '#c0392b' : 'var(--mid)',fontWeight:700}}>
                {h2h.wins2}
              </span>
              <span style={{color:'var(--light)',fontSize:'0.52rem'}}>({h2h.total})</span>
            </div>
          )}
        </div>

        {/* West */}
        <div style={{
          display:'flex',alignItems:'center',gap:6,
          opacity: hasResult && !westWon ? 0.4 : 1,
        }}>
          {hasResult && westWon && (
            <span style={{width:10,height:10,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid var(--ink)',flexShrink:0,display:'inline-block'}} />
          )}
          <div>
            <div style={{fontWeight: westWon ? 800 : 600, fontSize:'0.88rem'}}>
              {westFlag} {m.westShikona}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:2}}>{m.westRank}</div>
            {westR && (
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',fontWeight:600,
                color: westR.wins >= 8 ? '#1a6b5c' : westR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>
                {westR.wins}–{westR.losses}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {sanyaku.length > 0 && (
        <div style={{marginBottom:'0.5rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid #b8860b',marginBottom:1}}>
            {lang === 'en' ? "San'yaku" : "Сан'яку"}
          </div>
          {sanyaku.map(m => renderMatch(m))}
        </div>
      )}
      {maegashira.length > 0 && (
        <div>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid var(--border)',marginBottom:1}}>
            Maegashira
          </div>
          {maegashira.map(m => renderMatch(m))}
        </div>
      )}
    </div>
  )
}