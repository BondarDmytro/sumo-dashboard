'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

function ThemeIcon({ dark }) {
  if (dark) return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function NavBar() {
  const path = usePathname()
  const isStudio = path.startsWith('/studio')
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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

  if (isStudio) return null

  const tabs = [
    { href: '/', label: 'Турнір' },
    { href: '/rikishi', label: 'Рікіші' },
  ]

  return (
    <nav style={{
      background:'var(--header)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      position:'sticky',
      top:0,
      zIndex:100,
    }}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex'}}>
          {tabs.map(t => (
            <Link key={t.href} href={t.href} style={{
              display:'inline-block',
              padding:'0.75rem 1.25rem',
              fontFamily:'monospace',
              fontSize:'0.72rem',
              letterSpacing:'0.12em',
              textTransform:'uppercase',
              color: path === t.href ? '#f5f0e8' : '#6b6560',
              textDecoration:'none',
              borderBottom: path === t.href ? '2px solid #b8860b' : '2px solid transparent',
              transition:'color 0.2s',
            }}>
              {t.label}
            </Link>
          ))}
        </div>

        {mounted && (
          <button
            onClick={toggle}
            title={dark ? 'Світла тема' : 'Темна тема'}
            style={{
              background:'transparent',
              border:'1px solid rgba(255,255,255,0.15)',
              color: dark ? '#f5f0e8' : '#6b6560',
              width:34,
              height:34,
              borderRadius:'50%',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              cursor:'pointer',
              transition:'color 0.2s, border-color 0.2s',
              flexShrink:0,
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
          >
            <ThemeIcon dark={dark} />
          </button>
        )}
      </div>
    </nav>
  )
}