'use client' /* ja_batch2_t */
import { useState, useRef } from 'react' /* chart_hl_v1 race_smooth_v2 */
import { t3 } from '../i18n' /* ja_batch1 */
import { computeStandings } from '../lib/chanceEngine' /* chart_engine_v1 */
import { displayName } from '../lib/bashoCalendar' /* chart_race_v2 */
import { useEffect } from 'react' /* chart_mobile_v1 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useLang } from './LangProvider'

const COLORS = [
  '#1a6b5c','#1a4a7a','#c0392b','#b8860b',
  '#8e44ad','#2980b9','#e67e22','#27ae60',
  '#d35400','#16a085',
]
/* chart_race_v1: fiksovanyi kolir za rikishi - hash id v paletru, liniyi i bary synkhronni */
export const colorFor = (id) => {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function calcChanceAtDay(record, day) {
  const slice = record.slice(0, day)
  const wins = slice.filter(m => ['win','fusen win'].includes(m.result)).length
  const losses = slice.filter(m => ['loss','fusen loss'].includes(m.result)).length
  const played = wins + losses
  const remaining = 15 - played

  if (losses >= 5) return 0
  if (wins + remaining < 11) return 0

  let base = losses === 0 ? 85 : losses === 1 ? 55 : losses === 2 ? 25 : losses === 3 ? 8 : 2
  if (wins + remaining < 13) base *= 0.6

  return Math.round(base * 10) / 10
}

export default function YushoChart({ rikishi, highlightDay }) {
  const { lang } = useLang()
  const [hl, setHl] = useState(null)  /* chart_hl_v1 */
  const [mode, setMode] = useState('chart')  /* chart_race_v1 */
  const [raceDay, setRaceDay] = useState(null)
  const [racePlaying, setRacePlaying] = useState(false)
  const prevPosRef = useRef({})  /* race_smooth_v2 */
  const [raceTick, setRaceTick] = useState(0)  /* race_dir_v4: kadr rakhuiemo v efekti, ne v renderi */
  const raceViewRef = useRef(null)
  useEffect(() => {
    if (mode !== 'race' || !rikishi?.length) return
    const maxD = Math.max(...rikishi.map(r => r.record?.filter(m => m.result).length || 0), 1)
    const dayNow = raceDay ?? maxD
    const st = computeStandings(rikishi, dayNow)
    const frame = (st.rikishi || []).filter(r => !r.kyujo && (r.yushoChance || 0) > 0).sort((a, b) => (b.yushoChance || 0) - (a.yushoChance || 0) || b.wins - a.wins || (a.rankValue || 999) - (b.rankValue || 999))  /* race_sort_chance_v1 race_drop_eliminated_v1 */
    const dirs = {}
    frame.forEach((r, idx) => {
      const k = String(r._id || r.name)
      const prev = prevPosRef.current[k]
      dirs[k] = prev === undefined || prev === idx ? '' : idx < prev ? 'race-up' : 'race-down'
    })
    frame.forEach((r, idx) => { prevPosRef.current[String(r._id || r.name)] = idx })
    raceViewRef.current = { frame, dirs, dayNow }
    setRaceTick(t => t + 1)
  }, [mode, raceDay, rikishi])
  useEffect(() => {  /* race_tick_v1 */
    if (!racePlaying) return
    const t = setInterval(() => {
      setRaceDay(d => {
        const cur = d ?? 1
        const limit = Math.max(...(rikishi || []).map(r => r.record?.filter(m => m.result).length || 0), 1)
        if (cur >= limit) { setRacePlaying(false); return limit }
        return cur + 1
      })
    }, 2100)  /* race_smooth_v2 */
    return () => clearInterval(t)
  }, [racePlaying, rikishi])
  const [isMobile, setIsMobile] = useState(false)  /* chart_mobile_v1 */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  if (!rikishi?.length) return null

  const all = rikishi  /* chart_global_pct_v1 */
  const topAll = all.filter(r => (r.yushoChance ?? 1) > 0 || r.eliminatedDay)  /* day_switch_v2_chart: vybuli lyshaiutsia z obirvanymy kryvymy */
  const top = isMobile ? [...topAll].sort((a,b) => (b.yushoChance||0) - (a.yushoChance||0)).slice(0, 8) : topAll  /* chart_mobile_v1: top-8 na mob */
  const maxDay = Math.max(...top.map(r => r.record?.filter(m => m.result).length || 0))

  const chartData = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    const point = { day: isMobile ? String(day) : (lang === 'ja' ? `${day}日目` : lang === 'en' ? `Day ${day}` : `День ${day}`) }  /* chart_mobile_wide_v1 */

    const st = computeStandings(all, day)  /* chart_engine_v1: ta sama formula shcho v tablytsi */
    top.forEach(r => {
      if (r.eliminatedDay && day > r.eliminatedDay) { point[r.name] = undefined; return }  /* day_switch_v2_chart */
      const rr = st.rikishi.find(x => x.name === r.name)
      point[r.name] = rr ? rr.yushoChance : 0
    })

        return point
  })

  return (
    <div>
      <div style={{display:'flex',gap:6,marginBottom:8}}>{/* chart_race_v2 tabs */}
        {['chart','race'].map(mm => (
          <button key={mm} onClick={() => setMode(mm)} style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'0.26rem 0.75rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: mode === mm ? '#8a6a00' : 'var(--bg2)',color: mode === mm ? '#fff' : 'var(--mid)'}}>
            {mm === 'chart' ? t3(lang,'Графік','Chart','グラフ', 'Graphique') : t3(lang,'Гонка','Race','レース', 'Course')}
          </button>
        ))}
      </div>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:'0.75rem',letterSpacing:'0.08em'}}>
        {t3(lang, 'Динаміка шансів на юшо по днях турніру', 'Yusho chance dynamics by tournament day', '優勝確率の日別推移', 'Évolution des chances de yusho par jour')}
      </div>
      {mode === 'race' ? (() => {  /* chart_race_v2: honka - vsi ne-kyujo, № + bar + rekord + % */
        const rv = raceViewRef.current
        if (!rv) return null
        const { frame, dirs, dayNow } = rv
        const ROW_H = 24
        const maxC = Math.max(1, ...frame.map(r => r.yushoChance || 0))  /* race_smooth_v1: shkala vid % shansu */
        return (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <button onClick={() => { if (!racePlaying && (raceDay === null || raceDay >= maxDay)) setRaceDay(1); setRacePlaying(p => !p) }}  /* race_resume_v1 */
                style={{fontFamily:'monospace',fontSize:'0.62rem',padding:'0.26rem 0.75rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: racePlaying ? 'var(--bg2)' : '#8a6a00',color: racePlaying ? 'var(--mid)' : '#fff'}}>
                {racePlaying ? '\u23f8' : '\u25b6'}
              </button>
              <input type="range" min={1} max={maxDay} value={dayNow} onChange={e => { setRacePlaying(false); setRaceDay(Number(e.target.value)) }} style={{flex:1}} />
              <span style={{fontFamily:'monospace',fontSize:'0.66rem',color:'var(--mid)',minWidth:60,textAlign:'right'}}>{t3(lang,'день','day','', 'jour')} {dayNow}{lang === 'ja' ? '日目' : ''}</span>
            </div>
            <div style={{position:'relative',height: frame.length * ROW_H}}>
              {(() => {  /* race_stable_dom_v5: DOM u poriadku za id - transition zhyve, pozytsiia lyshe transformom */
                const posById = {}
                frame.forEach((r, idx) => { posById[String(r._id || r.name)] = idx })
                return [...frame].sort((a, b) => String(a._id || a.name).localeCompare(String(b._id || b.name))).map((r) => {
                  const idx = posById[String(r._id || r.name)]
                  return (
                <div key={r._id || r.name} className={'race-row ' + dirs[String(r._id || r.name)]} style={{position:'absolute',left:0,right:0,top:0,transform:`translateY(${idx * ROW_H}px)`,height:ROW_H,display:'flex',alignItems:'center',gap:8,willChange:'transform'}}>
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)',minWidth:22,textAlign:'right'}}>{idx + 1}</span>
                  <span style={{fontFamily:'monospace',fontSize:'0.64rem',fontWeight: idx === 0 ? 700 : 500,minWidth:105,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{displayName(r, lang)}</span>
                  <div style={{flex:1,height:12,background:'var(--bg2)',borderRadius:2,overflow:'hidden'}}>
                    <div className="race-bar" style={{height:'100%',width:`${((r.yushoChance || 0) / maxC) * 100}%`,background:colorFor(r._id || r.name),opacity: idx === 0 ? 1 : 0.6,borderRadius:2}} />
                  </div>
                  <span style={{fontFamily:'monospace',fontSize:'0.62rem',minWidth:32,textAlign:'right'}}>{r.wins}{'\u2013'}{r.losses}</span>
                  <span style={{fontFamily:'monospace',fontSize:'0.6rem',color: (r.yushoChance || 0) > 0 ? '#1a6b5c' : 'var(--light)',minWidth:44,textAlign:'right'}}>{(r.yushoChance ?? 0)}%</span>
                </div>
                  )
                })
              })()}
            </div>
          </div>
        )
      })() : (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={isMobile ? {top:5,right:4,left:0,bottom:0} : {top:5,right:20,left:0,bottom:5}}>
              connectNulls={false}
          {highlightDay && <ReferenceLine x={isMobile ? String(highlightDay) : (lang === 'ja' ? `${highlightDay}\u65E5\u76EE` : lang === 'en' ? `Day ${highlightDay}` : `\u0414\u0435\u043D\u044C ${highlightDay}`)} stroke="#b8860b" strokeWidth={2} strokeDasharray="4 3" />}  {/* day_switch_chart_v1 */}
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tick={{fontFamily:'monospace',fontSize: isMobile ? 9 : 10,fill:'var(--mid)'}}
            height={isMobile ? 16 : undefined}
            interval={isMobile ? 'preserveStartEnd' : 0}
            tickMargin={isMobile ? 2 : 5}
            tickLine={false}
            axisLine={{stroke:'var(--border)'}}
          />{/* chart_mobile_wide_v2: tsyfry horyzontalno, kut ne potriben */}
          <YAxis
            tickFormatter={v => v + '%'}
            tick={{fontFamily:'monospace',fontSize: isMobile ? 8 : 10,fill:'var(--mid)'}}
            tickLine={false}
            axisLine={false}
            mirror={isMobile}
            width={isMobile ? 4 : 40}
            tickCount={isMobile ? 4 : undefined}
          />{/* chart_mobile_wide_v3: mirror - pidpysy vseredyni polia, vis ne zaimaie shyryny */}
          <Tooltip
            content={({ active, payload, label }) => {  /* chart_tt5_v1: top-5 */
              if (!active || !payload?.length) return null
              const top5 = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)
              return (
                <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'8px 12px',fontFamily:'monospace',fontSize:12}}>
                  <div style={{color:'var(--mid)',marginBottom:4}}>{label}</div>
                  {top5.map(p => {
                    const rr = top.find(x => x.name === p.dataKey)
                    const nm = lang === 'ja' && rr?.nameJp ? rr.nameJp : p.dataKey
                    return <div key={p.dataKey} style={{color:p.stroke}}>{nm} : {p.value}%</div>
                  })}
                </div>
              )
            }}
          />
          {!isMobile && <Legend
            onClick={e => setHl(h => h === e.dataKey ? null : e.dataKey)}
            wrapperStyle={{fontFamily:'monospace',fontSize:11,paddingTop:8}}
            formatter={(value) => { const rr = top.find(x => x.name === value); return <span style={{color:'var(--ink)'}}>{lang === 'ja' && rr?.nameJp ? rr.nameJp : value}</span> }}
          />}
          {/* chart_ja_names */}
          {top.map((r, i) => (
            <Line
              key={r.name}
              type="monotone"
              dataKey={r.name}
              stroke={colorFor(r._id || r.name)} /* chart_race_v2 */
              strokeWidth={hl === r.name ? 3.5 : i < 3 ? 2.5 : 1.5} strokeOpacity={hl && hl !== r.name ? 0.18 : 1}
              dot={false}
              activeDot={{r:4}}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}
/* fr_batch4b_v1 */
