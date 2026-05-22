'use client'

import { useEffect, useState } from 'react'

const RANK_ORDER = ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi', 'Maegashira']
const RANK_COLORS = {
  'Yokozuna': '#b8860b',
  'Ozeki': '#1a6b5c',
  'Sekiwake': '#1a4a7a',
  'Komusubi': '#8e44ad',
  'Maegashira': 'var(--mid)',
}

function getRankType(rank) {
  return RANK_ORDER.find(r => rank?.includes(r)) || 'Maegashira'
}

const KIMARITE_CATEGORIES = {
  'Виштовхування': ['yorikiri','oshidashi','tsukidashi','okuridashi','yoritaoshi','oshitaoshi','tsukiotoshi','okuritsuriotoshi','okuriashi'],
  'Кидки': ['uwatenage','shitatenage','uwatedashinage','shitatedashinage','kotenage','kubinage','sukuinage','kirikaeshi','tottari','katasukashi','ipponzeoi','uwatehineri','shitatehineri'],
  'Підсічки': ['sotogake','uchigake','chongake','kawazugake','kekaeshi','mitokorozeme','ashitori'],
  'Збивання': ['hatakikomi','hikiotoshi','haritaoshi','makiotoshi','uchimuso','watashikomi'],
  'Спеціальні': ['fumidashi','koshikudake','tsuriotoshi','isamiashi','okurinage','kimedashi','amiuchi','tsuridashi'],
}

function getKimariteCategory(name) {
  for (const [cat, moves] of Object.entries(KIMARITE_CATEGORIES)) {
    if (moves.includes(name)) return cat
  }
  return 'Інші'
}

