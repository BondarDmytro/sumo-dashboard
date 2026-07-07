/* auto_current_v3 */
'use client'
/* champ_text_v3 */
import { useLang } from './LangProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { currentBashoId, bashoInfo, nextBashoId, bashoStatus, prevBashoIdOf } from '../lib/bashoCalendar' /* header_calendar_v1 */
import BashoCountdown from './BashoCountdown'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

export default function TournamentHeader({ currentDay, daysLeft, contendersCount, hasPlayoff, isFinished, bashoId = currentBashoId(), champion = null, bashoSelect = null }) {  /* basho_filter_v2 */  /* header_v3 */
  const bi = bashoInfo(bashoId)
  const status = bashoStatus(bashoId)
  const nextBi = bashoInfo(nextBashoId(bashoId))
  const cdTarget = status === 'upcoming' ? bi : (status === 'finished' || isFinished ? nextBi : null)
  const { lang } = useLang()
  const router = useRouter()
  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => { router.refresh() }, 60000)
    return () => clearInterval(interval)
  }, [router, isFinished])

  return (
    <header className="anim-header" style={{background:'var(--header)',color:'#f5f0e8',padding:'1.5rem 2rem',position:'relative',overflow:'hidden',minHeight:120}}>
      {bashoSelect && <div style={{position:'absolute',top:'1rem',right:'1.25rem',zIndex:2}}>{bashoSelect}</div>}  {/* basho_filter_v2 */}
      <div style={{position:'absolute',right:'-0.05em',top:'-0.1em',fontSize:'clamp(6rem,15vw,12rem)',fontWeight:800,opacity:0.12,lineHeight:1,pointerEvents:'none',color:'#ff2121'}}>相撲</div>
      <div style={{maxWidth:1280,margin:'0 auto',position:'relative',zIndex:1,display:'grid',gridTemplateColumns:champion ? '1fr minmax(300px,420px) 1fr' : '2fr 1fr',gap:'2.5rem',alignItems:'center'}}>  {/* header_v10 */}
        <div style={{order:2,display:'flex',flexDirection:'column',alignItems:'center',justifySelf:'center',width:'100%',textAlign:'center',height:300}}>
          <img src={bi.venue.img} alt={bi.venue.name} onError={e => { e.currentTarget.style.display = 'none' }} style={{width:'100%',flex:1,minHeight:0,objectFit:'cover',borderRadius:4,border:'1px solid rgba(240,192,96,0.25)'}} />
          <div style={{fontSize:'0.85rem',fontWeight:700,color:'#f0c060',marginTop:10}}>{bi.venue.name + ' · ' + (lang === 'en' ? bi.city.en : lang === 'ja' ? bi.city.ja : bi.city.uk)}</div>
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
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.15em',color:'#6b6560',marginTop:2}}>{bi.kanji + ' ' + (lang === 'en' ? bi.label.en : lang === 'ja' ? bi.label.ja : bi.label.uk)}</div>
        </div>
        <div style={{minWidth:0,order:1,height:300,display:'flex',flexDirection:'column',justifyContent:'center'}}>  {/* header_v17 */}
        <h1 style={{whiteSpace:'nowrap',fontSize:'clamp(1.3rem,2.2vw,1.9rem)',fontWeight:800,lineHeight:1.1,margin:0,marginBottom:'0.75rem'}}>
          {t3(lang, 'Гонка за юшо', 'Yusho Race', '優勝レース')}
          <span style={{color:'#fb5050'}}>
            {t3(lang, ' — наживо', ' — Live', '・ライブ')}
          </span>
        </h1>
        <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'1rem',color:'#b8c7c8'}}>
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
        {cdTarget && <BashoCountdown startUtcMs={cdTarget.startUtcMs} bashoLabel={lang === 'en' ? cdTarget.label.en : lang === 'ja' ? cdTarget.label.ja : cdTarget.label.uk} />}
        </div>
        {champion && (
          <div style={{order:3,display:'flex',flexDirection:'row',gap:'1rem',alignItems:'center',justifySelf:'end',height:300}}>
            <img src={'/rikishi/' + champion.id + '.jpg'} alt={champion.name} onError={e => { e.currentTarget.style.display = 'none' }}
              style={{height:'100%',width:'auto',objectFit:'cover',objectPosition:'top',borderRadius:4,border:'1px solid rgba(240,192,96,0.25)'}} />
            <div style={{width:420,minWidth:320,textAlign:'right'}}>
              <div style={{fontSize:'1rem',fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#f0c060',marginBottom:6}}>{(lang === 'en' ? bashoInfo(prevBashoIdOf(bashoId)).label.en : lang === 'ja' ? bashoInfo(prevBashoIdOf(bashoId)).label.ja : bashoInfo(prevBashoIdOf(bashoId)).label.uk) + (lang === 'en' ? ' \u2014 yusho' : lang === 'ja' ? '\u3000\u512a\u52dd' : ' \u2014 \u044e\u0448\u043e')}</div>
              <div style={{fontSize:'1.8rem',fontWeight:800,lineHeight:1.15,whiteSpace:'nowrap'}}>{champion.name}</div>
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
