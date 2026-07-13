'use client'
import { t3 } from '../i18n' /* ja_batch1 */

import { useLang } from './LangProvider'
import ChartWrapper from './ChartWrapper'
import H2HTable from './H2HTable'

export default function TournamentFooter({ contenders, h2h, allRikishi = null }) {
  const { lang } = useLang()

  return (
    <>
      <div className="anim-4" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {t3(lang, 'Графік ймовірностей юшо', 'Yusho probability chart', '優勝確率チャート')}
      </div>
      <div className="anim-4" style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
        <ChartWrapper rikishi={allRikishi || contenders} />{/* chart_global_pct_v1 */}
      </div>

      <div className="anim-5" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {t3(lang, 'Очні зустрічі — цей турнір (топ претенденти)', 'Head-to-head — this tournament (top contenders)', '対戦成績 — 今場所（上位陣）')}
      </div>
      <div className="anim-5">
        <H2HTable rikishi={contenders.slice(0,10)} h2h={h2h} />  {/* h2h_top10_v1 */}
      </div>

      <div className="anim-6" style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
        {lang === 'ja' ? (
          <><b style={{color:'var(--ink)'}}>データ:</b> sumo-api.com · 60秒ごとに更新 · <b style={{color:'var(--ink)'}}>算出方法:</b> 現在の成績 (60%)、番付 (15%)、残り取組の難易度 (15%)、直近5日の調子 (10%)。不戦 (✦) — 相手の休場による勝ち。賭けではありません。</>
        ) : lang === 'en' ? (
          <><b style={{color:'var(--ink)'}}>Data:</b> sumo-api.com · updates every 60 seconds · <b style={{color:'var(--ink)'}}>Methodology:</b> current record (60%), rank (15%), remaining schedule difficulty (15%), recent form last 5 days (10%). Fusen (✦) — win by opponent withdrawal. Not a bet.</>
        ) : (  /* footer_ja_v1 */
          <><b style={{color:'var(--ink)'}}>Дані:</b> sumo-api.com · оновлення кожні 60 секунд · <b style={{color:'var(--ink)'}}>Методологія:</b> поточний рекорд (60%), ранг (15%), складність розкладу (15%), форма останніх 5 днів (10%). Fusen (✦) — перемога через знімання суперника. Не є ставкою.</>
        )}
      </div>
    </>
  )
}