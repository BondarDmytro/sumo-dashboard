'use client' /* ja_batch2_t */
import { useState } from 'react' /* chart_hl_v1 */
import { t3 } from '../i18n' /* ja_batch1 */
import { computeStandings } from '../lib/chanceEngine' /* chart_engine_v1 */
import { useEffect } from 'react' /* chart_mobile_v1 */

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useLang } from './LangProvider'

const COLORS = [
  '#1a6b5c','#1a4a7a','#c0392b','#b8860b',
  '#8e44ad','#2980b9','#e67e22','#27ae60',
  '#d35400','#16a085',
]

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

export default function YushoChart({ rikishi }) {
  const { lang } = useLang()
  const [hl, setHl] = useState(null)  /* chart_hl_v1 */
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
  const topAll = all.filter(r => (r.yushoChance ?? 1) > 0)
  const top = isMobile ? [...topAll].sort((a,b) => (b.yushoChance||0) - (a.yushoChance||0)).slice(0, 8) : topAll  /* chart_mobile_v1: top-8 na mob */
  const maxDay = Math.max(...top.map(r => r.record?.filter(m => m.result).length || 0))

  const chartData = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    const point = { day: isMobile ? String(day) : (lang === 'ja' ? `${day}日目` : lang === 'en' ? `Day ${day}` : `День ${day}`) }  /* chart_mobile_wide_v1 */

    const st = computeStandings(all, day)  /* chart_engine_v1: ta sama formula shcho v tablytsi */
    top.forEach(r => {
      const rr = st.rikishi.find(x => x.name === r.name)
      point[r.name] = rr ? rr.yushoChance : 0
    })

        return point
  })

  return (
    <div>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:'0.75rem',letterSpacing:'0.08em'}}>
        {t3(lang, 'Динаміка шансів на юшо по днях турніру', 'Yusho chance dynamics by tournament day', '優勝確率の日別推移')}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={isMobile ? {top:5,right:4,left:0,bottom:0} : {top:5,right:20,left:0,bottom:5}}>
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
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={hl === r.name ? 3.5 : i < 3 ? 2.5 : 1.5} strokeOpacity={hl && hl !== r.name ? 0.18 : 1}
              dot={false}
              activeDot={{r:4}}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}