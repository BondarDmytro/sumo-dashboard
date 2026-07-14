'use client'
/* live_now_v2: potochnyi bii bud-yakoho dyvizionu. Khronolohiia dnia: Jonokuchi -> ... -> Makuuchi.
   Pershyi dyvizion iz nezihranym boiem = na dokhio zaraz. Polling 60s, vikno 08:00-18:30 JST. */
import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { usePathname, useRouter } from 'next/navigation' /* live_click_v1 */
import { currentBashoId, bashoInfo } from '../lib/bashoCalendar'
import meta from '../lib/rikishiMeta.json' /* live_ja_v1 */

const DIVS = ['Jonokuchi', 'Jonidan', 'Sandanme', 'Makushita', 'Juryo', 'Makuuchi']
const DIV_LABEL = { Jonokuchi: '序ノ口', Jonidan: '序二段', Sandanme: '三段目', Makushita: '幕下', Juryo: '十両', Makuuchi: '幕内' }

export default function LiveNow({ currentDay: dayProp = null }) {
  /* den rakhuiemo sami: (zaraz - start) / doba + 1 */
  const bi = bashoInfo(currentBashoId())
  const currentDay = dayProp ?? Math.min(15, Math.max(1, Math.floor((Date.now() - bi.startUtcMs) / 86400000) + 1))
  const { lang } = useLang()
  const [live, setLive] = useState(null)
  const path = usePathname()
  const router = useRouter()
  const _seg = (path || '').split('/')[1]
  const langPrefix = ['uk','en','ja'].includes(_seg) ? '/' + _seg : ''
  const goLive = () => {  /* live_click_v3: push + podiia dlia toho zh pathname */
    router.push(langPrefix + '/?tab=torikumi' + (live?.division ? '&div=' + live.division : ''))
    setTimeout(() => window.dispatchEvent(new Event('livenav')), 150)
  }

  useEffect(() => {
    let stop = false
    async function poll() {
      try {
        const utc = new Date()
        const jstMin = (utc.getUTCHours() * 60 + utc.getUTCMinutes() + 540) % 1440
        if (jstMin < 480 || jstMin > 1110) { if (!stop) setLive(null); return }  // 08:00-18:30 JST
        const results = await Promise.all(DIVS.map(d =>
          fetch(`/api/torikumi?division=${d}&day=${currentDay}`).then(r => r.json()).catch(() => [])
        ))
        /* live_detect_v2: divizion "u rozpali" (ye i zihrani, i nezihrani) maie priorytet -
           zavysli cherez lah API boi molodshykh dyvizioniv ne blokuiut perekhid do starshykh */
        let found = null, fallback = null
        for (let i = DIVS.length - 1; i >= 0; i--) {  // vid Makuuchi vnyz
          const ms = Array.isArray(results[i]) ? results[i] : []
          const sorted = [...ms].sort((a, b) => a.matchNo - b.matchNo)
          const next = sorted.find(m => !m.winnerEn)
          if (!next) continue
          const hasPlayed = sorted.some(m => m.winnerEn)
          if (hasPlayed) { found = { ...next, division: DIVS[i] }; break }  // rozpal - naistarshyi peremagaie
          if (!fallback) fallback = { ...next, division: DIVS[i] }  // shche ne pochavsia - kandydat
        }
        if (!found && fallback) {
          // zhodnoho "v rozpali": berem NAIMOLODSHYI divizion sered nepochatykh (ranok - Jonokuchi pershyi)
          for (let i = 0; i < DIVS.length; i++) {
            const ms = Array.isArray(results[i]) ? results[i] : []
            const next = [...ms].sort((a, b) => a.matchNo - b.matchNo).find(m => !m.winnerEn)
            if (next) { found = { ...next, division: DIVS[i] }; break }
          }
        }
        if (!stop) setLive(found)
      } catch { if (!stop) setLive(null) }
    }
    poll()
    const t = setInterval(poll, 60000)
    return () => { stop = true; clearInterval(t) }
  }, [currentDay])

  if (!live) return null
  const divLabel = lang === 'ja' ? DIV_LABEL[live.division] : live.division
  /* live_ja_v1: yaponski shikony z mety po id */
  const jaName = (id, fallback) => {
    if (lang !== 'ja') return fallback
    const rec = meta.find(m => Number(m.id) === Number(id))
    return (rec?.nameJp && rec.nameJp.split(/\s/)[0]) || fallback
  }
  return (
    <div className="live-now" onClick={goLive} role="button" title="\u2192 torikumi" style={{cursor:'pointer',display:'flex',alignItems:'center',gap:7,fontFamily:'monospace',fontSize:'0.72rem',whiteSpace:'nowrap'}}>
      <span className="live-dot" />
      <span style={{color:'#fb5050',fontWeight:700,letterSpacing:'0.08em'}}>{lang === 'ja' ? '\u30e9\u30a4\u30d6' : 'LIVE'}</span>
      <span style={{color:'#f5f0e8'}}>{jaName(live.eastId, live.eastShikona)}</span>
      <span style={{color:'#8a8a8a'}}>{lang === 'ja' ? '\u5bfe' : 'vs'}</span>
      <span style={{color:'#f5f0e8'}}>{jaName(live.westId, live.westShikona)}</span>
      <span style={{color:'#b8860b',fontSize:'0.62rem'}}>{divLabel}</span>
    </div>
  )
}
