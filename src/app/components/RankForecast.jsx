'use client'

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

const TYPE_STYLES = {
  danger: { bg: 'rgba(192,57,43,0.12)', color: '#c0392b', border: 'rgba(192,57,43,0.3)' },
  warning: { bg: 'rgba(184,134,11,0.12)', color: '#e79315', border: 'rgba(184,134,11,0.3)' },
  good: { bg: 'rgba(26,107,92,0.12)', color: '#04a98b', border: 'rgba(26,107,92,0.3)' },
  info: { bg: 'var(--bg2)', color: 'var(--mid)', border: 'var(--border)' },
}

const FORECAST_TRANSLATIONS = {
  '✓ Ранг Озекі збережено': '✓ Ozeki rank retained',
  'Довічний ранг': 'Lifetime rank (Yokozuna)',
  '⚠ Маке-коші — очікується критика': '⚠ Make-koshi — criticism expected',
  '⚠ Маке-коші → наступний турнір кадо-бан': '⚠ Make-koshi → next basho kadoban',
  '🔴 Кюджо на кадо-бані → виліт з Озекі на наступний турнір': '🔴 Kyujo on kadoban → demoted from Ozeki next basho',
  '✓ Качі-коші — ранг Секіваке збережено': '✓ Kachi-koshi — Sekiwake rank retained',
  '⚠ Маке-коші → пониження з Секіваке': '⚠ Make-koshi → demotion from Sekiwake',
  '✓ Качі-коші — ранг Комусубі збережено': '✓ Kachi-koshi — Komusubi rank retained',
  '⚠ Маке-коші → пониження з Комусубі': '⚠ Make-koshi → demotion from Komusubi',
  '⚠ Маке-коші → пониження': '⚠ Make-koshi → demotion',
  '✓ Качі-коші': '✓ Kachi-koshi',
  '✓ Качі-коші — ранг збережено': '✓ Kachi-koshi — rank retained',
  '⚠ Під загрозою пониження': '⚠ At risk of demotion',
}

function translateForecast(text) {
  if (!text) return text
  if (FORECAST_TRANSLATIONS[text]) return FORECAST_TRANSLATIONS[text]
  let result = text
  result = result.replace('Озекі-тест:', 'Ozeki test:')
  result = result.replace('(цей цикл недостатній)', '(not enough this cycle)')
  result = result.replace('(можливо наступного)', '(possible next cycle)')
  result = result.replace('Потрібно ще', 'Need')
  result = result.replace('перемог для качі-коші', 'more wins for kachi-koshi')
  result = result.replace('перемоги для качі-коші', 'more wins for kachi-koshi')
  result = result.replace('перемога для качі-коші', 'more win for kachi-koshi')
  result = result.replace('підвищення до Секіваке', 'promotion to Sekiwake')
  result = result.replace('підвищення до Комусубі', 'promotion to Komusubi')
  result = result.replace('підвищення до Озекі', 'promotion to Ozeki')
  result = result.replace('перемог →', 'wins →')
  result = result.replace('перемоги →', 'wins →')
  result = result.replace('перемога →', 'win →')
  result = result.replace('Маке-коші', 'Make-koshi')
  result = result.replace('Качі-коші', 'Kachi-koshi')
  result = result.replace('кадо-бан', 'kadoban')
  result = result.replace('пониження', 'demotion')
  result = result.replace('збережено', 'retained')
  result = result.replace('наступний турнір', 'next basho')
  result = result.replace('виліт з Озекі', 'demoted from Ozeki')
  return result
}

function BashoWins({ bashoId, wins, losses }) {
  const label = bashoId.slice(0,4) + '/' + bashoId.slice(4)
  const kk = wins >= 8
  return (
    <div style={{textAlign:'center',minWidth:44}}>
      <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--light)',marginBottom:2}}>{label}</div>
      <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:600,color: kk ? 'var(--ink)' : '#c0392b'}}>
        {wins}–{losses}
      </div>
    </div>
  )
}

