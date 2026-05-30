'use client'
import { useState, useEffect } from 'react'

const VS_ANIM = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@900&display=swap');
:root { --jp: 'Noto Serif JP', serif; }
@keyframes vsSlideLeft {
  0%   { opacity:0; transform: translateX(-180px) scale(0.7); }
  65%  { opacity:1; transform: translateX(10px) scale(1.05); }
  100% { opacity:1; transform: translateX(0) scale(1); }
}
@keyframes vsSlideRight {
  0%   { opacity:0; transform: translateX(180px) scale(0.7); }
  65%  { opacity:1; transform: translateX(-10px) scale(1.05); }
  100% { opacity:1; transform: translateX(0) scale(1); }
}
@keyframes vsLogoPop {
  0%   { opacity:0; transform: scale(0.3) rotate(-8deg); }
  55%  { opacity:1; transform: scale(1.12) rotate(2deg); }
  75%  { transform: scale(0.96) rotate(-1deg); }
  100% { opacity:1; transform: scale(1) rotate(0deg); }
}
@keyframes vsRingPulse {
  0%,100% { opacity:0.18; transform:scale(1); }
  50%     { opacity:0.32; transform:scale(1.04); }
}
@keyframes vsHeynakke {
  0%   { opacity:0; letter-spacing:0.5em; }
  100% { opacity:1; letter-spacing:0.22em; }
}
@keyframes vsNameIn {
  0%   { opacity:0; transform: translateY(14px); }
  100% { opacity:1; transform: translateY(0); }
}
@keyframes vsFadeOut {
  0%  { opacity:1; }
  75% { opacity:1; }
  100%{ opacity:0; }
}
@keyframes vsFlash {
  0%  { opacity:0; }
  8%  { opacity:0.4; }
  20% { opacity:0; }
  28% { opacity:0.18; }
  100%{ opacity:0; }
}
@keyframes vsGoldGlow {
  0%,100% { filter: drop-shadow(0 0 12px rgba(255,200,50,0.5)); }
  50%     { filter: drop-shadow(0 0 32px rgba(255,200,50,0.95)) brightness(1.1); }
}
@keyframes vsRedGlow {
  0%,100% { filter: drop-shadow(0 0 12px rgba(220,50,30,0.5)); }
  50%     { filter: drop-shadow(0 0 32px rgba(220,50,30,0.95)) brightness(1.1); }
}
@keyframes vsAvatarPulse {
  0%,100% { transform: scale(1); box-shadow: 0 0 8px currentColor; }
  50%     { transform: scale(1.08); box-shadow: 0 0 20px currentColor; }
}
`

// Маппінг avatar id → колір glow
const AVATAR_GLOW = {
  av_gold:   '#c8950a',
  av_red:    '#c03020',
  av_blue:   '#2060c0',
  av_green:  '#1a8040',
  av_purple: '#7020a0',
  av_pulse:  '#c8950a',
}

function RikishiGlow({ glowColor, side }) {
  const anim = side === 'left'
    ? 'vsSlideLeft 0.6s cubic-bezier(0.34,1.25,0.64,1) both'
    : 'vsSlideRight 0.6s cubic-bezier(0.34,1.25,0.64,1) both'

  return (
    <div style={{
      flex: '0 0 min(35vw,220px)', height: '100%', zIndex: 6,
      animation: anim,
      transformOrigin: 'center bottom',
    }}>
      <div style={{
        width: '100%', height: '100%',
        animation: side === 'left'
          ? 'vsGoldGlow 3s ease-in-out 0.7s infinite'
          : 'vsRedGlow 3s ease-in-out 0.9s infinite',
      }}>
        <img
          src={side === 'left' ? '/images/vs/rikishi-player.webp' : '/images/vs/rikishi-opponent.webp'}
          alt=""
          style={{ width:'100%', height:'100%', objectFit:'contain', objectPosition:'bottom center', display:'block',
            filter: `drop-shadow(0 0 16px ${glowColor}88)`,
          }}
          onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block' }}
        />
        {/* SVG fallback */}
        {side === 'left' ? (
          <svg viewBox="0 0 110 150" style={{display:'none',width:'100%',height:'100%'}}>
            <circle cx="58" cy="20" r="17" fill={glowColor}/>
            <ellipse cx="50" cy="78" rx="30" ry="36" fill={glowColor} transform="rotate(-8 50 78)"/>
            <ellipse cx="82" cy="62" rx="9" ry="20" fill={glowColor} transform="rotate(-48 82 62)"/>
            <ellipse cx="70" cy="120" rx="13" ry="20" fill={glowColor} transform="rotate(-10 70 120)"/>
            <ellipse cx="32" cy="118" rx="12" ry="17" fill={glowColor} transform="rotate(16 32 118)"/>
          </svg>
        ) : (
          <svg viewBox="0 0 110 150" style={{display:'none',width:'100%',height:'100%'}}>
            <circle cx="52" cy="20" r="17" fill={glowColor}/>
            <ellipse cx="60" cy="78" rx="30" ry="36" fill={glowColor} transform="rotate(8 60 78)"/>
            <ellipse cx="28" cy="62" rx="9" ry="20" fill={glowColor} transform="rotate(48 28 62)"/>
            <ellipse cx="40" cy="120" rx="13" ry="20" fill={glowColor} transform="rotate(10 40 120)"/>
            <ellipse cx="78" cy="118" rx="12" ry="17" fill={glowColor} transform="rotate(-16 78 118)"/>
          </svg>
        )}
      </div>
    </div>
  )
}

export default function VSScreen({ playerLabel, opponentLabel, lang, playerAvatar, onDone }) {
  const [phase, setPhase] = useState(0)
  const playerGlow = AVATAR_GLOW[playerAvatar] || '#c8950a'
  const opponentGlow = '#a01818' // CPU завжди червоний

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 500)
    const t2 = setTimeout(() => setPhase(2), 950)
    const t3 = setTimeout(() => setPhase(3), 2800)
    const t4 = setTimeout(() => onDone?.(), 3450)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  return (
    <>
      <style>{VS_ANIM}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'radial-gradient(ellipse at 50% 42%, #1e1208 0%, #0a0805 55%, #050302 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        animation: phase >= 3 ? 'vsFadeOut 0.65s ease forwards' : undefined,
        overflow: 'hidden',
      }}>

        {/* Спалах */}
        <div style={{
          position: 'absolute', inset: 0, background: '#fff',
          animation: 'vsFlash 1.1s ease 0.35s both',
          pointerEvents: 'none', zIndex: 15,
        }}/>

        {/* Кільця */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 'min(88vw,540px)', height: 'min(88vw,540px)',
          marginLeft: 'calc(min(88vw,540px) / -2)',
          marginTop: 'calc(min(88vw,540px) / -2)',
          borderRadius: '50%',
          border: `1.5px solid ${playerGlow}55`,
          animation: 'vsRingPulse 2.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}/>

        {/* Арена */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          width: '100%', maxWidth: 800, height: 'min(56vw,360px)',
          position: 'relative', flexShrink: 0,
        }}>
          <RikishiGlow glowColor={playerGlow} side="left" />

          {/* VS — центр */}
          <div style={{
            flex: '0 0 min(22vw,140px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            alignSelf: 'center',
            zIndex: 3,
            paddingBottom: 'min(4vw,24px)',
          }}>
            {phase >= 1 && (
              <div style={{ animation: 'vsLogoPop 0.5s cubic-bezier(0.34,1.4,0.64,1) both' }}>
                <img src="/images/vs/vs-logo.webp" alt="VS"
                  style={{
                    width: '100%', height: 'auto', display: 'block',
                    filter: 'drop-shadow(0 0 28px rgba(200,50,10,0.75)) drop-shadow(0 6px 18px rgba(0,0,0,0.95))',
                  }}
                  onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block' }}
                />
                <div style={{
                  display:'none', fontFamily:'var(--jp)', fontSize:'min(12vw,80px)', fontWeight:900,
                  color:'#c83010', textShadow:'0 0 32px rgba(220,60,20,0.85)', lineHeight:1,
                }}>VS</div>
              </div>
            )}
          </div>

          <RikishiGlow glowColor={opponentGlow} side="right" />
        </div>

        {/* ХЕЙ-НАККЕ */}
        {phase >= 1 && (
          <div style={{
            fontFamily: 'var(--jp)', fontWeight: 900,
            fontSize: 'min(3.8vw,18px)',
            color: 'rgba(220,185,100,0.78)',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            textShadow: '0 0 18px rgba(200,160,60,0.45)',
            marginTop: '1rem', marginBottom: '1rem',
            animation: 'vsHeynakke 0.65s ease 0.25s both',
          }}>
            {lang === 'en' ? 'HEY-NAKKE!' : 'ХЕЙ-НАККЕ!'}
          </div>
        )}

        {/* Імена — однакова відстань через space-around */}
        {phase >= 2 && (
          <div style={{
            display: 'flex', width: '100%', maxWidth: 800,
            justifyContent: 'space-around',
            padding: '0 min(2vw,12px)',
            animation: 'vsNameIn 0.4s ease both',
            boxSizing: 'border-box',
          }}>
            <div style={{
              background: 'rgba(20,14,4,0.93)',
              border: `1px solid ${playerGlow}88`,
              borderRadius: 6,
              padding: 'clamp(6px,1.2vw,10px) clamp(14px,3vw,24px)',
              boxShadow: `0 0 18px ${playerGlow}20, 0 4px 18px rgba(0,0,0,0.8)`,
            }}>
              <div style={{
                fontFamily: 'var(--jp)', fontWeight: 900,
                fontSize: 'clamp(12px,2.8vw,18px)',
                color: playerGlow,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                textShadow: `0 0 12px ${playerGlow}99`,
                whiteSpace: 'nowrap',
              }}>{playerLabel}</div>
            </div>

            <div style={{
              background: 'rgba(20,5,5,0.93)',
              border: `1px solid ${opponentGlow}88`,
              borderRadius: 6,
              padding: 'clamp(6px,1.2vw,10px) clamp(14px,3vw,24px)',
              boxShadow: `0 0 18px ${opponentGlow}20, 0 4px 18px rgba(0,0,0,0.8)`,
            }}>
              <div style={{
                fontFamily: 'var(--jp)', fontWeight: 900,
                fontSize: 'clamp(12px,2.8vw,18px)',
                color: '#f08070',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                textShadow: '0 0 12px rgba(220,80,60,0.6)',
                whiteSpace: 'nowrap',
              }}>{opponentLabel}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
