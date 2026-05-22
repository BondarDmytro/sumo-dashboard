'use client'

import { useEffect, useState } from 'react'

const BASHOS = [
  { id: '202603', label: 'Хару 2026', date: 'Березень 2026', location: 'Осака' },
  { id: '202601', label: 'Хацу 2026', date: 'Січень 2026', location: 'Токіо' },
  { id: '202511', label: 'Кюшу 2025', date: 'Листопад 2025', location: 'Фукуока' },
]

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

function getRankShort(rank) {
  if (!rank) return '?'
  if (rank.includes('Yokozuna')) return rank.replace('Yokozuna ', 'Y').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Ozeki')) return rank.replace('Ozeki ', 'O').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Sekiwake')) return rank.replace('Sekiwake ', 'S').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Komusubi')) return rank.replace('Komusubi ', 'K').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Maegashira')) {
    const num = rank.match(/\d+/)?.[0] || ''
    return `M${num}${rank.includes('East') ? 'e' : 'w'}`
  }
  return rank
}

function MatchDots({ record }) {
  return (
    <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
      {record.map((m, idx) => {
        const isWin = RESULTS_WIN.includes(m.result)
        const isLoss = RESULTS_LOSS.includes(m.result)
        const isFusen = m.kimarite === 'fusen'
        return (
          <span key={idx} title={`День ${idx+1}${m.opponentShikonaEn ? ': '+m.opponentShikonaEn : ''}`} style={{
            width:11,height:11,borderRadius:'50%',
            background: isWin ? 'var(--ink)' : m.result==='absent' ? '#aaa' : 'transparent',
            border: isLoss ? '1.5px solid var(--ink)' : m.result==='absent' ? '1.5px solid #aaa' : isWin ? 'none' : '1px dashed var(--light)',
            display:'inline-block',flexShrink:0,
            opacity: isFusen ? 0.5 : 1,
          }} />
        )
      })}
    </div>
  )
}

