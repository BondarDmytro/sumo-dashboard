'use client'
/* countdown_x2c */
/* countdown_x2b */
/* countdown_x2 */
// Зворотний відлік до старту башьо: dd:hh:mm:ss + час старту в JST і локальному часі глядача.
// basho_countdown_v1
import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

function pad(n) { return String(n).padStart(2, '0') }

export default function BashoCountdown({ startUtcMs, bashoLabel }) {
  const { lang } = useLang()
  const [now, setNow] = useState(null) // null до маунта — проти hydration mismatch

  useEffect(() => {
    setNow(Date.now())
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  if (now === null) return null
  const diff = startUtcMs - now
  if (diff <= 0) return null

  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)

  const startDate = new Date(startUtcMs)
  const jst = startDate.toLocaleString(lang === 'en' ? 'en-GB' : lang === 'ja' ? 'ja-JP' : 'uk-UA', {
    timeZone: 'Asia/Tokyo', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })
  const local = startDate.toLocaleString(lang === 'en' ? 'en-GB' : lang === 'ja' ? 'ja-JP' : 'uk-UA', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  const cell = { textAlign: 'center', minWidth: 52 }
  const num = { fontFamily: 'monospace', fontSize: 'clamp(1.35rem, 6vw, 2.2rem)', fontWeight: 800, color: '#f0c060', lineHeight: 1 }
  const lab = { fontFamily: 'monospace', fontSize: 'clamp(0.5rem, 1.8vw, 0.7rem)', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b8c7c8', marginTop: 4 }

  return (
    <div className="cd-outer" style={{ marginTop: '0.9rem' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#b8c7c8', marginBottom: 8 }}>
        {t3(lang, `До старту — ${bashoLabel}`, `Countdown — ${bashoLabel}`, `開始まで — ${bashoLabel}`)}
      </div>
      <div className="cd-wrap" style={{ display: 'flex', gap: 'clamp(4px, 1.6vw, 10px)', alignItems: 'center', flexWrap: 'nowrap' /* countdown_fluid_v1 */ }}>
        <div style={cell}><div style={num}>{pad(d)}</div><div style={lab}>{t3(lang,'днів','days','日')}</div></div>
        <div style={{ ...num, opacity: 0.4 }}>:</div>
        <div style={cell}><div style={num}>{pad(h)}</div><div style={lab}>{t3(lang,'год','hrs','時間')}</div></div>
        <div style={{ ...num, opacity: 0.4 }}>:</div>
        <div style={cell}><div style={num}>{pad(m)}</div><div style={lab}>{t3(lang,'хв','min','分')}</div></div>
        <div style={{ ...num, opacity: 0.4 }}>:</div>
        <div style={cell}><div style={num}>{pad(s)}</div><div style={lab}>{t3(lang,'сек','sec','秒')}</div></div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#6b6560', marginTop: 10 }}>
        <div>🇯🇵 {jst} JST</div>  {/* jst_two_lines */}
        <div style={{marginTop: 2}}>🕐 {t3(lang, 'у вас', 'your time', '現地')}: {local}</div>
      </div>
    </div>
  )
}