const KIMARITE_INFO = {
  'yorikiri': { ua: 'Виштовхування суперника за межі дохьо грудьми або тулубом, тримаючи його за маваші. Найпоширеніша техніка в сумо.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Sumo_kimari-te_yorikiri.svg/400px-Sumo_kimari-te_yorikiri.svg.png' },
  'oshidashi': { ua: 'Виштовхування суперника обома руками без захвату маваші. Друга за популярністю техніка.', img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Sumo_kimari-te_oshidashi.svg/400px-Sumo_kimari-te_oshidashi.svg.png' },
  'hatakikomi': { ua: 'Збивання суперника вниз ударом долонею по спині або плечу коли він втрачає рівновагу.', img: null },
  'uwatenage': { ua: 'Кидок суперника через верхній захват маваші зовнішньою рукою.', img: null },
  'yoritaoshi': { ua: 'Суперника виштовхують і він падає за межами дохьо. Схожа на yorikiri але суперник падає.', img: null },
  'hikiotoshi': { ua: 'Різке притягування суперника вниз за руку або плече коли він рухається вперед.', img: null },
  'tsukiotoshi': { ua: 'Збивання суперника поштовхом в бік або вниз.', img: null },
  'oshitaoshi': { ua: 'Суперника штовхають і він падає за межами дохьо.', img: null },
  'shitatenage': { ua: 'Кидок суперника через нижній захват маваші внутрішньою рукою.', img: null },
  'okuridashi': { ua: 'Виштовхування суперника ззаду обома руками. Зазвичай після розвороту.', img: null },
  'kotenage': { ua: 'Кидок через захват руки суперника під пахву.', img: null },
  'sukuinage': { ua: 'Кидок через підхват — захоплення руки суперника знизу з наступним кидком.', img: null },
  'tsukidashi': { ua: 'Виштовхування суперника серією поштовхів без захвату маваші.', img: null },
  'uwatedashinage': { ua: 'Кидок суперника вниз через верхній захват маваші.', img: null },
  'sotogake': { ua: 'Підсічка зовнішньою ногою — зачіп ноги суперника зовні.', img: null },
  'katasukashi': { ua: 'Суперника перекидають через плече захопивши його руку під пахву.', img: null },
  'kubinage': { ua: 'Кидок через шию — суперника захоплюють за шию і кидають через себе.', img: null },
  'uwatehineri': { ua: 'Скручування суперника через верхній захват маваші.', img: null },
  'tottari': { ua: 'Захоплення обох рук суперника і перекидання його через себе.', img: null },
  'uchigake': { ua: 'Підсічка внутрішньою ногою — зачіп ноги суперника зсередини.', img: null },
  'kimedashi': { ua: 'Виштовхування суперника з фіксацією його рук.', img: null },
  'amiuchi': { ua: 'Кидок через закидання руки через плече суперника.', img: null },
}

function BanzukeView({ data }) {
  if (!data) return null
  const { east, west } = data
  const ranks = {}
  ;[...(east||[]), ...(west||[])].forEach(r => {
    const type = getRankType(r.rank)
    if (!ranks[type]) ranks[type] = { east: [], west: [] }
    if (r.side === 'East') ranks[type].east.push(r)
    else ranks[type].west.push(r)
  })
  return (
    <div>
      {RANK_ORDER.map(rankType => {
        if (!ranks[rankType]) return null
        const { east: e, west: w } = ranks[rankType]
        const rows = Math.max(e.length, w.length)
        return (
          <div key={rankType} style={{marginBottom:2}}>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:RANK_COLORS[rankType],padding:'0.3rem 0.75rem',background:'var(--bg2)',borderLeft:`3px solid ${RANK_COLORS[rankType]}`}}>
              {rankType === 'Maegashira' ? 'Маєґашіра' : rankType === 'Yokozuna' ? 'Йокодзуна' : rankType === 'Ozeki' ? 'Озекі' : rankType === 'Sekiwake' ? 'Секіваке' : 'Комусубі'}
            </div>
            {Array.from({length: rows}).map((_, i) => {
              const er = e[i]
              const wr = w[i]
              return (
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:4,borderBottom:'1px solid var(--border)',background: i % 2 === 0 ? 'var(--card)' : 'var(--bg2)'}}>
                  <div style={{padding:'0.5rem 0.75rem',display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                    {er && (
                      <>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontWeight:700,fontSize:'0.85rem'}}>{er.shikonaEn}</div>
                          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{er.wins}–{er.losses}</div>
                        </div>
                        <span style={{fontSize:'0.9rem'}}>{er.flag || '🇯🇵'}</span>
                      </>
                    )}
                  </div>
                  <div style={{padding:'0.5rem 0.5rem',textAlign:'center',minWidth:80,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:RANK_COLORS[rankType],fontWeight:600}}>
                      {er?.rank?.replace(rankType+' ','').replace(' East','e').replace(' West','w') || wr?.rank?.replace(rankType+' ','').replace(' East','e').replace(' West','w')}
                    </div>
                  </div>
                  <div style={{padding:'0.5rem 0.75rem',display:'flex',alignItems:'center',gap:8}}>
                    {wr && (
                      <>
                        <span style={{fontSize:'0.9rem'}}>{wr.flag || '🇯🇵'}</span>
                        <div>
                          <div style={{fontWeight:700,fontSize:'0.85rem'}}>{wr.shikonaEn}</div>
                          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{wr.wins}–{wr.losses}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function KimariteModal({ item, onClose }) {
  if (!item) return null
  const info = KIMARITE_INFO[item.kimarite]
  const ytUrl = `https://www.youtube.com/results?search_query=sumo+${item.kimarite}+technique`

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div onClick={e => e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:4,maxWidth:480,width:'100%',padding:'1.5rem',position:'relative'}}>
        <button onClick={onClose} style={{position:'absolute',top:12,right:12,background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1}}>
          {'✕'}
        </button>
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--light)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>
          {getKimariteCategory(item.kimarite)}
        </div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,marginBottom:'0.75rem'}}>{item.kimarite}</h2>
        {info?.ua && (
          <p style={{fontSize:'0.85rem',color:'var(--mid)',lineHeight:1.6,marginBottom:'1rem'}}>
            {info.ua}
          </p>
        )}
        {info?.img ? (
          <div style={{background:'var(--bg2)',borderRadius:2,padding:'1rem',textAlign:'center',marginBottom:'1rem'}}>
            <img src={info.img} alt={item.kimarite} style={{maxWidth:'100%',maxHeight:220,objectFit:'contain'}} onError={e => { e.target.style.display='none' }} />
          </div>
        ) : (
          <div style={{background:'var(--bg2)',borderRadius:2,padding:'2rem',textAlign:'center',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.75rem',marginBottom:'1rem'}}>
            {info ? 'Зображення буде додано' : 'Опис та зображення буде додано'}
          </div>
        )}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>Використань за всю історію</div>
            <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700}}>{item.count.toLocaleString()}</div>
          </div>
          <a href={ytUrl} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:6,background:'#FF0000',color:'#fff',padding:'6px 14px',borderRadius:2,textDecoration:'none',fontFamily:'monospace',fontSize:'0.68rem',fontWeight:600}}>
            <span>{'▶'}</span>
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </div>
  )
}

function KimariteView({ data }) {
  const [selected, setSelected] = useState(null)
  if (!data?.records) return null
  const sorted = data.records.slice(0, 30)
  const maxCount = sorted[0]?.count || 1
  const totalCount = sorted.reduce((s, item) => s + item.count, 0)

  return (
    <div>
      {selected && <KimariteModal item={selected} onClose={() => setSelected(null)} />}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:4,marginBottom:'2rem'}}>
        {sorted.map((item, i) => (
          <div key={item.kimarite} onClick={() => setSelected(item)}
            style={{background:'var(--card)',border:'1px solid var(--border)',padding:'0.6rem 0.75rem',display:'flex',alignItems:'center',gap:10,cursor:'pointer',transition:'border-color 0.15s'}}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--ink)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
          >
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg2)',color:'var(--mid)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'monospace',fontSize:'0.65rem',flexShrink:0,fontWeight:600}}>
              {i+1}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:'0.85rem',marginBottom:1}}>{item.kimarite}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:3}}>{getKimariteCategory(item.kimarite)}</div>
              <div style={{height:3,background:'var(--bg2)',borderRadius:1}}>
                <div style={{height:'100%',width:`${item.count/maxCount*100}%`,background: i === 0 ? '#b8860b' : i < 3 ? '#1a6b5c' : 'var(--mid)',borderRadius:1}} />
              </div>
            </div>
            <div style={{textAlign:'right',flexShrink:0}}>
              <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:700}}>{item.count.toLocaleString()}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>{(item.count/totalCount*100).toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:'0.72rem',color:'var(--mid)',fontFamily:'monospace'}}>
        * Загальна статистика з 1958 · Натисни на техніку для деталей
      </div>
    </div>
  )
}

