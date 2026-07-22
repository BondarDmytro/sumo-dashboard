'use client' /* arch_rank_ja_v1 */ /* ja_batch3_fix */
import RikishiLink from './RikishiLink' /* rikishi_links_batch2_v1 */
import { rankColor } from '../lib/rankColors' /* rank_badge_color_v1 */
import { kimariteKanji } from '../lib/kimarite' /* ja_kimarite_ui_v1 */
import { t3 } from '../i18n' /* ja_batch1 */
import { displayName, displayRank, bashoInfo } from '../lib/bashoCalendar' /* ja_batch3_fix2 */

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

import { BASHO_LIST as BASHOS, currentBashoId } from '../lib/bashoCalendar' /* archive_basho_list_import_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

function getRankShort(rank) {
  if (!rank) return '?'
  if (rank.includes('Yokozuna')) return rank.replace('Yokozuna ', 'Y').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Ozeki')) return rank.replace('Ozeki ', 'O').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Sekiwake')) return rank.replace('Sekiwake ', 'S').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Komusubi')) return rank.replace('Komusubi ', 'K').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Maegashira')) {
    const num = rank.match(/\d+/)?.[0] || ''
    return `M${num}${rank.includes('East') ? 'e' : 'w'}`
  }
  return rank
}

function MatchDots({ record, isMobile }) {  /* arch_table_mobile_v1 */
  return (
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'nowrap',width:'100%',minWidth: isMobile ? 122 : 210}}>{/* arch_dots_big_v1 + arch_table_mobile_v1 */}
      {record.map((m, idx) => {
        const isWin = RESULTS_WIN.includes(m.result)
        const isLoss = RESULTS_LOSS.includes(m.result)
        const isFusen = m.kimarite === 'fusen'
        return (
          <span key={idx} title={`Day ${idx+1}${m.opponentShikonaEn ? ': '+m.opponentShikonaEn : ''}`} style={{
            width: isMobile ? 7 : 11,height: isMobile ? 7 : 11,borderRadius: isFusen ? 0 : '50%',boxSizing:'border-box',  /* fusen_squares_v1 */
            background: isWin ? '#f5f0e8' : isLoss ? '#0f0e0c' : m.result==='absent' ? '#aaa' : 'transparent', /* arch_dots_canon_v1 */
            border: (isWin || isLoss) ? '1.5px solid var(--ink)' : m.result==='absent' ? '1.5px solid #aaa' : '1px dashed var(--light)',
            display:'inline-block',flexShrink:0,
          }} />
        )
      })}
    </div>
  )
}

