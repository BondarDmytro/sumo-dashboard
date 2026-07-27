'use client'
import { ukrName } from '../lib/translit'  /* ukr_names_v2 */
import OvrBadge from './OvrBadge' /* ovr_in_tables_v1 */
/* rank_badge_color_v1 */
import { useState, useEffect, useRef } from 'react' /* table_timetravel_v1 result_wave_v1 */
import { displayRank, shortRank } from '../lib/bashoCalendar' /* kanji_names_v2 */
import { rankColor } from '../lib/rankColors' /* rank_badge_color_v1 */

import { useLang } from './LangProvider'
import FlagName from './FlagName'
import { computeStandings } from '../lib/chanceEngine' /* table_timetravel_v1 */
import { useFavorites } from './useFavorites' /* fav_row_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
const RESULTS_PLAYED = [...RESULTS_WIN, ...RESULTS_LOSS]

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

function TodayCell({ record, currentDay, t, lang }) {  /* today_opponent_jp_v1 */
  const todayMatch = record.find(m => m.day === currentDay)
  const todayWin = todayMatch && RESULTS_WIN.includes(todayMatch.result)
  const todayLoss = todayMatch && RESULTS_LOSS.includes(todayMatch.result)
  if (!todayMatch || !todayMatch.result) {
    return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>{t3(lang,'очікується','upcoming','予定')}</span>
  }
  if (todayWin) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid #0f0e0c',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>
        {todayMatch.kimarite==='fusen'?'✦ ':''}{lang === 'ja' ? String(todayMatch.opponentJp || todayMatch.opponent || '').split('(')[0] : todayMatch.opponent}
      </span>
    </div>
  )
  if (todayLoss) return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
      <span style={{width:16,height:16,borderRadius:'50%',background:'#0f0e0c',border:'1.5px solid #f5f0e8',display:'inline-block'}} />
      <span style={{fontSize:'0.6rem',fontFamily:'monospace',color:'var(--mid)',whiteSpace:'nowrap'}}>{lang === 'ja' ? String(todayMatch.opponentJp || todayMatch.opponent || '').split('(')[0] : todayMatch.opponent}</span>
    </div>
  )
  return <span style={{color:'var(--light)',fontSize:'0.68rem',fontFamily:'monospace'}}>—</span>
}

function MatchDots({ record, currentDay }) {
  return (
    <div className="tt-dots" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'nowrap',width:'100%'}}>{/* dots_stretch_v1 */}
      {Array.from({length:15}).map((_, idx) => {
        const m = record[idx]
        const isWin = m && RESULTS_WIN.includes(m.result)
        const isLoss = m && RESULTS_LOSS.includes(m.result)
        const isAbsent = m?.result === 'absent'
        const isFusen = m?.kimarite === 'fusen'
        const noResult = !m || !RESULTS_WIN.concat(RESULTS_LOSS, ['absent']).includes(m.result)
        const isToday = m?.day === currentDay
        return (
          <span key={idx} style={{
            width:11,height:11,borderRadius: isFusen ? 0 : '50%',  /* fusen_squares_v1 */
            background: noResult ? 'transparent' : isWin ? '#f5f0e8' : isLoss ? '#0f0e0c' : isAbsent ? '#888' : 'transparent',
            border: noResult ? '1px dashed var(--light)' : '1.5px solid var(--ink)',
            boxSizing:'border-box',
            display:'inline-block',flexShrink:0,
            outline: isToday ? '2px solid #b8860b' : 'none',
            outlineOffset: 1,
          }} />
        )
      })}

    </div>
  )
}

