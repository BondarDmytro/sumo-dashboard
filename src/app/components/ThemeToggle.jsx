'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark') {
      setDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      style={{
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        color: '#f5f0e8',
        fontFamily: 'monospace',
        fontSize: '0.65rem',
        letterSpacing: '0.1em',
        padding: '6px 12px',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {dark ? '☀ СВІТЛА' : '☾ ТЕМНА'}
    </button>
  )
}
