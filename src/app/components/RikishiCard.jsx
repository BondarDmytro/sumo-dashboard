'use client'
import { useLang } from './LangProvider' /* langfix3 */
import { displayName, displayRank } from '../lib/bashoCalendar' /* ja_names_sweep_v1 */

/* rikishi_card_flat_v1 */
export default function RikishiCard({ r, index }) {
  const { lang } = useLang()
  const rankColors = ['#b8860b', '#888', '#a0522d']
  const bgColor = index < 3 ? rankColors[index] : 'var(--bg2)'
  const textColor = index < 3 ? '#fff' : 'var(--mid)'
  const barColor = index === 0 ? '#1a6b5c' : index === 1 ? '#1a4a7a' : index === 2 ? '#c0392b' : '#888'

  return (
    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderLeft:`3px solid ${barColor}`,borderRadius:2,overflow:'hidden'}}>
      <div style={{padding:'0.4rem 0.6rem',display:'flex',alignItems:'center',gap:8}}>
        <div style={{width:20,height:20,borderRadius:'50%',flexShrink:0,background:bgColor,color:textColor,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.68rem',fontWeight:500,fontFamily:'monospace'}}>{index+1}</div>
        <div style={{flex:'0 0 32%',minWidth:0}}>
          <div style={{fontWeight:700,fontSize:'0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{displayName(r, lang)}</div>
          <div style={{fontSize:'0.62rem',color:'var(--mid)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
            {displayRank(r.rankFull, lang)} <span style={{fontFamily:'monospace',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.rank}</span>
          </div>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{flex:1,height:4,background:'var(--bg2)',borderRadius:1}}>
              <div style={{height:'100%',width:`${r.yushoChance}%`,background:barColor,borderRadius:1}}/>
            </div>
            <span style={{fontFamily:'Georgia,serif',fontSize:'0.82rem',fontWeight:600,color:barColor,textAlign:'right'}}>{r.yushoChance}%</span>
            <span style={{fontFamily:'monospace',fontSize:'0.55rem',fontWeight:500,color:r.chanceDelta>0?`#1a6b5c`:r.chanceDelta<0?`#c0392b`:`var(--mid)`,minWidth:22,textAlign:'right'}}>
              {r.chanceDelta>0?`\u25b2+${r.chanceDelta}`:r.chanceDelta<0?`\u25bc${r.chanceDelta}`:'\u2013'}
            </span>
          </div>
          <div style={{fontSize:'0.6rem',color:'var(--mid)',fontStyle:'italic',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginTop:2}}>
            {r.note}{' · день '}{r.nextOpponent ? `vs ${r.nextOpponent}` : '—'}
          </div>
        </div>
        <div style={{textAlign:'right',flexShrink:0}}>
          <div style={{fontFamily:'monospace',fontWeight:500,fontSize:'0.8rem'}}>{r.wins}{'–'}{r.losses}</div>
          <span style={{fontFamily:'monospace',fontSize:'0.55rem',padding:'1px 5px',borderRadius:2,background:r.status==='lead'?`#d4edda`:`#fff3cd`,color:r.status==='lead'?`#155724`:`#856404`}}>
            {r.status==='lead'?'лідер':'-1'}
          </span>
        </div>
      </div>
    </div>
  )
}
