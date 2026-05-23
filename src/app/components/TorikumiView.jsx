'use client'

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

export default function TorikumiView({ currentDay, bios = {} }) {
  const { lang } = useLang()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const nextDay = currentDay + 1

  useEffect(() => {
    if (nextDay > 15) { setLoading(false); return }
    fetch(`/api/torikumi?day=${nextDay}`)
      .then(r => r.json())
      .then(d => { setMatches(d); setLoading(false) })
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

  const sanyaku = matches.filter(m =>
    ['Yokozuna','Ozeki','Sekiwake','Komusubi'].some(r =>
      m.eastRank?.includes(r) || m.westRank?.includes(r)
    )
  )
  const maegashira = matches.filter(m =>
    !['Yokozuna','Ozeki','Sekiwake','Komusubi'].some(r =>
      m.eastRank?.includes(r) || m.westRank?.includes(r)
    )
  )

  const renderMatch = (m) => {
    const eastFlag = bios[m.eastId]?.country?.flag || '🇯🇵'
    const westFlag = bios[m.westId]?.country?.flag || '🇯🇵'
    const hasResult = !!m.winnerId
    const eastWon = hasResult && m.winnerId === m.eastId
    const westWon = hasResult && m.winnerId === m.westId

    return (
      <div key={m.id} style={{
        display:'grid',
        gridTemplateColumns:'1fr auto 1fr',
        gap:8,
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
            <div style={{fontWeight: eastWon ? 800 : 600, fontSize:'0.9rem'}}>
              {eastFlag} {m.eastShikona}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{m.eastRank}</div>
          </div>
          {hasResult && eastWon && (
            <span style={{
              width:10,height:10,borderRadius:'50%',
              background:'#f5f0e8',border:'1.5px solid var(--ink)',
              flexShrink:0,display:'inline-block'
            }} />
          )}
        </div>

        {/* Center */}
        <div style={{textAlign:'center',minWidth:60}}>
          {hasResult ? (
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)'}}>
              {m.kimarite}
            </div>
          ) : (
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--light)'}}>vs</div>
          )}
        </div>

        {/* West */}
        <div style={{
          display:'flex',alignItems:'center',gap:6,
          opacity: hasResult && !westWon ? 0.4 : 1,
        }}>
          {hasResult && westWon && (
            <span style={{
              width:10,height:10,borderRadius:'50%',
              background:'#f5f0e8',border:'1.5px solid var(--ink)',
              flexShrink:0,display:'inline-block'
            }} />
          )}
          <div>
            <div style={{fontWeight: westWon ? 800 : 600, fontSize:'0.9rem'}}>
              {westFlag} {m.westShikona}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{m.westRank}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {sanyaku.length > 0 && (
        <div style={{marginBottom:'1rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid #b8860b'}}>
            {lang === 'en' ? "San'yaku" : "Сан'яку"}
          </div>
          {[...sanyaku].reverse().map(m => renderMatch(m))}
        </div>
      )}
      {maegashira.length > 0 && (
        <div>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid var(--border)'}}>
            Maegashira
          </div>
          {maegashira.map(m => renderMatch(m))}
        </div>
      )}
    </div>
  )
}