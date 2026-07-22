'use client'
/* first_meeting_v1 tk_ja_widths_v1 */
/* rank_color_tk_v1 rank_pill_tk_v2 */
import { shortRank, bashoInfo } from '../lib/bashoCalendar' /* tk_shortrank */ /* pickem_panel_v1 */
import { rankColor } from '../lib/rankColors' /* rank_color_tk_v1 */
import { usePicks, pickDeadlineUtcMs } from './usePicks'
import PickemBoard from './PickemBoard' /* pickem_board_wire_v1 */ /* ja_batch2_t */
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

export default function TorikumiView({ division = null, /* division_torikumi_v1 */ currentDay, bios = {}, rikishi = [], pickem = false, pickemScore = false, bashoId = null })  /* pickem_score_v1 */  /* pickem_panel_v1 */ {
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
  /* pickem_panel_v1: shchodenni prohnozy */
  const { uid: pickUid, myPicks, submit } = usePicks((pickem || pickemScore) ? bashoId : null, currentDay)
  const [boardOpen, setBoardOpen] = useState(false)  /* pickem_board_wire_v1 */
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const locked = pickem && myPicks && Object.keys(myPicks).length > 0
  /* pickem_score_v1: rakhunok dnia z rezultatamy */
  const scoreMode = pickemScore && myPicks && Object.keys(myPicks).length > 0
  const scored = scoreMode ? matches.filter(m => m.winnerId && myPicks[m.matchNo]) : []
  const hits = scored.filter(m => Number(myPicks[m.matchNo]) === Number(m.winnerId)).length
  const pickMark = (matchNo, rid) => {
    if (!scoreMode) return null
    const my = Number(myPicks[matchNo] || 0)
    if (my !== Number(rid)) return null
    const m2 = matches.find(x => x.matchNo === matchNo)
    if (!m2 || !m2.winnerId) return <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{'\u25cb'}</span>
    return Number(m2.winnerId) === my
      ? <span style={{fontFamily:'monospace',fontSize:'0.66rem',color:'#1a4a7a',fontWeight:800}}>{'\u2713'}</span>
      : <span style={{fontFamily:'monospace',fontSize:'0.66rem',color:'var(--mid)'}}>{'\u2717'}</span>
  }
  const deadlineMs = pickem && bashoId ? pickDeadlineUtcMs(bashoInfo(bashoId).startUtcMs, currentDay) : 0
  const deadlinePast = pickem && Date.now() > deadlineMs
  const pickOf = (matchNo) => locked ? Number(myPicks[matchNo] || 0) : Number(draft[matchNo] || 0)
  const togglePick = (matchNo, rid) => {
    if (!pickem || locked || deadlinePast) return
    setDraft(d => { const n = { ...d }; if (Number(n[matchNo]) === rid) delete n[matchNo]; else n[matchNo] = rid; return n })
  }
  const isSynthetic = matches.length > 0 && !!matches[0].synthetic  /* pickem_synth_guard_v1 */
  const fixPicks = async () => {
    if (saving || isSynthetic || !Object.keys(draft).length) return
    if (!window.confirm(t3(lang, 'Прогноз не можна буде змінити. Фіксуємо?', 'Picks cannot be changed later. Lock in?', '予想は変更できません。確定しますか？'))) return
    setSaving(true)
    const res = await submit(draft)
    setSaving(false)
    if (!res.ok) window.alert(t3(lang, 'Не вдалося зберегти: ', 'Failed to save: ', '保存に失敗: ') + res.err)
  }
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
    <div>
      {pickem && (  /* pickem_empty_v1: anons prohnoziv poky rozkladu nema */
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'0.55rem 1rem',marginBottom:8,background:'rgba(41,128,185,0.08)',border:'1px solid rgba(41,128,185,0.35)',borderRadius:3,fontFamily:'monospace',fontSize:'0.66rem',color:'var(--mid)'}}>
          <span>🎯</span>
          <span>{t3(lang, "Щойно з'явиться розклад — тут можна буде вгадати переможців сан'яку", "Once the schedule is out, you can pick the san'yaku winners here", '取組発表後、ここで三役の勝者を予想できます')}</span>
        </div>
      )}
      <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)',fontSize:'0.8rem'}}>
        {lang === 'ja' ? `${nextDay}日目の取組は未発表` : lang === 'en' ? `Schedule for day ${nextDay} not yet available` : `Розклад на день ${nextDay} ще не сформовано`}
      </div>
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
    const pickable = pickem && !locked && !deadlinePast  /* pickem_all_affordance_v1: vsi pary makuuchi */ /* pickem_dev_test_v1 TMP - VYDALYTY: povernuty !hasResult */  /* pickem_panel_v1 */
    const pickedId = pickem ? pickOf(m.matchNo) : 0
    const eMark = pickem || pickemScore ? pickMark(m.matchNo, m.eastId) : null  /* pickem_score_v1 */
    const wMark = pickem || pickemScore ? pickMark(m.matchNo, m.westId) : null
    const pickStyle = (rid) => pickedId === rid
      ? { background: 'rgba(41,128,185,0.16)', boxShadow: 'inset 0 0 0 2px #1a4a7a', borderRadius: 3, padding: '2px 4px' } /* pickem_blue_v1 */
      : pickable
        ? { boxShadow: 'inset 0 0 0 1px rgba(41,128,185,0.45)', background: 'rgba(41,128,185,0.05)', borderRadius: 3, padding: '2px 4px' } /* pickem_blue_v1 */
        : {}  /* pickem_all_affordance_v1: nevybrani klikabelni - punktyrno-zolota afordnist */

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
        <div style={{display:'grid',gridTemplateColumns: ((hasResult || eMark) ? (isMobile ? 'auto minmax(0,1fr) auto auto 12px' : (lang === 'ja' ? '56px minmax(0,1fr) 22px 40px 14px' : '42px minmax(0,1fr) 22px 40px 14px')) : (isMobile ? 'auto minmax(0,1fr) auto auto' : (lang === 'ja' ? '56px minmax(0,1fr) 22px 40px' : '42px minmax(0,1fr) 22px 40px')))  /* tk_cols_v4 */,gap:4,alignItems:'center',minWidth:0,opacity: hasResult && !eastWon ? 0.4 : 1,cursor: pickable ? 'pointer' : 'default'}} /* pickem_name_frame_v1 */ onClick={pickable ? () => togglePick(m.matchNo, m.eastId) : undefined}>{/* tk_cols_v2 + pickem_panel_v1 */}
          <span style={{fontFamily:'monospace',fontSize: isMobile ? '0.52rem' : '0.56rem',color:rankColor(m.eastRank),fontWeight:700,background:rankColor(m.eastRank)+'2e',padding:'1px 4px',borderRadius:2,whiteSpace:'nowrap',textAlign:'center',width:'fit-content',margin:'0 auto'}}  /* tk_pill_fit_v2 */>{shortRank(m.eastRank, lang)}</span>
          <span style={{fontWeight: eastWon ? 800 : 600,fontSize: isMobile ? '0.54rem' : '0.88rem',whiteSpace:'nowrap' /* tk_name_fit_v1 */,textAlign:'center',...pickStyle(m.eastId)}}>{lang === 'ja' ? String(eastR?.nameJp || m.eastJp || m.eastShikona).split('\u3000')[0] : m.eastShikona}{/* tk_jp_fallback_v1 */}</span>{/* tk_cols_v4: ja - lyshe shikona */}{/* tk_mob_badge_col_v1: beidzh vynos u kolonku */}  {/* tk_name_center_v1 */}
          <span style={{fontSize: isMobile ? '0.7rem' : '0.85rem',textAlign:'center'}}>{eastFlag}</span>
          <span style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:600,whiteSpace:'nowrap',color: eastR && eastR.wins >= 8 ? '#1a6b5c' : eastR && eastR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>{eastR ? eastR.wins + '–' + eastR.losses : ''}</span>
          {(hasResult || eMark) && (
            eMark
              ? <span style={{textAlign:'center'}}>{eMark}</span>
              : (!isMobile
                ? <span title={m.kimarite === 'fusen' ? 'fusen' : undefined} style={{width:10,height:10,borderRadius: m.kimarite === 'fusen' ? 0 : '50%',background: eastWon ? '#f5f0e8' : '#0f0e0c',border:'1.5px solid var(--ink)',boxSizing:'border-box',display:'inline-block',margin:'0 auto'}} />
                : <span />)
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
          {hasH2H ? (
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
          ) : (
            <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'var(--light)',textAlign:'center',fontStyle:'italic'}}>
              {t3(lang, 'перша зустріч', 'first meeting', '初対戦')}
            </div>
          )}
        </div>

        {/* West */}
        <div style={{display:'grid',gridTemplateColumns: ((hasResult || wMark) ? (isMobile ? '12px auto auto minmax(0,1fr) auto' : (lang === 'ja' ? '14px 56px 22px minmax(0,1fr) 40px' : '14px 42px 22px minmax(0,1fr) 40px')) : (isMobile ? 'auto auto minmax(0,1fr) auto' : (lang === 'ja' ? '56px 22px minmax(0,1fr) 40px' : '42px 22px minmax(0,1fr) 40px')))  /* tk_cols_v4 */,gap:4,alignItems:'center',minWidth:0,opacity: hasResult && !westWon ? 0.4 : 1,cursor: pickable ? 'pointer' : 'default'}} onClick={pickable ? () => togglePick(m.matchNo, m.westId) : undefined}>{/* tk_cols_v2 + pickem_panel_v1 */}
          {(hasResult || wMark) && (
            wMark
              ? <span style={{textAlign:'center'}}>{wMark}</span>
              : (!isMobile
                ? <span title={m.kimarite === 'fusen' ? 'fusen' : undefined} style={{width:10,height:10,borderRadius: m.kimarite === 'fusen' ? 0 : '50%',background: westWon ? '#f5f0e8' : '#0f0e0c',border:'1.5px solid var(--ink)',boxSizing:'border-box',display:'inline-block',margin:'0 auto'}} />
                : <span />)
          )}
          <span style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:600,whiteSpace:'nowrap',color: westR && westR.wins >= 8 ? '#1a6b5c' : westR && westR.losses >= 8 ? '#c0392b' : 'var(--ink)'}}>{westR ? westR.wins + '–' + westR.losses : ''}</span>
          <span style={{fontSize: isMobile ? '0.7rem' : '0.85rem',textAlign:'center'}}>{westFlag}</span>
          <span style={{fontWeight: westWon ? 800 : 600,fontSize: isMobile ? '0.54rem' : '0.88rem',whiteSpace:'nowrap' /* tk_name_fit_v1 */,textAlign:'center',...pickStyle(m.westId)}}>{lang === 'ja' ? String(westR?.nameJp || m.westJp || m.westShikona).split('\u3000')[0] : m.westShikona}{/* tk_jp_fallback_v1 */}</span>{/* tk_cols_v4 */}{/* tk_mob_badge_col_v1 */}  {/* tk_name_center_v1 */}
          <span style={{fontFamily:'monospace',fontSize: isMobile ? '0.52rem' : '0.56rem',color:rankColor(m.westRank),fontWeight:700,background:rankColor(m.westRank)+'2e',padding:'1px 4px',borderRadius:2,whiteSpace:'nowrap',textAlign:'center',width:'fit-content',margin:'0 auto'}}>{shortRank(m.westRank, lang)}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {scoreMode && (  /* pickem_score_v1: ranishnia smuha rezultatu */
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',padding:'0.55rem 1rem',marginBottom:8,background:'rgba(41,128,185,0.08)',border:'1px solid rgba(41,128,185,0.35)',borderRadius:3,fontFamily:'monospace',fontSize:'0.66rem'}}>
          <span>🎯</span>
          <span style={{color:'var(--ink)',fontWeight:700}}>{t3(lang, 'Твій прогноз', 'Your picks', '予想結果')}: {hits}/{scored.length} {'\u2713'}</span>
          {scored.length < Object.keys(myPicks).length && <span style={{color:'var(--mid)'}}>{t3(lang, '· ще не всі бої завершено', '· some bouts pending', '· 未消化の取組あり')}</span>}
          <button onClick={() => setBoardOpen(true)} style={{marginLeft:'auto',fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'3px 12px',cursor:'pointer',borderRadius:2,border:'1px solid rgba(41,128,185,0.6)',background:'transparent',color:'#1a4a7a',fontWeight:700}}>
            {t3(lang, 'Лідерборд', 'Leaderboard', '順位表')} {'\u2192'}
          </button>
          <PickemBoard bashoId={bashoId} currentDay={currentDay} myUid={pickUid} open={boardOpen} onClose={() => setBoardOpen(false)} />
        </div>
      )}
      {pickem && (  /* pickem_panel_v1: banner staniv */
        <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',padding:'0.55rem 1rem',marginBottom:8,background:'rgba(41,128,185,0.08)',border:'1px solid rgba(41,128,185,0.35)',borderRadius:3,fontFamily:'monospace',fontSize:'0.66rem'}}>
          <span>🎯</span>
          {locked ? (
            <span style={{color:'#1a6b5c',fontWeight:700}}>{t3(lang, 'Твій прогноз зафіксовано · результат — після боїв', 'Your picks are locked · results after the bouts', '予想確定 · 結果は取組後')}</span>
          ) : deadlinePast ? (
            <span style={{color:'var(--mid)'}}>{t3(lang, 'Прийом прогнозів на цей день закрито', 'Picks for this day are closed', 'この日の予想受付は終了')}</span>
          ) : (
            <>
              <span style={{color:'var(--ink)',fontWeight:700}}>{t3(lang, 'Вгадай переможців дня — клікай по стороні пари', 'Pick the day winners — tap a side', 'その日の勝者を予想 — 側をタップ')}</span>
              <span style={{color:'var(--mid)'}}>{Object.keys(draft).length}/{matches.length}</span>{/* pickem_all_affordance_v1 */}
              {isSynthetic && <span style={{color:'#b8860b'}}>{t3(lang, '· попередні пари — фіксація відкриється з офіційним розкладом', '· preliminary pairs — lock opens with the official schedule', '· 暫定取組 — 正式発表後に確定可能')}</span>}{/* synth_badge_v1 */}
              {Object.keys(draft).length > 0 && !isSynthetic && (
                <button onClick={fixPicks} disabled={saving} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.08em',textTransform:'uppercase',padding:'4px 14px',cursor:'pointer',borderRadius:2,border:'1px solid #1a4a7a',background:'#1a4a7a',color:'#fff',fontWeight:700,opacity: saving ? 0.6 : 1}}>
                  {saving ? '...' : t3(lang, 'Зафіксувати', 'Lock in', '確定')} ({Object.keys(draft).length})
                </button>
              )}
            </>
          )}
        </div>
      )}
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