export default function ArchivePageClient() {
  const ARCHIVE_BASHOS = BASHOS.filter(b => b.id !== currentBashoId())  /* archive_default_v1 */
  const [selectedBasho, setSelectedBasho] = useState(ARCHIVE_BASHOS[0])
  const [data, setData] = useState(null)
  const [bios, setBios] = useState({})
  const [loading, setLoading] = useState(false)
  const [biosLoaded, setBiosLoaded] = useState(false)
  const { lang } = useLang()
  const [isMobile, setIsMobile] = useState(false)  /* arch_tabs_mobile_v1 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  useEffect(() => {
    fetch('/api/bios').then(r => r.json()).then(d => {
      setBios(d)
      setBiosLoaded(true)
    }).catch(() => setBiosLoaded(true))
  }, [])

  useEffect(() => {
    if (!biosLoaded) return
    const load = async () => {
      setLoading(true)
      setData(null)
      try {
        const [banzuke, bashoApiData] = await Promise.all([  /* shadow_fix_v1: не тінити bashoInfo з календаря */
          fetch(`https://sumo-api.com/api/basho/${selectedBasho.id}/banzuke/Makuuchi`).then(r => r.json()),
          fetch(`https://sumo-api.com/api/basho/${selectedBasho.id}`).then(r => r.json()),
        ])
        const all = [...(banzuke.east||[]), ...(banzuke.west||[])]
        const processed = all.map(r => {
          const record = r.record || []
          const wins = record.filter(m => RESULTS_WIN.includes(m.result)).length
          const losses = record.filter(m => RESULTS_LOSS.includes(m.result)).length
          const absentCount = record.filter(m => m.result === 'absent').length
          const hasLateAbsent = record.some((m, i) => m.result === 'absent' && i >= 5)
          const kyujo = absentCount > 5 || (absentCount > 0 && hasLateAbsent)
          return {
            id: r.rikishiID,
            name: r.shikonaEn,
            nameJp: r.shikonaJp,  /* ja_names_sweep_v1 */
            rank: getRankShort(r.rank),
            rankFull: r.rank,
            rankValue: r.rankValue || 999,
            wins, losses, kyujo,
            record,
            flag: bios[r.rikishiID]?.country?.flag || '🇯🇵',
          }
        })
        processed.sort((a,b) => b.wins - a.wins || a.rankValue - b.rankValue)
        const maxWins = Math.max(...processed.filter(r => !r.kyujo).map(r => r.wins))
        const officialWinnerId = bashoApiData.yusho?.find(y => y.type === 'Makuuchi')?.rikishiId
        const winner = officialWinnerId
          ? processed.find(r => r.id === officialWinnerId)
          : processed.find(r => r.wins === maxWins && !r.kyujo)

        let playoff = null
        if (officialWinnerId) {
          try {
            const matchRes = await fetch(`https://sumo-api.com/api/rikishi/${officialWinnerId}/matches?limit=100`)
            const matchData = await matchRes.json()
            const playoffMatch = matchData.records?.find(m =>
              m.bashoId === selectedBasho.id && m.day >= 16 && m.winnerId === officialWinnerId
            )
            if (playoffMatch) {
              const loser = playoffMatch.eastId === officialWinnerId
                ? (playoffMatch.westShikona || playoffMatch.westEn || playoffMatch.west)
                : (playoffMatch.eastShikona || playoffMatch.eastEn || playoffMatch.east)
              playoff = {
                loser,
                kimarite: playoffMatch.kimarite,
              }
            }
          } catch(e) {}
        }

        setData({ rikishi: processed, maxWins, winner, playoff, winnerId: officialWinnerId })
      } catch(e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedBasho, biosLoaded])

  const tableHeaders = lang === 'en'
    ? ['#', 'Rikishi', 'Rank', 'Record', 'Matches']
    : lang === 'ja' ? ['#', '力士', '番付', '成績', '取組']  /* ja_final_tails */
    : ['#', 'Рікіші', 'Ранг', 'Рекорд', 'Матчі']

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          {t3(lang, 'Архів турнірів', 'Tournament archive', '場所アーカイブ')}
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'1.5rem'}}>
          {t3(lang, 'Результати', 'Results', '結果')}
          <span style={{color:'#b8860b'}}>{t3(lang, ' — Попередні басьо', ' — Previous basho', ' — 過去の場所')}</span>
        </h1>

        {/* Кнопки вибору басьо */}
        <div style={{display: isMobile ? 'grid' : 'flex',gridTemplateColumns:'repeat(2, minmax(0,1fr))',gap: isMobile ? 6 : 8,marginBottom:'2rem',flexWrap:'wrap'}}>{/* arch_tabs_mobile_v1 */}
          {ARCHIVE_BASHOS.map(b => (  /* archive_no_current_v1 */
            <button key={b.id} onClick={() => setSelectedBasho(b)} style={{
              padding: isMobile ? '0.45rem 0.4rem' : '0.6rem 1.25rem',
              fontFamily:'monospace',fontSize: isMobile ? '0.6rem' : '0.72rem',
              minWidth:0,overflow:'hidden',whiteSpace:'nowrap',textOverflow:'ellipsis',
              letterSpacing:'0.08em',
              background: selectedBasho.id === b.id ? 'var(--ink)' : 'var(--bg2)',
              color: selectedBasho.id === b.id ? 'var(--bg)' : 'var(--mid)',
              border:`1px solid ${selectedBasho.id === b.id ? 'var(--ink)' : 'var(--border)'}`,
              borderRadius:2,cursor:'pointer',
            }}>
              <div style={{fontWeight:700}}>{bashoInfo(b.id).label[lang]}</div>
              <div style={{fontSize:'0.58rem',opacity:0.7}}>{bashoInfo(b.id).city[lang]}</div>
            </button>
          ))}
        </div>

        {loading && (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            {t3(lang, 'Завантаження...', 'Loading...', '読み込み中...')}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Банер переможця з фото */}
            {data.winner && (
  <div style={{
    background:'var(--bg2)',
    border:'2px solid #b8860b',
    borderRadius:4,
    marginBottom:'2rem',
    position:'relative',
    overflow:'hidden',
  }}>
    <div style={{
      position:'absolute',right:'-0.02em',top:'-0.1em',
      fontSize:'clamp(4rem,10vw,8rem)',
      fontWeight:800,opacity:0.08,lineHeight:1,
      pointerEvents:'none',color:'#b8860b',
    }}>🏆</div>

    <div style={{display:'flex',flexDirection:'row',minHeight:220}}>
      <img
        src={`/rikishi/${data.winner.id}.webp`}
        alt={data.winner.name}
        style={{
          width:'clamp(100px,22%,180px)',
          minHeight:'100%',
          objectFit:'cover',
          objectPosition:'top',
          display:'block',
          flexShrink:0,
        }}
        onError={e=>{e.target.style.display='none'}}
      />

      <div style={{
        position:'relative',zIndex:1,
        flex:1,minWidth:0,
        display:'flex',flexDirection:'column',
        justifyContent:'center',
        padding:'1rem 1.25rem',
        gap:'0.6rem',
      }}>
        <div style={{fontFamily:'monospace',fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#b8860b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          {bashoInfo(selectedBasho.id).label[lang] + ' — ' + t3(lang, 'Юшо', 'Yusho', '優勝')}
        </div>

        <div>
          <div style={{fontWeight:800,fontSize:'clamp(1.1rem,4vw,2.2rem)',lineHeight:1.1,color:'var(--ink)',wordBreak:'break-word'}}>
            {data.winner.flag} {displayName(data.winner, lang)}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginTop:6}}>
            {displayRank(data.winner.rankFull, lang)}
          </div>
        </div>

        <div style={{display:'inline-block'}}>
          <div style={{background:'var(--card)',padding:'0.5rem 1rem',borderRadius:2,border:'1px solid var(--border)',display:'inline-block'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'clamp(1.4rem,5vw,1.8rem)',fontWeight:800,color:'#b8860b',lineHeight:1}}>
              {data.winner.wins}–{data.winner.losses}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginTop:4,textTransform:'uppercase',letterSpacing:'0.1em'}}>
              {t3(lang, 'Фінальний рекорд', 'Final record', '最終成績')}
            </div>
          </div>
        </div>

        {data.playoff && (
          <div style={{
            display:'inline-flex',alignItems:'flex-start',gap:6,alignSelf:'flex-start',
            background:'rgba(184,134,11,0.15)',
            border:'1px solid rgba(184,134,11,0.4)',
            padding:'6px 10px',borderRadius:2,maxWidth:'100%',
          }}>
            <span style={{flexShrink:0}}>⚡</span>
            <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#b8860b',fontWeight:600,wordBreak:'break-word'}}>
              {lang === 'en'
                ? `Won in playoff vs ${data.playoff.loser} · ${data.playoff.kimarite}`
                : lang === 'ja' ? `優勝決定戦で${data.playoff.loser}を下す · ${kimariteKanji(data.playoff.kimarite)}` : `Переміг у плей-офі проти ${data.playoff.loser} · ${data.playoff.kimarite}`}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
)}

            {/* Таблиця результатів */}
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.78rem'}}>
                <thead>
                  <tr style={{borderBottom:'2px solid var(--ink)'}}>
                    {tableHeaders.map(h => (
                      <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 0.3rem',textAlign: h === tableHeaders[1] ? 'left' : 'center',fontWeight:500}}>{/* arch_th_center_v1 */}
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rikishi.map((r, i) => (
                    <tr key={r.id} style={{borderBottom:'1px solid var(--border)',opacity: r.kyujo ? 0.5 : 1}}>
                      <td style={{padding:'0.5rem 0.3rem',fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>
                        {r.id === data.winner?.id ? '🏆' : i+1}
                      </td>
                      <td style={{padding:'0.5rem 0.3rem'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span>{r.flag}</span>
                          <div>
                            <div style={{fontWeight:700,fontSize: isMobile ? '0.7rem' : '0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth: isMobile ? 92 : 'none'}}><RikishiLink id={r.id}>{displayName(r, lang)}</RikishiLink></div>
                            {!isMobile && <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{displayRank(r.rankFull, lang)}</div>}{/* arch_table_mobile_v1 */}
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'0.5rem 0.3rem'}}>
                        <span style={{fontFamily:'monospace',fontSize:'0.6rem',background:rankColor(r.rank) + '2e',padding:'2px 5px',borderRadius:2,color:rankColor(r.rank),fontWeight:600}}>{displayRank(r.rank, lang)}</span>
                      </td>
                      <td style={{padding:'0.5rem 0.3rem',fontFamily:'monospace',fontWeight:600,fontSize: isMobile ? '0.7rem' : '0.88rem',whiteSpace:'nowrap'}}>
                        <span style={{color: r.kyujo ? 'var(--mid)' : r.wins >= 8 ? 'var(--ink)' : '#c0392b'}}>
                          {r.wins}–{r.losses}
                        </span>
                        {r.kyujo && (
                          <span style={{fontFamily:'monospace',fontSize:'0.55rem',background:'#fde8e8',color:'#c0392b',padding:'1px 5px',borderRadius:2,marginLeft:4}}>
                            {t3(lang, 'КЮД', 'KYJ', '休')}
                          </span>
                        )}
                      </td>
                      <td style={{padding:'0.5rem 0.3rem',width:'34%'}}>{/* arch_dots_big_v1: kolonka Matchi zabyraie tretynu tablytsi */}
                        <MatchDots record={r.record} isMobile={isMobile} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
/* archive_dots_nowrap_v1 */

/* archive_table_compact_v1 */
