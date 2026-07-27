'use client'
import { ukrName } from '../lib/translit'  /* ukr_names_v2 */
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja, fr) {  /* fr_local_t3_v1 */
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  if (lang === 'fr') return fr !== undefined ? fr : en
  return uk
}

export default function TournamentStatus({ leaders, chasers, currentDay, maxWins, kyujoCount, contendersCount, eliminatedCount = 0, isFinished, topKimarite = null, winner = null, playoff = null }) {  /* ts_kimarite_v1 */  /* ts_eliminated_v1 */
  const { lang } = useLang()
  if (isFinished) {
    if (!winner) return null
    const wid = winner._id ?? winner.id
    return (
      <>
        <div className="anim-1" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.8rem',marginTop:'1.2rem'}}>
          {t3(lang, 'Підсумки турніру', 'Tournament results', '\u5834\u6240\u7D50\u679C')}
        </div>
        <div className="anim-1" style={{display:'flex',gap:'1rem',alignItems:'stretch',background:'var(--card)',border:'1px solid #b8860b',borderRadius:4,padding:'0.9rem 1rem',marginBottom:'1.2rem',flexWrap:'wrap'}}>
          {wid && <img src={`/rikishi/${wid}.webp`} alt={winner.name} onError={e => { e.target.style.display = 'none' }}
            style={{width:96,height:168,objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid #b8860b',flexShrink:0}} />}
          <div style={{flex:1,minWidth:200,display:'flex',flexDirection:'column',justifyContent:'center',gap:4}}>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#b8860b'}}>{String.fromCodePoint(0x1F3C6)} {t3(lang, 'Юшо', 'Yusho champion', '\u512A\u52DD')}</div>
            <div style={{fontWeight:800,fontSize:'1.4rem',lineHeight:1.1}}>{lang === 'uk' ? ukrName(winner.name) : winner.name}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)'}}>{winner.rank || ''}{winner.wins != null ? ` \u00b7 ${winner.wins}\u2013${winner.losses}` : ''}</div>
            {playoff?.bouts?.length > 0 && (
              <div style={{marginTop:6,paddingTop:6,borderTop:'1px solid var(--border)'}}>
                <div style={{fontFamily:'monospace',fontSize:'0.52rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',marginBottom:3}}>{t3(lang, 'Плей-оф', 'Playoff', '\u512A\u52DD\u6C7A\u5B9A\u6226')}</div>
                {playoff.bouts.map((b, i) => (
                  <div key={i} style={{fontFamily:'monospace',fontSize:'0.66rem',padding:'1px 0'}}>
                    <span style={{fontWeight: String(b.winnerId) === String(b.eastId) ? 800 : 400,color: String(b.winnerId) === String(b.eastId) ? '#1a6b5c' : 'var(--ink)'}}>{lang === 'uk' ? ukrName(b.east) : b.east}</span>
                    <span style={{color:'var(--light)'}}> vs </span>
                    <span style={{fontWeight: String(b.winnerId) === String(b.westId) ? 800 : 400,color: String(b.winnerId) === String(b.westId) ? '#1a6b5c' : 'var(--ink)'}}>{lang === 'uk' ? ukrName(b.west) : b.west}</span>
                    {b.kimarite && <span style={{color:'var(--mid)'}}> {'\u00b7'} {b.kimarite}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

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
