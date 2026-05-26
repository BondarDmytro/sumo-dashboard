'use client'
import { useLang } from './LangProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

export default function TournamentHeader({ currentDay, daysLeft, contendersCount, hasPlayoff, isFinished }) {
  const { lang } = useLang()
  const router = useRouter()
  useEffect(() => {
    if (isFinished) return
    const interval = setInterval(() => { router.refresh() }, 60000)
    return () => clearInterval(interval)
  }, [router, isFinished])

  return (
    <header className="anim-header" style={{background:'var(--header)',color:'#f5f0e8',padding:'1.5rem 2rem',position:'relative',overflow:'hidden',minHeight:120}}>
      <div style={{position:'absolute',right:'-0.05em',top:'-0.1em',fontSize:'clamp(6rem,15vw,12rem)',fontWeight:800,opacity:0.12,lineHeight:1,pointerEvents:'none',color:'#ff2121'}}>相撲</div>
      <div style={{maxWidth:1100,margin:'0 auto',position:'relative',zIndex:1}}>
        <div style={{fontFamily:'monospace',fontSize:'0.65rem',letterSpacing:'0.18em',textTransform:'uppercase',color:'#6b6560',marginBottom:'0.3rem'}}>
          {t3(lang, '夏場所 · Натсу Басьо 2026 · Токіо', '夏場所 · Natsu Basho 2026 · Tokyo', '夏場所 · 夏場所 2026 · 東京')}
        </div>
        <h1 style={{fontSize:'clamp(1.4rem,3vw,2rem)',fontWeight:800,lineHeight:1.1,margin:0,marginBottom:'0.75rem'}}>
          {t3(lang, 'Прогноз переможця турніру', 'Yusho Forecast', '優勝予想')}
          <span style={{color:'#fb5050'}}>
            {t3(lang, ' Дивізіон Макуучі', '  Makuuchi Division', ' 幕内')}
          </span>
        </h1>
        <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',fontSize:'0.85rem',color:'#b8c7c8'}}>
          {isFinished ? (
            <span style={{display:'inline-flex',alignItems:'center',gap:6,background:'rgba(184,134,11,0.2)',border:'1px solid rgba(184,134,11,0.5)',padding:'4px 14px',borderRadius:2}}>
              <span>🏆</span>
              <b style={{color:'#b8860b'}}>{t3(lang, 'Турнір завершено', 'Tournament finished', '場所終了')}</b>
            </span>
          ) : (
            <>
              <span>
                <b style={{color:'#f5f0e8'}}>{t3(lang, 'День', 'Day', '')} {currentDay}</b> {t3(lang, 'з 15', 'of 15', '日目／15')}
              </span>
              {daysLeft > 0 && (
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
      </div>
    </header>
  )
}
