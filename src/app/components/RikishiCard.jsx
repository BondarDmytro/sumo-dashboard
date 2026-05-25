'use client'

export default function RikishiCard({ r, index }) {
  const rankColors = ['#b8860b', '#888', '#a0522d']
  const bgColor = index < 3 ? rankColors[index] : 'var(--bg2)'
  const textColor = index < 3 ? '#fff' : 'var(--mid)'
  const barColor = index === 0 ? '#1a6b5c' : index === 1 ? '#1a4a7a' : index === 2 ? '#c0392b' : '#888'

  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderTop:`3px solid ${barColor}`,borderRadius:2,overflow:'hidden'}}>
      {/* Фото — менша висота */}
      <div style={{position:'relative',width:'100%',paddingTop:'60%',background:'var(--bg2)'}}>
        <img
          src={`/rikishi/${r._id}.jpg`}
          alt={r.name}
          style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',objectPosition:'top',display:'block'}}
          onError={e=>{e.target.style.display='none'}}
        />
        <div style={{
          position:'absolute',top:8,left:8,
          width:26,height:26,borderRadius:'50%',
          background:bgColor,color:textColor,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'0.68rem',fontWeight:500,fontFamily:'monospace',
        }}>
          {index+1}
        </div>
      </div>

      {/* Контент */}
      <div style={{padding:'0.75rem 1rem'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8,marginBottom:'0.5rem'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:'0.95rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.name}</div>
            <div style={{fontSize:'0.68rem',color:'var(--mid)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
              {r.rankFull} · <span style={{fontFamily:'monospace',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.rank}</span>
            </div>
          </div>
          <div style={{textAlign:'right',flexShrink:0}}>
            <div style={{fontFamily:'monospace',fontWeight:500,fontSize:'0.85rem'}}>{r.wins}–{r.losses}</div>
            <span style={{fontFamily:'monospace',fontSize:'0.58rem',padding:'1px 6px',borderRadius:2,background:r.status==='lead'?'#d4edda':'#fff3cd',color:r.status==='lead'?'#155724':'#856404'}}>
              {r.status==='lead'?'лідер':'-1'}
            </span>
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:'0.4rem'}}>
          <div style={{flex:1,height:5,background:'var(--bg2)',borderRadius:1}}>
            <div style={{height:'100%',width:`${r.yushoChance}%`,background:barColor,borderRadius:1}}/>
          </div>
          <span style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:600,color:barColor,minWidth:40,textAlign:'right'}}>{r.yushoChance}%</span>
          <span style={{fontFamily:'monospace',fontSize:'0.6rem',fontWeight:500,color:r.chanceDelta>0?'#1a6b5c':r.chanceDelta<0?'#c0392b':'var(--mid)',minWidth:28,textAlign:'right'}}>
            {r.chanceDelta>0?`▲+${r.chanceDelta}`:r.chanceDelta<0?`▼${r.chanceDelta}`:'–'}
          </span>
        </div>

        <div style={{fontSize:'0.68rem',color:'var(--mid)',fontStyle:'italic',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
          {r.note} · день {r.nextOpponent ? `vs ${r.nextOpponent}` : '—'}
        </div>
      </div>
    </div>
  )
}