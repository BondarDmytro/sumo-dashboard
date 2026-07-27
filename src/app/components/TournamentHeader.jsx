/* auto_current_v3 */
'use client'
import { ukrName } from '../lib/translit'  /* ukr_names_v4 */
import RikishiLink from './RikishiLink' /* champions_links_v1 */
/* champ_text_v3 */
import { useLang } from './LangProvider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useBashoFilter } from './BashoFilterContext' /* champions_filter_v1 */
import { currentBashoId as curBashoIdFn, bashoStatus as bashoStatusFn } from '../lib/bashoCalendar'
import { currentBashoId, bashoInfo, nextBashoId, bashoStatus, prevBashoIdOf } from '../lib/bashoCalendar' /* header_calendar_v1 */
import BashoCountdown from './BashoCountdown'
import ShareButton from './ShareButton' /* share_button_v1 */
import MyRikishi from './MyRikishi' /* favorites_v1 */

/* top5_classes_v1 */
function t3(lang, uk, en, ja, fr) {  /* fr_local_t3_v1 */
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  if (lang === 'fr') return fr !== undefined ? fr : en
  return uk
}

export default function TournamentHeader({ currentDay, daysLeft, contendersCount, hasPlayoff, isFinished, bashoId = currentBashoId(), champion = null, bashoSelect = null, top3 = [], top5Juryo = [], champions = null, sansho = null }) {  /* basho_filter_v2 */  /* header_v3 */  /* sansho_hero_v1 */
  const bi = bashoInfo(bashoId)
  const status = bashoStatus(bashoId)
  const nextBi = bashoInfo(nextBashoId(bashoId))
  /* day_countdown_v1: u laivi - vidlik do nastupnoho dnia (08:30 JST), pislia dnia 15 - do nastupnoho basho */
  const dayCd = (!isFinished && status !== 'upcoming' && status !== 'finished' && currentDay < 15) ? {
    startUtcMs: bi.startUtcMs + currentDay * 86400000,
    label: {
      uk: `день ${currentDay + 1} — ${bi.label.uk}`,
      en: `day ${currentDay + 1} — ${bi.label.en}`,
      ja: `${currentDay + 1}日目 — ${bi.label.ja}`,
    },
  } : null
  /* cd_hide_during_bouts: pid chas boiv (08:00-18:30 JST) countdown khovaietsia - LIVE-riadok u navbari pokryvaie */
  const jstMinNow = (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 540) % 1440
  const boutsNow = status !== 'upcoming' && status !== 'finished' && !isFinished && jstMinNow >= 480 && jstMinNow <= 1110
  const cdTarget = boutsNow ? null : (status === 'upcoming' ? bi : (status === 'finished' || isFinished || currentDay >= 15 ? nextBi : dayCd))
  const { lang } = useLang()
  const { selBasho } = useBashoFilter()  /* champions_filter_v1 */
  const [champsView, setChampsView] = useState(null)
  const [sanshoView, setSanshoView] = useState(null)  /* sansho_hero_v1 */
  useEffect(() => {
    const base = curBashoIdFn()
    if (!selBasho || selBasho === base || bashoStatusFn(selBasho) !== 'finished') { setChampsView(null); setSanshoView(null); return }  /* sansho_hero_v1 */
    let alive = true
    const divs = ['Makuuchi', 'Juryo', 'Makushita', 'Sandanme', 'Jonidan', 'Jonokuchi']
    Promise.all(divs.map(d => fetch(`/api/basho-division?division=${d}&basho=${selBasho}`).then(r => r.json()).catch(() => null)))
      .then(packs => {
        if (!alive) return
        const list = divs.map((d, i) => {
          const w = packs[i]?.winner
          return w ? { division: d, id: String(w._id ?? w.id ?? ''), name: w.name, nameJp: w.nameJp || null, wins: w.wins, losses: w.losses, po: Boolean(packs[i]?.playoff) } : null
        }).filter(Boolean)
        setChampsView(list.length ? list : null)
        setSanshoView((packs[0]?.specialPrizes || []).length ? packs[0].specialPrizes : null)  /* sansho_hero_v1 */
      })
    return () => { alive = false }
  }, [selBasho])
  const champsEff = champsView || champions
  const sanshoEff = sanshoView || sansho  /* sansho_hero_v1 */
  const SANSHO_UK = { 'Shukun-sho': { uk: '\u0428\u044E\u043A\u0443\u043D-\u0448\u043E', en: 'Shukun-sho', ja: '\u6B8A\u52F2\u8CDE' }, 'Kanto-sho': { uk: '\u041A\u0430\u043D\u0442\u043E-\u0448\u043E', en: 'Kanto-sho', ja: '\u6562\u95D8\u8CDE' }, 'Gino-sho': { uk: '\u0413\u0456\u043D\u043E-\u0448\u043E', en: 'Gino-sho', ja: '\u6280\u80FD\u8CDE' } }
  const router = useRouter()
  useEffect(() => {  /* refresh_gate_v1: 60s u vikni boiv (08:00-18:45 JST), 600s poza - ne palymo Vercel unochi */
    if (isFinished) return
    let interval
    const arm = () => {
      const jm = (new Date().getUTCHours() * 60 + new Date().getUTCMinutes() + 540) % 1440
      const inBouts = jm >= 480 && jm <= 1125
      clearInterval(interval)
      interval = setInterval(() => { router.refresh(); arm() }, inBouts ? 60000 : 600000)
    }
    arm()
    return () => clearInterval(interval)
  }, [router, isFinished])

  return (
    <header className="anim-header" style={{background:'var(--header)',color:'#f5f0e8',padding:'1.5rem 2rem',position:'relative',overflow:'hidden',minHeight:120}}>
      {bashoSelect && <div className="th-basho-select" style={{zIndex:2}}>{bashoSelect}</div>}  {/* basho_select_mobile_v1 */}  {/* basho_filter_v2 */}
      <div style={{position:'absolute',right:'-0.05em',top:'-0.1em',fontSize:'clamp(6rem,15vw,12rem)',fontWeight:800,opacity:0.12,lineHeight:1,pointerEvents:'none',color:'#ff2121'}}>相撲</div>
      <div className={(champion || (champions && champions.length > 0) || (!isFinished && top3.length > 0)) ? 'th-grid th-grid-3' : 'th-grid th-grid-2'}  /* champions_grid3_v1 */ style={{maxWidth:1280,margin:'0 auto',position:'relative',zIndex:1,alignItems:'center'}}>  {/* header_mobile_v1 */}  {/* header_v10 */}
        <div className="th-col" style={{order:2,display:'flex',flexDirection:'column',alignItems:'center',justifySelf:'center',width:'100%',textAlign:'center'}}>
          <img src={bi.venue.img} alt={bi.venue.name} onError={e => { e.currentTarget.style.display = 'none' }} style={{width:'100%',flex:1,minHeight:0,objectFit:'cover',borderRadius:4,border:'1px solid rgba(240,192,96,0.25)'}} />
          <div style={{fontSize:'0.85rem',fontWeight:700,color:'#f0c060',marginTop:10}}>{bi.venue.name + ' · ' + (lang === 'en' ? bi.city.en : lang === 'ja' ? bi.city.ja : lang === 'fr' ? bi.city.fr : bi.city.uk)}</div>
          {bi.venue.credit && (
            <div style={{fontSize:'0.55rem',fontFamily:'monospace',color:'#f5f0e8',opacity:0.45,marginTop:3}}>  {/* venue_credits_v1 */}
              Photo: {bi.venue.credit.author
                ? <a href={bi.venue.credit.fileUrl} target="_blank" rel="noreferrer" style={{color:'inherit'}}>{bi.venue.credit.author}</a>
                : <a href={bi.venue.credit.fileUrl} target="_blank" rel="noreferrer" style={{color:'inherit'}}>Wikimedia Commons</a>}
              {' / '}
              {bi.venue.credit.licenseUrl
                ? <a href={bi.venue.credit.licenseUrl} target="_blank" rel="noreferrer" style={{color:'inherit'}}>{bi.venue.credit.license}</a>
                : bi.venue.credit.license}
            </div>
          )}
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.15em',color:'#6b6560',marginTop:2}}>{lang === 'ja' ? bi.label.ja : bi.kanji + ' ' + (lang === 'en' || lang === 'fr' ? bi.label.en : bi.label.uk)}  {/* kanji_dedup_v1 */}</div>
        </div>
        <div className="th-col" style={{minWidth:0,order:1,display:'flex',flexDirection:'column',justifyContent:'flex-start',paddingTop:'0.5rem'}}>  {/* header_v17 top_align_v1 */}
        <div className="th-title-row" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:'0.75rem'}}>{/* share_inline_v1 share_row_class_v1 */}
        <h1 style={{whiteSpace:'nowrap',fontSize:'clamp(1.3rem,2.2vw,1.9rem)',fontWeight:800,lineHeight:1.1,margin:0}}>
          {t3(lang, 'Гонка за юшо', 'Yusho Race', '優勝レース')}
          <span style={{color:'#fb5050'}}>
            {t3(lang, ' — наживо', ' — Live', '・ライブ')}
          </span>
        </h1>
        <ShareButton />
        </div>
        <div className="th-stats-row" style={{display:'flex',gap:'1.2rem',flexWrap:'nowrap',whiteSpace:'nowrap',fontSize:'1rem',color:'#b8c7c8'}}>
          {isFinished ? (
            <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(184,134,11,0.2)',border:'1px solid rgba(184,134,11,0.5)',padding:'4px 14px',borderRadius:2}}>
              <span>🏆</span>
              <b style={{color:'#b8860b'}}>{t3(lang, 'Турнір завершено', 'Tournament finished', '場所終了')}</b>
            </span>
          ) : (
            <>
              {bashoStatus(bashoId) === 'upcoming' ? (
                <span><b style={{color:'#f5f0e8'}}>{t3(lang, 'Не розпочато', 'Not started', '開始前')}</b></span>
              ) : (
              <span>
                <b style={{color:'#f5f0e8'}}>{t3(lang, 'День', 'Day', '')} {currentDay}</b> {t3(lang, 'з 15', 'of 15', '日目／15')}
              </span>
              )}  {/* header_v18 */}
              {daysLeft > 0 && bashoStatus(bashoId) !== 'upcoming' && (  /* header_v19 */
                <span>
                  <b style={{color:'#f5f0e8'}}>{daysLeft}</b> {t3(lang, 'днів залишилось', 'days remaining', '日残り')}
                </span>
              )}
              <span>
                <b style={{color:'#f5f0e8'}}>{contendersCount}</b> {t3(lang, 'претендентів', 'contenders', '優勝候補')}
              </span>
              {hasPlayoff && (
                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(184,134,11,0.2)',border:'1px solid rgba(184,134,11,0.5)',padding:'2px 10px',borderRadius:2}}>
                  <span>⚡</span>
                  <b style={{color:'#b8860b'}}>{t3(lang, 'Можливий плей-оф!', 'Possible playoff!', '巴戦の可能性！')}</b>
                </span>
              )}
            </>
          )}
        </div>
      {cdTarget && <BashoCountdown startUtcMs={cdTarget.startUtcMs} bashoLabel={lang === 'en' ? cdTarget.label.en : lang === 'ja' ? cdTarget.label.ja : lang === 'fr' ? cdTarget.label.fr : cdTarget.label.uk} />}
        </div>
        {(champsEff && champsEff.length > 0) && (  /* champions_hero_v3 champions_filter_v1 */
          <div className="th-col th-col-leaders" style={{order:3,display:'flex',flexDirection:'column',justifyContent:'flex-start',paddingTop:'0.5rem',minWidth:0}}>  {/* champions_hero_v2 */}
            <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.18em',color:'#6b6560',marginBottom:10}}>{String.fromCodePoint(0x1F3C6)} {t3(lang, '\u0427\u0435\u043C\u043F\u0456\u043E\u043D\u0438', 'Champions', '\u5404\u6BB5\u512A\u52DD')}</div>
            {champsEff.map(c => (
              <div key={c.division} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontFamily:'monospace',fontSize:'0.78rem'}}>
                <span style={{color:'#6b6560',fontSize:'0.58rem',minWidth:76,textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.division}</span>
                <span style={{color:'#f5f0e8',fontWeight:800,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',width:118,flexShrink:0}}><RikishiLink id={c.id} style={{borderBottomColor:'rgba(245,240,232,0.35)'}}>{lang === 'ja' && c.nameJp ? c.nameJp.split(/\s/)[0] : lang === 'uk' ? ukrName(c.name) : c.name}</RikishiLink></span>  {/* champions_links_v1 */}
                <span style={{color:'#f0c060',fontWeight:700,minWidth:44,textAlign:'center',marginLeft:0}}>{c.wins != null ? `${c.wins}\u2013${c.losses}` : ''}</span>  {/* champions_align_v1 */}
                <span style={{fontSize:'0.52rem',fontFamily:'monospace',padding:'1px 5px',borderRadius:2,marginLeft:4,flexShrink:0,minWidth:38,textAlign:'center',display:'inline-block',
                              background: c.po ? 'rgba(184,134,11,0.25)' : 'rgba(255,255,255,0.08)',
                              color: c.po ? '#f0c060' : '#8a847c',
                              border: '1px solid ' + (c.po ? 'rgba(240,192,96,0.4)' : 'rgba(255,255,255,0.12)')}}>
                  {c.po ? t3(lang, '\u041F-\u041E', 'P-O', '\u512A\u6C7A') : t3(lang, '\u0441\u043E\u043B\u043E', 'solo', '\u5358\u72EC')}
                </span>  {/* champions_po_mark_v1 */}
              </div>
            ))}
            <MyRikishi />
            {(sanshoEff && sanshoEff.length > 0) && (  /* sansho_hero_v1 */
              <>
                <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.18em',color:'#6b6560',marginTop:12,marginBottom:10}}>{String.fromCodePoint(0x1F3C5)} {t3(lang, '\u0421\u0430\u043D\u043A\u044C\u043E', 'Sansho', '\u4E09\u8CDE')}</div>
                {sanshoEff.map((p, i) => (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontFamily:'monospace',fontSize:'0.78rem'}}>
                    <span style={{color:'#6b6560',fontSize:'0.58rem',minWidth:76,textTransform:'uppercase',letterSpacing:'0.05em'}}>{(SANSHO_UK[p.type] ? t3(lang, SANSHO_UK[p.type].uk, SANSHO_UK[p.type].en, SANSHO_UK[p.type].ja) : p.type)}</span>
                    <span style={{color:'#f5f0e8',fontWeight:800,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}><RikishiLink id={String(p.rikishiId)} style={{borderBottomColor:'rgba(245,240,232,0.35)'}}>{lang === 'ja' && p.shikonaJp ? p.shikonaJp.split(/\s/)[0] : lang === 'uk' ? ukrName(p.shikonaEn) : p.shikonaEn}</RikishiLink></span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
        {!isFinished && top3.length > 0 && !(champions && champions.length > 0) && (  /* champions_hero_v4 */
          <div className="th-col th-col-leaders" style={{order:3,display:'flex',flexDirection:'column',justifyContent:'flex-start',paddingTop:'0.5rem',minWidth:0}}>{/* top5_center_v1 top_align_v1 */}
            <div className="top5-wrap"><div className="top5-col">{/* top5_sbs_v1 top5_sbs_v2: zagolovok useredyni kolonky */}
            <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.18em',color:'#6b6560',marginBottom:10}}>
              Makuuchi · 幕内{/* top5_hdr_short_v1 */}
            </div>
            {top3.map((r, i) => (
              <div key={r.name} className="top5-row" style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontFamily:'monospace',fontSize:'0.8rem'}}>
                <span style={{width:17,height:17,borderRadius:'50%',background:['#b8860b','#999','#a0522d','#4a5a6a','#4a5a6a'][i],color:'#fff',fontSize:'0.68rem',fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>
                <span style={{color:'#f5f0e8',minWidth:96,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lang === 'ja' && r.nameJp ? r.nameJp.split(/\s/)[0] : r.name}</span>
                <span style={{flex:1,height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                  <span style={{display:'block',height:'100%',width:Math.min(r.chance*3,100)+'%',background:['#b8860b','#999','#a0522d','#4a5a6a','#4a5a6a'][i]}} />
                </span>
                <span className="top5-pct" style={{color:'#f0c060',fontWeight:700,minWidth:52,textAlign:'right'}}>{r.chance}%</span>
              </div>
            ))}
            </div>{/* top5_sbs_v1: mak-grupa zakryta */}
            <div className="top5-col">
            {top5Juryo.length > 0 && (<>
              <div style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.18em',color:'#6b6560',margin:'14px 0 10px'}}>Juryo · 十両</div>{/* top5_juryo_v1 */}
              {top5Juryo.map((r, i) => (
                <div key={r.name} className="top5-row" style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,fontFamily:'monospace',fontSize:'0.8rem'}}>
                  <span style={{width:17,height:17,borderRadius:'50%',background:['#b8860b','#999','#a0522d','#4a5a6a','#4a5a6a'][i],color:'#fff',fontSize:'0.68rem',fontWeight:700,display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{i+1}</span>
                  <span style={{color:'#f5f0e8',minWidth:96,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lang === 'ja' && r.nameJp ? r.nameJp.split(/\s/)[0] : r.name}</span>
                  <span style={{flex:1,height:6,background:'rgba(255,255,255,0.1)',borderRadius:3,overflow:'hidden'}}>
                    <span style={{display:'block',height:'100%',width:Math.min(r.chance*3,100)+'%',background:['#b8860b','#999','#a0522d','#4a5a6a','#4a5a6a'][i]}} />
                  </span>
                  <span className="top5-pct" style={{color:'#f0c060',fontWeight:700,minWidth:52,textAlign:'right'}}>{r.chance}%</span>
                </div>
              ))}
            </>)}
            </div></div>{/* top5_sbs_v1: juryo-grupa i wrap zakryti */}
            <MyRikishi />
          </div>
        )}
        {champion && (
          <div className="th-col" style={{order:3,display:'flex',flexDirection:'row',gap:'1rem',alignItems:'center',justifySelf:'end'}}>
            <img src={'/rikishi/' + champion.id + '.webp'} alt={champion.name} onError={e => { e.currentTarget.style.display = 'none' }}
              style={{height:'100%',width:'auto',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'1px solid rgba(240,192,96,0.25)'}} />
            <div style={{maxWidth:420,minWidth:0,textAlign:'right'}}>
              <div style={{fontSize:'1rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#f0c060',marginBottom:6}}>{(lang === 'en' ? bashoInfo(prevBashoIdOf(bashoId)).label.en : lang === 'ja' ? bashoInfo(prevBashoIdOf(bashoId)).label.ja : lang === 'fr' ? bashoInfo(prevBashoIdOf(bashoId)).label.fr : bashoInfo(prevBashoIdOf(bashoId)).label.uk) + (lang === 'en' || lang === 'fr' ? ' \u2014 yusho' : lang === 'ja' ? '\u3000\u512a\u52dd' : ' \u2014 \u044e\u0448\u043e')}</div>
              <div style={{fontSize:'1.8rem',fontWeight:800,lineHeight:1.15,whiteSpace:'nowrap'}}>{lang === 'ja' && champion.nameJp ? champion.nameJp : champion.name}</div>  {/* ja_champ_render */}
              <div style={{fontFamily:'Georgia,serif',fontSize:'2rem',fontWeight:800,color:'#f0c060',marginTop:8}}>{champion.wins}{'\u2013'}{champion.losses}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.85rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'#6b6560',marginTop:4}}>{lang === 'en' ? 'Final record' : lang === 'ja' ? '最終成績' : 'Фінальний рекорд'}</div>
              {champion.playoff && <div style={{fontSize:'0.75rem',color:'#b8c7c8',marginTop:8,maxWidth:220}}>{lang === 'en' ? 'Won the playoff' : lang === 'ja' ? '優勝決定戦を制す' : 'Переміг у плей-офі'}</div>}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

/* header_mobile_v2 */

/* fr_ternary_sweep_v1 */
