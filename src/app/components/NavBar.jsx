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

function IconBtn({ href, title, color, children }) {
  const style = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: color || '#6b6560',
    width: 34, height: 34, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', cursor: 'pointer',
    transition: 'opacity 0.2s, border-color 0.2s',
    flexShrink: 0,
  }
  const enter = e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }
  const leave = e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }

  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} style={style} onMouseEnter={enter} onMouseLeave={leave}>
      {children}
    </a>
  )
  return null
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
    { href: '/ranks', label: 'Прогноз рангів' },
    { href: '/sumo', label: 'Про сумо' },
  ]

  return (
    <nav style={{
      background: 'var(--header)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'0 1.5rem',display:'flex',alignItems:'center',justifyContent:'space-between'}}>

        <div style={{display:'flex'}}>
          {tabs.map(t => (
            <Link key={t.href} href={t.href} style={{
              display: 'inline-block',
              padding: '0.75rem 1.25rem',
              fontFamily: 'monospace',
              fontSize: '0.72rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: path === t.href ? '#f5f0e8' : '#6b6560',
              textDecoration: 'none',
              borderBottom: path === t.href ? '2px solid #b8860b' : '2px solid transparent',
              transition: 'color 0.2s',
            }}>
              {t.label}
            </Link>
          ))}
        </div>

        {mounted && (
          <div style={{display:'flex',alignItems:'center',gap:8}}>

            <IconBtn href="https://www.youtube.com/@kachikoshiua" title="YouTube" color="#FF0000">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
              </svg>
            </IconBtn>

            <IconBtn href="https://t.me/kachikoshiua" title="Telegram" color="#29B6F6">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.9 8.2l-2 9.4c-.1.6-.5.8-.9.5l-2.5-1.9-1.2 1.1c-.1.1-.3.2-.6.2l.2-2.6 4.9-4.4c.2-.2 0-.3-.3-.1L6.4 14.6 4 13.9c-.5-.2-.5-.5.1-.7l11.5-4.4c.5-.2.9.1.3.4z"/>
              </svg>
            </IconBtn>

            <IconBtn href="https://sumosite-production.up.railway.app/" title="Сайт" color="#f5f0e8">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </IconBtn>

            <button
              onClick={toggle}
              title={dark ? 'Світла тема' : 'Темна тема'}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#b8860b',
                width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'opacity 0.2s, border-color 0.2s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity='0.75'; e.currentTarget.style.borderColor='rgba(255,255,255,0.35)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity='1'; e.currentTarget.style.borderColor='rgba(255,255,255,0.15)' }}
            >
              <ThemeIcon dark={dark} />
            </button>

          </div>
        )}

      </div>
    </nav>
  )
}