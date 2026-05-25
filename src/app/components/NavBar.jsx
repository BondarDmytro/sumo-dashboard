'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLang } from './LangProvider'
import SumoQuiz from './SumoQuiz'

function ThemeIcon({ dark }) {
  if (dark) return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function IconBtn({ href, onClick, title, color, children }) {
  const style = {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.15)',
    color: color || '#6b6560',
    width: 30, height: 30, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    textDecoration: 'none', cursor: 'pointer',
    flexShrink: 0,
  }
  if (href) return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={title} style={style}>
      {children}
    </a>
  )
  if (onClick) return (
    <button onClick={onClick} title={title} style={style}>
      {children}
    </button>
  )
  return null
}

function GamesMenu({ onClose, onOpenQuiz, lang }) {
  const games = [
    {
      id: 'quiz',
      emoji: '🧠',
      title: lang === 'en' ? 'Sumo Quiz' : 'Сумо Квіз',
      desc: lang === 'en' ? '15 questions · Easy → Hard · Kachi-koshi or Make-koshi' : '15 питань · Легкі → Важкі · Качі-коші або Маке-коші',
      ready: true,
    },
    {
      id: 'snap',
      emoji: '🃏',
      title: lang === 'en' ? 'Yusho Card Game' : 'Юшо',
      desc: lang === 'en' ? 'Card battle · Collect the full deck' : 'Карткова битва · Зберіть повну колоду',
      ready: false,
    },
    {
      id: 'clash',
      emoji: '⚔️',
      title: lang === 'en' ? 'Sumo Clash' : 'Сумо Клеш',
      desc: lang === 'en' ? 'Strategic card game · Techniques & ranks' : 'Стратегічна карткова гра · Техніки та ранги',
      ready: false,
    },
  ]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      backdropFilter: 'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 4,
        maxWidth: 480, width: '100%',
        overflow: 'hidden',
      }}>
        <div style={{
          borderBottom: '1px solid var(--border)',
          padding: '0.75rem 1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--mid)' }}>
            {lang === 'en' ? '🎮 Games' : '🎮 Ігри'}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--mid)', fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1 }}>
            {'✕'}
          </button>
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {games.map(g => (
            <div key={g.id} onClick={g.ready ? onOpenQuiz : undefined} style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${g.ready ? '#b8860b' : 'var(--border)'}`,
              borderRadius: 2, padding: '1rem',
              cursor: g.ready ? 'pointer' : 'default',
              opacity: g.ready ? 1 : 0.55,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{g.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.title}</div>
                  {!g.ready && (
                    <span style={{
                      fontFamily: 'monospace', fontSize: '0.52rem',
                      border: '1px solid var(--border)',
                      color: 'var(--mid)', padding: '1px 6px', borderRadius: 2,
                    }}>
                      {lang === 'en' ? 'IN DEV' : 'В РОЗРОБЦІ'}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'var(--mid)' }}>{g.desc}</div>
              </div>
              {g.ready && <span style={{ color: 'var(--mid)', fontSize: '1.2rem' }}>{'›'}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function NavBar() {
  const path = usePathname()
  const isStudio = path.startsWith('/studio')
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [gamesOpen, setGamesOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const { lang, setLanguage, t } = useLang()

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
    { href: '/', label: t?.nav?.tournament || 'Турнір' },
    { href: '/ranks', label: t?.nav?.ranks || 'Прогноз рангів' },
    { href: '/rikishi', label: t?.nav?.rikishi || 'Рікіші' },
    { href: '/archive', label: t?.nav?.archive || 'Архів' },
    { href: '/sumo', label: t?.nav?.sumo || 'Про сумо' },
  ]

  return (
    <>
      <nav style={{
        background: 'var(--header)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Рядок 1: вкладки + кнопка ігор (горизонтальний скрол на мобільному) */}
        <div style={{
          display: 'flex', alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          maxWidth: 1100, margin: '0 auto',
          padding: '0 0.75rem',
        }}>
          <style>{`.nav-scroll::-webkit-scrollbar{display:none}`}</style>

          {tabs.map(tab => (
            <Link key={tab.href} href={tab.href} style={{
              display: 'inline-block',
              padding: '0.7rem 0.9rem',
              fontFamily: 'monospace',
              fontSize: '0.68rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: path === tab.href ? '#f5f0e8' : '#6b6560',
              textDecoration: 'none',
              borderBottom: path === tab.href ? '2px solid #b8860b' : '2px solid transparent',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {tab.label}
            </Link>
          ))}

          {mounted && (
            <button
              onClick={() => setGamesOpen(true)}
              title={lang === 'en' ? 'Games' : 'Ігри'}
              style={{
                marginLeft: 8,
                background: '#b8860b',
                border: 'none',
                color: '#fff',
                width: 30, height: 30, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}
            >
              🎮
            </button>
          )}

          {/* Іконки справа — на десктопі */}
          {mounted && (
            <div style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 6,
              paddingLeft: 12, flexShrink: 0,
            }}>
              <IconBtn href="https://www.youtube.com/@kachikoshiua" title="YouTube" color="#FF0000">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                </svg>
              </IconBtn>

              <IconBtn href="https://t.me/kachikoshiua" title="Telegram" color="#29B6F6">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.9 8.2l-2 9.4c-.1.6-.5.8-.9.5l-2.5-1.9-1.2 1.1c-.1.1-.3.2-.6.2l.2-2.6 4.9-4.4c.2-.2 0-.3-.3-.1L6.4 14.6 4 13.9c-.5-.2-.5-.5.1-.7l11.5-4.4c.5-.2.9.1.3.4z"/>
                </svg>
              </IconBtn>

              <IconBtn href="https://sumosite-production.up.railway.app/" title="Сайт" color="#f5f0e8">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </IconBtn>

              <IconBtn onClick={toggle} title={dark ? 'Світла тема' : 'Темна тема'} color="#b8860b">
                <ThemeIcon dark={dark} />
              </IconBtn>

              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />

              <IconBtn onClick={() => setLanguage(lang === 'uk' ? 'en' : 'uk')} title={lang === 'uk' ? 'Switch to English' : 'Перейти на українську'} color="#f5f0e8">
                <span style={{ fontSize: '0.85rem' }}>{lang === 'uk' ? '🇬🇧' : '🇺🇦'}</span>
              </IconBtn>
            </div>
          )}
        </div>
      </nav>

      {gamesOpen && (
        <GamesMenu
          onClose={() => setGamesOpen(false)}
          onOpenQuiz={() => { setGamesOpen(false); setQuizOpen(true) }}
          lang={lang}
        />
      )}
      {quizOpen && <SumoQuiz onClose={() => setQuizOpen(false)} />}
    </>
  )
}