'use client'

import { useLang } from './LangProvider'

export default function H2HTable({ rikishi, h2h }) {
  const { lang } = useLang()
  const names = rikishi.map(r => r.name)

  const getResult = (a, b) => {
    const match = h2h.find(m =>
      (m.fighter1 === a && m.fighter2 === b) ||
      (m.fighter1 === b && m.fighter2 === a)
    )
    if (!match) return null
    if (match.winner === 'pending') return 'pending'
    return match.winner === a ? 'win' : 'loss'
  }

  return (
    <div style={{overflowX:'auto',marginBottom:'2rem',WebkitOverflowScrolling:'touch'}}>
      <table style={{borderCollapse:'collapse',fontSize:'0.75rem',minWidth:400}}>
        <thead>
          <tr>
            <th style={{
              padding:'0.4rem 0.6rem',
              fontFamily:'monospace',fontSize:'0.58rem',
              letterSpacing:'0.1em',textTransform:'uppercase',
              color:'var(--mid)',textAlign:'left',
              borderBottom:'2px solid var(--ink)',
              minWidth:100, position:'sticky', left:0,
              background:'var(--bg)',zIndex:1,
            }}>
              {lang === 'en' ? 'Rikishi' : 'Рікіші'}
            </th>
            {names.map(name => (
              <th key={name} style={{
                padding:'0.4rem 0.4rem',
                fontFamily:'monospace',fontSize:'0.6rem',
                color:'var(--mid)',textAlign:'center',
                borderBottom:'2px solid var(--ink)',
                minWidth:70,fontWeight:500,
                whiteSpace:'nowrap',
              }}>
                {name.length > 10 ? name.slice(0,9)+'…' : name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((rowName, i) => (
            <tr key={rowName} style={{borderBottom:'1px solid var(--border)'}}>
              <td style={{
                padding:'0.5rem 0.6rem',fontWeight:700,fontSize:'0.8rem',
                position:'sticky',left:0,background:'var(--bg)',zIndex:1,
              }}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{
                    width:20,height:20,borderRadius:'50%',flexShrink:0,
                    background:i<3?['#b8860b','#888','#a0522d'][i]:'var(--bg2)',
                    color:i<3?'#fff':'var(--mid)',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:'0.6rem',fontFamily:'monospace',
                  }}>
                    {i+1}
                  </div>
                  <span style={{whiteSpace:'nowrap'}}>{rowName}</span>
                </div>
              </td>
              {names.map(colName => {
                if (rowName === colName) return (
                  <td key={colName} style={{padding:'0.5rem 0.4rem',textAlign:'center',background:'var(--bg2)'}}>
                    <span style={{color:'var(--light)'}}>—</span>
                  </td>
                )
                const result = getResult(rowName, colName)
                if (!result || result === 'pending') return (
                  <td key={colName} style={{padding:'0.5rem 0.4rem',textAlign:'center'}}>
                    <span style={{color:'var(--light)',fontFamily:'monospace'}}>·</span>
                  </td>
                )
                return (
                  <td key={colName} style={{
                    padding:0,textAlign:'center',
                    background:result==='win'?'rgba(26,107,92,0.15)':'rgba(192,57,43,0.1)',
                  }}>
                    <div style={{
                      display:'flex',alignItems:'center',justifyContent:'center',
                      minHeight:36,
                      color:result==='win'?'#1a6b5c':'#c0392b',
                      fontSize:'0.85rem',fontWeight:700,
                    }}>
                      {result==='win'?'●':'○'}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:'0.75rem',fontSize:'0.68rem',color:'var(--light)',fontFamily:'monospace',display:'flex',gap:'0.75rem',flexWrap:'wrap'}}>
        <span><span style={{background:'var(--ink)',color:'var(--bg)',padding:'1px 5px',borderRadius:2}}>●</span> {lang === 'en' ? 'win' : 'перемога'}</span>
        <span><span style={{border:'1.5px solid var(--ink)',color:'var(--ink)',padding:'1px 5px',borderRadius:2}}>○</span> {lang === 'en' ? 'loss' : 'поразка'}</span>
        <span><span style={{color:'var(--light)'}}>·</span> {lang === 'en' ? 'not met' : 'не зустрічались'}</span>
      </div>
    </div>
  )
}