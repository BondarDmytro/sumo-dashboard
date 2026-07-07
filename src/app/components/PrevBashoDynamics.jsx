'use client' /* ja_batch2_t */
// Динаміка попереднього басьо по днях: слайдер дня 1-15 (+плей-оф),
// повна таблиця всіх учасників зі станом W-L на обраний день. prev_dynamics_v1
import { useEffect, useState, useMemo } from 'react'
import { useLang } from './LangProvider'
import { displayRank, displayName, bashoInfo } from '../lib/bashoCalendar'
import CompactGrid from './CompactGrid' /* dyn_compactgrid_v1 */

const WIN = ['win', 'fusen win']
const LOSS = ['loss', 'fusen loss']

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

export default function PrevBashoDynamics({ bashoId }) {
  const { lang } = useLang()
  const bi = bashoInfo(bashoId)
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [day, setDay] = useState(15)
  const [view, setView] = useState('groups')  /* groups_default_v1 */      /* dyn_views_v1: list | groups */
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let alive = true
    Promise.all([
      fetch('https://sumo-api.com/api/basho/' + bashoId + '/banzuke/Makuuchi').then(r => r.json()),
      fetch('https://sumo-api.com/api/basho/' + bashoId).then(r => r.json()).catch(() => null),
    ]).then(([banzuke, info]) => { if (alive) setData({ banzuke, info }) })
      .catch(e => { if (alive) setErr(String(e)) })
    return () => { alive = false }
  }, [bashoId])

  // Кумулятивні W-L по днях для всіх рікіші
  const rows = useMemo(() => {
    if (!data) return []
    const all = [...(data.banzuke.east || []), ...(data.banzuke.west || [])]
    return all.map(r => {
      const rec = r.record || []
      const cum = [] // cum[d-1] = {w, l, res}
      let w = 0, l = 0
      for (let d = 0; d < 15; d++) {
        const m = rec[d]
        let res = '-'
        if (m) {
          if (WIN.includes(m.result)) { w++; res = 'w' }
          else if (LOSS.includes(m.result)) { l++; res = 'l' }
          else if (m.result === 'absent') res = 'a'
        }
        cum.push({ w, l, res })
      }
      return { id: r.rikishiID, name: r.shikonaEn, nameJp: r.shikonaJp, rank: r.rank,  /* ja_names_sweep_v1 */ rankValue: r.rankValue || 999, cum, rawRecord: rec }
    })
  }, [data])

  const dayRows = useMemo(() => {
    const list = rows.map(r => ({ ...r, w: r.cum[day - 1].w, l: r.cum[day - 1].l, res: r.cum[day - 1].res }))
    list.sort((a, b) => b.w - a.w || a.l - b.l || a.rankValue - b.rankValue)
    return list
  }, [rows, day])

  const kyujoNow = dayRows.filter(r => r.res === 'a')  /* dyn_kyujo_v2: absent у обраний день = кюджо */
  const activeNow = dayRows.filter(r => r.res !== 'a')
  const maxW = activeNow.length ? activeNow[0].w : 0
  const leaders = activeNow.filter(r => r.w === maxW && r.w > 0)

  // Хроніка лідерів по днях
  const timeline = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const d = i + 1
      let top = -1
      rows.forEach(r => { if (r.cum[i].w > top) top = r.cum[i].w })
      const names = rows.filter(r => r.cum[i].w === top && top > 0).map(r => r.name)
      return { day: d, top, names }
    })
  }, [rows])

  const yusho = data?.info?.yusho?.find?.(y => y.type === 'Makuuchi') || null
  const playoff = data?.info?.playoff || null

  if (err) return <div style={{ padding: '2rem', color: 'var(--mid)', fontFamily: 'monospace', fontSize: '0.72rem' }}>API error: {err}</div>
  if (!data) return <div style={{ padding: '2rem', color: 'var(--mid)', fontFamily: 'monospace', fontSize: '0.72rem' }}>{t3(lang, 'Завантаження…', 'Loading…', '読み込み中…')}</div>

  const label = lang === 'en' ? bi.label.en : lang === 'ja' ? bi.label.ja : bi.label.uk

  return (
    <div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--mid)', margin: '1rem 0 0.75rem' }}>
        {label} — {t3(lang, 'динаміка турніру', 'tournament dynamics', '優勝争いの推移')}
      </div>

      {/* Слайдер дня */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setDay(d => Math.max(1, d - 1))} disabled={day <= 1}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 2, width: 30, height: 30, cursor: day <= 1 ? 'default' : 'pointer', opacity: day <= 1 ? 0.4 : 1 }}>‹</button>
        <input type="range" min={1} max={15} value={day} onChange={e => setDay(parseInt(e.target.value, 10))} style={{ flex: 1, minWidth: 160, accentColor: '#b8860b' }} />
        <button onClick={() => setDay(d => Math.min(15, d + 1))} disabled={day >= 15}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--ink)', borderRadius: 2, width: 30, height: 30, cursor: day >= 15 ? 'default' : 'pointer', opacity: day >= 15 ? 0.4 : 1 }}>›</button>
        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)', minWidth: 90 }}>
          {t3(lang, 'День', 'Day', '日目')} {day}/15
        </div>
      </div>

      {/* Хроніка лідерів */}
      <div style={{ display: 'flex', gap: 3, marginBottom: '1rem' }}>
        {timeline.map(tl => (
          <div key={tl.day} onClick={() => setDay(tl.day)} title={'#' + tl.day + ': ' + tl.names.join(', ') + ' (' + tl.top + 'W)'}
            style={{ flex: 1, height: 22, borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tl.day === day ? '#b8860b' : 'var(--bg2)', border: '1px solid ' + (tl.day === day ? '#b8860b' : 'var(--border)'),
              fontFamily: 'monospace', fontSize: '0.55rem', color: tl.day === day ? '#1a120a' : 'var(--mid)', fontWeight: 700 }}>
            {tl.day}
          </div>
        ))}
      </div>

      {/* Перемикач візуалізації */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '1rem' }}>
        {[
          { id: 'groups', label: t3(lang, 'По перемогах', 'By wins', '勝数別') },
          { id: 'list', label: t3(lang, 'Список', 'List', 'リスト') },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)} style={{
            padding: '4px 14px', fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: view === v.id ? '#b8860b' : 'var(--bg2)', color: view === v.id ? '#1a120a' : 'var(--mid)',
            border: '1px solid ' + (view === v.id ? '#b8860b' : 'var(--border)'), borderRadius: 2, cursor: 'pointer', fontWeight: 700,
          }}>{v.label}</button>
        ))}
      </div>

      {/* Плей-оф банер на дні 15 */}
      {day === 15 && (playoff || yusho) && (
        <div style={{ background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.4)', borderRadius: 2, padding: '0.75rem 1rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--ink)' }}>
          🏆 {yusho ? ((lang === 'ja' && yusho.shikonaJp ? yusho.shikonaJp : yusho.shikonaEn) + ' — ' + t3(lang, 'юшо', 'yusho', '優勝')) : ''}{playoff ? ' · ' + t3(lang, 'плей-оф', 'playoff', '優勝決定戦') : ''}
        </div>
      )}

      {kyujoNow.length > 0 && (
        <CompactGrid currentDay={day} isKyujo={true}
          items={kyujoNow.map(r => ({ _id: String(r.id), name: r.name, rank: r.rank, wins: r.w, losses: r.l, record: r.rawRecord.slice(0, day) }))} />
      )}

      {/* Таблиця всіх учасників на день */}
      {view === 'list' && <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '0.72rem' }}>
          <thead>
            <tr style={{ color: 'var(--mid)', textAlign: 'left', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <th style={{ padding: '6px 8px' }}>#</th>
              <th style={{ padding: '6px 8px' }}>{t3(lang, 'Рікіші', 'Rikishi', '力士')}</th>
              <th style={{ padding: '6px 8px' }}>{t3(lang, 'Ранг', 'Rank', '番付')}</th>
              <th style={{ padding: '6px 8px' }}>W–L</th>
              <th style={{ padding: '6px 8px' }}>{t3(lang, 'День', 'Day', '当日')} {day}</th>
            </tr>
          </thead>
          <tbody>
            {(showAll ? activeNow : activeNow.slice(0, 10)).map((r, i) => {
              const isLeader = r.w === maxW && r.w > 0
              return (
                <tr key={r.id} style={{ borderTop: '1px solid var(--border)', background: isLeader ? 'rgba(184,134,11,0.08)' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>{i + 1}</td>
                  <td style={{ padding: '6px 8px', fontWeight: isLeader ? 800 : 500, color: 'var(--ink)' }}>
                    {displayName(r, lang)}{isLeader && ' ★'}
                  </td>
                  <td style={{ padding: '6px 8px', color: 'var(--mid)' }}>{displayRank(r.rank, lang)}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700, color: isLeader ? '#b8860b' : 'var(--ink)' }}>{r.w}–{r.l}</td>
                  <td style={{ padding: '6px 8px' }}>
                    {r.res === 'w' ? <span style={{ color: '#1a6b5c' }}>○</span> : r.res === 'l' ? <span style={{ color: '#c0392b' }}>●</span> : r.res === 'a' ? <span style={{ color: 'var(--light)' }}>{t3(lang, 'кюджо', 'kyujo', '休')}</span> : <span style={{ color: 'var(--light)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {activeNow.length > 10 && (
          <button onClick={() => setShowAll(v => !v)} style={{
            marginTop: 10, width: '100%', padding: '8px', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            background: 'var(--bg2)', color: 'var(--mid)', border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer',
          }}>
            {showAll ? t3(lang, 'Згорнути до топ-10', 'Collapse to top 10', 'トップ10に戻す') : t3(lang, 'Показати всіх (' + activeNow.length + ')', 'Show all (' + activeNow.length + ')', '全員表示 (' + activeNow.length + ')')}
          </button>
        )}
      </div>}

      {/* Групування за перемогами (CompactGrid, як основна таблиця) */}
      {view === 'groups' && (
        <CompactGrid currentDay={day} isKyujo={false}
          items={activeNow.map(r => ({ _id: String(r.id), name: r.name, rank: r.rank, wins: r.w, losses: r.l, record: r.rawRecord.slice(0, day) }))}
          title={lang === 'ja' ? day + '日目終了時点の星取' : (lang === 'en' ? 'Standings after day ' : 'Стан після дня ') + day} />
      )}
    </div>
  )
}
