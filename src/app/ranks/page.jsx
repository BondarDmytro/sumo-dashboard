/* auto_current_v3 */
'use client'
import { t3 } from '../i18n' /* ja_batch1 */

import RankForecast from '../components/RankForecast'
import { useLang } from '../components/LangProvider'
import { currentBashoId, bashoInfo } from '../lib/bashoCalendar' /* basho_labels_v2 */

export default function RanksPage() {
  const { lang } = useLang()

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          {bashoInfo(currentBashoId()).label[lang] /* ja_batch2 */}
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'0.4rem'}}>
          {t3(lang, 'Прогноз змін рангу', 'Rank Forecast', '番付予想')}
          <span style={{color:'#b8860b'}}>{t3(lang, " — Сан'яку", " — San'yaku", " — 三役")}</span>
        </h1>
        <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'2rem',lineHeight:1.6}}>
          {lang === 'en'
            ? "Forecast based on current results. Takes into account kadoban for Ozeki, ozeki promotion test (33 wins over 3 basho) for Sekiwake, and make-koshi for all ranks."
            : lang === 'ja' ? '現在の成績に基づく予想。大関の角番、関脇の大関取り（3場所で33勝）、全地位の負け越しを考慮。'  /* ja_gaps_v2 */
            : "Прогноз на основі поточних результатів. Враховує кадо-бан для Озекі, озекі-тест (33 перемоги за 3 башьо) для Секіваке, та маке-коші для всіх рангів."}
        </p>
        <RankForecast />
      </div>
    </main>
  )
}