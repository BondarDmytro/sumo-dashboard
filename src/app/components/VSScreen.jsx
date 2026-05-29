'use client'
import { useState, useEffect } from 'react'

const VS_ANIM = `
@keyframes vsEnterL {
  from { transform: translateX(-140%) }
  to   { transform: translateX(0) }
}
@keyframes vsEnterR {
  from { transform: translateX(140%) }
  to   { transform: translateX(0) }
}
@keyframes vsTextPop {
  0%   { transform: scale(0.2) rotate(-12deg); opacity: 0 }
  55%  { transform: scale(1.18) rotate(4deg);  opacity: 1 }
  75%  { transform: scale(0.95) rotate(-2deg) }
  100% { transform: scale(1)    rotate(0);     opacity: 1 }
}
@keyframes vsChargeL {
  0%   { transform: translateX(0) }
  100% { transform: translateX(48%) }
}
@keyframes vsChargeR {
  0%   { transform: translateX(0) }
  100% { transform: translateX(-48%) }
}
@keyframes vsImpactFlash {
  0%   { opacity: 0 }
  15%  { opacity: 1 }
  100% { opacity: 0 }
}
@keyframes vsShockwave {
  0%   { transform: translate(-50%,-50%) scale(0.1); opacity: 0.9 }
  100% { transform: translate(-50%,-50%) scale(4.5); opacity: 0 }
}
@keyframes vsShockwave2 {
  0%   { transform: translate(-50%,-50%) scale(0.1); opacity: 0.6 }
  100% { transform: translate(-50%,-50%) scale(3);   opacity: 0 }
}
@keyframes vsSpeedLine {
  0%   { transform: scaleX(0) translateY(-50%); opacity: 0 }
  20%  { opacity: 0.55 }
  100% { transform: scaleX(1) translateY(-50%); opacity: 0 }
}
@keyframes vsDust {
  0%   { transform: translate(0,0) scale(1);     opacity: 0.7 }
  100% { transform: translate(0,-45px) scale(0); opacity: 0 }
}
@keyframes vsGroundLine {
  0%   { transform: scaleX(0); opacity: 1 }
  100% { transform: scaleX(1); opacity: 0 }
}
@keyframes vsRikishiIdle {
  0%,100% { transform: translateY(0) }
  50%     { transform: translateY(-5px) }
}
@keyframes vsRikishiCharge {
  0%,100% { transform: translateY(0) scaleX(1) }
  30%     { transform: translateY(-8px) scaleX(1.06) }
  60%     { transform: translateY(3px)  scaleX(0.96) }
}
@keyframes vsNameSlide {
  from { transform: translateY(20px); opacity: 0 }
  to   { transform: translateY(0);    opacity: 1 }
}
@keyframes vsFadeOut {
  from { opacity: 1 }
  to   { opacity: 0 }
}
@keyframes vsScreenIn {
  from { opacity: 0 }
  to   { opacity: 1 }
}
@keyframes vsBgPulse {
  0%,100% { opacity: 0.06 }
  50%     { opacity: 0.12 }
}
@keyframes vsKanjiReveal {
  0%   { opacity: 0; transform: scale(1.4) }
  100% { opacity: 0.07; transform: scale(1) }
}
@keyframes vsLabelGlow {
  0%,100% { text-shadow: 0 0 20px rgba(240,192,96,0.4), 0 2px 8px rgba(0,0,0,0.9) }
  50%     { text-shadow: 0 0 40px rgba(240,192,96,0.8), 0 2px 8px rgba(0,0,0,0.9) }
}
`

// ── SVG рікіші — fallback якщо зображення відсутнє ───────────
function RikishiSilhouette({ color = '#c8a060', size = 180 }) {
  return (
    <svg viewBox="0 0 110 140" width={size} height={size * 1.27}
      style={{ display: 'block', overflow: 'visible' }}>
      <ellipse cx="62" cy="10" rx="7" ry="5" fill={color} />
      <circle cx="58" cy="26" r="18" fill={color} />
      <ellipse cx="50" cy="76" rx="30" ry="34" fill={color} transform="rotate(-12 50 76)" />
      <ellipse cx="50" cy="92" rx="26" ry="9" fill={color} opacity="0.6" />
      <ellipse cx="82" cy="62" rx="9" ry="20" fill={color} transform="rotate(-50 82 62)" />
      <circle cx="92" cy="48" r="9" fill={color} />
      <ellipse cx="18" cy="70" rx="8" ry="16" fill={color} transform="rotate(25 18 70)" />
      <ellipse cx="68" cy="118" rx="14" ry="20" fill={color} transform="rotate(-12 68 118)" />
      <ellipse cx="74" cy="137" rx="13" ry="8" fill={color} />
      <ellipse cx="30" cy="116" rx="13" ry="18" fill={color} transform="rotate(18 30 116)" />
      <ellipse cx="22" cy="133" rx="12" ry="7" fill={color} />
    </svg>
  )
}