export default function SumoPageClient() {
  const [tab, setTab] = useState('banzuke')
  const [banzuke, setBanzuke] = useState(null)
  const [kimarite, setKimarite] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('https://sumo-api.com/api/basho/202605/banzuke/Makuuchi').then(r => r.json()),
      fetch('https://sumo-api.com/api/kimarite?sortField=count&sortOrder=desc').then(r => r.json()),
      fetch('/api/bios').then(r => r.json()),
    ]).then(([b, k, biosData]) => {
      const addFlags = (list) => (list||[]).map(r => ({...r, flag: biosData[r.rikishiID]?.country?.flag || '🇯🇵'}))
      setBanzuke({ east: addFlags(b.east), west: addFlags(b.west) })
      setKimarite(k)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'banzuke', label: 'Банзуке' },
    { id: 'kimarite', label: 'Кіматі' },
  ]

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1100,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          Натсу Басьо 2026
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'1.5rem'}}>
          Про сумо
          <span style={{color:'#b8860b'}}> — Довідник</span>
        </h1>
        <div style={{display:'flex',gap:1,marginBottom:'2rem',borderBottom:'2px solid var(--border)'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'0.6rem 1.25rem',fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',background:'transparent',border:'none',color: tab === t.id ? 'var(--ink)' : 'var(--mid)',borderBottom: tab === t.id ? '2px solid #b8860b' : '2px solid transparent',marginBottom:-2,cursor:'pointer'}}>
              {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>Завантаження...</div>
        ) : (
          <>
            {tab === 'banzuke' && (
              <div>
                <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'1.5rem',lineHeight:1.6}}>
                  Банзуке — офіційна таблиця рангів борців перед початком турніру. Схід (East) традиційно вважається сильнішою стороною.
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:0,marginBottom:4}}>
                  <div style={{padding:'0.4rem 0.75rem',fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textAlign:'right',color:'var(--mid)'}}>СХІД (EAST)</div>
                  <div style={{padding:'0.4rem 0.5rem',minWidth:80}} />
                  <div style={{padding:'0.4rem 0.75rem',fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--mid)'}}>ЗАХІД (WEST)</div>
                </div>
                <BanzukeView data={banzuke} />
              </div>
            )}
            {tab === 'kimarite' && (
              <div>
                <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'1.5rem',lineHeight:1.6}}>
                  Кіматі — офіційні техніки завершення поєдинку в сумо. Всього існує 82 офіційні техніки. Натисни на будь-яку для опису та відео.
                </p>
                <KimariteView data={kimarite} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}