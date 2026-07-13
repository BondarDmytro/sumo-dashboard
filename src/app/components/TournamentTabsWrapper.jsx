'use client' /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useState } from 'react'
import { useLang } from './LangProvider'
import TournamentTable from './TournamentTable'
import CompactGrid from './CompactGrid' /* list_kyujo_v1 */
import TorikumiView from './TorikumiView'
import PrizeMoney from './PrizeMoney'
import { useBios } from './BiosProvider'
import PrevBashoDynamics from './PrevBashoDynamics' /* prev_dynamics_tab_v1 */
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext' /* basho_filter_v2 */

export default function TournamentTabsWrapper({ contenders, currentDay, allRikishi = [], isFinished = false, specialPrizes = [], yushoData = [] }) {
  const [tab, setTab] = useState('standings')
  const { selBasho, division } = useBashoFilter()  /* basho_filter_v2 */ /* division_wire_v1 */
  const [liveView, setLiveView] = useState('list')  /* live_dynamics_v1 */
  const isCurrent = selBasho === CURRENT_BASHO
  const { lang } = useLang()
  const bios = useBios()

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
    ...(isCurrent ? [{ id: 'prizes', label: t3(lang, 'Призові', 'Prize money', '賞金') }] : []),
  ]  /* basho_filter_v1 */

  return (
    <>
      <div className="tabs-row" style={{display:'flex',gap:1,marginBottom:'1.2rem',borderBottom:'2px solid var(--border)'}}>  {/* tabs_scroll_v1 */}
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:'0.5rem 1.25rem',
            fontFamily:'monospace',fontSize:'0.72rem',
            letterSpacing:'0.1em',textTransform:'uppercase',
            background:'transparent',border:'none',
            color: tab === t.id ? 'var(--ink)' : 'var(--mid)',
            borderBottom: tab === t.id ? '2px solid #b8860b' : '2px solid transparent',
            marginBottom:-2,cursor:'pointer',
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
            {allRikishi?.some(r => r.kyujo) && <CompactGrid items={allRikishi.filter(r => r.kyujo)} isKyujo currentDay={currentDay} />}
            <TournamentTable contenders={contenders} currentDay={currentDay} allRikishi={allRikishi} />
          </>)}
          {liveView === 'wins' && <PrevBashoDynamics bashoId={CURRENT_BASHO} liveDay={currentDay} division={division} />}
        </>
      )}
      {isCurrent && tab === 'torikumi' && <TorikumiView division={division} currentDay={currentDay} bios={bios} rikishi={allRikishi} />}
      {isCurrent && tab === 'torikumi2' && <TorikumiView division={division} currentDay={currentDay+1} bios={bios} rikishi={allRikishi} />}  {/* torikumi2_v1 */}
      {isCurrent && tab === 'prizes' && <PrizeMoney rikishi={allRikishi.filter(r => !r.kyujo)} specialPrizes={specialPrizes} yushoData={yushoData} isFinished={isFinished} />}
      {!isCurrent && <PrevBashoDynamics bashoId={selBasho} />}  {/* basho_filter_v1 */}
    </>
  )
}