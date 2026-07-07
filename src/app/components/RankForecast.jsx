'use client'
import { t3 } from '../i18n' /* ja_batch1 */

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'

const TYPE_STYLES = {
  danger: { bg: 'rgba(192,57,43,0.12)', color: '#c0392b', border: 'rgba(192,57,43,0.3)' },
  warning: { bg: 'rgba(184,134,11,0.12)', color: '#e79315', border: 'rgba(184,134,11,0.3)' },
  good: { bg: 'rgba(26,107,92,0.12)', color: '#04a98b', border: 'rgba(26,107,92,0.3)' },
  info: { bg: 'var(--bg2)', color: 'var(--mid)', border: 'var(--border)' },
}

/* dead_dict_removed: словник translateForecast знесено */


/* translateForecast знесено: API віддає {uk,en,ja} (forecast_i18n_client_v1) */


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
      {t3(lang, 'Завантаження прогнозу рангів...', 'Loading rank forecast...', '番付予想を読み込み中...')}
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
                    const text = (f.text && typeof f.text === 'object') ? (f.text[lang] || f.text.uk) : f.text  /* forecast_i18n_client_v1 */
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
                  {t3(lang, '← попер', '← prev', '← 前')}
                </div>
                {[...r.prevBashos].reverse().map(b => (
                  <BashoWins key={b.bashoId} {...b} />
                ))}
                <div style={{width:1,height:24,background:'var(--border)',flexShrink:0}} />
                <div style={{textAlign:'center',minWidth:44,flexShrink:0}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.52rem',color:'#1a6b5c',marginBottom:1}}>
                    {t3(lang, 'зараз', 'now', '現在')}
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>{r.wins}–{r.losses}</div>
                </div>
                {r.rank.includes('Sekiwake') && (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'var(--bg2)',borderRadius:2,padding:'3px 8px',minWidth:60,flexShrink:0}}>
                    <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--light)'}}>
                      {t3(lang, 'Озекі-тест', 'Ozeki test', '大関取り')}
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
                {r.bio?.country?.flag && r.bio.country.flag !== '🇯🇵' && (  /* country_name_i18n_v1: порівнюємо прапор, не назву */
                  <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{typeof r.bio.country.name === 'object' ? (r.bio.country.name[lang] || r.bio.country.name.uk) : r.bio.country.name}</span>
                )}
                {r.bio?.age && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.age} {t3(lang, 'р.', 'y.o.', '歳')}</span>}
                {r.bio?.height && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.height} {t3(lang, 'см', 'cm', 'cm')}</span>}
                {r.bio?.weight && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.weight} {t3(lang, 'кг', 'kg', 'kg')}</span>}
                {r.bio?.debut && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{t3(lang, 'дебют', 'debut', '初土俯')} {r.bio.debut.slice(0,4)}/{r.bio.debut.slice(4)}</span>}
                {r.bio?.heya && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.heya}</span>}
              </div>
            </div>

            <div style={{padding:'0.5rem 1rem',display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',borderRight:'1px solid var(--border)'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)',whiteSpace:'nowrap'}}>
                {t3(lang, '← попередні', '← previous', '← 前の場所')}
              </div>
              {[...r.prevBashos].reverse().map(b => (
                <BashoWins key={b.bashoId} {...b} />
              ))}
              <div style={{width:1,height:28,background:'var(--border)',margin:'0 2px'}} />
              <div style={{textAlign:'center',minWidth:48}}>
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'#1a6b5c',marginBottom:1}}>
                  {t3(lang, 'поточний', 'current', '現在')}
                </div>
                <div style={{fontFamily:'monospace',fontSize:'0.8rem',fontWeight:700,color:'var(--ink)'}}>{r.wins}–{r.losses}</div>
              </div>
              {r.rank.includes('Sekiwake') && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',background:'var(--bg2)',borderRadius:2,padding:'3px 8px',minWidth:65}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.54rem',color:'var(--light)'}}>
                    {t3(lang, 'Озекі-тест', 'Ozeki test', '大関取り')}
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
                const text = (f.text && typeof f.text === 'object') ? (f.text[lang] || f.text.uk) : f.text  /* forecast_i18n_client_v1 */
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