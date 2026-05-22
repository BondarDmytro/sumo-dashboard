'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const COLORS = { 0: '#1a6b5c', 1: '#1a4a7a', 2: '#c0392b' }

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    return (
      <div style={{background:'#0f0e0c',color:'#f5f0e8',padding:'10px 14px',borderRadius:2,fontFamily:'monospace',fontSize:'0.75rem'}}>
        <div style={{fontWeight:700,marginBottom:4}}>{d.name}</div>
        <div>{d.rank} · {d.wins}–{d.losses}</div>
        <div style={{marginTop:4,fontSize:'1rem',fontWeight:600,color:payload[0].fill}}>{d.value}%</div>
      </div>
    )
  }
  return null
}

export default function YushoChart({ rikishi }) {
  const data = rikishi.map(r => ({
    name: r.name,
    value: r.yushoChance,
    rank: r.rank,
    wins: r.wins,
    losses: r.losses,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontFamily: 'monospace', fontSize: 11, fill: '#6b6560' }} axisLine={{ stroke: '#0f0e0c' }} tickLine={false} />
        <YAxis tickFormatter={v => `${v}%`} tick={{ fontFamily: 'monospace', fontSize: 11, fill: '#6b6560' }} axisLine={{ stroke: '#0f0e0c' }} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(15,14,12,0.05)' }} />
        <Bar dataKey="value" radius={[2, 2, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i] || '#888'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
