'use client'

import { useLang } from './LangProvider'

export default function TournamentStatus({ leaders, chasers, currentDay, maxWins, kyujoCount, contendersCount }) {
  const { lang } = useLang()

  const stats = [
    {
      num: leaders.length,
      label: lang === 'en' ? 'Leaders' : 'Лідери',
      sub: `${lang === 'en' ? 'record' : 'рекорд'} ${maxWins}–${leaders[0]?.losses ?? '?'}`,
      color: '#1a6b5c'
    },
    {
      num: chasers.length,
      label: lang === 'en' ? 'Chasers' : 'Переслідувачі',
      sub: `${lang === 'en' ? 'record' : 'рекорд'} ${maxWins-1}–${chasers[0]?.losses ?? '?'}`,
    },
    {
      num: 15 - currentDay,
      label: lang === 'en' ? 'Days remaining' : 'Днів залишилось',
      sub: lang === 'en' ? 'to final' : 'до фіналу',
      color: '#01ddff'
    },
    {
      num: kyujoCount,
      label: lang === 'en' ? 'Kyujo' : 'Кюджо',
      sub: lang === 'en' ? 'absent' : 'відсутні',
      color: '#b8860b'
    },
    {
      num: contendersCount,
      label: lang === 'en' ? 'Contenders' : 'Претендентів',
      sub: lang === 'en' ? 'chance > 0%' : 'шанс > 0%',
    },
  ]

  return (
    <>
      <div className="anim-1" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2.5rem'}}>
        {lang === 'en' ? 'Tournament status' : 'Стан турніру'}
      </div>
      <div className="anim-1" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:1,background:'var(--border)',border:'1px solid var(--border)',marginBottom:'2rem'}}>
        {stats.map((s, i) => (
          <div key={i} style={{background:'var(--card)',padding:'1.25rem 1rem',textAlign:'center'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'2.8rem',fontWeight:800,lineHeight:1,color:s.color||'var(--ink)'}}>{s.num}</div>
            <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:'0.4rem'}}>{s.label}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',marginTop:'0.2rem'}}>{s.sub}</div>
          </div>
        ))}
      </div>
    </>
  )
}