'use client'

import { useState } from 'react'
import { useLang } from './LangProvider'
import TournamentTable from './TournamentTable'
import TorikumiView from './TorikumiView'
import { useBios } from './BiosProvider'

export default function TournamentTabsWrapper({ contenders, currentDay, allRikishi = [], isFinished = false }) {
  const [tab, setTab] = useState('standings')
  const { lang } = useLang()
  const bios = useBios()
  const nextDay = currentDay + 1

  const tabs = [
    { id: 'standings', label: lang === 'en' ? 'Standings' : 'Таблиця' },
    ...(!isFinished && currentDay <= 15 ? [{
      id: 'torikumi',
      label: lang === 'en' ? `Day ${currentDay} schedule` : `Розклад дня ${currentDay}`
    }] : []),
  ]

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
      {tab === 'standings' && <TournamentTable contenders={contenders} currentDay={currentDay} />}
      {tab === 'torikumi' && <TorikumiView currentDay={currentDay} bios={bios} rikishi={allRikishi} />}
    </>
  )
}