'use client'

export default function RikishiCard({ r, index }) {
  const rankColors = ['#b8860b', '#888', '#a0522d']
  const bgColor = index < 3 ? rankColors[index] : 'var(--bg2)'
  const textColor = index < 3 ? '#fff' : 'var(--mid)'
  const barColor = index === 0 ? '#1a6b5c' : index === 1 ? '#1a4a7a' : index === 2 ? '#c0392b' : '#888'

  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:`3px solid ${barColor}`,padding:'1rem 1.25rem',borderRadius:2}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'0.75rem'}}>
        <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace',flexShrink:0}}>
          {index+1}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:'1rem'}}>{r.name}</div>
          <div style={{fontSize:'0.72rem',color:'var(--mid)'}}>{r.rankFull} · <span style={{fontFamily:'monospace',background:'var(--bg2)',padding:'1px 5px',borderRadius:2}}>{r.rank}</span></div>
        </div>
        <div style={{textAlign:'right'}}>
          <div style={{fontFamily:'monospace',fontWeight:500,fontSize:'0.9rem'}}>{r.wins}–{r.losses}</div>
          <span style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'2px 7px',borderRadius:2,background:r.status==='lead'?'#d4edda':'#fff3cd',color:r.status==='lead'?'#155724':'#856404'}}>
            {r.status==='lead'?'лідер':'-1'}
          </span>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:'0.5rem'}}>
        <div style={{flex:1,height:6,background:'var(--bg2)',borderRadius:1}}>
          <div style={{height:'100%',width:`${r.yushoChance}%`,background:barColor,borderRadius:1}}></div>
        </div>
        <span style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:600,color:barColor,minWidth:44,textAlign:'right'}}>{r.yushoChance}%</span>
        <span style={{fontFamily:'monospace',fontSize:'0.65rem',fontWeight:500,color:r.chanceDelta>0?'#1a6b5c':r.chanceDelta<0?'#c0392b':'var(--mid)',minWidth:32,textAlign:'right'}}>
          {r.chanceDelta>0?`▲+${r.chanceDelta}`:r.chanceDelta<0?`▼${r.chanceDelta}`:'–'}
        </span>
      </div>

      <div style={{fontSize:'0.72rem',color:'var(--mid)',fontStyle:'italic'}}>
        {r.note} · день {r.nextOpponent ? `vs ${r.nextOpponent}` : '—'}
      </div>
    </div>
  )
}
