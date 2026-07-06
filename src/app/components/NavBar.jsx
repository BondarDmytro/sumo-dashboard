'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLang } from './LangProvider'

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

export default function NavBar() {
  const path = usePathname()
  const isStudio = path.startsWith('/studio')
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const { lang, setLanguage, t } = useLang()

  useEffect(() => {
  setMounted(true)
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    setDark(true)
    document.documentElement.setAttribute('data-theme', 'dark')
  }
}, [])

useEffect(() => {
  if (!langMenuOpen) return
  const handler = () => setLangMenuOpen(false)
  document.addEventListener('click', handler)
  return () => document.removeEventListener('click', handler)
}, [langMenuOpen])

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
        <div style={{
          display: 'flex', alignItems: 'center',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          maxWidth: 1280, margin: '0 auto',
          padding: '0 0.75rem',
        }}>
              <a href="https://dohyo-legends.com" title="Dohyo Legends" style={{display:'flex',alignItems:'center',marginRight:6,textDecoration:'none'}}> {/*navbar_home_v1 navbar_social_removed_v1*/}
                <img src="https://dohyo-legends.com/images/dohyo-logo.webp" alt="Dohyo Legends" style={{height:26,width:'auto',objectFit:'contain',filter:'drop-shadow(0 0 6px rgba(200,149,10,0.4))'}}/>
              </a>  {/* navbar_cleanup_v1 */}
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

          {/*navbar_games_removed_v1: кнопка ігор прибрана, ігри на /game*/}

          {mounted && (
            <div style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: 6,
              paddingLeft: 12, flexShrink: 0,
            }}>

              <IconBtn onClick={toggle} title={dark ? 'Світла тема' : 'Темна тема'} color="#b8860b">
                <ThemeIcon dark={dark} />
              </IconBtn>

              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)' }} />

              <div style={{position:'relative'}}>
  <IconBtn onClick={(e)=>{e.stopPropagation();setLangMenuOpen(v=>!v)}} title="Language" color="#f5f0e8">
    <span style={{fontSize:'0.85rem'}}>
      {lang==='uk'?'🇺🇦':lang==='en'?'🇬🇧':'🇯🇵'}
    </span>
  </IconBtn>
  {langMenuOpen&&(
    <div onClick={e=>e.stopPropagation()} style={{
      position:'fixed',top:48,right:12,
      background:'var(--card)',border:'1px solid var(--border)',
      borderRadius:4,overflow:'hidden',zIndex:200,
      boxShadow:'0 4px 12px rgba(0,0,0,0.3)',minWidth:140,
    }}>
                    {[
                      {code:'uk',flag:'🇺🇦',label:'Українська'},
                      {code:'en',flag:'🇬🇧',label:'English'},
                      {code:'ja',flag:'🇯🇵',label:'日本語'},
                    ].map(l=>(
                      <div key={l.code} onClick={()=>{setLanguage(l.code);setLangMenuOpen(false)}} style={{
                        display:'flex',alignItems:'center',gap:8,
                        padding:'8px 12px',cursor:'pointer',
                        background:lang===l.code?'rgba(184,134,11,0.15)':'transparent',
                        borderLeft:`2px solid ${lang===l.code?'#b8860b':'transparent'}`,
                        fontFamily:'monospace',fontSize:'0.75rem',color:'var(--ink)',
                      }}>
                        <span style={{fontSize:'1rem'}}>{l.flag}</span>
                        {l.label}
                        {lang===l.code&&<span style={{marginLeft:'auto',color:'#b8860b'}}>✓</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      
    </>
  )
}