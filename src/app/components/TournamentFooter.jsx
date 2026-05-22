'use client'

import { useLang } from './LangProvider'
import ChartWrapper from './ChartWrapper'
import H2HTable from './H2HTable'

export default function TournamentFooter({ contenders, h2h }) {
  const { lang } = useLang()

  return (
    <>
      <div className="anim-4" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {lang === 'en' ? 'Yusho probability chart' : 'Графік ймовірностей юшо'}
      </div>
      <div className="anim-4" style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
        <ChartWrapper rikishi={contenders.slice(0,10)} />
      </div>

      <div className="anim-5" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {lang === 'en' ? 'Head-to-head — this tournament (top contenders)' : 'Очні зустрічі — цей турнір (топ претенденти)'}
      </div>
      <div className="anim-5">
        <H2HTable rikishi={contenders.slice(0,8)} h2h={h2h} />
      </div>

      <div className="anim-6" style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
        {lang === 'en' ? (
          <><b style={{color:'var(--ink)'}}>Data:</b> sumo-api.com · updated every 5 minutes · <b style={{color:'var(--ink)'}}>Methodology:</b> current record (60%), rank (15%), schedule (15%), form (10%). Fusen (✦) — win by opponent withdrawal. Not a bet.</>
        ) : (
          <><b style={{color:'var(--ink)'}}>Дані:</b> sumo-api.com · оновлення кожні 5 хвилин · <b style={{color:'var(--ink)'}}>Методологія:</b> поточний рекорд (60%), ранг (15%), розклад (15%), форма (10%). Fusen (✦) — перемога через знімання суперника. Не є ставкою.</>
        )}
      </div>
    </>
  )
}