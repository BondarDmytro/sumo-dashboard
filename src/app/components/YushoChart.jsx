'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = [
  '#1a6b5c','#1a4a7a','#c0392b','#b8860b',
  '#8e44ad','#2980b9','#e67e22','#27ae60',
  '#d35400','#16a085',
]

function calcChanceAtDay(record, day, allRikishi) {
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
  if (!rikishi?.length) return null

  const top = rikishi.slice(0, 8)
  const maxDay = Math.max(...top.map(r => r.record?.filter(m => m.result).length || 0))

  // Будуємо дані по днях
  const chartData = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    const point = { day: `День ${day}` }

    // Рахуємо сирі шанси для всіх
    const rawChances = {}
    top.forEach(r => {
      rawChances[r.name] = calcChanceAtDay(r.record || [], day, top)
    })

    // Нормалізуємо до 100%
    const total = Object.values(rawChances).reduce((s, v) => s + v, 0)
    top.forEach(r => {
      point[r.name] = total > 0
        ? Math.round(rawChances[r.name] / total * 1000) / 10
        : 0
    })

    return point
  })

  return (
    <div>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:'0.75rem',letterSpacing:'0.08em'}}>
        Динаміка шансів на юшо по днях турніру
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{top:5,right:20,left:0,bottom:5}}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="day"
            tick={{fontFamily:'monospace',fontSize:10,fill:'var(--mid)'}}
            tickLine={false}
            axisLine={{stroke:'var(--border)'}}
          />
          <YAxis
            tickFormatter={v => `${v}%`}
            tick={{fontFamily:'monospace',fontSize:10,fill:'var(--mid)'}}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background:'var(--card)',
              border:'1px solid var(--border)',
              borderRadius:2,
              fontFamily:'monospace',
              fontSize:11,
              color:'var(--ink)',
            }}
            formatter={(value, name) => [`${value}%`, name]}
            labelStyle={{color:'var(--mid)',marginBottom:4}}
          />
          <Legend
            wrapperStyle={{fontFamily:'monospace',fontSize:11,paddingTop:8}}
            formatter={(value) => <span style={{color:'var(--ink)'}}>{value}</span>}
          />
          {top.map((r, i) => (
            <Line
              key={r.name}
              type="monotone"
              dataKey={r.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={i < 3 ? 2.5 : 1.5}
              dot={false}
              activeDot={{r:4}}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}