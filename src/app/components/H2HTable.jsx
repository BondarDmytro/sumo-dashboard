'use client'

export default function H2HTable({ rikishi, h2h }) {
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
    <div style={{overflowX:'auto',marginBottom:'2rem'}}>
      <table style={{borderCollapse:'collapse',fontSize:'0.78rem',width:'100%'}}>
        <thead>
          <tr>
            <th style={{padding:'0.5rem 0.75rem',fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--mid)',textAlign:'left',borderBottom:'2px solid var(--ink)',minWidth:120}}>
              Рікіші
            </th>
            {names.map(name => (
              <th key={name} style={{padding:'0.5rem 0.5rem',fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',borderBottom:'2px solid var(--ink)',minWidth:90,fontWeight:500}}>
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((rowName, i) => (
            <tr key={rowName} style={{borderBottom:'1px solid var(--border)'}}>
              <td style={{padding:'0.6rem 0.75rem',fontWeight:700,fontSize:'0.85rem'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:i<3?['#b8860b','#888','#a0522d'][i]:'var(--bg2)',color:i<3?'#fff':'var(--mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontFamily:'monospace',flexShrink:0}}>
                    {i+1}
                  </div>
                  {rowName}
                </div>
              </td>
              {names.map(colName => {
                if (rowName === colName) {
                  return (
                    <td key={colName} style={{padding:'0.6rem 0.5rem',textAlign:'center',background:'var(--bg2)'}}>
                      <span style={{color:'var(--light)',fontSize:'0.8rem'}}>—</span>
                    </td>
                  )
                }
                const result = getResult(rowName, colName)
                if (!result) {
                  return (
                    <td key={colName} style={{padding:'0.6rem 0.5rem',textAlign:'center'}}>
                      <span style={{color:'var(--light)',fontSize:'0.75rem',fontFamily:'monospace'}}>·</span>
                    </td>
                  )
                }
                if (result === 'pending') {
                  return (
                    <td key={colName} style={{padding:'0.6rem 0.5rem',textAlign:'center'}}>
                      <span style={{background:'#fff3cd',color:'#856404',fontSize:'0.6rem',fontFamily:'monospace',padding:'2px 6px',borderRadius:2}}>день 12</span>
                    </td>
                  )
                }
                return (
                  <td key={colName} style={{padding:'0.6rem 0.5rem',textAlign:'center'}}>
                    <span style={{
                      background: result==='win'?'#d4edda':'#fde8e8',
                      color: result==='win'?'#155724':'#721c24',
                      fontSize:'0.7rem',
                      fontFamily:'monospace',
                      fontWeight:600,
                      padding:'3px 8px',
                      borderRadius:2
                    }}>
                      {result==='win'?'✓':'✗'}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{marginTop:'0.75rem',fontSize:'0.7rem',color:'var(--light)',fontFamily:'monospace',display:'flex',gap:'1rem',flexWrap:'wrap'}}>
        <span><span style={{background:'#d4edda',color:'#155724',padding:'1px 5px',borderRadius:2}}>✓</span> перемога</span>
        <span><span style={{background:'#fde8e8',color:'#721c24',padding:'1px 5px',borderRadius:2}}>✗</span> поразка</span>
        <span><span style={{background:'#fff3cd',color:'#856404',padding:'1px 5px',borderRadius:2}}>день 12</span> заплановано</span>
        <span><span style={{color:'var(--light)'}}>·</span> не зустрічались</span>
      </div>
    </div>
  )
}
