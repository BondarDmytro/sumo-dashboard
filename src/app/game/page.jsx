// src/app/game/page.jsx
// Сторінка міні-ігор: Сумо Квіз + Юшо (ігрові компоненти відкриваються на місці)
'use client'
import { useState } from 'react'
import NavBar from '../components/NavBar'
import SumoQuiz from '../components/SumoQuiz'
import YushoGame from '../components/YushoGame'
import { useLang } from '../components/LangProvider'

export default function GamePage() {
  const [quizOpen, setQuizOpen] = useState(false)
  const [yushoOpen, setYushoOpen] = useState(false)
  const { lang } = useLang()
  const en = lang === 'en'
  const games = [
    {
      id: 'quiz', icon: '🧠',
      title: en ? 'Sumo Quiz' : 'Сумо Квіз',
      desc: en ? '15 questions · Easy → Hard · Kachi-koshi or Make-koshi' : '15 питань · Легкі → Важкі · Качі-коші або Маке-коші',
      open: () => setQuizOpen(true),
    },
    {
      id: 'yusho', icon: '🃏',
      title: en ? 'Yusho Card Game' : 'Юшо',
      desc: en ? 'Card battle · Collect the full deck' : 'Карткова битва · Зберіть повну колоду',
      open: () => setYushoOpen(true),
    },
  ]
  return (
    <>
      <NavBar />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px 80px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.06em', marginBottom: 6 }}>
          🎮 {en ? 'Mini-games' : 'Міні-ігри'}
        </h1>
        <p style={{ opacity: 0.7, marginBottom: 28 }}>
          {en ? 'Quick sumo games — right in your browser.' : 'Швидкі ігри про сумо — просто у браузері.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {games.map(g => (
            <button key={g.id} onClick={g.open} style={{
              display: 'flex', alignItems: 'center', gap: 18, textAlign: 'start',
              padding: '20px 22px', borderRadius: 12, cursor: 'pointer',
              border: '1px solid var(--border, rgba(128,128,128,0.3))',
              background: 'var(--card-bg, rgba(128,128,128,0.06))',
              color: 'inherit', fontSize: '1rem',
            }}>
              <span style={{ fontSize: '2rem' }}>{g.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <b style={{ fontSize: '1.1rem' }}>{g.title}</b>
                <span style={{ opacity: 0.7, fontSize: '0.85rem' }}>{g.desc}</span>
              </span>
              <span style={{ marginInlineStart: 'auto', opacity: 0.5 }}>›</span>
            </button>
          ))}
        </div>
      </main>
      {quizOpen && <SumoQuiz onClose={() => setQuizOpen(false)} />}
      {yushoOpen && <YushoGame onClose={() => setYushoOpen(false)} lang={lang} />}
    </>
  )
}
