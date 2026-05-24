'use client'

import { useLang } from './LangProvider'
import { useBios } from './BiosProvider'

export default function YushoWinner({ winner, playoff, bashoLabel, bashoLabelEn }) {
  const { lang } = useLang()
  const bios = useBios()
  if (!winner) return null

  const flag = bios[winner._id]?.country?.flag || '🇯🇵'
  const label = lang === 'en' ? bashoLabelEn : bashoLabel

  return (
    <div style={{
      background:'var(--bg2)',
      border:'2px solid #b8860b',
      borderRadius:4,
      padding:'2rem',
      marginBottom:'2rem',
      position:'relative',
      overflow:'hidden',
    }}>
      <div style={{
        position:'absolute',right:'-0.02em',top:'-0.1em',
        fontSize:'clamp(4rem,10vw,8rem)',
        fontWeight:800,opacity:0.08,lineHeight:1,
        pointerEvents:'none',color:'#b8860b',
      }}>🏆</div>

      <div style={{position:'relative',zIndex:1}}>
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#b8860b',marginBottom:'0.5rem'}}>
          {lang === 'en' ? `${label} — Yusho` : `${label} — Юшо`}
        </div>

        <div style={{display:'flex',alignItems:'center',gap:'1.5rem',flexWrap:'wrap'}}>
          <img
            src={`/rikishi/${winner._id}.jpg`}
            alt={winner.name}
            width={100}
            height={100}
            style={{borderRadius:'50%',objectFit:'cover',border:'3px solid #b8860b',flexShrink:0}}
            onError={e=>{e.target.style.display='none'}}
          />
          <div style={{flex:1,minWidth:200}}>
            <h2 style={{fontSize:'clamp(1.5rem,4vw,2.5rem)',fontWeight:800,margin:0,lineHeight:1,color:'var(--ink)'}}>
              {flag} {winner.name}
            </h2>
            <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginTop:6}}>
              {winner.rankFull}
            </div>
          </div>

          <div style={{textAlign:'center',background:'var(--card)',padding:'0.75rem 1.5rem',borderRadius:2,border:'1px solid var(--border)'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'2.2rem',fontWeight:800,color:'#b8860b',lineHeight:1}}>
              {winner.wins}–{winner.losses}
            </div>
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4,textTransform:'uppercase',letterSpacing:'0.1em'}}>
              {lang === 'en' ? 'Final record' : 'Фінальний рекорд'}
            </div>
          </div>
        </div>

        {playoff && (
          <div style={{
            marginTop:'1rem',
            display:'inline-flex',alignItems:'center',gap:8,
            background:'rgba(184,134,11,0.15)',
            border:'1px solid rgba(184,134,11,0.4)',
            padding:'6px 14px',borderRadius:2,
          }}>
            <span>⚡</span>
            <span style={{fontFamily:'monospace',fontSize:'0.68rem',color:'#b8860b',fontWeight:600}}>
              {lang === 'en'
                ? `Won in playoff vs ${playoff.loser} · ${playoff.kimarite}`
                : `Переміг у плей-офі проти ${playoff.loser} · ${playoff.kimarite}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}