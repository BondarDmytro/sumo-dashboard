'use client'
import { useState } from 'react'

// Додай цей компонент у src/app/admin/games/page.jsx (або де зручно)
// <DeployButton />

const STATES = {
  idle:    { label: '🚀 Задеплоїти',       color: '#2563eb', pulse: false },
  loading: { label: '⏳ Деплоїться...',     color: '#d97706', pulse: true  },
  success: { label: '✅ Деплой запущено',   color: '#16a34a', pulse: false },
  error:   { label: '❌ Помилка',           color: '#dc2626', pulse: false },
}

export default function DeployButton() {
  const [status, setStatus]   = useState('idle')
  const [jobId, setJobId]     = useState(null)
  const [detail, setDetail]   = useState('')
  const [history, setHistory] = useState([])

  async function handleDeploy() {
    if (status === 'loading') return
    setStatus('loading')
    setDetail('')
    const startedAt = new Date().toLocaleTimeString('uk-UA')

    try {
      const res  = await fetch('/api/deploy', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Unknown error')

      setStatus('success')
      setJobId(data.jobId)
      setDetail(`Job: ${data.jobId ?? '—'}`)
      setHistory(h => [{ time: startedAt, status: 'ok', jobId: data.jobId }, ...h.slice(0, 4)])

      // Скидаємо до idle через 8с
      setTimeout(() => { setStatus('idle'); setDetail('') }, 8000)

    } catch (e) {
      setStatus('error')
      setDetail(e.message)
      setHistory(h => [{ time: startedAt, status: 'err', msg: e.message }, ...h.slice(0, 4)])
      setTimeout(() => { setStatus('idle'); setDetail('') }, 6000)
    }
  }

  const s = STATES[status]

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {/* Кнопка */}
      <button
        onClick={handleDeploy}
        disabled={status === 'loading'}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          gap:            8,
          padding:        '10px 20px',
          background:     s.color,
          color:          '#fff',
          border:         'none',
          borderRadius:   8,
          fontSize:       14,
          fontWeight:     700,
          cursor:         status === 'loading' ? 'not-allowed' : 'pointer',
          opacity:        status === 'loading' ? 0.85 : 1,
          transition:     'all 0.2s',
          boxShadow:      `0 2px 8px ${s.color}66`,
          animation:      s.pulse ? 'deployPulse 1.2s ease infinite' : 'none',
        }}
      >
        {s.label}
      </button>

      {/* Деталі поточного запиту */}
      {detail && (
        <div style={{
          marginTop: 6, fontSize: 12,
          color: status === 'error' ? '#dc2626' : '#6b7280',
        }}>
          {detail}
          {jobId && (
            <a
              href={`https://vercel.com/bondaridmytro/sumo-dashboard/deployments`}
              target="_blank" rel="noreferrer"
              style={{ marginLeft: 8, color: '#2563eb' }}
            >
              → Vercel Deployments
            </a>
          )}
        </div>
      )}

      {/* Історія останніх деплоїв */}
      {history.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            ОСТАННІ ДЕПЛОЇ
          </div>
          {history.map((h, i) => (
            <div key={i} style={{
              fontSize: 12, padding: '3px 0',
              color: h.status === 'ok' ? '#16a34a' : '#dc2626',
            }}>
              {h.time} — {h.status === 'ok' ? `✓ job: ${h.jobId ?? '—'}` : `✗ ${h.msg}`}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes deployPulse {
          0%, 100% { box-shadow: 0 2px 8px ${STATES.loading.color}66; }
          50%       { box-shadow: 0 2px 20px ${STATES.loading.color}cc; }
        }
      `}</style>
    </div>
  )
}
