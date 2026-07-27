'use client'
/* rikishi_hub_v1: klientska chastyna profil-khaba - zhyvyi detail poverkh servernoho bio */
import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { RikishiDetail } from './RikishiPageClient'
import { t3 } from '../i18n'

export default function RikishiHubClient({ id }) {
  const { lang } = useLang()
  const [data, setData] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  useEffect(() => {
    fetch('/api/rikishi-list').then(r => r.json()).then(d => setData(d)).catch(() => {})
  }, [])
  if (!data) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)'}}>
      {t3(lang, 'Завантаження даних турніру...', 'Loading tournament data...', '読み込み中...', 'Chargement des données du tournoi...')}
    </div>
  )
  const r = data?.rikishi?.find(x => String(x.id) === String(id) || String(x._id) === String(id))
  if (!r) return null
  const jpMap = {}
  data?.rikishi?.forEach(x => { if (x.nameJp) jpMap[x.name] = x.nameJp })
  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1rem 1.25rem'}}>
      <RikishiDetail r={r} lang={lang} isMobile={isMobile} jpMap={jpMap} />
    </div>
  )
}

/* fr_batch4b_v1 */
