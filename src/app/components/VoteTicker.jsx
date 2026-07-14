'use client'
/* votes_v1 -> ticker_v4: zavzhdy vydymyi, fixed pid navbarom + spacer, neprozoryi */
import { useVotes } from './useVotes'
import { useLang } from './LangProvider'
import { useBios } from './BiosProvider'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import meta from '../lib/rikishiMeta.json'

export default function VoteTicker() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const path = usePathname()
  const [navH, setNavH] = useState(44)
  useEffect(() => {
    const el = document.querySelector('nav')
    if (!el) return
    const measure = () => setNavH(el.offsetHeight)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const [barH, setBarH] = useState(30)
  const { votes, total } = useVotes()
  const { lang } = useLang()
  const bios = useBios()
  if (path && path.startsWith('/studio')) return null
  if (total < 3) return null

  const t = (uk, en, ja) => lang === 'en' ? en : lang === 'ja' ? ja : uk
  const top = Object.entries(votes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, n]) => {
      const bio = bios[String(id)]
      const m = meta.find(x => Number(x.id) === Number(id))
      const name = lang === 'ja'
        ? ((bio?.nameJp || m?.nameJp || '').split(/\s/)[0] || '#' + id)
        : (bio?.name || m?.name || '#' + id)
      return { id, name, n, pct: Math.round((n / total) * 100) }
    })

  const items = top.map((r, i) => (
    <span key={r.id} style={{marginRight:28,whiteSpace:'nowrap'}}>
      <span style={{color: i === 0 ? '#b8860b' : 'var(--mid)',fontWeight: i === 0 ? 700 : 400}}>{i + 1}.</span>{' '}
      <span style={{color:'var(--ink)',fontWeight:600}}>{r.name}</span>{' '}
      <span style={{color:'#b8860b',fontWeight:700}}>{r.pct}%</span>{' '}
      <span style={{color:'var(--mid)',fontSize:'0.62rem'}}>({r.n})</span>
    </span>
  ))

  return (
    <>
    <div style={{height:barH}} aria-hidden="true" />
    <div ref={el => { if (el && el.offsetHeight && el.offsetHeight !== barH) setBarH(el.offsetHeight) }} className="vt-bar" style={{position:'fixed',top:navH,left:0,right:0,zIndex:90,backgroundColor:'var(--bg)',display:'flex',alignItems:'center',padding:'6px 0',fontFamily:'monospace',fontSize:'0.72rem'}}>
      <span className="vt-label" style={{flexShrink:0,padding: isMobile ? '0 7px' : '0 14px',fontSize: isMobile ? '0.58rem' : undefined,color:'var(--mid)',letterSpacing:'0.12em',textTransform:'uppercase',whiteSpace:'nowrap',borderRight:'1px solid rgba(184,134,11,0.35)'}}>
        {'\ud83d\uddf3\ufe0f '}{isMobile ? <>{t('Прогноз', 'Picks', '予想')} · {total}</> : <>{t('Народний вибір', "Fans' pick", 'ファン予想')} · {total} {t('голосів', 'votes', '票')}</>}
      </span>
      <div style={{flex:1,overflow:'hidden',minWidth:0}}>
        <div className="vt-track" style={{display:'inline-flex',whiteSpace:'nowrap',animation:'vtScroll2 25s linear infinite',willChange:'transform',paddingLeft:'100%'}}>
          {items}
        </div>
      </div>
    </div>
    </>
  )
}