export default function TournamentTable({ contenders, currentDay, allRikishi = null, extViewDay = null, onDayChange = null, divisionWinner = null, divisionPlayoff = null }) {
  const [isMobileTT, setIsMobileTT] = useState(false)  /* tt_score_mobile_v1 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobileTT(mq.matches)
    const h = e => setIsMobileTT(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  /* result_wave_v1 kk_mk_color_v1 kk_mk_v2 */
  const [waveIds, setWaveIds] = useState(new Set())
  const prevPlayedRef = useRef({})
  useEffect(() => {
    const next = {}
    const fresh = new Set()
    ;(contenders || []).forEach(r => {
      const played = (r.record || []).filter(m => m && m.result).length
      next[r._id] = played
      const prev = prevPlayedRef.current[r._id]
      if (prev !== undefined && played > prev) fresh.add(r._id)
    })
    prevPlayedRef.current = next
    if (fresh.size) {
      setWaveIds(fresh)
      const t = setTimeout(() => setWaveIds(new Set()), 2000)
      return () => clearTimeout(t)
    }
  }, [contenders])
  const { isFav } = useFavorites()  /* fav_row_v1 */
  const { t, lang } = useLang()
  const [viewDay, setViewDay] = useState(currentDay)  /* table_timetravel_v1 */
  const dayMax = divisionPlayoff ? 16 : currentDay  /* tt_playoff_tab_v1 */
  const viewDayEff = extViewDay ?? viewDay  /* ts_timetravel_v1 */
  const setDay = (d) => { setViewDay(d); if (onDayChange) onDayChange(d) }
  const retro = viewDayEff !== currentDay && allRikishi?.length
    ? computeStandings(allRikishi, Math.min(viewDayEff, 15))  /* tt_playoff_tab_v1: den 16 = pislia-pleiof */
    : null
  const shown = retro
    ? retro.rikishi.filter(r => !r.kyujo)  /* retro_all_v1 tt_po_fulllist_v1: den 16 = povnyi spysok, uchasnyky P-O vydni v paneli */
    : contenders

  const dayLabel = t3(lang, `День ${viewDayEff}`, `Day ${viewDayEff}`, `${viewDayEff}日目`)
  const headers = [
    dayLabel,
    '#',
    t3(lang, 'Рікіші', 'Rikishi', '力士'),
    t3(lang, 'Ранг', 'Rank', '番付'),
    t3(lang, 'Бал', 'Score', '点'),  /* ovr_col_tt_v1 tt_mob_rank_score_v1 */
    t3(lang, 'Рекорд', 'Record', '成績'),
    t3(lang, 'Матчі', 'Matches', '取組'),
    t3(lang, 'Статус', 'Status', '状態'),
    t3(lang, 'Шанс на юшо', 'Yusho chance', '優勝確率'),
  ]  /* delta_col_removed_v1 */

  return (
    <>
      <div className="anim-2" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
        {t3(lang, 'Турнірна таблиця — всі рікіші макуучі', 'Standings — all Makuuchi rikishi', '幕内力士 全員成績表')}
      </div>
      <div className="tt-slider" style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.5rem'}}>{/* table_timetravel_v1 */}
        <button onClick={() => setDay(d => Math.max(1, d - 1))} disabled={viewDayEff <= 1}
          style={{fontFamily:'monospace',padding:'2px 10px',cursor:'pointer',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:2,color:'var(--ink)'}}>{'\u2039'}</button>
        <input type="range" min={1} max={dayMax} value={viewDayEff} onChange={e => setDay(parseInt(e.target.value, 10))}
          style={{flex:1,minWidth:120,accentColor:'#b8860b'}} />
        <button onClick={() => setDay(d => Math.min(dayMax, d + 1))} disabled={viewDayEff >= dayMax}
          style={{fontFamily:'monospace',padding:'2px 10px',cursor:'pointer',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:2,color:'var(--ink)'}}>{'\u203a'}</button>
        <span style={{fontFamily:'monospace',fontSize:'0.7rem',fontWeight:700,whiteSpace:'nowrap'}}>{viewDayEff === 16 ? t3(lang, '\u041F\u043B\u0435\u0439-\u043E\u0444', 'Playoff', '\u512A\u52DD\u6C7A\u5B9A\u6226') : t3(lang,'\u0414\u0435\u043d\u044c','Day','\u65e5\u76ee') + ' ' + viewDayEff + '/' + currentDay}</span>
      </div>
      <div className="tt-days" style={{display:'flex',gap:3,marginBottom:'0.6rem'}}>{/* table_timetravel_v1 */}
        {Array.from({length: divisionPlayoff ? 16 : 15},(_,k)=>k+1).map(d => (
          <div key={d} onClick={() => d <= dayMax && setDay(d)}
            style={{flex:1,height:20,borderRadius:2,display:'flex',alignItems:'center',justifyContent:'center',
              cursor: d > dayMax ? 'default' : 'pointer', opacity: d > dayMax ? 0.35 : 1,
              background: d === viewDayEff ? '#b8860b' : d <= currentDay ? 'rgba(184,134,11,0.18)' : 'var(--bg2)',
              border: '1px solid ' + (d === viewDayEff ? '#b8860b' : d <= dayMax ? 'rgba(184,134,11,0.4)' : 'var(--border)'),
              fontFamily:'monospace',fontSize:'0.55rem',fontWeight:700,color: d === viewDayEff ? '#1a120a' : 'var(--mid)'}}>
            {d === 16 ? t3(lang, '\u041F-\u041E', 'P-O', '\u512A\u6C7A') : d}
          </div>
        ))}
      </div>
      {viewDayEff === 16 && divisionPlayoff?.bouts?.length > 0 && (
        <div style={{marginBottom:'1rem',padding:'0.7rem 0.9rem',background:'var(--card)',border:'1px solid #b8860b',borderRadius:4}}>  {/* tt_playoff_panel_v1 */}
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'#b8860b',marginBottom:6}}>{t3(lang, '\u041F\u043B\u0435\u0439-\u043E\u0444 \u0437\u0430 \u044E\u0448\u043E', 'Yusho playoff', '\u512A\u52DD\u6C7A\u5B9A\u6226')}</div>
          {divisionWinner && (
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8,paddingBottom:8,borderBottom:'1px solid var(--border)'}}>  {/* tt_playoff_champion_v1 */}
              <span style={{fontSize:'1.1rem'}}>{String.fromCodePoint(0x1F3C6)}</span>
              <span style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--mid)'}}>{t3(lang, '\u042E\u0448\u043E', 'Yusho', '\u512A\u52DD')}:</span>
              <span style={{fontWeight:800,fontSize:'0.95rem',color:'#b8860b'}}>{divisionWinner.name || divisionWinner}</span>
            </div>
          )}
          {divisionPlayoff.bouts.map((b, i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontFamily:'monospace',fontSize:'0.72rem',padding:'3px 0'}}>
              <span style={{fontWeight: String(b.winnerId) === String(b.eastId) ? 800 : 400,color: String(b.winnerId) === String(b.eastId) ? '#1a6b5c' : 'var(--ink)'}}>{lang === 'uk' ? ukrName(b.east) : b.east}</span>
              <span style={{color:'var(--light)',fontSize:'0.6rem'}}>vs</span>
              <span style={{fontWeight: String(b.winnerId) === String(b.westId) ? 800 : 400,color: String(b.winnerId) === String(b.westId) ? '#1a6b5c' : 'var(--ink)'}}>{lang === 'uk' ? ukrName(b.west) : b.west}</span>
              {b.kimarite && <span style={{color:'var(--mid)',fontSize:'0.6rem'}}>{'\u00b7'} {b.kimarite}</span>}
              {!b.winnerId && <span style={{color:'#b8860b',fontSize:'0.6rem'}}>{t3(lang, '\u0442\u0440\u0438\u0432\u0430\u0454...', 'in progress...', '\u9032\u884C\u4E2D')}</span>}
            </div>
          ))}
        </div>
      )}
      <div className="anim-3 desktop-table" style={{overflowX:'auto',marginBottom:'1rem'}}>
        <table className="tt-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
          <thead>
            <tr style={{borderBottom:'2px solid var(--ink)'}}>
              {headers.map(h => (
                <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 0.75rem',textAlign:'center',fontWeight:500 /* tt_compact_v1 tt_th_center */}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => {
              const rankColors = ['#b8860b','#888','#a0522d']
              const bgColor = i < 3 ? rankColors[i] : 'var(--bg2)'
              const textColor = i < 3 ? '#fff' : 'var(--mid)'
              const barColor = i===0?'#1a6b5c':i===1?'#1a4a7a':i===2?'#c0392b':'#888'
              const statusLabel = r.status === 'lead'
                ? ((viewDayEff >= 15 && divisionWinner && (String(divisionWinner._id ?? divisionWinner.id ?? divisionWinner) === String(r._id) || divisionWinner.name === r.name)) ? /* tt_yusho_day_gate_v1 */ t3(lang, '\u044E\u0448\u043E ' , 'yusho ', '\u512A\u52DD ') + String.fromCodePoint(0x1F3C6) : (isMobileTT ? t3(lang, '\u041B', 'L', '\u30C8') : t3(lang, 'лідер', 'leader', 'トップ')))  /* tt_mob_final_v1 division_winner_v1 */
                : r.status === 'chase'
                ? (isMobileTT ? t3(lang, '\u041F', 'C', '\u8FFD') : t3(lang, 'переслідувач', 'chaser', '追走'))
                : (!r.kyujo && (r.yushoChance ?? 1) <= 0)
                ? (r.eliminatedDay
                    ? (isMobileTT ? t3(lang, `\u0414-${r.eliminatedDay}`, `D-${r.eliminatedDay}`, `\u8131${r.eliminatedDay}`) : t3(lang, `вибув (д. ${r.eliminatedDay})`, `out (d. ${r.eliminatedDay})`, `脱落（${r.eliminatedDay}日目）`))
                    : (isMobileTT ? t3(lang, '\u0412', 'O', '\u8131') : t3(lang, 'вибув', 'out', '脱落')))  /* tt_elim_day_v1 tt_mob_elim_v1 */
                : `${r.wins}–${r.losses}`
              const isOut = !r.kyujo && (r.yushoChance ?? 1) <= 0 && r.status !== 'lead' && r.status !== 'chase'
              return (
                <tr key={r._id} className={[isFav(r._id) ? 'fav-row' : '', waveIds.has(r._id) ? 'result-wave' : ''].filter(Boolean).join(' ') || undefined} style={{borderBottom:'1px solid var(--border)'}}>
                  <td style={{padding:'0.35rem 0.75rem',textAlign:'center',minWidth:90}}>
                    <TodayCell record={r.record} currentDay={viewDayEff} t={t} lang={lang}/>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace'}}>{i+1}</div>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <FlagName id={r._id} name={r.name} />
                    {r.editorialNote && <div className="tt-note" style={{fontSize:'0.65rem',color:'#b8860b',marginTop:2}}>{r.editorialNote[typeof lang !== 'undefined' ? lang : 'uk'] || r.editorialNote.uk /* ja_batch4b tt_note_mobile_v1 */}</div>} {/* badge_render_v1 */}
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',textAlign:'center'}}>{/* tt_rank_rec_center_v1 */}
                    <span style={{fontFamily:'monospace',fontSize:'0.62rem',background:rankColor(r.rankFull || r.rank) + '2e',padding:'2px 6px',borderRadius:2,color:rankColor(r.rankFull || r.rank),fontWeight:600,display:'inline-block'}}>{shortRank(r.rank, lang)}</span>  {/* tt_shortrank_v1 */}
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',textAlign:'center' /* ovr_col_tt_v2 */}}><OvrBadge id={r._id} size="lg" /></td>
                  <td style={{padding:'0.35rem 0.75rem',fontFamily:'monospace',textAlign:'center',whiteSpace:'nowrap',
                    fontWeight: (r.wins >= ((r.wins + r.losses <= 7 && currentDay > 8) ? 4 : 8) || r.losses >= ((r.wins + r.losses <= 7 && currentDay > 8) ? 4 : 8)) ? 700 : 500,
                    color: r.wins >= ((r.wins + r.losses <= 7 && currentDay > 8) ? 4 : 8) ? '#1a6b5c' : r.losses >= ((r.wins + r.losses <= 7 && currentDay > 8) ? 4 : 8) ? '#c0392b' : 'var(--ink)'}}>{r.wins}–{r.losses}</td>{/* tt_rank_rec_center_v1 tt_rec_nowrap_v1 */}
                  <td style={{padding:'0.35rem 0.75rem'}}>
                    <MatchDots record={r.record} currentDay={currentDay} />
                  </td>
                  <td style={{padding:'0.35rem 0.75rem',textAlign:'center'}}>{/* tt_status_center_v1 */}
                    <span className={isOut ? 'status-out' : undefined} style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'3px 8px',borderRadius:2,display:'inline-block',
                      background:r.status==='lead'?'#b8860b':r.status==='chase'?'#1a6b5c':'var(--bg2)', /* tt_status_colors_v1 */
                      color:r.status==='lead'?'#fff':r.status==='chase'?'#fff':'var(--mid)'}}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{padding:'0.35rem 0.75rem'}} className="tt-chancecell">
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div className="tt-chancebar" style={{flex:1,height:5,background:'var(--bg2)'}}>
                        <div style={{height:'100%',width:`${Math.min(r.yushoChance,100)}%`,background:barColor}} />
                      </div>
                      <span style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:600,color:barColor,minWidth:40,textAlign:'right'}}>{r.yushoChance}%</span>
                    </div>
                  </td>
                             </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
