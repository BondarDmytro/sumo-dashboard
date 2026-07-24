'use client'
/* no_bet_all_langs_v1 */
import { t3 } from '../i18n' /* ja_batch1 */

import { useState } from 'react'
import { useLang } from './LangProvider'
import ChartWrapper from './ChartWrapper'
import H2HTable from './H2HTable'

export default function TournamentFooter({ contenders, h2h, allRikishi = null }) {
  const { lang } = useLang()
  const maxDay = Array.isArray(h2h) && h2h.length ? Math.max(...h2h.map(m => m.day || 1)) : 15  /* day_switch_v1 */
  const [viewDay, setViewDay] = useState(null)  /* null = poточний (maxDay) */
  const day = viewDay ?? maxDay
  const RESULTS_WIN_F = ['win', 'fusen win']  /* day_switch_v2 */
  const winsAt = (r, d) => (r.record || []).slice(0, d).filter(m => RESULTS_WIN_F.includes(m?.result)).length
  const topAtDay = (allRikishi && allRikishi.length)
    ? [...allRikishi].filter(r => !r.kyujo).sort((a, b) => winsAt(b, day) - winsAt(a, day)).slice(0, 10)
    : contenders.slice(0, 10)

  return (
    <>
      <div className="anim-4" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {t3(lang, 'Графік ймовірностей юшо', 'Yusho probability chart', '優勝確率チャート')}
      </div>
      <div className="anim-4" style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
        <ChartWrapper highlightDay={day} rikishi={allRikishi || contenders} />{/* chart_global_pct_v1 */}
      </div>

      {Array.isArray(h2h) && h2h.length > 0 && (<>{/* h2h_hide_empty_v1: dlia ne-Makuuchi h2h porozhnii - blok khovaietsia */}
      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginTop:'0.5rem',marginBottom:'1rem',alignItems:'center'}}>  {/* day_switch_v1: spilnyi peremykach dniv */}
        <span style={{fontFamily:'monospace',fontSize:'0.56rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--mid)',marginRight:6}}>{t3(lang, 'День', 'Day', String.fromCharCode(0x65E5))}</span>
        {Array.from({length: maxDay}, (_, i) => i + 1).map(d => (
          <button key={d} onClick={() => setViewDay(d === maxDay ? null : d)} style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'0.2rem 0.5rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: day === d ? '#8a6a00' : 'var(--bg2)',color: day === d ? '#fff' : 'var(--mid)'}}>{d}</button>
        ))}
      </div>
      <div className="anim-5" style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2rem'}}>
        {t3(lang, 'Очні зустрічі — цей турнір (топ претенденти)', 'Head-to-head — this tournament (top contenders)', '対戦成績 — 今場所（上位陣）')}
      </div>
      <div className="anim-5">
        <H2HTable rikishi={topAtDay} h2h={h2h} maxDay={day} />  {/* h2h_top10_v1 day_switch_v1 */}
      </div>
      </>)}

      <div className="anim-6" style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
        {lang === 'ja' ? (
          <><b style={{color:'var(--ink)'}}>データ:</b> sumo-api.com · 60秒ごとに更新 · <b style={{color:'var(--ink)'}}>算出方法:</b> 過去36場所(2020–2026)のデータで学習した統計モデル。成績・首位との差・番付・直近5日の調子を考慮。不戦 (✦) — 相手の休場による勝ち。無料の統計ファンサイトです。</>
        ) : lang === 'en' ? (
          <><b style={{color:'var(--ink)'}}>Data:</b> sumo-api.com · updates every 60 seconds · <b style={{color:'var(--ink)'}}>Methodology:</b> logistic model trained on 36 basho (2020–2026): record, gap to leader, rank, 5-day form. Day-10 top-1 accuracy ≈ 50–60% (holdout). Fusen (✦) — win by opponent withdrawal. Free statistical fan site.</>
        ) : (  /* footer_ja_v1 + footer_model_v1 */
          <><b style={{color:'var(--ink)'}}>Дані:</b> sumo-api.com · оновлення кожні 60 секунд · <b style={{color:'var(--ink)'}}>Методологія:</b> логістична модель, навчена на 36 басьо (2020–2026): рекорд, відставання від лідера, ранг, форма 5 днів. Точність top-1 на дні 10 ≈ 50–60% (holdout). Fusen (✦) — перемога через знімання суперника. Безкоштовний статистичний фан-сайт.</>
        )}
      </div>
    </>
  )
}