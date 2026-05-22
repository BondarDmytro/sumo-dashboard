import { getTournament, getRikishi, getMatches } from '@/sanity/queries'
import ThemeToggle from './components/ThemeToggle'
import RikishiCard from './components/RikishiCard'
import ChartWrapper from './components/ChartWrapper'
import H2HTable from './components/H2HTable'
import { getH2H } from '@/sanity/queries'

export const revalidate = 60

export default async function Home() {
  const [tournament, rikishi, matches, h2h] = await Promise.all([
    getTournament(),
    getRikishi(),
    getMatches(),
    getH2H(),
  ])

  const leaders = rikishi.filter(r => r.status === 'lead')
  const chasers = rikishi.filter(r => r.status === 'chase')

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>

      <header style={{background:'var(--header)',color:'#f5f0e8',padding:'3rem 2rem 2rem',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:'-0.05em',top:'-0.15em',fontSize:'clamp(8rem,20vw,18rem)',fontWeight:800,opacity:0.06,lineHeight:1,pointerEvents:'none'}}>相撲</div>
        <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'monospace',fontSize:'0.7rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'#c8c3b8',marginBottom:'0.75rem'}}>
            Великий турнір сумо · Токіо · Травень 2026
          </div>
          <h1 style={{fontSize:'clamp(2rem,5vw,3.5rem)',fontWeight:800,lineHeight:1.1,marginBottom:'0.5rem'}}>
            夏場所 — {tournament?.name}<br/>
            <span style={{color:'#b8860b'}}>Прогноз Юшо</span>
          </h1>
          <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginTop:'1rem',fontSize:'0.9rem',color:'#c8c3b8'}}>
            <span><b style={{color:'#f5f0e8'}}>День {tournament?.currentDay}</b> завершено</span>
            <span><b style={{color:'#f5f0e8'}}>{tournament?.totalDays - tournament?.currentDay}</b> днів залишилось</span>
            <span><b style={{color:'#f5f0e8'}}>{rikishi.length}</b> претендентів</span>
            <span><b style={{color:'#f5f0e8'}}>{tournament?.location}</b></span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,marginTop:'1rem',flexWrap:'wrap'}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,background:'#1a6b5c',color:'#fff',fontFamily:'monospace',fontSize:'0.65rem',letterSpacing:'0.1em',padding:'4px 10px',borderRadius:2}}>
              ↻ {tournament?.updatedNote}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem',marginTop:'2.5rem'}}>
          Стан турніру
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:1,background:'var(--border)',border:'1px solid var(--border)',marginBottom:'2rem'}}>
          {[
            {num:leaders.length,label:'Лідери',sub:`рекорд ${leaders[0]?.wins}-${leaders[0]?.losses}`,color:'#1a6b5c'},
            {num:chasers.length,label:'Переслідувачі',sub:`рекорд ${chasers[0]?.wins}-${chasers[0]?.losses}`},
            {num:tournament?.totalDays-tournament?.currentDay,label:'Днів залишилось',sub:'до фіналу',color:'#c0392b'},
            {num:tournament?.kyujoCount,label:'Кюджо',sub:'обидва йокодзуна',color:'#b8860b'},
            {num:matches.length,label:'Вирішальних пар',sub:`у день ${tournament?.currentDay+1}`},
          ].map((s,i)=>(
            <div key={i} style={{background:'var(--card)',padding:'1.25rem 1rem',textAlign:'center'}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'2.8rem',fontWeight:800,lineHeight:1,color:s.color||'var(--ink)'}}>{s.num}</div>
              <div style={{fontSize:'0.72rem',color:'var(--mid)',marginTop:'0.4rem'}}>{s.label}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',marginTop:'0.2rem'}}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Математичний прогноз юшо
        </div>
        <div className="desktop-table" style={{overflowX:'auto',marginBottom:'2rem'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.88rem'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--ink)'}}>
                {['#','Рікіші','Ранг','Рекорд','Статус',`День ${tournament?.currentDay+1}`,'Шанс на юшо','Δ'].map(h=>(
                  <th key={h} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.6rem 0.75rem',textAlign:'left',fontWeight:500}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rikishi.map((r,i)=>{
                const rankColors=['#b8860b','#888','#a0522d']
                const bgColor=i<3?rankColors[i]:'var(--bg2)'
                const textColor=i<3?'#fff':'var(--mid)'
                const barColor=i===0?'#1a6b5c':i===1?'#1a4a7a':i===2?'#c0392b':'#888'
                return(
                  <tr key={r._id} style={{borderBottom:'1px solid var(--border)'}}>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.72rem',fontWeight:500,fontFamily:'monospace'}}>{i+1}</div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <div style={{fontWeight:700,fontSize:'0.95rem'}}>{r.name}</div>
                      <div style={{fontSize:'0.72rem',color:'var(--mid)',fontStyle:'italic',marginTop:2}}>{r.rankFull} · {r.note}</div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <span style={{fontFamily:'monospace',fontSize:'0.62rem',background:'var(--bg2)',padding:'2px 6px',borderRadius:2,color:'var(--mid)'}}>{r.rank}</span>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem',fontFamily:'monospace',fontWeight:500}}>{r.wins}–{r.losses}</td>
                    <td style={{padding:'0.85rem 0.75rem'}}>
                      <span style={{fontFamily:'monospace',fontSize:'0.6rem',padding:'3px 8px',borderRadius:2,background:r.status==='lead'?'#d4edda':'#fff3cd',color:r.status==='lead'?'#155724':'#856404'}}>
                        {r.status==='lead'?'лідер':'-1'}
                      </span>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem',fontSize:'0.78rem',color:'var(--mid)'}}>vs {r.nextOpponent}</td>
                    <td style={{padding:'0.85rem 0.75rem',minWidth:200}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <div style={{flex:1,height:5,background:'var(--bg2)'}}>
                          <div style={{height:'100%',width:`${r.yushoChance}%`,background:barColor}}></div>
                        </div>
                        <span style={{fontFamily:'Georgia,serif',fontSize:'1rem',fontWeight:600,color:barColor,minWidth:40,textAlign:'right'}}>{r.yushoChance}%</span>
                      </div>
                    </td>
                    <td style={{padding:'0.85rem 0.75rem',fontFamily:'monospace',fontSize:'0.65rem',fontWeight:500,color:r.chanceDelta>0?'#1a6b5c':r.chanceDelta<0?'#c0392b':'var(--mid)'}}>
                      {r.chanceDelta>0?`▲+${r.chanceDelta}`:r.chanceDelta<0?`▼${r.chanceDelta}`:'–'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards" style={{marginBottom:'2rem'}}>
          {rikishi.map((r,i) => <RikishiCard key={r._id} r={r} index={i} />)}
        </div>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Графік ймовірностей юшо
        </div>
        <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem',marginBottom:'2rem'}}>
          <ChartWrapper rikishi={rikishi} />
        </div>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Вирішальні поєдинки — день {tournament?.currentDay+1}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:1,background:'var(--border)',marginBottom:'2rem'}}>
          {matches.map(m=>(
            <div key={m._id} style={{background:'var(--card)',padding:'1.1rem 1.25rem',borderTop:`3px solid ${m.importance==='critical'?'#c0392b':'#b8860b'}`}}>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:m.importance==='critical'?'#c0392b':'#b8860b',marginBottom:'0.6rem'}}>
                {m.importance==='critical'?'⭐ ':''}{m.label}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'0.5rem'}}>
                <span style={{fontWeight:700,fontSize:'1rem'}}>{m.fighterA}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>проти</span>
                <span style={{fontWeight:700,fontSize:'1rem'}}>{m.fighterB}</span>
              </div>
              <div style={{fontSize:'0.78rem',color:'var(--mid)',lineHeight:1.5}}>{m.note}</div>
            </div>
          ))}
        </div>

        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.2rem'}}>
          Очні зустрічі — цей турнір
        </div>
        <H2HTable rikishi={rikishi} h2h={h2h} />
          Відсутні зірки — кюджо
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:1,background:'var(--border)',marginBottom:'2rem'}}>
          {[
            {name:'Hoshoryu',rank:'Йокодзуна 1e',reason:'травма підколінного сухожилля'},
            {name:'Onosato',rank:'Йокодзуна 1w',reason:'травма лівого плеча'},
            {name:'Aonishiki',rank:'Озекі 1w',reason:'перелом пальця · втрачає ранг'},
          ].map(k=>(
            <div key={k.name} style={{background:'var(--card)',padding:'1rem 1.25rem',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#c0392b',flexShrink:0}}></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:'0.9rem'}}>{k.name}</div>
                <div style={{fontSize:'0.72rem',color:'var(--mid)'}}>{k.rank}</div>
                <div style={{fontSize:'0.7rem',color:'var(--light)',marginTop:2}}>{k.reason}</div>
              </div>
              <span style={{fontFamily:'monospace',fontSize:'0.58rem',letterSpacing:'0.08em',background:'#fde8e8',color:'#c0392b',padding:'3px 7px',borderRadius:2}}>КЮДЖО</span>
            </div>
          ))}
        </div>

        <div style={{marginTop:'2.5rem',paddingTop:'1.5rem',borderTop:'1px solid var(--border)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.7}}>
          <b style={{color:'var(--ink)'}}>Методологія:</b> поточний рекорд (60%), ранг та сила розкладу (15%), очні зустрічі (15%), форма за 3 басьо (10%). Сума ≈ 100%. <b style={{color:'var(--ink)'}}>Не є ставкою — виключно статистична модель.</b>
        </div>

      </div>
    </main>
  )
}