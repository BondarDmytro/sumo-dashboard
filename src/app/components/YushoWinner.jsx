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
      marginBottom:'2rem',
      position:'relative',
      overflow:'hidden',
      display:'flex',
      minHeight:260,
    }}>
      {/* Фонове тло — трофей */}
      <div style={{
        position:'absolute',right:'-0.02em',top:'-0.1em',
        fontSize:'clamp(4rem,10vw,8rem)',
        fontWeight:800,opacity:0.08,lineHeight:1,
        pointerEvents:'none',color:'#b8860b',
      }}>🏆</div>

      {/* Фото — зліва, на всю висоту */}
      <img
        src={`/rikishi/${winner._id}.jpg`}
        alt={winner.name}
        style={{
          width:180,
          minHeight:'100%',
          objectFit:'cover',
          objectPosition:'top',
          display:'block',
          flexShrink:0,
        }}
        onError={e=>{e.target.style.display='none'}}
      />

      {/* Інфо — справа */}
      <div style={{
        position:'relative',zIndex:1,
        flex:1,
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        padding:'1.75rem 2rem',
        gap:'0.75rem',
      }}>
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'#b8860b'}}>
          {lang === 'en' ? `${label} — Yusho` : `${label} — Юшо`}
        </div>

        <div>
          <h2 style={{fontSize:'clamp(1.4rem,3vw,2.2rem)',fontWeight:800,margin:0,lineHeight:1,color:'var(--ink)'}}>
            {flag} {winner.name}
          </h2>
          <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginTop:6}}>
            {winner.rankFull}
          </div>
        </div>

        <div style={{display:'inline-block'}}>
          <div style={{background:'var(--card)',padding:'0.75rem 1.5rem',borderRadius:2,border:'1px solid var(--border)',display:'inline-block'}}>
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
            display:'inline-flex',alignItems:'center',gap:8,alignSelf:'flex-start',
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