export default function ArchivePageClient() {
  const [selectedBasho, setSelectedBasho] = useState(BASHOS[0])
  const [data, setData] = useState(null)
  const [bios, setBios] = useState({})
  const [loading, setLoading] = useState(false)

  const [biosLoaded, setBiosLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/bios').then(r => r.json()).then(d => {
      setBios(d)
      setBiosLoaded(true)
    }).catch(() => setBiosLoaded(true))
  }, [])

  useEffect(() => {
    if (!biosLoaded) return
    const load = async () => {
      setLoading(true)
      setData(null)
      try {
        const [banzuke, bashoInfo] = await Promise.all([
          fetch(`https://sumo-api.com/api/basho/${selectedBasho.id}/banzuke/Makuuchi`).then(r => r.json()),
          fetch(`https://sumo-api.com/api/basho/${selectedBasho.id}`).then(r => r.json()),
        ])
        const all = [...(banzuke.east||[]), ...(banzuke.west||[])]
        const processed = all.map(r => {
          const record = r.record || []
          const wins = record.filter(m => RESULTS_WIN.includes(m.result)).length
          const losses = record.filter(m => RESULTS_LOSS.includes(m.result)).length
          const absentCount = record.filter(m => m.result === 'absent').length
          const hasLateAbsent = record.some((m, i) => m.result === 'absent' && i >= 5)
          const kyujo = absentCount > 5 || (absentCount > 0 && hasLateAbsent)
          return {
            id: r.rikishiID,
            name: r.shikonaEn,
            nameJp: r.shikonaJp,
            rank: getRankShort(r.rank),
            rankFull: r.rank,
            rankValue: r.rankValue || 999,
            wins, losses, kyujo,
            record,
            flag: bios[r.rikishiID]?.country?.flag || '🇯🇵',
          }
        })
        processed.sort((a,b) => b.wins - a.wins || a.rankValue - b.rankValue)
        const maxWins = Math.max(...processed.filter(r => !r.kyujo).map(r => r.wins))
        const officialWinnerId = bashoInfo.yusho?.find(y => y.type === 'Makuuchi')?.rikishiId
        const winner = officialWinnerId
        ? processed.find(r => r.id === officialWinnerId)
        : processed.find(r => r.wins === maxWins && !r.kyujo)


        // Завантажуємо матчі переможця щоб знайти плей-оф (день 16+)
        let playoff = null
        if (officialWinnerId) {
          try {
            const matchRes = await fetch(`https://sumo-api.com/api/rikishi/${officialWinnerId}/matches?limit=100`)
            const matchData = await matchRes.json()
            const playoffMatch = matchData.records?.find(m =>
              m.bashoId === selectedBasho.id && m.day >= 16 && m.winnerId === officialWinnerId
            )
            console.log('playoffMatch:', playoffMatch)
            if (playoffMatch) {
              const loser = playoffMatch.eastId === officialWinnerId
                ? (playoffMatch.westShikona || playoffMatch.westEn || playoffMatch.west)
                : (playoffMatch.eastShikona || playoffMatch.eastEn || playoffMatch.east)
              playoff = {
                winner: bashoInfo.yusho.find(y => y.type === 'Makuuchi')?.shikonaEn,
                loser,
                kimarite: playoffMatch.kimarite,
              }
            }
          } catch(e) {}
        }

        setData({ rikishi: processed, maxWins, winner, playoff })
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBasho, biosLoaded])

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          Архів турнірів
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'1.5rem'}}>
          Результати
          <span style={{color:'#b8860b'}}> — Попередні басьо</span>
        </h1>

        {/* Вибір турніру */}
        <div style={{display:'flex',gap:8,marginBottom:'2rem',flexWrap:'wrap'}}>
          {BASHOS.map(b => (
            <button key={b.id} onClick={() => setSelectedBasho(b)} style={{
              padding:'0.6rem 1.25rem',
              fontFamily:'monospace',fontSize:'0.72rem',
              letterSpacing:'0.08em',
              background: selectedBasho.id === b.id ? 'var(--ink)' : 'var(--bg2)',
              color: selectedBasho.id === b.id ? 'var(--bg)' : 'var(--mid)',
              border:`1px solid ${selectedBasho.id === b.id ? 'var(--ink)' : 'var(--border)'}`,
              borderRadius:2,cursor:'pointer',
            }}>
              <div style={{fontWeight:700}}>{b.label}</div>
              <div style={{fontSize:'0.58rem',opacity:0.7}}>{b.location}</div>
            </button>
          ))}
        </div>

        {loading && (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            Завантаження...
          </div>
        )}

        {data && !loading && (
          <>
            {/* Переможець */}
            {data.winner && (
              <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderLeft:'4px solid #b8860b',padding:'1rem 1.5rem',marginBottom:'2rem',display:'flex',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}>
                <div style={{fontSize:'2rem'}}>🏆</div>
                <div>
                  <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',letterSpacing:'0.1em',textTransform:'uppercase'}}>Переможець {selectedBasho.label}</div>
                  <div style={{fontWeight:800,fontSize:'1.2rem',marginTop:2}}>
                    {data.winner.flag} {data.winner.name}
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginTop:2}}>
                    {data.winner.rankFull} · {data.winner.wins}–{data.winner.losses}
                  </div>
                    {data.playoff && (
                    <div style={{marginTop:6,display:'inline-flex',alignItems:'center',gap:6,background:'rgba(184,134,11,0.15)',border:'1px solid rgba(184,134,11,0.4)',padding:'3px 10px',borderRadius:2}}>
                      <span style={{fontSize:'0.75rem'}}>⚡</span>
                      <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#b8860b',fontWeight:600}}>
                        Плей-оф проти {data.playoff.loser} · {data.playoff.kimarite}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Таблиця */}
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid var(--ink)'}}>
                    {['#','Рікіші','Ранг','Рекорд','Матчі'].map(h => (
                      <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.5rem 0.75rem',textAlign:'left',fontWeight:500}}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rikishi.map((r, i) => (
                    <tr key={r.id} style={{borderBottom:'1px solid var(--border)',opacity: r.kyujo ? 0.5 : 1}}>
                      <td style={{padding:'0.6rem 0.75rem',fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>
                        {r.wins === data.maxWins && !r.kyujo ? '🏆' : i+1}
                      </td>
                      <td style={{padding:'0.6rem 0.75rem'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span>{r.flag}</span>
                          <div>
                            <div style={{fontWeight:700,fontSize:'0.88rem'}}>{r.name}</div>
                            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{r.rankFull}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'0.6rem 0.75rem'}}>
                        <span style={{fontFamily:'monospace',fontSize:'0.6rem',background:'var(--bg2)',padding:'2px 5px',borderRadius:2,color:'var(--mid)'}}>{r.rank}</span>
                      </td>
                      <td style={{padding:'0.6rem 0.75rem',fontFamily:'monospace',fontWeight:600,fontSize:'0.88rem'}}>
                        <span style={{color: r.kyujo ? 'var(--mid)' : r.wins >= 8 ? 'var(--ink)' : '#c0392b'}}>
                          {r.wins}–{r.losses}
                        </span>
                        {r.kyujo && <span style={{fontFamily:'monospace',fontSize:'0.55rem',background:'#fde8e8',color:'#c0392b',padding:'1px 5px',borderRadius:2,marginLeft:4}}>КЮД</span>}
                      </td>
                      <td style={{padding:'0.6rem 0.75rem'}}>
                        <MatchDots record={r.record} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </main>
  )
}