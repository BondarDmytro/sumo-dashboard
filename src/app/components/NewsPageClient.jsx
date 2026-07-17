'use client'
/* news_page_client_v1 */
import { useEffect, useState } from 'react'
import { t3 } from '../i18n'

function relTime(dateStr, lang) {
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const h = Math.floor((Date.now() - d.getTime()) / 3600000)
  if (h < 1) return t3(lang, 'щойно', 'just now', 'たった今')
  if (h < 24) return h + t3(lang, ' год тому', 'h ago', '時間前')
  const days = Math.floor(h / 24)
  return days + t3(lang, ' дн тому', 'd ago', '日前')
}

export default function NewsPageClient({ lang }) {
  const [news, setNews] = useState(null)

  useEffect(() => {
    fetch('/api/news').then(r => r.json()).then(d => setNews(d.news || [])).catch(() => setNews([]))
  }, [])

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:900,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.4rem'}}>
          {t3(lang, 'Новини сумо', 'Sumo News', '相撲ニュース')}
        </h1>
        <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'2rem',lineHeight:1.6}}>
          {t3(lang, 'Офіційні новини від NHK мовою оригіналу. Клік відкриває повну статтю на nhk.or.jp.',
              'Official NHK news in original Japanese. Click opens the full article on nhk.or.jp.',
              'NHKの公式ニュース。クリックでnhk.or.jpの記事全文へ。')}
        </p>
        {news === null && <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>...</div>}
        {news && news.length === 0 && (
          <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>
            {t3(lang, 'Наразі свіжих сумо-новин немає', 'No fresh sumo news right now', '現在、新しい相撲ニュースはありません')}
          </div>
        )}
        {news && news.map((n, i) => (
          <a key={i} href={n.link} target="_blank" rel="noopener noreferrer" style={{display:'flex',gap:12,alignItems:'baseline',padding:'0.7rem 0.25rem',borderBottom:'1px solid var(--border)',textDecoration:'none',color:'var(--ink)'}}>
            <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)',whiteSpace:'nowrap',flexShrink:0,minWidth:78}}>{relTime(n.date, lang)}</span>
            <span style={{fontSize:'0.9rem',lineHeight:1.5}}>{n.title} <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)'}}>{'\u2197'}</span></span>
          </a>
        ))}
        <div style={{marginTop:'1.2rem',fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)'}}>
          {t3(lang, 'Джерело: NHK (www3.nhk.or.jp) · заголовки мовою оригіналу', 'Source: NHK (www3.nhk.or.jp) · headlines in original language', '出典: NHK (www3.nhk.or.jp)')}
        </div>
      </div>
    </main>
  )
}
