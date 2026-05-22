'use client'

import { useEffect, useState } from 'react'

const TYPE_STYLES = {
  danger: { bg: '#fde8e8', color: '#c0392b', border: '#f5c6c6' },
  warning: { bg: '#fff3cd', color: '#856404', border: '#ffeaa0' },
  good: { bg: '#d4edda', color: '#155724', border: '#b8dfc4' },
  info: { bg: 'var(--bg2)', color: 'var(--mid)', border: 'var(--border)' },
}

function BashoWins({ bashoId, wins, losses }) {
  const label = bashoId.slice(0,4) + '/' + bashoId.slice(4)
  const kk = wins >= 8
  return (
    <div style={{textAlign:'center',minWidth:52}}>
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'monospace',fontSize:'0.82rem',fontWeight:600,color: kk ? 'var(--ink)' : '#c0392b'}}>
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
    <div style={{marginBottom:'2rem'}}>
      {data.rikishi.map(r => (
        <div key={r.id} style={{
          background:'var(--card)',
          border:'1px solid var(--border)',
          borderLeft:`4px solid ${
            r.forecasts.some(f=>f.type==='danger') ? '#c0392b' :
            r.forecasts.some(f=>f.type==='warning') ? '#b8860b' :
            r.forecasts.some(f=>f.type==='good') ? '#1a6b5c' : 'var(--border)'
          }`,
          padding:'1rem 1.25rem',
          marginBottom:1,
        }}>
          <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',flexWrap:'wrap'}}>

            {/* БІО */}
            <div style={{minWidth:200,flex:'0 0 auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                <span style={{fontSize:'1.2rem'}}>{r.bio?.country?.flag}</span>
                <div style={{fontWeight:700,fontSize:'0.95rem'}}>{r.name}</div>
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>{r.rank}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.82rem',fontWeight:600,marginTop:4}}>
                {r.wins}–{r.losses}
                <span style={{fontSize:'0.6rem',color:'var(--mid)',marginLeft:6}}>поточний</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>
                {r.bio?.country?.name !== 'Японія' && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    {r.bio.country.name}
                  </span>
                )}
                {r.bio?.age && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    {r.bio.age} р.
                  </span>
                )}
                {r.bio?.height && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    {r.bio.height} см
                  </span>
                )}
                {r.bio?.weight && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    {r.bio.weight} кг
                  </span>
                )}
                {r.bio?.debut && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    дебют {r.bio.debut.slice(0,4)}/{r.bio.debut.slice(4)}
                  </span>
                )}
                {r.bio?.heya && (
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',background:'var(--bg2)',padding:'2px 6px',borderRadius:2}}>
                    {r.bio.heya}
                  </span>
                )}
              </div>
            </div>

            {/* ПОПЕРЕДНІ БАСЬО */}
            <div style={{display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap',flex:'0 0 auto'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)'}}>
                ← попередні басьо
              </div>
              {[...r.prevBashos].reverse().map(b => (
                <BashoWins key={b.bashoId} {...b} />
              ))}
              <div style={{width:1,height:32,background:'var(--border)',margin:'0 4px'}} />
              <div style={{textAlign:'center',minWidth:52}}>
                <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'#1a6b5c',marginBottom:2}}>поточний</div>
                <div style={{fontFamily:'monospace',fontSize:'0.82rem',fontWeight:700,color:'var(--ink)'}}>
                  {r.wins}–{r.losses}
                </div>
              </div>

              {r.rank.includes('Sekiwake') && (
                <div style={{
                  display:'flex',flexDirection:'column',alignItems:'center',
                  background:'var(--bg2)',borderRadius:2,padding:'4px 10px',minWidth:80
                }}>
                  <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)'}}>Озекі-тест</div>
                  <div style={{fontFamily:'monospace',fontSize:'1rem',fontWeight:700,color:
                    (r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)) >= 33 ? '#1a6b5c' : 'var(--ink)'
                  }}>
                    {r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)}
                    <span style={{fontSize:'0.65rem',color:'var(--mid)'}}>/33</span>
                  </div>
                </div>
              )}
            </div>

            {/* ПРОГНОЗ */}
            <div style={{flex:1,minWidth:200,display:'flex',flexDirection:'column',gap:6}}>
              {r.forecasts.map((f,i) => {
                const st = TYPE_STYLES[f.type] || TYPE_STYLES.info
                return (
                  <div key={i} style={{
                    background:st.bg,
                    color:st.color,
                    border:`1px solid ${st.border}`,
                    borderRadius:2,
                    padding:'5px 10px',
                    fontSize:'0.78rem',
                    lineHeight:1.4,
                  }}>
                    {f.text}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}