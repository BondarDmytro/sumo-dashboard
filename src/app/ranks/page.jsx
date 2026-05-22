'use client'

import RankForecast from '../components/RankForecast'
import { useLang } from '../components/LangProvider'

export default function RanksPage() {
  const { lang } = useLang()

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          {lang === 'en' ? 'Natsu Basho 2026' : 'Натсу Басьо 2026'}
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.4rem'}}>
          {lang === 'en' ? 'Rank Forecast' : 'Прогноз змін рангу'}
          <span style={{color:'#b8860b'}}>{lang === 'en' ? " — San'yaku" : " — Сан'яку"}</span>
        </h1>
        <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'2rem',lineHeight:1.6}}>
          {lang === 'en'
            ? "Forecast based on current results. Takes into account kadoban for Ozeki, ozeki promotion test (33 wins over 3 basho) for Sekiwake, and make-koshi for all ranks."
            : "Прогноз на основі поточних результатів. Враховує кадо-бан для Озекі, озекі-тест (33 перемоги за 3 басьо) для Секіваке, та маке-коші для всіх рангів."}
        </p>
        <RankForecast />
      </div>
    </main>
  )
}