export default function RankForecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/rankforecast')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{padding:'2rem',textAlign:'center',fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>
      {lang === 'en' ? 'Loading rank forecast...' : 'Завантаження прогнозу рангів...'}
    </div>
  )

  if (!data?.rikishi?.length) return null

  return (
    <div style={{marginBottom:'1rem'}}>
      {data.rikishi.map(r => {
        const mainType = r.forecasts[0]?.type || 'info'
        const st = TYPE_STYLES[mainType] || TYPE_STYLES.info
        const borderColor = mainType === 'danger' ? '#c0392b' : mainType === 'warning' ? '#b8860b' : mainType === 'good' ? '#1a6b5c' : 'var(--border)'

        if (isMobile) {
          return (
            <div key={r.id} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${borderColor}`,
              marginBottom: 4,
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              {/* Рядок 1: ім'я + статус */}
              <div style={{
                display: 'flex', alignItems: 'stretch',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{flex:1, padding:'0.5rem 0.75rem'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:'1rem'}}>{r.bio?.country?.flag}</span>
                    <div style={{fontWeight:700,fontSize:'0.9rem'}}>{r.name}</div>
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:2}}>{r.rank}</div>
                </div>
                <div style={{
                  background: st.bg,
                  display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center',
                  padding:'0.5rem 0.75rem',
                  minWidth:120,
                  borderLeft:'1px solid var(--border)',
                  textAlign:'center',
                }}>
                  {r.forecasts.map((f,i) => {
                    const fst = TYPE_STYLES[f.type] || TYPE_STYLES.info
                    const text = lang === 'en' ? translateForecast(f.text) : f.text
                    return (
                      <div key={i} style={{
                        color: fst.color,
                        fontSize: '0.65rem',
                        lineHeight: 1.3,
                        fontWeight: i === 0 ? 600 : 400,
                      }}>
                        {text}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Рядок 2: результати басьо */}
              <div style={{
                padding:'0.4rem 0.75rem',
                display:'flex',alignItems:'center',
                gap:'0.5rem',
                overflowX:'auto',
                scrollbarWidth:'none',
              }}>
                <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'var(--light)',whiteSpace:'nowrap',flexShrink:0}}>
                  {lang === 'en' ? '← prev' : '← попер'}
                </div>
                {[...r.prevBashos].reverse().map(b => (
                  <BashoWins key={b.bashoId} {...b} />
                ))}
                <div style={{width:1,height:24,background:'var(--border)',flexShrink:0}} />
                <div style={{textAlign:'center',minWidth:44,flexShrink:0}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'#1a6b5c',marginBottom:1}}>
                    {lang === 'en' ? 'now' : 'зараз'}
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>{r.wins}–{r.losses}</div>
                </div>
                {r.rank.includes('Sekiwake') && (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'var(--bg2)',borderRadius:2,padding:'3px 8px',minWidth:60,flexShrink:0}}>
                    <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--light)'}}>
                      {lang === 'en' ? 'Ozeki test' : 'Озекі-тест'}
                    </div>
                    <div style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:700,color:(r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)) >= 33 ? '#1a6b5c' : 'var(--ink)'}}>
                      {r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)}
                      <span style={{fontSize:'0.55rem',color:'var(--mid)'}}>/33</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        }

        // Десктоп — оригінальний layout
        return (
          <div key={r.id} style={{
            display:'grid',
            gridTemplateColumns:'160px 1fr 200px',
            background:'var(--card)',
            border:'1px solid var(--border)',
            borderLeft:`4px solid ${borderColor}`,
            marginBottom:1,
            minHeight:60,
          }}>
            <div style={{padding:'0.5rem 1rem',borderRight:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:1}}>
                <span style={{fontSize:'1.1rem'}}>{r.bio?.country?.flag}</span>
                <div style={{fontWeight:700,fontSize:'0.9rem'}}>{r.name}</div>
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:3}}>{r.rank}</div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {r.bio?.country?.name !== 'Японія' && r.bio?.country?.name !== 'Japan' && (
                  <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.country.name}</span>
                )}
                {r.bio?.age && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.age} {lang === 'en' ? 'y.o.' : 'р.'}</span>}
                {r.bio?.height && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.height} {lang === 'en' ? 'cm' : 'см'}</span>}
                {r.bio?.weight && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.weight} {lang === 'en' ? 'kg' : 'кг'}</span>}
                {r.bio?.debut && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{lang === 'en' ? 'debut' : 'дебют'} {r.bio.debut.slice(0,4)}/{r.bio.debut.slice(4)}</span>}
                {r.bio?.heya && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.heya}</span>}
              </div>
            </div>

            <div style={{padding:'0.5rem 1rem',display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',borderRight:'1px solid var(--border)'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)',whiteSpace:'nowrap'}}>
                {lang === 'en' ? '← previous' : '← попередні'}
              </div>
              {[...r.prevBashos].reverse().map(b => (
                <BashoWins key={b.bashoId} {...b} />
              ))}
              <div style={{width:1,height:28,background:'var(--border)',margin:'0 2px'}} />
              <div style={{textAlign:'center',minWidth:48}}>
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'#1a6b5c',marginBottom:1}}>
                  {lang === 'en' ? 'current' : 'поточний'}
                </div>
                <div style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:700,color:'var(--ink)'}}>{r.wins}–{r.losses}</div>
              </div>
              {r.rank.includes('Sekiwake') && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'var(--bg2)',borderRadius:2,padding:'3px 8px',minWidth:65}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.54rem',color:'var(--light)'}}>
                    {lang === 'en' ? 'Ozeki test' : 'Озекі-тест'}
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.88rem',fontWeight:700,color:(r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)) >= 33 ? '#1a6b5c' : 'var(--ink)'}}>
                    {r.wins + r.prevBashos.slice(0,2).reduce((s,b)=>s+b.wins,0)}
                    <span style={{fontSize:'0.58rem',color:'var(--mid)'}}>/33</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: st.bg,
              display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              padding:'0.5rem 1rem',
              gap:4,textAlign:'center',
            }}>
              {r.forecasts.map((f,i) => {
                const fst = TYPE_STYLES[f.type] || TYPE_STYLES.info
                const text = lang === 'en' ? translateForecast(f.text) : f.text
                return (
                  <div key={i} style={{
                    color: fst.color,
                    fontSize:'0.75rem',
                    lineHeight:1.4,
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    {text}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}