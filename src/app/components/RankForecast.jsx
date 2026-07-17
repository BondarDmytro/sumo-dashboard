'use client'
import RikishiLink from './RikishiLink' /* rikishi_links_batch2_v1 */
import { displayName, displayRank, currentBashoId } from '../lib/bashoCalendar' /* ja_names_sweep_v1 rf_polish_v1 */
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

const shortR = (x) => String(x).replace(' East','e').replace(' West','w').replace('Maegashira ','M').replace('Sekiwake ','S').replace('Komusubi ','K').replace('Ozeki ','O').replace('Yokozuna ','Y').replace('Juryo ','J').replace('Makushita ','Ms').replace('Sandanme ','Sd').replace('Jonidan ','Jd').replace('Jonokuchi ','Jk')  /* rf_polish_v1 */

function kyujoDiscount(hist) {  /* rf_kyujo_disc_v1: 0.85 yakshcho absent-dni v 2 ostannikh basho, 0.92 v odnomu */
  const recent = (hist || []).slice(-2)
  const hit = recent.filter(h => (h.a || 0) > 0 || ((h.w || 0) + (h.l || 0)) === 0).length
  return hit >= 2 ? 0.85 : hit === 1 ? 0.92 : 1
}

function chancePct(need, wins, losses, hist) {  /* rf_chance_client_v1 */
  const remaining = 15 - wins - losses
  if (need <= 0) return 100
  if (need > remaining) return 0
  const played = wins + losses
  const p = Math.min(0.7, Math.max(0.3, played > 0 ? wins / played : 0.5))
  const binom = (n, k) => { let r = 1; for (let j = 1; j <= k; j++) r = r * (n - j + 1) / j; return r }
  let prob = 0
  for (let k = need; k <= remaining; k++) prob += binom(remaining, k) * Math.pow(p, k) * Math.pow(1 - p, remaining - k)
  const pct = Math.round(prob * kyujoDiscount(hist) * 100)
  return Math.min(99, Math.max(1, pct))  /* rf_clamp_v1: 0/100 lyshe dlia determinovanykh vypadkiv (rannie return vyshche) */
}

