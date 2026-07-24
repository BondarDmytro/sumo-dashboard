'use client'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

export default function TournamentStatus({ leaders, chasers, currentDay, maxWins, kyujoCount, contendersCount, eliminatedCount = 0, isFinished, topKimarite = null }) {  /* ts_kimarite_v1 */  /* ts_eliminated_v1 */
  const { lang } = useLang()
  if (isFinished) return null

  const rec = t3(lang, 'рекорд', 'record', '成績')
  const stats = [
    {
      num: leaders.length,
      label: t3(lang, 'Лідери', 'Leaders', 'トップ'),
      sub: `${rec} ${maxWins}–${leaders[0]?.losses ?? '?'}`,
      color: '#b8860b'
    },
    {
      num: chasers.length,
      label: t3(lang, 'Переслідувачі', 'Chasers', '追う力士'),
      sub: `${rec} ${maxWins-1}–${chasers[0]?.losses ?? '?'}`,
      color: '#1a6b5c'
    },
    {
      num: contendersCount,
      label: t3(lang, 'Претендентів', 'Contenders', '優勝候補'),
      sub: t3(lang, 'шанс > 0%', 'chance > 0%', '確率 > 0%'),
      color: 'var(--mid)',
    },
    ...(eliminatedCount > 0 ? [{
      num: eliminatedCount,
      label: t3(lang, 'Вибули', 'Eliminated', '脱落'),
      sub: t3(lang, 'шанс 0%', 'chance 0%', '確率 0%'),
      color: 'var(--ink)'
    }] : []),
    ...(topKimarite ? [{
      num: topKimarite.name,
      label: t3(lang, 'Техніка турніру', 'Top kimarite', '決まり手'),
      sub: `${topKimarite.count} \u00b7 ${topKimarite.pct}%`,
      color: '#7d3c98'
    }] : []),  /* ts_kimarite_v2 */
    ...(15 - currentDay > 0 ? [{
      num: 15 - currentDay,
      label: t3(lang, 'Днів залишилось', 'Days remaining', '残り日数'),
      sub: t3(lang, 'до фіналу', 'to final', '千秋楽まで'),
      color: 'var(--ink)'
    }] : []),
    {
      num: kyujoCount,
      label: t3(lang, 'Кюджо', 'Kyujo', '休場'),
      sub: t3(lang, 'відсутні', 'absent', '不在'),
      color: '#c0392b'
    },
  ]

  return (
    <>
      <div className="anim-1" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.8rem',marginTop:'1.2rem'}}>
        {t3(lang, 'Стан турніру', 'Tournament status', '場所の状況')}
      </div>
      <div className="anim-1 ts-grid" style={{gap:1,background:'var(--border)',border:'1px solid var(--border)',marginBottom:'1.2rem'}}>
        {stats.map((s, i) => (
          <div key={i} style={{background:'var(--card)',padding:'0.5rem 0.75rem',textAlign:'center' /* ts_compact_v1 */}}>
            <div className="ts-numzone"><span className={typeof s.num === 'string' ? 'ts-num-text' : 'ts-num'} style={{fontFamily:'Georgia,serif',fontWeight:800,color:s.color||'var(--ink)',whiteSpace:'nowrap' /* ts_kimarite_final */}}>{s.num}</span></div>
            <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:'0.4rem'}}>{s.label}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',marginTop:'0.2rem'}}>{s.sub}</div>
          </div>
        ))}
      </div>
    </>
  )
}

/* tstatus_mobile_v1 */

/* ts_colors_v1 */
