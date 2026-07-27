'use client' /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useState, useEffect } from 'react'
import { useLang } from './LangProvider'
import TournamentTable from './TournamentTable'
import CompactGrid from './CompactGrid' /* list_kyujo_v1 */
import TorikumiView from './TorikumiView'
import PrizeMoney from './PrizeMoney'
import { useBios } from './BiosProvider'
import PrevBashoDynamics from './PrevBashoDynamics' /* prev_dynamics_tab_v1 */
import PickemBoard from './PickemBoard' /* pickem_board_tab_v1 */
import TournamentFooter from './TournamentFooter'  /* arch_footer_v1 */
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext' /* basho_filter_v2 */
import { displayName, displayRank, bashoInfo } from '../lib/bashoCalendar'  /* arch_standings_v1 */

export default function TournamentTabsWrapper({ contenders, currentDay, allRikishi = [], isFinished = false, specialPrizes = [], yushoData = [], tableDay = null, onTableDay = null, divisionWinner = null, divisionPlayoff = null }) {
  const { setDivision } = useBashoFilter()  /* div_from_url_v1 */
  const [tab, setTab] = useState('standings')
  useEffect(() => {  /* url_listen_v1: chytannia na mount + slukhannia live-nav podii (push z tiiei zh storinky) */
    const apply = () => {
      const sp = new URLSearchParams(window.location.search)
      if (sp.get('tab') === 'torikumi') setTab('torikumi')
      const d = sp.get('div')
      if (['Makuuchi','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi'].includes(d)) setDivision(d)
    }
    apply()
    window.addEventListener('livenav', apply)
    return () => window.removeEventListener('livenav', apply)
  }, [])
  const { selBasho, division } = useBashoFilter()  /* basho_filter_v2 */ /* division_wire_v1 */
  const [liveView, setLiveView] = useState('list')  /* live_dynamics_v1 */
  const [boardUid, setBoardUid] = useState(null)  /* pickem_board_tab_v1 */
  useEffect(() => { try { setBoardUid(localStorage.getItem('dohyo_pickem_uid')) } catch {} }, [])
  const isCurrent = selBasho === CURRENT_BASHO
  const { lang } = useLang()
  const bios = useBios()
  const [archPrize, setArchPrize] = useState(null)  /* arch_prizes_v1 */
  useEffect(() => {  /* arch_prizes_v1: lazy-fetch arkhivnykh pryzovykh pry vidkrytti taby */
    if (isCurrent) return  /* arch_standings_v1: paket potriben i dlia standings */
    let alive = true
    setArchPrize(null)
    fetch(`/api/basho-division?division=${division}&basho=${selBasho}`)
      .then(r => r.json())
      .then(d => { if (alive) setArchPrize(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [isCurrent, selBasho, division])  /* arch_standings_v1 */

  const tabs = [
    { id: 'standings', label: t3(lang, 'Таблиця', 'Standings', '星取表', 'Classement') },
    ...(isCurrent && !isFinished && currentDay <= 15 ? [{
      id: 'torikumi',
      label: lang === 'ja' ? `${currentDay}日目の取組` : lang === 'en' ? `Day ${currentDay} schedule` : `Розклад дня ${currentDay}`
    }] : []),
    ...(isCurrent && !isFinished && currentDay < 15 ? [{
      id: 'torikumi2',  /* torikumi2_v1 */
      label: lang === 'ja' ? `${currentDay+1}日目の取組` : lang === 'en' ? `Day ${currentDay+1} schedule` : `Розклад дня ${currentDay+1}`
    }] : []),
    ...(isCurrent ? [{ id: 'board', label: t3(lang, 'Лідерборд', 'Leaderboard', 'ランキング', 'Classement joueurs') }] : []),  /* pickem_board_tab_v1 */
    ...(true /* arch_prizes_v1 */ ? [{ id: 'prizes', label: t3(lang, 'Призові', 'Prize money', '賞金', 'Gains') }] : []),
  ]  /* basho_filter_v1 */

  return (
    <>
      <div className="tabs-row" style={{display:'flex',gap:1,marginBottom:'1.2rem',borderBottom:'2px solid var(--border)'}}>  {/* tabs_scroll_v1 */}
        {tabs.map(t => (
          <button key={t.id} className={"tab-btn" + (tab === t.id ? " tab-active" : "") + (t.id === 'board' ? " tab-board" : "") + (t.id === 'prizes' ? " tab-prizes" : "")} onClick={() => setTab(t.id)} style={{/* tabs_color_css_v1 */
            padding:'0.45rem 1.1rem',
            fontFamily:'monospace',fontSize:'0.72rem',
            letterSpacing:'0.1em',textTransform:'uppercase',
            cursor:'pointer',
          }}>
            {t.label}
          </button>
        ))}
      </div>
      {isCurrent && tab === 'standings' && (  /* live_dynamics_v1: peremykach Spysok | Po peremohakh dlia zhyvoho basho */
        <>
          <div style={{display:'flex',gap:6,marginBottom:'0.9rem'}}>
            {['list','wins'].map(v => (
              <button key={v} onClick={() => setLiveView(v)} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.35rem 0.9rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: liveView === v ? '#8a6a00' : 'var(--bg2)',color: liveView === v ? '#fff' : 'var(--mid)'}}>
                {v === 'list' ? t3(lang,'\u0421\u043f\u0438\u0441\u043e\u043a','List','\u4e00\u89a7', 'Liste') : t3(lang,'\u041f\u043e \u043f\u0435\u0440\u0435\u043c\u043e\u0433\u0430\u0445','By wins','\u6210\u7e3e\u5225', 'Par victoires')}
              </button>
            ))}
          </div>
          {liveView === 'list' && (<>{/* list_kyujo_v1 */}
            {allRikishi?.some(r => r.kyujo) && <div className="kyujo-strip"><CompactGrid items={allRikishi.filter(r => r.kyujo)} isKyujo currentDay={currentDay} /></div>}{/* kyujo_hscroll_v1 */}
            <TournamentTable contenders={contenders} currentDay={currentDay} allRikishi={allRikishi} extViewDay={tableDay} onDayChange={onTableDay} divisionWinner={divisionWinner} divisionPlayoff={divisionPlayoff} />  {/* division_winner_v1 */}  {/* ts_timetravel_v1 */}
          </>)}
          {liveView === 'wins' && <PrevBashoDynamics bashoId={CURRENT_BASHO} liveDay={currentDay} division={division} />}
        </>
      )}
      {isCurrent && tab === 'torikumi' && <TorikumiView division={division} currentDay={currentDay} bios={bios} rikishi={allRikishi} pickemScore={true} bashoId={CURRENT_BASHO} />}{/* pickem_score_v1: potochnyi den - read-only rakhunok */}
      {isCurrent && tab === 'torikumi2' && <TorikumiView division={division} currentDay={currentDay+1} bios={bios} rikishi={allRikishi} pickem={true} bashoId={CURRENT_BASHO} />}{/* pickem_panel_v1 */}  {/* torikumi2_v1 */}
      {isCurrent && tab === 'board' && <PickemBoard bashoId={CURRENT_BASHO} currentDay={currentDay} myUid={boardUid} inline={true} />}{/* pickem_board_tab_v1 */}
      {isCurrent && tab === 'prizes' && <PrizeMoney rikishi={allRikishi.filter(r => !r.kyujo)} specialPrizes={specialPrizes} yushoData={yushoData} isFinished={isFinished} />}
      {!isCurrent && tab === 'standings' && (  /* arch_standings_v1 */
        archPrize && archPrize.rikishi
          ? (() => {
              const arkAll = archPrize.rikishi
              const arkCont = arkAll.filter(r => r.yushoChance > 0).sort((a,b) => b.wins - a.wins || b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
              const w = archPrize.winner
              const wid = w ? String(w._id || w.id || '') : ''
              return (<>
                {w && (
                  <div style={{background:'var(--bg2)',border:'2px solid #b8860b',borderRadius:4,marginBottom:'1.2rem',position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',right:'-0.02em',top:'-0.1em',fontSize:'clamp(4rem,10vw,8rem)',fontWeight:800,opacity:0.08,lineHeight:1,pointerEvents:'none',color:'#b8860b'}}>{String.fromCodePoint(0x1F3C6)}</div>
                    <div style={{display:'flex',flexDirection:'row',minHeight:180}}>
                      <img src={'/rikishi/' + wid + '.webp'} alt={w.name} style={{width:'clamp(100px,22%,180px)',minHeight:'100%',objectFit:'cover',objectPosition:'top',display:'block',flexShrink:0}} onError={e=>{e.target.style.display='none'}} />
                      <div style={{position:'relative',zIndex:1,flex:1,minWidth:0,display:'flex',flexDirection:'column',justifyContent:'center',padding:'1rem 1.25rem',gap:'0.6rem'}}>
                        <div style={{fontFamily:'monospace',fontSize:'0.58rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#b8860b',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {bashoInfo(selBasho).label[lang] + ' \u2014 ' + t3(lang, '\u042E\u0448\u043E', 'Yusho', '\u512A\u52DD', 'Yusho')}
                        </div>
                        <div>
                          <div style={{fontWeight:800,fontSize:'clamp(1.1rem,4vw,2.2rem)',lineHeight:1.1,color:'var(--ink)',wordBreak:'break-word'}}>
                            {(bios[wid]?.country?.flag || '') + ' '}{displayName(w, lang)}
                          </div>
                          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginTop:6}}>{displayRank(w.rankFull || w.rank, lang)}</div>
                        </div>
                        <div style={{background:'var(--card)',padding:'0.5rem 1rem',borderRadius:2,border:'1px solid var(--border)',display:'inline-block',alignSelf:'flex-start'}}>
                          <div style={{fontFamily:'Georgia,serif',fontSize:'clamp(1.4rem,5vw,1.8rem)',fontWeight:800,color:'#b8860b',lineHeight:1}}>{w.wins}{'\u2013'}{w.losses}</div>
                          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginTop:4,textTransform:'uppercase',letterSpacing:'0.1em'}}>{t3(lang, '\u0424\u0456\u043D\u0430\u043B\u044C\u043D\u0438\u0439 \u0440\u0435\u043A\u043E\u0440\u0434', 'Final record', '\u6700\u7D42\u6210\u7E3E', 'Bilan final')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <TournamentTable contenders={arkCont} currentDay={archPrize.currentDay || 15} allRikishi={arkAll} divisionWinner={w} divisionPlayoff={archPrize.playoff} />
                <TournamentFooter contenders={arkCont} h2h={archPrize.h2h || []} allRikishi={arkAll} />  {/* arch_footer_v1 */}
              </>)
            })()
          : <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>{t3(lang, '\u0417\u0430\u0432\u0430\u043D\u0442\u0430\u0436\u0435\u043D\u043D\u044F\u2026', 'Loading\u2026', '\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026', 'Chargement\u2026')}</div>
      )}
      {!isCurrent && tab === 'prizes' && (  /* arch_prizes_v1 */
        archPrize && archPrize.rikishi
          ? <PrizeMoney rikishi={archPrize.rikishi.filter(r => !r.kyujo)} specialPrizes={archPrize.specialPrizes || []} yushoData={archPrize.yushoData || []} isFinished={true} />
          : <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>{t3(lang, 'Завантаження…', 'Loading…', '読み込み中…', 'Chargement…')}</div>
      )}
    </>
  )
}
/* fr_batch4_ttw_v1 */
