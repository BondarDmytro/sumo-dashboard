/* auto_current_v3 */
'use client' /* ja_gaps_v1  kanji_names_v2 */ /* ja_batch3 */ /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { displayName, displayRank, currentBashoId, bashoInfo } from '../lib/bashoCalendar' /* basho_labels_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']

const NATSU_2026_DAYS = {
  1:'https://www.youtube.com/watch?v=iDs67K0MBkw',
  2:'https://www.youtube.com/watch?v=SB8XBdvcQWk',
  3:'https://www.youtube.com/watch?v=g_EIsaBPfDQ',
  4:'https://www.youtube.com/watch?v=o4iuuEN6YsU',
  5:'https://www.youtube.com/watch?v=AptBKGxomI0',
  6:'https://www.youtube.com/watch?v=70fQmPz40fU',
  7:'https://www.youtube.com/watch?v=smcdd9yQBmQ',
  8:'https://www.youtube.com/watch?v=acJs0UxC9uQ',
  9:'https://www.youtube.com/watch?v=5nffQM7J2uU',
  10:'https://www.youtube.com/watch?v=zWx2S4W5h8U',
  11:'https://www.youtube.com/watch?v=9XK1pBIQhO4',
  12:'https://www.youtube.com/watch?v=FcfRtn6fxx0',
  13:'https://www.youtube.com/watch?v=9w-Wf-uBwiE',
  14:'https://www.youtube.com/watch?v=9TY-ZfGygb8',
  15:'https://www.youtube.com/watch?v=AXl2YrIZ2w8',
}

const PINNED_VIDEOS = {
  '202605-12-day16': 'https://www.youtube.com/watch?v=dqkC7MPlufc',
}

function WinRate({ wins, total }) {
  const pct = total > 0 ? Math.round(wins / total * 100) : 0
  return (
    <div style={{display:'flex',alignItems:'center',gap:8}}>
      <div style={{flex:1,height:4,background:'var(--bg2)'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'var(--ink)'}} />
      </div>
      <span style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',minWidth:36}}>{pct}%</span>
    </div>
  )
}

const DIVISION_JA = { Makuuchi: '幕内', Juryo: '十両', Makushita: '幕下', Sandanme: '三段目', Jonidan: '序二段', Jonokuchi: '序ノ口' }  /* ja_gaps_v1 */
function RikishiListCard({ r, onClick, selected }) {
  const { lang } = useLang()  /* listcard_lang_v1 */
  return (
    <div onClick={() => onClick(r)} style={{
      background: selected ? 'var(--ink)' : 'var(--card)',
      color: selected ? 'var(--bg)' : 'var(--ink)',
      border:`1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
      borderLeft:`3px solid ${r.stats?.yusho > 0 ? '#b8860b' : 'var(--border)'}`,
      padding:'0.65rem 0.9rem',
      cursor:'pointer',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{fontSize:'0.9rem'}}>{r.country?.flag}</span>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:'0.85rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{displayName(r, lang)}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color: selected ? 'rgba(245,240,232,0.6)' : 'var(--mid)'}}>{displayRank(r.rank, lang)}</div>
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',fontWeight:600,flexShrink:0}}>
          {r.wins}–{r.losses}
        </div>
      </div>
    </div>
  )
}

function RikishiDetail({ r, lang, onBack, isMobile }) {
  if (!r) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--mid)',fontFamily:'monospace',fontSize:'0.8rem'}}>
      {t3(lang, '← Виберіть рікіші зі списку', '← Select a rikishi from the list', '← 一覧から力士を選択')}
    </div>
  )

  const sanshoList = Object.entries(r.stats?.sansho || {}).filter(([,v]) => v > 0)
  const bioLabels = lang === 'en'
    ? ['Country', 'Age', 'Height', 'Weight', 'Stable', 'Debut']
    : lang === 'ja' ? ['出身', '年齢', '身長', '体重', '部屋', '初土俯']  /* ja_tails_v1 */
    : ['Країна', 'Вік', 'Зріст', 'Вага', 'Стайня', 'Дебют']
  const bioValues = [
    (typeof r.country?.name === 'object' ? (r.country.name[lang] || r.country.name.uk) : r.country?.name),  /* country_name_i18n_v1 */
    r.age ? `${r.age} ${t3(lang, 'р.', 'y.o.', '歳')}` : '—',
    r.height ? `${r.height} ${t3(lang, 'см', 'cm', 'cm')}` : '—',
    r.weight ? `${r.weight} ${t3(lang, 'кг', 'kg', 'kg')}` : '—',
    r.heya || '—',
    r.debut ? `${r.debut.slice(0,4)}/${r.debut.slice(4)}` : '—',
  ]
  const hasPlayoff = String(r.id) === '12'

  return (
    <div>
      {/* Кнопка назад — тільки на мобільному */}
      {isMobile && onBack && (
        <button onClick={onBack} style={{
          display:'flex',alignItems:'center',gap:6,
          background:'transparent',border:'none',
          color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem',
          cursor:'pointer',padding:'0 0 1rem 0',
          letterSpacing:'0.05em',
        }}>
          {'‹'} {t3(lang, 'До списку', 'Back to list', '一覧に戻る')}
        </button>
      )}

      {/* Верхній блок: фото + ім'я + біо */}
      <div style={{display:'flex',alignItems:'flex-start',gap:'1rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        <img
          src={`/rikishi/${r.id}.jpg`}
          alt={r.name}
          style={{
            width: isMobile ? 90 : 108,
            height: isMobile ? 158 : 189,
            objectFit:'cover',objectPosition:'top',
            borderRadius:4,border:'2px solid var(--border)',
            flexShrink:0,display:'block',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />

        <div style={{flex:1,minWidth:150,paddingTop:4}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
            <span style={{fontSize:'1.5rem'}}>{r.country?.flag}</span>
            <div style={{fontWeight:800,fontSize: isMobile ? '1.1rem' : '1.4rem',lineHeight:1}}>{displayName(r, lang)}</div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:4}}>{r.nameJp}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginBottom:8}}>{displayRank(r.rank, lang)}</div>

          {r.stats?.yusho > 0 && (
            <div style={{marginBottom:6}}>
              <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',marginBottom:4}}>
                {Array.from({length: Math.min(r.stats.yusho, 10)}).map((_,i) => (
                  <span key={i} style={{fontSize:'0.9rem'}}>{'🏆'}</span>
                ))}
                <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#b8860b',marginLeft:4}}>
                  {r.stats.yusho}{'×'} {t3(lang, 'юшо', 'yusho', '優勝')}
                </span>
              </div>
              {Object.keys(r.stats.yushoByDivision || {}).length > 0 && (
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {Object.entries(r.stats.yushoByDivision)
                    .filter(([, count]) => count > 0)
                    .sort(([a], [b]) => {
                      const order = ['Makuuchi','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi']
                      // ja_gaps_v1
                      return order.indexOf(a) - order.indexOf(b)
                    })
                    .map(([division, count]) => (
                      <span key={division} style={{
                        fontFamily:'monospace',fontSize:'0.58rem',
                        background: division === 'Makuuchi' ? 'rgba(184,134,11,0.15)' : 'var(--bg2)',
                        border: division === 'Makuuchi' ? '1px solid rgba(184,134,11,0.4)' : '1px solid var(--border)',
                        color: division === 'Makuuchi' ? '#b8860b' : 'var(--mid)',
                        padding:'2px 7px',borderRadius:2,
                      }}>
                        {lang === 'ja' ? (DIVISION_JA[division] || division) : division} {count}{'×'}  {/* ja_gaps_div_fix */}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {sanshoList.length > 0 && (
            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
              {sanshoList.map(([name, count]) => (
                <span key={name} style={{fontFamily:'monospace',fontSize:'0.6rem',background:'var(--bg2)',padding:'2px 7px',borderRadius:2,color:'var(--mid)'}}>
                  {name} {count}{'×'}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Біо-сітка */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,width:'100%'}}>
          {bioLabels.map((label, idx) => (
            <div key={label} style={{background:'var(--bg2)',padding:'0.5rem 0.6rem',borderRadius:2}}>
              <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{label}</div>
              <div style={{fontWeight:600,fontSize:'0.8rem'}}>{bioValues[idx]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Кар'єрна статистика */}
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        {lang === 'ja' ? '通算成績' : lang === 'en' ? 'Career statistics' : "Кар'єрна статистика"}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>Makuuchi</div>
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {r.stats?.makuuchiWins}–{(r.stats?.makuuchiMatches||0) - (r.stats?.makuuchiWins||0)}
          </div>
          <WinRate wins={r.stats?.makuuchiWins||0} total={r.stats?.makuuchiMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {r.stats?.makuuchiBasho} {t3(lang, 'турнірів', 'tournaments', '場所')}
          </div>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>
            {lang === 'ja' ? '通算合計' : lang === 'en' ? 'Career total' : "Кар'єра загалом"}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {r.stats?.totalWins}–{r.stats?.totalLosses}
          </div>
          <WinRate wins={r.stats?.totalWins||0} total={r.stats?.totalMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {r.stats?.totalMatches} {t3(lang, 'матчів', 'matches', '番')}
          </div>
        </div>
      </div>

      {/* Результати турніру */}
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        {bashoInfo(currentBashoId()).label[lang] /* ja_batch2 */} — {r.wins}–{r.losses}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4}}>
        {r.record.map(m => {
          if (!m.result && !m.opponent) return null
          const isWin = RESULTS_WIN.includes(m.result)
          const isLoss = RESULTS_LOSS.includes(m.result)
          const isFusen = m.kimarite === 'fusen'
          const isAbsent = m.result === 'absent'
          const isEmpty = !m.result
          const pinnedKey = `202605-${r.id}-day${m.day}`
          const pinnedUrl = PINNED_VIDEOS[pinnedKey] || NATSU_2026_DAYS[m.day]
          const ytQuery = encodeURIComponent(`${bashoInfo(currentBashoId()).label.en} Day ${m.day} ${r.name} ${m.opponent || ''}`) /* basho_labels_v2 */
          const ytUrl = pinnedUrl || `https://www.youtube.com/@sumo-video/search?query=${ytQuery}`
          return (
            <div key={m.day} style={{
              background:'var(--bg2)',
              border:`1px solid ${isWin ? 'rgba(26,107,92,0.4)' : isLoss ? 'rgba(192,57,43,0.4)' : 'var(--border)'}`,
              padding:'0.4rem 0.6rem',borderRadius:2,
              opacity: isEmpty ? 0.4 : 1,
            }}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                <span style={{
                  width:9,height:9,borderRadius:'50%',flexShrink:0,
                  background: isWin ? '#f5f0e8' : isLoss ? '#1a1a1a' : isAbsent ? '#aaa' : 'transparent',
border: isWin ? '1.5px solid var(--ink)' : isLoss ? '1.5px solid var(--ink)' : isAbsent ? '1.5px solid #aaa' : isEmpty ? '1px dashed var(--light)' : 'none',
                  opacity: isFusen ? 0.5 : 1,
                }} />
                <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
                  {lang === 'ja' ? `${m.day}日目` : (lang === 'en' ? `Day ${m.day}` : `День ${m.day}`)}
                </span>
              </div>
              {m.opponent ? (
                <div style={{fontSize:'0.68rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{m.opponent}</div>
              ) : (
                <div style={{fontSize:'0.65rem',color:'var(--light)'}}>—</div>
              )}
              {m.kimarite && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2,gap:4}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)'}}>{m.kimarite}</div>
                  <a href={ytUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                    style={{display:'inline-flex',alignItems:'center',fontFamily:'monospace',fontSize:'0.5rem',color:'#fff',background:'#c00',padding:'1px 5px',borderRadius:2,textDecoration:'none',flexShrink:0,lineHeight:1.4}}>
                    {'\u25B6'}
                  </a>
                </div>
              )}
              {isAbsent && (
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'#c0392b',marginTop:2}}>
                  {t3(lang, 'кюджо', 'kyujo', '休場')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {hasPlayoff && (
        <div style={{marginTop:'1rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
            {t3(lang, 'Плей-оф — День 16', 'Playoff — Day 16', '優勝決定戦')}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4}}>
            <div style={{background:'var(--bg2)',border:'1px solid rgba(184,134,11,0.4)',padding:'0.4rem 0.6rem',borderRadius:2}}>
              <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                <span style={{width:9,height:9,borderRadius:'50%',flexShrink:0,background:'#f5f0e8', border:'1.5px solid var(--ink)'}} />
                <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
                  {lang === 'ja' ? '16日目' : (lang === 'en' ? 'Day 16' : 'День 16')}
                </span>
              </div>
              <div style={{fontSize:'0.68rem',fontWeight:600,marginBottom:2}}>Kirishima</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2,gap:4}}>
                <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)'}}>oshidashi ⚡</div>
                <a href="https://www.youtube.com/watch?v=dqkC7MPlufc" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{display:'inline-flex',alignItems:'center',fontFamily:'monospace',fontSize:'0.5rem',color:'#fff',background:'#c00',padding:'1px 5px',borderRadius:2,textDecoration:'none',flexShrink:0,lineHeight:1.4}}>
                  {'\u25B6'}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RikishiPageClient() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const { lang } = useLang()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/rikishi-list')
      .then(r => r.json())
      .then(d => {
        setData(d)
        if (d.rikishi?.length) setSelected(d.rikishi[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = data?.rikishi?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.rank.toLowerCase().includes(search.toLowerCase()) ||
    r.country?.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  function handleSelect(r) {
    setSelected(r)
    if (isMobile) setShowDetail(true)
  }

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.5rem'}}>
          {(lang === 'ja' ? '幕内力士 — ' : lang === 'en' ? 'Makuuchi rikishi — ' : 'Рікіші макуучі — ') + bashoInfo(currentBashoId()).label[lang]}
        </div>

        {loading ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            {t3(lang, 'Завантаження даних...', 'Loading...', '読み込み中...')}
          </div>
        ) : isMobile ? (
          /* Мобільний layout */
          showDetail ? (
            <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1rem'}}>
              <RikishiDetail
                r={selected} lang={lang}
                isMobile={true}
                onBack={() => setShowDetail(false)}
              />
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t3(lang, 'Пошук...', 'Search...', '検索...')}
                style={{
                  width:'100%',padding:'0.5rem 0.75rem',
                  background:'var(--bg2)',border:'1px solid var(--border)',
                  color:'var(--ink)',fontFamily:'monospace',fontSize:'0.75rem',
                  borderRadius:2,marginBottom:6,outline:'none',boxSizing:'border-box',
                }}
              />
              <div style={{display:'flex',flexDirection:'column',gap:1}}>
                {filtered.map(r => (
                  <RikishiListCard
                    key={r.id} r={r}
                    onClick={handleSelect}
                    selected={selected?.id === r.id}
                  />
                ))}
              </div>
            </>
          )
        ) : (
          /* Десктоп layout */
          <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:'1.5rem',alignItems:'start'}}>
            <div style={{position:'sticky',top:52}}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t3(lang, 'Пошук...', 'Search...', '検索...')}
                style={{
                  width:'100%',padding:'0.5rem 0.75rem',
                  background:'var(--bg2)',border:'1px solid var(--border)',
                  color:'var(--ink)',fontFamily:'monospace',fontSize:'0.75rem',
                  borderRadius:2,marginBottom:6,outline:'none',boxSizing:'border-box',
                }}
              />
              <div style={{maxHeight:'calc(100vh - 140px)',overflowY:'auto',display:'flex',flexDirection:'column',gap:1}}>
                {filtered.map(r => (
                  <RikishiListCard
                    key={r.id} r={r}
                    onClick={setSelected}
                    selected={selected?.id === r.id}
                  />
                ))}
              </div>
            </div>
            <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1.5rem'}}>
              <RikishiDetail r={selected} lang={lang} isMobile={false} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}