const HEYA_JA = {  /* ja_gaps_v2: основні стайні */
  'Tatsunami': '立浪', 'Nishonoseki': '二所ノ関', 'Otowayama': '音羽山', 'Sadogatake': '佐渡ヶ嚆',
  'Isegahama': '伊勢ヶ濱', 'Oshiogawa': '押尾川', 'Kokonoe': '九重', 'Takasago': '高砂',
  'Kasugano': '春日野', 'Oitekaze': '追手風', 'Tokitsukaze': '時津風', 'Dewanoumi': '出羽海',
  'Hakkaku': '八角', 'Kise': '木瀬', 'Minato': '渊', 'Naruto': '鳴戸',
  'Asakayama': '浅香山', 'Tamanoi': '玉ノ井', 'Fujishima': '藤島', 'Miyagino': '宮城野',
  'Onomatsu': '阿武松', 'Shikoroyama': '錆山', 'Ajigawa': '安治川', 'Takadagawa': '高田川',
  'Arashio': '荒汐', 'Ikazuchi': '雷', 'Hanaregoma': '放駒', 'Nishikido': '錦戸',
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
        const borderColor = r.rank.includes('Yokozuna') ? '#b8860b' : r.rank.includes('Ozeki') ? '#1a4a7a' : r.rank.includes('Sekiwake') ? '#1a6b5c' : r.rank.includes('Komusubi') ? '#a0522d' : 'var(--border)'  /* rf_updown_v1 */

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
                    <div style={{fontWeight:700,fontSize:'0.9rem'}}><RikishiLink id={r.id}>{displayName(r, lang)}</RikishiLink></div>
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:2}}>{displayRank(r.rank, lang)}</div>
                </div>
                <div style={{
                  background: st.bg,
                  display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center',
                  padding:'0.5rem 0.5rem',
                  flex:'0 0 45%',
                  maxWidth:'45%',
                  boxSizing:'border-box',
                  borderLeft:'1px solid var(--border)',
                  textAlign:'center',
                }}>
                  {r.forecasts.slice(0, 1).map((f,i) => {
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
                <div style={{fontWeight:700,fontSize:'0.9rem'}}><RikishiLink id={r.id}>{displayName(r, lang)}</RikishiLink></div>
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:3}}>{displayRank(r.rank, lang)}</div>
              <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                {r.bio?.country?.flag && r.bio.country.flag !== '🇯🇵' && (  /* country_name_i18n_v1: порівнюємо прапор, не назву */
                  <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{typeof r.bio.country.name === 'object' ? (r.bio.country.name[lang] || r.bio.country.name.uk) : r.bio.country.name}</span>
                )}
                {r.bio?.age && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.age} {t3(lang, 'р.', 'y.o.', '歳')}</span>}
                {r.bio?.height && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.height} {t3(lang, 'см', 'cm', 'cm')}</span>}
                {r.bio?.weight && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{r.bio.weight} {t3(lang, 'кг', 'kg', 'kg')}</span>}
                {r.bio?.debut && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{t3(lang, 'дебют', 'debut', '初土俯')} {r.bio.debut.slice(0,4)}/{r.bio.debut.slice(4)}</span>}
                {r.bio?.heya && <span style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 4px',borderRadius:2}}>{lang === 'ja' ? (HEYA_JA[r.bio.heya] || r.bio.heya) : r.bio.heya}</span>}
              </div>
            </div>

            <div style={{padding:'0.5rem 1rem',display:'flex',alignItems:'center',gap:'0.6rem',borderRight:'1px solid var(--border)'}}>{/* rf_grid10_v1 */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(10, 1fr)',gap:4,flex:1,alignItems:'center'}}>
                {(() => {
                  const hist = (r.last9 && r.last9.length ? r.last9 : [...(r.prevBashos || [])].reverse().map(b => ({ b: b.bashoId, w: b.wins, l: b.losses, a: 0 })))
                  const cells = hist.slice(-9)
                  const pad = Array.from({ length: Math.max(0, 9 - cells.length) })
                  return (<>
                    {pad.map((_, i) => <div key={'p' + i} />)}
                    {cells.map(h => {
                      const kyujo = (h.w + h.l) === 0
                      const kk = !kyujo && h.w > h.l
                      return (
                        <div key={h.b} style={{textAlign:'center'}}>
                          <div style={{fontFamily:'monospace',fontSize:'0.53rem',color:'var(--light)',marginBottom:2,whiteSpace:'nowrap'}}>{String(h.b).slice(0,4)}/{String(h.b).slice(4)}</div>
                          <div style={{fontFamily:'monospace',fontSize:'0.92rem',fontWeight:700,whiteSpace:'nowrap',color: kyujo ? 'var(--light)' : kk ? 'var(--ink)' : '#c0392b'}}>
                            {kyujo ? '\u4f11' : `${h.w}\u2013${h.l}`}{h.y ? ' \ud83c\udfc6' : ''}
                          </div>
                          {h.r ? <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',whiteSpace:'nowrap',marginTop:1}}>{shortR(h.r)}</div> : null}
                        </div>
                      )
                    })}
                    <div style={{textAlign:'center',borderLeft:'1px solid var(--border)'}}>
                      <div style={{fontFamily:'monospace',fontSize:'0.53rem',color:'#1a6b5c',marginBottom:2,whiteSpace:'nowrap'}}>{String(currentBashoId()).slice(0,4)}/{String(currentBashoId()).slice(4)}</div>
                      <div style={{fontFamily:'monospace',fontSize:'0.92rem',fontWeight:700,whiteSpace:'nowrap',color: (r.wins + r.losses) === 0 ? 'var(--light)' : 'var(--ink)'}}>{(r.wins + r.losses) === 0 ? '\u4f11' : r.wins + '\u2013' + r.losses}</div>
                      <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',whiteSpace:'nowrap',marginTop:1}}>{shortR(r.rank)}</div>
                    </div>
                  </>)
                })()}
              </div>

            </div>

            <div style={{
              background: st.bg,
              display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',
              padding:'0.5rem 1rem',
              gap:4,textAlign:'center',
            }}>
              {r.forecasts.slice(0, 1).map  /* rf_grid10_v2 */((f,i) => {
                const fst = TYPE_STYLES[f.type] || TYPE_STYLES.info
                const text = (f.text && typeof f.text === 'object') ? (f.text[lang] || f.text.uk) : f.text  /* forecast_i18n_client_v1 */
                return (
                  <div key={i} style={{
                    color: fst.color,
                    fontSize:'0.75rem',
                    lineHeight:1.4,
                    fontWeight: i === 0 ? 600 : 400,
                  }}>
                    {text}{typeof f.need === 'number' ? ' \u2014 ' + chancePct(f.need, r.wins, r.losses, r.last9) + '%' : ''}
                  </div>
                )
              })}
              {(r.wins + r.losses) > 0 && (() => {  /* rf_updown_v1 */
                const pKachi = chancePct(8 - r.wins, r.wins, r.losses, r.last9)
                return (
                  <div style={{fontFamily:'monospace',fontSize:'0.62rem',display:'flex',gap:10,justifyContent:'center',marginTop:2}}>
                    <span style={{color:'#1a6b5c'}}>{'\u2191'} {t3(lang, 'качі-коші', 'kachi-koshi', '勝ち越し')} {pKachi}%</span>
                    <span style={{color:'#c0392b'}}>{'\u2193'} {t3(lang, 'маке-коші', 'make-koshi', '負け越し')} {100 - pKachi}%</span>
                  </div>
                )
              })()}
            </div>
          </div>
        )
      })}
    </div>
  )
}
/* rankforecast_verdict_fixed_v1 */
