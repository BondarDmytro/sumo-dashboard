'use client'
// Глобальна сіль по кліку: слухає document, fixed-overlay, desktop-only. global_salt_v1
// Логіка крупинок відтворена за SaltClickBurst (sumoclash), але з clientX/Y без rect.
import { useEffect, useState, useRef } from 'react'

export default function GlobalSalt() {
  const [bursts, setBursts] = useState([])
  const [on, setOn] = useState(false)
  const idRef = useRef(0)
  useEffect(() => { setOn(window.matchMedia('(pointer: fine)').matches) }, [])
  useEffect(() => {
    if (!on) return
    const onClick = (e) => {
      if (e.target.closest('button, a, input, textarea, select, label, img, svg, [role="button"], [contenteditable], [data-no-salt]')) return
      const x = e.clientX
      const y = e.clientY
      const n = 8 + Math.floor(Math.random() * 5)
      const grains = Array.from({ length: n }, (_, i) => {
        const ang = Math.random() * Math.PI * 2
        const dist = 18 + Math.random() * 42
        return {
          gid: i,
          tx: (Math.cos(ang) * dist) + 'px',
          ty: (Math.sin(ang) * dist * 0.6 + 24 + Math.random() * 30) + 'px',
          size: (3 + Math.random() * 4) + 'px',
          delay: (Math.random() * 0.05) + 's',
        }
      })
      const id = idRef.current++
      setBursts(b => [...b, { id, x, y, grains }])
      setTimeout(() => setBursts(b => b.filter(z => z.id !== id)), 950)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [on])
  if (!on) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 9998 }}>
      <style>{`@keyframes saltClickFall { 0% { transform: translate(0,0) scale(1); opacity: 1; } 70% { opacity: 0.9; } 100% { transform: translate(var(--tx), var(--ty)) scale(0.6); opacity: 0; } }`}</style>  {/* salt_inline_keyframes_v1 */}
      {bursts.map(b => (
        <div key={b.id} style={{ position: 'absolute', top: b.y, left: b.x, width: 0, height: 0 }}>
          {b.grains.map(g => (
            <div key={g.gid} style={{
              position: 'absolute', top: 0, left: 0, width: g.size, height: g.size,
              borderRadius: '50%', background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 0 3px rgba(255,255,255,0.7)',
              '--tx': g.tx, '--ty': g.ty,
              animation: 'saltClickFall 0.9s ease-out ' + g.delay + ' both',
            }} />
          ))}
        </div>
      ))}
    </div>
  )
}
