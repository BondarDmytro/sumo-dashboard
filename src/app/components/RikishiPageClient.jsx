'use client'

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

function WinRate({ wins, total }) {
  const pct = total > 0 ? Math.round(wins / total * 100) : 0
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height:4,background:'var(--bg2)'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'var(--ink)'}} />
      </div>
      <span style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',minWidth:36}}>{pct}%</span>
    </div>
  )
}

function RikishiListCard({ r, onClick, selected }) {
  return (
    <div onClick={() => onClick(r)} style={{
      background: selected ? 'var(--ink)' : 'var(--card)',
      color: selected ? 'var(--bg)' : 'var(--ink)',
      border:`1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
      borderLeft:`3px solid ${r.stats?.yusho > 0 ? '#b8860b' : 'var(--border)'}`,
      padding:'0.65rem 0.9rem',
      cursor:'pointer',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:'0.9rem'}}>{r.country?.flag}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:'0.85rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color: selected ? 'rgba(245,240,232,0.6)' : 'var(--mid)'}}>{r.rank}</div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',fontWeight:600,flexShrink:0}}>
          {r.wins}–{r.losses}
        </div>
      </div>
    </div>
  )
}

function RikishiDetail({ r, lang }) {
  if (!r) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--mid)',fontFamily:'monospace',fontSize:'0.8rem'}}>
      {lang === 'en' ? '← Select a rikishi from the list' : '← Виберіть рікіші зі списку'}
    </div>
  )

  const sanshoList = Object.entries(r.stats?.sansho || {}).filter(([,v]) => v > 0)

  const bioLabels = lang === 'en'
    ? ['Country', 'Age', 'Height', 'Weight', 'Stable', 'Debut']
    : ['Країна', 'Вік', 'Зріст', 'Вага', 'Стайня', 'Дебют']

  const bioValues = [
    r.country?.name,
    r.age ? `${r.age} ${lang === 'en' ? 'y.o.' : 'р.'}` : '—',
    r.height ? `${r.height} ${lang === 'en' ? 'cm' : 'см'}` : '—',
    r.weight ? `${r.weight} ${lang === 'en' ? 'kg' : 'кг'}` : '—',
    r.heya || '—',
    r.debut ? `${r.debut.slice(0,4)}/${r.debut.slice(4)}` : '—',
  ]

  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-start',gap:'1.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:200}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
            <span style={{fontSize:'2.2rem'}}>{r.country?.flag}</span>
            <div>
              <div style={{fontWeight:800,fontSize:'1.4rem',lineHeight:1}}>{r.name}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginTop:3}}>{r.nameJp}</div>
            </div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginBottom:8}}>{r.rank}</div>
          {r.stats?.yusho > 0 && (
            <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
              {Array.from({length: Math.min(r.stats.yusho, 10)}).map((_,i) => (
                <span key={i} style={{fontSize:'1rem'}}>🏆</span>
              ))}
              <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#b8860b',marginLeft:4}}>
                {r.stats.yusho}× {lang === 'en' ? 'yusho' : 'юшо'}
              </span>
            </div>
          )}
          {sanshoList.length > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:6}}>
              {sanshoList.map(([name, count]) => (
                <span key={name} style={{fontFamily:'monospace',fontSize:'0.6rem',background:'var(--bg2)',padding:'2px 7px',borderRadius:2,color:'var(--mid)'}}>
                  {name} ×{count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,minWidth:260}}>
          {bioLabels.map((label, idx) => (
            <div key={label} style={{background:'var(--bg2)',padding:'0.5rem 0.6rem',borderRadius:2}}>
              <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{label}</div>
              <div style={{fontWeight:600,fontSize:'0.8rem'}}>{bioValues[idx]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        {lang === 'en' ? 'Career statistics' : "Кар'єрна статистика"}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>Makuuchi</div>
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {r.stats?.makuuchiWins}–{(r.stats?.makuuchiMatches||0) - (r.stats?.makuuchiWins||0)}
          </div>
          <WinRate wins={r.stats?.makuuchiWins||0} total={r.stats?.makuuchiMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {r.stats?.makuuchiBasho} {lang === 'en' ? 'tournaments' : 'турнірів'}
          </div>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>
            {lang === 'en' ? 'Career total' : "Кар'єра загалом"}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {r.stats?.totalWins}–{r.stats?.totalLosses}
          </div>
          <WinRate wins={r.stats?.totalWins||0} total={r.stats?.totalMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {r.stats?.totalMatches} {lang === 'en' ? 'matches' : 'матчів'}
          </div>
        </div>
      </div>

      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        {lang === 'en' ? 'Natsu Basho 2026' : 'Натсу Басьо 2026'} — {r.wins}–{r.losses}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:4}}>
        {r.record.map(m => {
          if (!m.result && !m.opponent) return null
          const isWin = RESULTS_WIN.includes(m.result)
          const isLoss = RESULTS_LOSS.includes(m.result)
          const isFusen = m.kimarite === 'fusen'
          const isAbsent = m.result === 'absent'
          const isEmpty = !m.result
          return (
            <div key={m.day} style={{
              background:'var(--bg2)',
              border:`1px solid ${isWin ? 'rgba(26,107,92,0.4)' : isLoss ? 'rgba(192,57,43,0.4)' : 'var(--border)'}`,
              padding:'0.4rem 0.6rem',
              borderRadius:2,
              opacity: isEmpty ? 0.4 : 1,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                <span style={{
                  width:9,height:9,borderRadius:'50%',flexShrink:0,
                  background: isWin ? 'var(--ink)' : isAbsent ? '#aaa' : 'transparent',
                  border: isLoss ? '1.5px solid var(--ink)' : isAbsent ? '1.5px solid #aaa' : isEmpty ? '1px dashed var(--light)' : 'none',
                  opacity: isFusen ? 0.5 : 1,
                }} />
                <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
                  {lang === 'en' ? 'Day' : 'День'} {m.day}
                </span>
              </div>
              {m.opponent ? (
                <div style={{fontSize:'0.68rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.opponent}</div>
              ) : (
                <div style={{fontSize:'0.65rem',color:'var(--light)'}}>—</div>
              )}
              {m.kimarite && (
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)',marginTop:2}}>{m.kimarite}</div>
              )}
              {isAbsent && (
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'#c0392b',marginTop:2}}>
                  {lang === 'en' ? 'kyujo' : 'кюджо'}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function RikishiPageClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const { lang } = useLang()

  useEffect(() => {
    fetch('/api/rikishi-list')
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d.rikishi?.length) setSelected(d.rikishi[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = data?.rikishi?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.rank.toLowerCase().includes(search.toLowerCase()) ||
    r.country?.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.5rem'}}>
          {lang === 'en' ? 'Makuuchi rikishi — Natsu Basho 2026' : 'Рікіші макуучі — Натсу Басьо 2026'}
        </div>

        {loading ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            {lang === 'en' ? 'Loading...' : 'Завантаження даних...'}
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'1.5rem',alignItems:'start'}}>
            <div style={{position:'sticky',top:52}}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={lang === 'en' ? 'Search...' : 'Пошук...'}
                style={{
                  width:'100%',padding:'0.5rem 0.75rem',
                  background:'var(--bg2)',border:'1px solid var(--border)',
                  color:'var(--ink)',fontFamily:'monospace',fontSize:'0.75rem',
                  borderRadius:2,marginBottom:6,outline:'none',boxSizing:'border-box',
                }}
              />
              <div style={{maxHeight:'calc(100vh - 140px)',overflowY:'auto',display:'flex',flexDirection:'column',gap:1}}>
                {filtered.map(r => (
                  <RikishiListCard
                    key={r.id}
                    r={r}
                    onClick={setSelected}
                    selected={selected?.id === r.id}
                  />
                ))}
              </div>
            </div>

            <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem'}}>
              <RikishiDetail r={selected} lang={lang} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}