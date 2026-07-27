'use client'
/* news_block_v1: NHK sumo headlines, external links */
import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { t3 } from '../i18n'

function relTime(dateStr, lang) {
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const h = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (h < 1) return t3(lang, 'щойно', 'just now', 'たった今', 'à l\u2019instant')
  if (h < 24) return h + t3(lang, ' год тому', 'h ago', '時間前', ' h')
  const days = Math.floor(h / 24)
  return days + t3(lang, ' дн тому', 'd ago', '日前', ' j')
}

export default function NewsBlock() {
  const [news, setNews] = useState(null)
  const { lang } = useLang()

  useEffect(() => {
    fetch('/api/news').then(r => r.json()).then(d => setNews(d.news || [])).catch(() => setNews([]))
  }, [])

  if (!news || news.length === 0) return null

  return (
    <div style={{marginTop:'2rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.6rem'}}>
        <span>{t3(lang, 'Новини', 'News', 'ニュース', 'Actualités')}</span>
        <span style={{letterSpacing:'normal',textTransform:'none',fontSize:'0.6rem'}}>NHK · {t3(lang, 'японською', 'in Japanese', '日本語', 'en japonais')}</span>
      </div>
      {news.map((n, i) => (
        <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{display:'flex',gap:10,alignItems:'baseline',padding:'0.45rem 0.25rem',borderBottom:'1px solid var(--border)',textDecoration:'none',color:'var(--ink)'}}>
          <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)',whiteSpace:'nowrap',flexShrink:0,minWidth:70}}>{relTime(n.date, lang)}</span>
          <span style={{fontSize:'0.8rem',lineHeight:1.45}}>{n.title} <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{'\u2197'}</span></span>
        </a>
      ))}
    </div>
  )
}

/* fr_batch4b_v1 */
