'use client'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

export default function TournamentStatus({ leaders, chasers, currentDay, maxWins, kyujoCount, contendersCount, isFinished }) {
  const { lang } = useLang()
  if (isFinished) return null

  const rec = t3(lang, 'рекорд', 'record', '成績')
  const stats = [
    {
      num: leaders.length,
      label: t3(lang, 'Лідери', 'Leaders', 'トップ'),
      sub: `${rec} ${maxWins}–${leaders[0]?.losses ?? '?'}`,
      color: '#1a6b5c'
    },
    {
      num: chasers.length,
      label: t3(lang, 'Переслідувачі', 'Chasers', '追う力士'),
      sub: `${rec} ${maxWins-1}–${chasers[0]?.losses ?? '?'}`,
    },
    ...(15 - currentDay > 0 ? [{
      num: 15 - currentDay,
      label: t3(lang, 'Днів залишилось', 'Days remaining', '残り日数'),
      sub: t3(lang, 'до фіналу', 'to final', '千秋楽まで'),
      color: '#01ddff'
    }] : []),
    {
      num: kyujoCount,
      label: t3(lang, 'Кюджо', 'Kyujo', '休場'),
      sub: t3(lang, 'відсутні', 'absent', '不在'),
      color: '#b8860b'
    },
    {
      num: contendersCount,
      label: t3(lang, 'Претендентів', 'Contenders', '優勝候補'),
      sub: t3(lang, 'шанс > 0%', 'chance > 0%', '確率 > 0%'),
    },
  ]

  return (
    <>
      <div className="anim-1" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2.5rem'}}>
        {t3(lang, 'Стан турніру', 'Tournament status', '場所の状況')}
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
