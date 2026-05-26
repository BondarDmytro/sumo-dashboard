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
    <div style={{
      background: 'var(--bg2)', borderRadius: 6, padding: '1rem',
      border: '1px solid var(--border)', textAlign: 'center',
    }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 800, color }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

export default function AdminGamesPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dbRef = ref(db, 'analytics/games')
    const unsub = onValue(dbRef, snap => {
      setData(snap.val())
      setLoading(false)
    })
    return () => off(dbRef)
  }, [])

  function fmt(iso) {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  const total = GAMES.reduce((sum, g) => sum + (data?.[g.id]?.totalLaunches || 0), 0)
  const totalUniq = GAMES.reduce((sum, g) => sum + (data?.[g.id]?.uniqueSessions || 0), 0)

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontWeight: 800, color: '#b8860b', marginBottom: '0.25rem' }}>
          🎮 Аналітика ігор
        </h1>
        <div style={{ fontSize: '0.7rem', color: 'var(--mid)' }}>
          Дані в реальному часі · Firebase Realtime DB
        </div>
      </div>

      {/* Зведення */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '2rem' }}>
        <StatCard label="Всього запусків" value={loading ? '...' : total} color="#b8860b"/>
        <StatCard label="Унікальних сесій" value={loading ? '...' : totalUniq} color="#1a6b5c"/>
        <StatCard label="Ігор" value={GAMES.length} color="#6b3fa0"/>
      </div>

      {/* По кожній грі */}
      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--mid)', fontSize: '0.8rem', padding: '2rem' }}>
          Завантаження...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {GAMES.map(game => {
            const d = data?.[game.id] || {}
            return (
              <div key={game.id} style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>{game.label}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--mid)' }}>
                      Останній запуск: {fmt(d.lastPlayed)}
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(184,134,11,0.15)', border: '1px solid #b8860b',
                    borderRadius: 4, padding: '3px 12px', fontSize: '0.65rem', color: '#b8860b', fontWeight: 700,
                  }}>
                    {d.totalLaunches || 0} запусків
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: game.hasMode ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
                  <StatCard label="Запусків" value={d.totalLaunches || 0}/>
                  <StatCard label="Унік. сесій" value={d.uniqueSessions || 0} color="#1a6b5c"/>
                  {game.hasMode && <>
                    <StatCard label="vs CPU" value={d.cpuLaunches || 0} color="#1a4a7a"/>
                    <StatCard label="Мультиплеєр" value={d.multiLaunches || 0} color="#6b3fa0"/>
                  </>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ marginTop: '2rem', fontSize: '0.6rem', color: 'var(--mid)', textAlign: 'center' }}>
        /admin/games · Тільки для адміністратора
      </div>
    </div>
  )
}
