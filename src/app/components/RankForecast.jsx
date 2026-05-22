'use client'

import { useEffect, useState } from 'react'

const TYPE_STYLES = {
  danger: { bg: 'rgba(192,57,43,0.12)', color: '#c0392b', border: 'rgba(192,57,43,0.3)' },
  warning: { bg: 'rgba(184,134,11,0.12)', color: '#9a7200', border: 'rgba(184,134,11,0.3)' },
  good: { bg: 'rgba(26,107,92,0.12)', color: '#1a6b5c', border: 'rgba(26,107,92,0.3)' },
  info: { bg: 'var(--bg2)', color: 'var(--mid)', border: 'var(--border)' },
}

function BashoWins({ bashoId, wins, losses }) {
  const label = bashoId.slice(0,4) + '/' + bashoId.slice(4)
  const kk = wins >= 8
  return (
    <div style={{textAlign:'center',minWidth:48}}>
      <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:600,color: kk ? 'var(--ink)' : '#c0392b'}}>
        {wins}–{losses}
      </div>
    </div>
  )
}

export default function RankForecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rankforecast')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>
      Завантаження прогнозу рангів...
    </div>
  )

  if (!data?.rikishi?.length) return null

  return (
    <div style={{marginBottom:'1rem'}}>
      {data.rikishi.map(r => {
        const mainType = r.forecasts[0]?.type || 'info'
        const st = TYPE_STYLES[mainType] || TYPE_STYLES.info
        const borderColor = mainType === 'danger' ? '#c0392b' : mainType === 'warning' ? '#b8860b' : mainType === 'good' ? '#1a6b5c' : 'var(--border)'

        return (
          <div key={r.id} style={{
            display:'grid',
            gridTemplateColumns:'380px 1fr 220px',
            background:'var(--card)',
            border:'1px solid var(--border)',
            borderLeft:`4px solid ${borderColor}`,
            marginBottom:1,
            minHeight:60,
          }}>

            {/* КОЛ 1 — Ім'я + біо */}
            <div style={{padding:'0.5rem 1rem',borderRight:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                <span style={{fontSize:'1.1rem'}}>{r.bio?.country?.flag}</span>
                <div style={{fontWeight:700,fontSize:'0.9rem'}}>{r.name}</div>
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:3}}>{r.rank}</div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {r.bio?.country?.name !== 'Японія' && (
                  <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.country.name}</span>
                )}
                {r.bio?.age && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.age} р.</span>}
                {r.bio?.height && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.height} см</span>}
                {r.bio?.weight && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.weight} кг</span>}
                {r.bio?.debut && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>дебют {r.bio.debut.slice(0,4)}/{r.bio.debut.slice(4)}</span>}
                {r.bio?.heya && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.heya}</span>}
              </div>
            </div>

            {/* КОЛ 2 — Попередні басьо + поточний */}
            <div style={{padding:'0.5rem 1rem',display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',borderRight:'1px solid var(--border)'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)',whiteSpace:'nowrap'}}>← попередні</div>
              {[...r.prevBashos].reverse().map(b => (
                <BashoWins key={b.bashoId} {...b} />
              ))}
              <div style={{width:1,height:28,background:'var(--border)',margin:'0 2px'}} />
              <div style={{textAlign:'center',minWidth:48}}>
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'#1a6b5c',marginBottom:1}}>поточний</div>
                <div style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:700,color:'var(--ink)'}}>{r.wins}–{r.losses}</div>
              </div>
              {r.rank.includes('Sekiwake') && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'var(--bg2)',borderRadius:2,padding:'3px 8px',minWidth:65}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.54rem',color:'var(--light)'}}>Озекі-тест</div>
                  <div style={{fontFamily:'monospace',fontSize:'0.88rem',fontWeight:700,color:(r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)) >= 33 ? '#1a6b5c' : 'var(--ink)'}}>
                    {r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)}
                    <span style={{fontSize:'0.58rem',color:'var(--mid)'}}>/33</span>
                  </div>
                </div>
              )}
            </div>

            {/* КОЛ 3 — Статус */}
            <div style={{
              background: st.bg,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              padding:'0.5rem 1rem',
              gap:4,
              textAlign:'center',
            }}>
              {r.forecasts.map((f,i) => {
                const fst = TYPE_STYLES[f.type] || TYPE_STYLES.info
                return (
                  <div key={i} style={{
                    color: fst.color,
                    fontSize:'0.75rem',
                    lineHeight:1.4,
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    {f.text}
                  </div>
                )
              })}
            </div>

          </div>
        )
      })}
    </div>
  )
}