// ── Рікіші з картинкою + SVG fallback ────────────────────────
// Показує img якщо файл є, інакше SVG силует
function RikishiImage({ src, svgColor, size = 200 }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <RikishiSilhouette color={svgColor} size={size} />
  return (
    <img
      src={src}
      alt=""
      style={{ width: size, height: 'auto', display: 'block', imageRendering: 'high-quality' }}
      onError={() => setFailed(true)}
    />
  )
}

// ── VS логотип з текстовим fallback ──────────────────────────
function VSLogo() {
  const [failed, setFailed] = useState(false)
  if (failed) return (
    <div style={{
      fontFamily: "'Noto Serif JP', serif",
      fontSize: 'clamp(3.5rem, 9vw, 7rem)',
      fontWeight: 900,
      color: '#f0c060',
      lineHeight: 1,
      letterSpacing: '0.08em',
      textShadow: `
        0 0 40px rgba(240,192,96,0.9),
        0 0 80px rgba(240,192,96,0.4),
        0 4px 12px rgba(0,0,0,1)
      `,
      animation: 'vsTextPop 0.5s cubic-bezier(.2,0,.2,1) both',
      position: 'relative', zIndex: 1,
    }}>
      VS
    </div>
  )
  return (
    <img
      src="/images/vs/vs-logo.webp"
      alt="VS"
      style={{
        width: 'clamp(120px, 18vw, 220px)',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        filter: 'drop-shadow(0 0 30px rgba(240,192,96,0.7))',
        animation: 'vsTextPop 0.5s cubic-bezier(.2,0,.2,1) both',
        position: 'relative', zIndex: 1,
      }}
      onError={() => setFailed(true)}
    />
  )
}

// ── Лінії швидкості ───────────────────────────────────────────
function SpeedLines({ side, active }) {
  if (!active) return null
  const lines = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    top: `${15 + i * 9}%`,
    width: `${55 + Math.random() * 30}%`,
    delay: `${i * 0.04}s`,
    opacity: 0.3 + Math.random() * 0.3,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {lines.map(l => (
        <div key={l.id} style={{
          position: 'absolute',
          top: l.top,
          [side === 'left' ? 'right' : 'left']: 0,
          width: l.width,
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(240,192,96,0.5))',
          transform: side === 'right' ? 'scaleX(-1)' : 'none',
          transformOrigin: side === 'right' ? 'left center' : 'right center',
          animation: `vsSpeedLine 0.35s ease ${l.delay} both`,
          opacity: l.opacity,
        }} />
      ))}
    </div>
  )
}

function DustParticles({ active }) {
  if (!active) return null
  const particles = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x: -40 + Math.random() * 80,
    y: -10 + Math.random() * 20,
    size: 6 + Math.random() * 14,
    delay: `${Math.random() * 0.2}s`,
    color: Math.random() > 0.5 ? 'rgba(240,192,96,0.5)' : 'rgba(255,255,255,0.25)',
  }))
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 5 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x, top: p.y,
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: p.color,
          animation: `vsDust 0.7s ease ${p.delay} both`,
        }} />
      ))}
    </div>
  )
}

function Shockwave({ active }) {
  if (!active) return null
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none', zIndex: 4 }}>
      <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '4px solid rgba(240,192,96,0.9)', animation: 'vsShockwave 0.7s ease both' }} />
      <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', animation: 'vsShockwave2 0.5s ease 0.1s both' }} />
    </div>
  )
}

