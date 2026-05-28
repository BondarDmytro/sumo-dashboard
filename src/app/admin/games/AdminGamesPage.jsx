'use client'

import { useState, useEffect } from 'react'
import { db } from '../../../lib/firebase'
import { ref, onValue, off } from 'firebase/database'

const GAMES = [
  { id: 'sumoClash',  label: 'Сумо Клеш ⚔️', hasMode: true },
  { id: 'sumoQuiz',   label: 'Сумо Квіз 🧠',  hasMode: false },
  { id: 'yushoGame',  label: 'Юшо Гра 🃏',    hasMode: false },
]

function StatCard({ label, value, color = 'var(--ink)' }) {
  return (
    <div style={{background:'var(--bg2)',borderRadius:6,padding:'1rem',border:'1px solid var(--border)',textAlign:'center'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{label}</div>
      <div style={{fontFamily:'monospace',fontSize:'1.6rem',fontWeight:800,color}}>{value ?? '—'}</div>
    </div>
  )
}

function StarRating({ stars, size = '1rem' }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{fontSize:size, filter: i<=stars ? 'none' : 'grayscale(1) opacity(0.3)'}}>🏅</span>
      ))}
    </span>
  )
}

export default function AdminGamesPage() {
  const [data, setData] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    const dbRef = ref(db, 'analytics/games')
    const unsub = onValue(dbRef, snap => { setData(snap.val()); setLoading(false) })
    return () => off(dbRef)
  }, [])

  useEffect(() => {
    const dbRef = ref(db, 'analytics/games/sumoClash/reviews')
    const unsub = onValue(dbRef, snap => {
      const val = snap.val()
      if (val) {
        const list = Object.values(val).sort((a, b) => b.ts - a.ts)
        setReviews(list)
      } else {
        setReviews([])
      }
      setReviewsLoading(false)
    })
    return () => off(dbRef)
  }, [])

  function fmt(ts) {
    if (!ts) return '—'
    const d = new Date(ts)
    return d.toLocaleString('uk-UA', {day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit'})
  }

  const total = GAMES.reduce((sum,g) => sum+(data?.[g.id]?.totalLaunches||0), 0)
  const totalUniq = GAMES.reduce((sum,g) => sum+(data?.[g.id]?.uniqueSessions||0), 0)

  const avgStars = reviews.length
    ? (reviews.reduce((s,r) => s + (r.stars||0), 0) / reviews.length).toFixed(1)
    : '—'
  const starsCount = [5,4,3,2,1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.stars === s).length
  }))
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 5)

  return (
    <div style={{maxWidth:900,margin:'0 auto',padding:'2rem 1rem',fontFamily:'monospace'}}>
      <div style={{marginBottom:'2rem'}}>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:800,color:'#b8860b',marginBottom:'0.25rem'}}>🎮 Аналітика ігор</h1>
        <div style={{fontSize:'0.7rem',color:'var(--mid)'}}>Дані в реальному часі · Firebase Realtime DB</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:'2rem'}}>
        <StatCard label="Всього запусків" value={loading?'...':total} color="#b8860b"/>
        <StatCard label="Унікальних сесій" value={loading?'...':totalUniq} color="#1a6b5c"/>
        <StatCard label="Ігор" value={GAMES.length} color="#6b3fa0"/>
      </div>

      {loading ? (
        <div style={{textAlign:'center',color:'var(--mid)',fontSize:'0.8rem',padding:'2rem'}}>Завантаження...</div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:16,marginBottom:'2.5rem'}}>
          {GAMES.map(game => {
            const d = data?.[game.id] || {}
            return (
              <div key={game.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'1.25rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem',flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontSize:'1rem',fontWeight:700,color:'var(--ink)',marginBottom:2}}>{game.label}</div>
                    <div style={{fontSize:'0.6rem',color:'var(--mid)'}}>Останній запуск: {fmt(d.lastPlayed)}</div>
                  </div>
                  <div style={{background:'rgba(184,134,11,0.15)',border:'1px solid #b8860b',borderRadius:4,padding:'3px 12px',fontSize:'0.65rem',color:'#b8860b',fontWeight:700}}>
                    {d.totalLaunches||0} запусків
                  </div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:game.hasMode?'repeat(4,1fr)':'repeat(2,1fr)',gap:10}}>
                  <StatCard label="Запусків" value={d.totalLaunches||0}/>
                  <StatCard label="Унік. сесій" value={d.uniqueSessions||0} color="#1a6b5c"/>
                  {game.hasMode && <>
                    <StatCard label="vs CPU" value={d.cpuLaunches||0} color="#1a4a7a"/>
                    <StatCard label="Мультиплеєр" value={d.multiLaunches||0} color="#6b3fa0"/>
                  </>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Відгуки ── */}
      <div style={{borderTop:'1px solid var(--border)',paddingTop:'2rem'}}>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:800,color:'var(--ink)',marginBottom:'1.25rem'}}>
          🏅 Відгуки гравців — Сумо Клеш
        </h2>

        {reviewsLoading ? (
          <div style={{textAlign:'center',color:'var(--mid)',fontSize:'0.8rem',padding:'1rem'}}>Завантаження відгуків...</div>
        ) : reviews.length === 0 ? (
          <div style={{textAlign:'center',color:'var(--mid)',fontSize:'0.8rem',padding:'2rem',background:'var(--bg2)',borderRadius:6}}>
            Відгуків ще немає
          </div>
        ) : (
          <>
            <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:24,background:'var(--bg2)',borderRadius:6,padding:'1.25rem',marginBottom:'1.5rem',border:'1px solid var(--border)'}}>
              <div style={{textAlign:'center',minWidth:100}}>
                <div style={{fontFamily:'Georgia,serif',fontSize:'3rem',fontWeight:900,color:'#b8860b',lineHeight:1}}>{avgStars}</div>
                <div style={{margin:'6px 0'}}><StarRating stars={Math.round(parseFloat(avgStars))} size="0.9rem"/></div>
                <div style={{fontSize:'0.6rem',color:'var(--mid)'}}>{reviews.length} відгуків</div>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:5,justifyContent:'center'}}>
                {starsCount.map(({stars, count}) => (
                  <div key={stars} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',width:12,textAlign:'right'}}>{stars}</span>
                    <span style={{fontSize:'0.65rem'}}>🏅</span>
                    <div style={{flex:1,height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',width:reviews.length?`${(count/reviews.length)*100}%`:'0%',background:'#b8860b',borderRadius:4}}/>
                    </div>
                    <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',width:20}}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {visibleReviews.map((r, i) => (
                <div key={i} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'0.875rem 1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,marginBottom:r.comment?6:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <StarRating stars={r.stars} size="0.85rem"/>
                      <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>
                        {r.mode && `${r.mode} · `}{r.lang === 'en' ? 'EN' : 'UK'}
                      </span>
                    </div>
                    <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)',flexShrink:0}}>{fmt(r.ts)}</span>
                  </div>
                  {r.comment && (
                    <div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'var(--ink)',lineHeight:1.6,marginTop:4,paddingTop:6,borderTop:'1px solid var(--border)'}}>
                      "{r.comment}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {reviews.length > 5 && (
              <button
                onClick={() => setShowAllReviews(v => !v)}
                style={{marginTop:12,width:'100%',padding:'0.6rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',borderRadius:4,fontFamily:'monospace',fontSize:'0.65rem',cursor:'pointer'}}
              >
                {showAllReviews ? '▲ Сховати' : `▼ Показати всі ${reviews.length} відгуків`}
              </button>
            )}
          </>
        )}
      </div>

      <div style={{marginTop:'2rem',fontSize:'0.6rem',color:'var(--mid)',textAlign:'center'}}>/admin/games · Тільки для адміністратора</div>
    </div>
  )
}
