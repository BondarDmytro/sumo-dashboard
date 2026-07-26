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
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext' /* basho_filter_v2 */

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
    if (isCurrent || tab !== 'prizes') return
    let alive = true
    setArchPrize(null)
    fetch(`/api/basho-division?division=${division}&basho=${selBasho}`)
      .then(r => r.json())
      .then(d => { if (alive) setArchPrize(d) })
      .catch(() => {})
    return () => { alive = false }
  }, [isCurrent, tab, selBasho, division])

  const tabs = [
    { id: 'standings', label: t3(lang, 'Таблиця', 'Standings', '星取表') },
    ...(isCurrent && !isFinished && currentDay <= 15 ? [{
      id: 'torikumi',
      label: lang === 'ja' ? `${currentDay}日目の取組` : lang === 'en' ? `Day ${currentDay} schedule` : `Розклад дня ${currentDay}`
    }] : []),
    ...(isCurrent && !isFinished && currentDay < 15 ? [{
      id: 'torikumi2',  /* torikumi2_v1 */
      label: lang === 'ja' ? `${currentDay+1}日目の取組` : lang === 'en' ? `Day ${currentDay+1} schedule` : `Розклад дня ${currentDay+1}`
    }] : []),
    ...(isCurrent ? [{ id: 'board', label: t3(lang, 'Лідерборд', 'Leaderboard', 'ランキング') }] : []),  /* pickem_board_tab_v1 */
    ...(true /* arch_prizes_v1 */ ? [{ id: 'prizes', label: t3(lang, 'Призові', 'Prize money', '賞金') }] : []),
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
                {v === 'list' ? t3(lang,'\u0421\u043f\u0438\u0441\u043e\u043a','List','\u4e00\u89a7') : t3(lang,'\u041f\u043e \u043f\u0435\u0440\u0435\u043c\u043e\u0433\u0430\u0445','By wins','\u6210\u7e3e\u5225')}
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
      {!isCurrent && tab === 'prizes' && (  /* arch_prizes_v1 */
        archPrize && archPrize.rikishi
          ? <PrizeMoney rikishi={archPrize.rikishi.filter(r => !r.kyujo)} specialPrizes={archPrize.specialPrizes || []} yushoData={archPrize.yushoData || []} isFinished={true} />
          : <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>{t3(lang, 'Завантаження…', 'Loading…', '読み込み中…')}</div>
      )}
      {!isCurrent && <PrevBashoDynamics bashoId={selBasho} />}  {/* basho_filter_v1 */}
    </>
  )
}