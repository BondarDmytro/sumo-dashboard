'use client'
/* division_gate_v1: pry division !== Makuuchi refetch povnoho paketa z /api/basho-division */
import { useState, useEffect } from 'react'
import { useBashoFilter, CURRENT_BASHO } from './BashoFilterContext'
import { useLang } from './LangProvider'
import TournamentStatus from './TournamentStatus'
import { computeStandings } from '../lib/chanceEngine' /* ts_timetravel_v1 */
import TournamentTabsWrapper from './TournamentTabsWrapper'
import TournamentFooter from './TournamentFooter' /* footer_division_v1 */

function t3(lang, uk, en, ja) { return lang === 'en' ? en : lang === 'ja' ? ja : uk }

export default function DivisionDataGate({ makuuchi }) {
  const [tableDay, setTableDay] = useState(null)  /* ts_timetravel_v1 */
  const { division, selBasho } = useBashoFilter()
  const { lang } = useLang()
  const [divData, setDivData] = useState(null)
  const [loading, setLoading] = useState(false)
  const isCurrent = selBasho === CURRENT_BASHO

  useEffect(() => {
    if (division === 'Makuuchi') { setDivData(null); return }
    let dead = false
    setLoading(true)
    fetch(`/api/basho-division?division=${division}`)
      .then(r => r.json())
      .then(d => { if (!dead) { setDivData(d.error ? null : d); setLoading(false) } })
      .catch(() => { if (!dead) { setDivData(null); setLoading(false) } })
    return () => { dead = true }
  }, [division])

  useEffect(() => {  /* gate_poll_v1: refetch paketa kozhni 120s u vikni boiv */
    if (!division || division === 'Makuuchi') return
    const tick = () => {
      const jm = (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 540) % 1440
      if (jm < 480 || jm > 1125) return
      fetch(`/api/basho-division?division=${division}`)
        .then(r => r.json())
        .then(d => { if (d && !d.error) setDivData(d) })
        .catch(() => {})
    }
    const t = setInterval(tick, 120000)
    return () => clearInterval(t)
  }, [division])

  let view = makuuchi
  if (division !== 'Makuuchi' && divData && isCurrent) {
    const rikishi = divData.rikishi || []
    const contenders = rikishi.filter(r => r.yushoChance > 0)
      .sort((a,b) => b.wins - a.wins || b.yushoChance - a.yushoChance || (a.rankValue||999) - (b.rankValue||999))
    view = {
      h2h: [],  /* footer_division_v1: H2H rakhuietsia serverom lyshe dlia Makuuchi */
      leaders: divData.leaders || [], chasers: divData.chasers || [],
      currentDay: divData.currentDay, maxWins: divData.maxWins,
      contenders, allRikishi: rikishi,
      kyujoCount: rikishi.filter(r => r.kyujo).length,
      isFinished: divData.isFinished || false,
      winner: divData.winner || null,  /* division_winner_v1 */
      playoff: divData.playoff || null,
      specialPrizes: divData.specialPrizes || [], yushoData: divData.yushoData || [],
    }
  }

  return (
    <>
      {loading && division !== 'Makuuchi' && (
        <div style={{padding:'0.6rem 0',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>
          {t3(lang,'\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0434\u0438\u0432\u0456\u0437\u0456\u043e\u043d\u0443...','Loading division...','\u8aad\u307f\u8fbc\u307f\u4e2d...')}
        </div>
      )}
      {(() => {
        const live = !tableDay || tableDay >= view.currentDay || !(view.allRikishi || []).length
        const st = live ? null : computeStandings(view.allRikishi, tableDay)
        const L = live ? view.leaders : st.leaders
        const C = live ? view.chasers : st.chasers
        const cnt = live ? null : st.rikishi.filter(r => !r.kyujo && (r.yushoChance ?? 0) > 0).length
        const elim = live ? null : st.rikishi.filter(r => !r.kyujo && (r.yushoChance ?? 0) <= 0).length
        const dLim = tableDay ?? view.currentDay  /* ts_kimarite_v1 */
        const kimCounts = {}
        let kimTotal = 0
        ;(view.allRikishi || []).forEach(r => (r.record || []).slice(0, dLim).forEach(m => {
          if (m && m.result === 'win' && m.kimarite && m.kimarite !== 'fusen') { kimCounts[m.kimarite] = (kimCounts[m.kimarite] || 0) + 1; kimTotal++ }
        }))
        const kimTop = Object.entries(kimCounts).sort((a, b) => b[1] - a[1])[0]
        const topKimarite = kimTop && kimTotal ? { name: kimTop[0], count: kimTop[1], pct: Math.round(kimTop[1] / kimTotal * 100) } : null
        return <TournamentStatus
        leaders={L} chasers={C} currentDay={tableDay ?? view.currentDay}
        maxWins={live ? view.maxWins : st.maxWins} kyujoCount={view.kyujoCount} topKimarite={topKimarite}
        contendersCount={cnt ?? (view.allRikishi || view.contenders || []).filter(r => !r.kyujo && (r.yushoChance ?? 0) > 0).length} isFinished={view.isFinished}  /* gate_contenders_fix_v1 */
        eliminatedCount={elim ?? (view.allRikishi || []).filter(r => !r.kyujo && (r.yushoChance ?? 0) <= 0).length}  /* gate_eliminated_v1 */
      />
      })()}
      <TournamentTabsWrapper tableDay={tableDay} onTableDay={setTableDay} divisionWinner={view.winner} divisionPlayoff={view.playoff}
        contenders={view.contenders} currentDay={view.currentDay}
        allRikishi={view.allRikishi} isFinished={view.isFinished}
        specialPrizes={view.specialPrizes} yushoData={view.yushoData}
      />
      {isCurrent && (  /* footer_division_v1: futer zhyve v geiti - division-aware */
        <TournamentFooter contenders={view.contenders} h2h={view.h2h !== undefined && division !== 'Makuuchi' ? [] : makuuchi.h2h} allRikishi={view.allRikishi} />
      )}
    </>
  )
}
