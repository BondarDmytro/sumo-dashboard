'use client'
import { shortRank } from '../lib/bashoCalendar' /* tk_shortrank */ /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { useFavorites } from './useFavorites' /* fav_row_v1 */

const RANK_ORDER = ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi', 'Maegashira']

function getRankValue(rank) {
  if (!rank) return 999
  const idx = RANK_ORDER.findIndex(r => rank.includes(r))
  const num = parseInt(rank.match(/\d+/)?.[0] || '0')
  const side = rank.includes('East') ? 0 : 1
  return idx * 100 + num * 2 + side
}

export default function TorikumiView({ division = null, /* division_torikumi_v1 */ currentDay, bios = {}, rikishi = [] }) {
  const [isMobile, setIsMobile] = useState(false)  /* tk_shortrank */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const { isFav } = useFavorites()  /* fav_row_v1 */
  const { lang } = useLang()
  const [matches, setMatches] = useState([])
  const [h2hData, setH2hData] = useState({})
  const [loading, setLoading] = useState(true)
  const nextDay = currentDay
  /* tk_live_v1: pershyi bii bez rezultatu = na dokhio zaraz (±1 bii, lah API) */
  const jstH = (new Date().getUTCHours() + 9) % 24
  const liveWindow = jstH >= 8 && jstH < 19
  useEffect(() => {  /* url_listen_v1 */
    const scrollIf = () => {
      if (new URLSearchParams(window.location.search).get('tab') !== 'torikumi') return
      setTimeout(() => document.getElementById('tk-live-row')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
    }
    scrollIf()
    window.addEventListener('livenav', scrollIf)
    return () => window.removeEventListener('livenav', scrollIf)
  }, [])
  const liveMatchId = liveWindow ? [...(matches || [])].sort((a,b) => a.matchNo - b.matchNo).find(m => !m.winnerEn)?.id : null

  useEffect(() => {  /* tk_poll_v1: u vikni boiv onovliuiemo TILKY matches (bez H2H - vin statychnyi za den) kozhni 90s */
    const tick = () => {
      const jm = (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 540) % 1440
      if (jm < 480 || jm > 1125) return
      fetch(`/api/torikumi?day=${nextDay}&division=${division || 'Makuuchi'}`)
        .then(r => r.json())
        .then(d => { if (Array.isArray(d) && d.length) setMatches(d) })
        .catch(() => {})
    }
    const t = setInterval(tick, 90000)
    return () => clearInterval(t)
  }, [nextDay, division])

  useEffect(() => {
    if (nextDay > 15) { setLoading(false); return }
    fetch(`/api/torikumi?day=${nextDay}&division=${division || 'Makuuchi'}`)  /* division_torikumi_v1 */
      .then(r => r.json())
      .then(async d => {
        setMatches(d)
        // Завантажуємо H2H для всіх пар паралельно
        const h2hResults = {}
        await Promise.all(d.map(async m => {
          try {
            const res = await fetch(`/api/h2h?id1=${m.eastId}&id2=${m.westId}`)
            const data = await res.json()
            h2hResults[`${m.eastId}-${m.westId}`] = data
          } catch {}
        }))
        setH2hData(h2hResults)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [nextDay, division])

  if (nextDay > 15) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {t3(lang, 'Турнір завершено', 'Tournament is over', '場所終了')}
    </div>
  )

  if (loading) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {t3(lang, 'Завантаження...', 'Loading...', '読み込み中...')}
    </div>
  )

  if (!matches.length) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
      {lang === 'ja' ? `${nextDay}日目の取組は未発表` : lang === 'en' ? `Schedule for day ${nextDay} not yet available` : `Розклад на день ${nextDay} ще не сформовано`}
    </div>
  )

  const rikishiMap = {}
  rikishi.forEach(r => { rikishiMap[r.name] = r })

  const isSanyaku = (rank) =>
    ['Yokozuna','Ozeki','Sekiwake','Komusubi'].some(r => rank?.includes(r))

const getSanyakuRank = (m) => {
    const e = getRankValue(m.eastRank)
    const w = getRankValue(m.westRank)
    if (isSanyaku(m.eastRank) && isSanyaku(m.westRank)) return Math.min(e, w)
    if (isSanyaku(m.eastRank)) return e
    return w
  }

const sanyaku = matches
    .filter(m => isSanyaku(m.eastRank) || isSanyaku(m.westRank))
    .sort((a, b) => b.matchNo - a.matchNo)

  const maegashira = matches
    .filter(m => !isSanyaku(m.eastRank) && !isSanyaku(m.westRank))
    .sort((a, b) => b.matchNo - a.matchNo)

  const renderMatch = (m) => {
    const eastFlag = bios[m.eastId]?.country?.flag || '🇯🇵'
    const westFlag = bios[m.westId]?.country?.flag || '🇯🇵'
    const hasResult = !!m.winnerId
    const eastWon = hasResult && m.winnerId === m.eastId
    const westWon = hasResult && m.winnerId === m.westId

    const eastR = rikishiMap[m.eastShikona]
    const westR = rikishiMap[m.westShikona]

    const h2h = h2hData[`${m.eastId}-${m.westId}`]
    const hasH2H = h2h && h2h.total > 0

    return (
      <div key={m.id} id={m.id === liveMatchId ? "tk-live-row" : undefined} className={"tk-match" + (m.id === liveMatchId ? " tk-live" : "") + ((isFav(m.eastId) || isFav(m.westId)) ? " fav-row" : "")} style={{
        display:'grid',
        gridTemplateColumns: isMobile ? '12px 1fr 64px 1fr' : '16px 1fr 96px 1fr',  /* tk_mobile_full_v1 */  /* tk_compact_v1 + tk_matchno_v1 */
        gap:4,
        padding:'0.6rem 1rem',
        borderBottom:'1px solid var(--border)',
        alignItems:'center',
      }}>
        <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)',textAlign:'left'}}>{m.matchNo}</div>{/* tk_matchno_v1 */}
        {/* East */}
        <div style={{display:'grid',gridTemplateColumns: (hasResult && !isMobile) ? 'auto minmax(0,1fr) auto auto 14px' : 'auto minmax(0,1fr) auto auto',gap:4,alignItems:'center',minWidth:0,opacity: hasResult && !eastWon ? 0.4 : 1}}>{/* tk_cols_v2: rank | name | flag | score | (circle) */}
          <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',whiteSpace:'nowrap'}}>{shortRank(m.eastRank, lang)}{/* tk_shortrank_all_v1 */}</span>
          <span style={{fontWeight: eastWon ? 800 : 600,fontSize: isMobile ? '0.62rem' : '0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textAlign:'center'}}>{lang === 'ja' && eastR?.nameJp ? eastR.nameJp : m.eastShikona}</span>  {/* tk_name_center_v1 */}
          <span style={{fontSize: isMobile ? '0.7rem' : '0.85rem'}}>{eastFlag}</span>
          <span style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:600,whiteSpace:'nowrap',color: eastR && eastR.wins >= 8 ? '#1a6b5c' : eastR && eastR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>{eastR ? eastR.wins + '–' + eastR.losses : ''}</span>
          {hasResult && !isMobile && (
            <span style={{width:10,height:10,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid var(--ink)',boxSizing:'border-box',display:'inline-block',visibility: eastWon ? 'visible' : 'hidden'}} />
          )}
        </div>

        {/* Center */}
        <div style={{textAlign:'center'}}>
          {hasResult ? (
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:4}}>
              {m.kimarite}
            </div>
          ) : (
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--light)',marginBottom:4}}>vs</div>
          )}
          {hasH2H && (
            <div style={{
              fontFamily:'monospace',fontSize:'0.58rem',
              color:'var(--mid)',
              display:'flex',alignItems:'center',justifyContent:'center',gap:4,
            }}>
              <span style={{color: h2h.wins1 > h2h.wins2 ? '#1a6b5c' : h2h.wins1 < h2h.wins2 ? '#c0392b' : 'var(--mid)',fontWeight:700}}>
                {h2h.wins1}
              </span>
              <span style={{color:'var(--light)'}}>–</span>
              <span style={{color: h2h.wins2 > h2h.wins1 ? '#1a6b5c' : h2h.wins2 < h2h.wins1 ? '#c0392b' : 'var(--mid)',fontWeight:700}}>
                {h2h.wins2}
              </span>
              <span style={{color:'var(--light)',fontSize:'0.52rem'}}>({h2h.total})</span>
            </div>
          )}
        </div>

        {/* West */}
        <div style={{display:'grid',gridTemplateColumns: (hasResult && !isMobile) ? '14px auto auto minmax(0,1fr) auto' : 'auto auto minmax(0,1fr) auto',gap:4,alignItems:'center',minWidth:0,opacity: hasResult && !westWon ? 0.4 : 1}}>{/* tk_cols_v2: (circle) | score | flag | name | rank */}
          {hasResult && !isMobile && (
            <span style={{width:10,height:10,borderRadius:'50%',background:'#f5f0e8',border:'1.5px solid var(--ink)',boxSizing:'border-box',display:'inline-block',visibility: westWon ? 'visible' : 'hidden'}} />
          )}
          <span style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:600,whiteSpace:'nowrap',color: westR && westR.wins >= 8 ? '#1a6b5c' : westR && westR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>{westR ? westR.wins + '–' + westR.losses : ''}</span>
          <span style={{fontSize: isMobile ? '0.7rem' : '0.85rem'}}>{westFlag}</span>
          <span style={{fontWeight: westWon ? 800 : 600,fontSize: isMobile ? '0.62rem' : '0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textAlign:'center'}}>{lang === 'ja' && westR?.nameJp ? westR.nameJp : m.westShikona}</span>  {/* tk_name_center_v1 */}
          <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',whiteSpace:'nowrap'}}>{shortRank(m.westRank, lang)}{/* tk_shortrank_all_v1 */}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {sanyaku.length > 0 && (
        <div style={{marginBottom:'0.5rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid #b8860b',marginBottom:1}}>
            {t3(lang, "Сан'яку", "San'yaku", "三役")}
          </div>
          <div className="tk-list">{sanyaku.map(m => renderMatch(m))}</div>{/* tk_compact_v1 */}
        </div>
      )}
      {maegashira.length > 0 && (
        <div>
          <div style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',padding:'0.4rem 1rem',background:'var(--bg2)',borderLeft:'3px solid var(--border)',marginBottom:1}}>
            Maegashira
          </div>
          <div className="tk-list">{maegashira.map(m => renderMatch(m))}</div>
        </div>
      )}
    </div>
  )
}