'use client'
/* burger_v1: mob-shtorka navihatsii, sluhaie nav-burger-toggle */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BurgerMenu({ tabs = [], langPrefix = '', lang = 'uk' }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    const h = () => setOpen(o => !o)
    window.addEventListener('nav-burger-toggle', h)
    return () => window.removeEventListener('nav-burger-toggle', h)
  }, [])
  useEffect(() => { setOpen(false) }, [pathname])
  if (!open) return null
  return (
    <div onClick={() => setOpen(false)} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(10,8,5,0.55)'}}>
      <div onClick={e => e.stopPropagation()} style={{position:'absolute',top:0,left:0,right:0,background:'var(--header)',borderBottom:'1px solid rgba(255,255,255,0.12)',padding:'0.6rem 1rem 1rem',display:'flex',flexDirection:'column'}}>
        {tabs.map(tab => (
          <Link key={tab.href} onClick={() => setOpen(false)}
            href={(tab.deep && !langPrefix ? '/' + (['uk','en','ja','fr'].includes(lang) ? lang : 'en') : langPrefix) + tab.href}
            style={{padding:'0.7rem 0.4rem',fontFamily:'monospace',fontSize:'0.78rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'#f5f0e8',textDecoration:'none',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