// ── Головний компонент ────────────────────────────────────────
export default function VSScreen({ playerLabel, opponentLabel, lang, onDone }) {
  const [phase, setPhase] = useState(0)
  const t = (uk, en) => lang === 'en' ? en : uk

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 1400),
      setTimeout(() => setPhase(3), 2100),
      setTimeout(() => setPhase(4), 2500),
      setTimeout(() => onDone(), 2900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  const isCharging = phase >= 2
  const isImpact   = phase >= 3
  const isExit     = phase >= 4

  return (
    <>
      <style>{VS_ANIM}</style>

      <div style={{
        position: 'absolute', inset: 0, zIndex: 500,
        background: '#0a0604',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        animation: isExit ? 'vsFadeOut 0.45s ease both' : 'vsScreenIn 0.3s ease both',
      }}>

        {/* Фонова текстура */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(ellipse 80% 40% at 50% 75%, rgba(80,40,10,0.5) 0%, transparent 70%),
            radial-gradient(ellipse 100% 100% at 50% 50%, rgba(40,20,5,0.8) 0%, transparent 80%)
          `,
          pointerEvents: 'none',
        }} />

        {/* Кандзі водяний знак */}
        <div style={{
          position: 'absolute',
          fontSize: 'clamp(200px, 40vw, 380px)',
          fontFamily: "'Noto Serif JP', serif",
          fontWeight: 900,
          color: '#b8860b',
          userSelect: 'none', pointerEvents: 'none',
          animation: 'vsKanjiReveal 0.8s ease 0.2s both',
          lineHeight: 1,
        }}>対</div>

        {/* Підлога дохьо */}
        <div style={{
          position: 'absolute',
          bottom: '18%', left: '10%', right: '10%',
          height: 3,
          background: 'linear-gradient(90deg, transparent, rgba(184,134,11,0.35), transparent)',
          borderRadius: 2,
        }} />

        {isImpact && (
          <div style={{
            position: 'absolute',
            bottom: '18%', left: '35%', right: '35%',
            height: 3,
            background: 'rgba(240,192,96,0.9)',
            transformOrigin: 'center',
            animation: 'vsGroundLine 0.5s ease both',
            boxShadow: '0 0 12px rgba(240,192,96,0.8)',
          }} />
        )}

        {/* ── Лівий рікіші (гравець) ── */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0, bottom: 0, width: '42%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: isCharging
            ? 'vsChargeL 0.55s cubic-bezier(.4,0,.2,1) both'
            : 'vsEnterL 0.5s cubic-bezier(.2,0,.2,1) both',
          overflow: 'hidden',
        }}>
          <SpeedLines side="left" active={isCharging && !isImpact} />
          <div style={{
            position: 'relative', zIndex: 2,
            animation: isCharging ? 'vsRikishiCharge 0.2s ease infinite' : 'vsRikishiIdle 1.8s ease infinite',
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 8px 24px rgba(184,134,11,0.4))',
          }}>
            <RikishiImage
              src="/images/vs/rikishi-player.webp"
              svgColor="#c8a060"
              size={200}
            />
          </div>
          <div style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
            fontWeight: 900, color: '#f0c060',
            textAlign: 'center', letterSpacing: '0.12em', textTransform: 'uppercase',
            animation: 'vsNameSlide 0.4s ease 0.3s both, vsLabelGlow 2s ease infinite',
            padding: '0.4rem 1rem',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(184,134,11,0.35)',
            borderRadius: 4, backdropFilter: 'blur(4px)',
            position: 'relative', zIndex: 2,
          }}>
            {playerLabel}
          </div>
        </div>

        {/* ── Правий рікіші (суперник) ── */}
        <div style={{
          position: 'absolute',
          right: 0, top: 0, bottom: 0, width: '42%',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: isCharging
            ? 'vsChargeR 0.55s cubic-bezier(.4,0,.2,1) both'
            : 'vsEnterR 0.5s cubic-bezier(.2,0,.2,1) both',
          overflow: 'hidden',
        }}>
          <SpeedLines side="right" active={isCharging && !isImpact} />
          {/* Анімація на зовнішньому div, flip — на внутрішньому. Інакше animation переписує transform */}
          <div style={{
            position: 'relative', zIndex: 2,
            animation: isCharging ? 'vsRikishiCharge 0.2s ease infinite' : 'vsRikishiIdle 1.8s ease 0.4s infinite',
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 8px 24px rgba(140,30,30,0.5))',
          }}>
            <RikishiImage
              src="/images/vs/rikishi-opponent.webp"
              svgColor="#c06050"
              size={200}
            />
          </div>
          <div style={{
            fontFamily: "'Noto Serif JP', serif",
            fontSize: 'clamp(0.75rem, 2vw, 1rem)',
            fontWeight: 900, color: '#e07060',
            textAlign: 'center', letterSpacing: '0.12em', textTransform: 'uppercase',
            animation: 'vsNameSlide 0.4s ease 0.4s both',
            padding: '0.4rem 1rem',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(192,60,40,0.35)',
            borderRadius: 4, backdropFilter: 'blur(4px)',
            position: 'relative', zIndex: 2,
          }}>
            {opponentLabel}
          </div>
        </div>

        {/* ── VS по центру ── */}
        {phase >= 1 && (
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10, textAlign: 'center', pointerEvents: 'none',
          }}>
            {/* Підсвічування */}
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              width: 180, height: 180, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(184,134,11,0.25) 0%, transparent 70%)',
              animation: 'vsBgPulse 1.5s ease infinite',
            }} />

            {/* VS — картинка або текстовий fallback */}
            <VSLogo />

            {/* Підпис */}
            <div style={{
              fontFamily: "'Noto Serif JP', serif",
              fontSize: 'clamp(0.6rem, 1.5vw, 0.8rem)',
              fontWeight: 700,
              color: 'rgba(255,200,80,0.65)',
              letterSpacing: '0.35em', textTransform: 'uppercase',
              marginTop: '0.4rem',
              animation: 'vsNameSlide 0.4s ease 0.5s both',
            }}>
              {t('Хей-накке!', 'Heiya-nakke!')}
            </div>
          </div>
        )}

        <Shockwave active={isImpact} />
        <DustParticles active={isImpact} />

        {isImpact && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 50% 45%, rgba(255,240,150,0.95) 0%, rgba(240,160,20,0.4) 40%, transparent 70%)',
            animation: 'vsImpactFlash 0.45s ease both',
            pointerEvents: 'none', zIndex: 8,
          }} />
        )}

        {/* Декоративна рамка */}
        {[0, 1].map(side => (
          <div key={side} style={{
            position: 'absolute', top: 0, bottom: 0,
            [side === 0 ? 'left' : 'right']: 0,
            width: 3,
            background: 'linear-gradient(180deg, transparent, rgba(184,134,11,0.4), transparent)',
          }} />
        ))}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(184,134,11,0.4), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, rgba(184,134,11,0.3), transparent)' }} />

      </div>
    </>
  )
}
