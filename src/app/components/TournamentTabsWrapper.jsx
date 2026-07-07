'use client' /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useState } from 'react'
import { useLang } from './LangProvider'
import TournamentTable from './TournamentTable'
import TorikumiView from './TorikumiView'
import PrizeMoney from './PrizeMoney'
import { useBios } from './BiosProvider'
import PrevBashoDynamics from './PrevBashoDynamics' /* prev_dynamics_tab_v1 */
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext' /* basho_filter_v2 */

export default function TournamentTabsWrapper({ contenders, currentDay, allRikishi = [], isFinished = false, specialPrizes = [], yushoData = [] }) {
  const [tab, setTab] = useState('standings')
  const { selBasho } = useBashoFilter()  /* basho_filter_v2 */
  const isCurrent = selBasho === CURRENT_BASHO
  const { lang } = useLang()
  const bios = useBios()

  const tabs = [
    { id: 'standings', label: t3(lang, 'Таблиця', 'Standings', '星取表') },
    ...(isCurrent && !isFinished && currentDay <= 15 ? [{
      id: 'torikumi',
      label: lang === 'ja' ? `${currentDay}日目の取組` : lang === 'en' ? `Day ${currentDay} schedule` : `Розклад дня ${currentDay}`
    }] : []),
    ...(isCurrent ? [{ id: 'prizes', label: t3(lang, 'Призові', 'Prize money', '賞金') }] : []),
  ]  /* basho_filter_v1 */

  return (
    <>
      <div style={{display:'flex',gap:1,marginBottom:'1.2rem',borderBottom:'2px solid var(--border)'}}>
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
      {isCurrent && tab === 'standings' && <TournamentTable contenders={contenders} currentDay={currentDay} />}
      {isCurrent && tab === 'torikumi' && <TorikumiView currentDay={currentDay} bios={bios} rikishi={allRikishi} />}
      {isCurrent && tab === 'prizes' && <PrizeMoney rikishi={allRikishi.filter(r => !r.kyujo)} specialPrizes={specialPrizes} yushoData={yushoData} isFinished={isFinished} />}
      {!isCurrent && <PrevBashoDynamics bashoId={selBasho} />}  {/* basho_filter_v1 */}
    </>
  )
}