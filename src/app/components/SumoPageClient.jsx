/* auto_current_v3 */
'use client' /* ja_kimarite_ui_v1 */
import { KIMARITE_INFO, kimariteKanji } from '../lib/kimarite' /* ja_names_sweep_v1 */
import { t3 } from '../i18n' /* ja_batch1 */

import { useEffect, useState } from 'react'
import { useLang } from './LangProvider'
import { currentBashoId, bashoInfo } from '../lib/bashoCalendar' /* basho_labels_v1 */

const RANK_ORDER = ['Yokozuna', 'Ozeki', 'Sekiwake', 'Komusubi', 'Maegashira']
const RANK_COLORS = {  /* banzuke_rank_colors_v1: kanon = lib/rankColors */
  'Yokozuna': '#b8860b',
  'Ozeki': '#c0392b',
  'Sekiwake': '#1a4a7a',
  'Komusubi': '#1a6b5c',
  'Maegashira': '#8a8578',
}

function getRankType(rank) {
  return RANK_ORDER.find(r => rank?.includes(r)) || 'Maegashira'
}

const KIMARITE_CATS = [  /* kimarite_ja_v1 */
  { label: { uk: 'Виштовхування', en: 'Push-out', ja: '寄り・押し' }, moves: ['yorikiri','oshidashi','tsukidashi','okuridashi','yoritaoshi','oshitaoshi','tsukiotoshi','okuritsuriotoshi','okuriashi'] },
  { label: { uk: 'Кидки', en: 'Throws', ja: '投げ手' }, moves: ['uwatenage','shitatenage','uwatedashinage','shitatedashinage','kotenage','kubinage','sukuinage','kirikaeshi','tottari','katasukashi','ipponzeoi','uwatehineri','shitatehineri'] },
  { label: { uk: 'Підсічки', en: 'Leg trips', ja: '掛け手' }, moves: ['sotogake','uchigake','chongake','kawazugake','kekaeshi','mitokorozeme','ashitori'] },
  { label: { uk: 'Збивання', en: 'Slap-down', ja: '叩き・引き' }, moves: ['hatakikomi','hikiotoshi','haritaoshi','makiotoshi','uchimuso','watashikomi'] },
  { label: { uk: 'Спеціальні', en: 'Special', ja: '特殊技' }, moves: ['fumidashi','koshikudake','tsuriotoshi','isamiashi','okurinage','kimedashi','amiuchi','tsuridashi'] },
]


function getKimariteCategory(name, lang) {
  for (const c of KIMARITE_CATS) {
    if (c.moves.includes(name)) return c.label[lang] || c.label.uk
  }
  return t3(lang, 'Інші', 'Other', 'その他')
}

const KIMARITE_EXT = {
  'yorikiri':'jpg','kekaeshi':'jpg','oshidashi':'png','hatakikomi':'png',
  'uwatenage':'jpg','uwatehineri':'png','shitatenage':'jpg','shitatehineri':'png',
  'yoritaoshi':'png','hikiotoshi':'png','tsukiotoshi':'jpg','oshitaoshi':'jpg',
  'okuridashi':'jpg','kotenage':'png','sukuinage':'png','tsukidashi':'png',
  'uwatedashinage':'png','shitatedashinage':'png','sotogake':'jpg','uchigake':'jpg',
  'katasukashi':'jpg','kubinage':'jpg','tottari':'jpg','kimedashi':'jpg',
  'amiuchi':'jpg','tsuridashi':'jpg','tsuriotoshi':'jpg','kawazugake':'jpg',
  'ipponzeoi':'jpg','chongake':'jpg','makiotoshi':'jpg','mitokorozeme':'jpg',
  'watashikomi':'jpg','kirikaeshi':'jpg','uchimuso':'png','ashitori':'png',
  'okurinage':'jpg','okuritsuriotoshi':'jpg','fumidashi':'jpg','isamiashi':'jpg',
  'koshikudake':'jpg',
}
const NSK_IMG = (name) => KIMARITE_EXT[name] ? `/kimarite/${name}.${KIMARITE_EXT[name]}` : null

/* KIMARITE_INFO -> lib/kimarite.js (kimarite_lib_v1) */

function BanzukeView({ data, lang }) {
  if (!data) return null
  const { east, west } = data
  const ranks = {}
  ;[...(east||[]), ...(west||[])].forEach(r => {
    const type = getRankType(r.rank)
    if (!ranks[type]) ranks[type] = { east: [], west: [] }
    if (r.side === 'East') ranks[type].east.push(r)
    else ranks[type].west.push(r)
  })

  const rankLabel = (rankType) => {
    if (lang === 'en') return rankType
    return rankType === 'Maegashira' ? (lang === 'ja' ? '前頭' : lang === 'en' ? 'Maegashira' : 'Маєґашіра') :  /* ja_gaps_v4 */
           lang === 'ja' ? (rankType === 'Yokozuna' ? '横綱' : rankType === 'Ozeki' ? '大関' : rankType === 'Sekiwake' ? '関脇' : '小結') :  /* ja_tails_v1 */
           rankType === 'Yokozuna' ? 'Йокодзуна' :
           rankType === 'Ozeki' ? 'Озекі' :
           rankType === 'Sekiwake' ? 'Секіваке' : 'Комусубі'
  }

  return (
    <div>
      {RANK_ORDER.map(rankType => {
        if (!ranks[rankType]) return null
        const { east: e, west: w } = ranks[rankType]
        const rows = Math.max(e.length, w.length)
        return (
          <div key={rankType} style={{marginBottom:2}}>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',color:RANK_COLORS[rankType],padding:'0.3rem 0.75rem',background:'var(--bg2)',borderLeft:`3px solid ${RANK_COLORS[rankType]}`}}>
              {rankLabel(rankType)}
            </div>
            {Array.from({length: rows}).map((_, i) => {
              const er = e[i]
              const wr = w[i]
              return (
                <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4,borderBottom:'1px solid var(--border)',background: i % 2 === 0 ? 'var(--card)' : 'var(--bg2)'}}>
                  <div style={{padding:'0.5rem 0.75rem',display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end'}}>
                    {er && (<>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700,fontSize:'0.85rem'}}>{lang === 'ja' && er.shikonaJp ? er.shikonaJp : er.shikonaEn}</div>
                        <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{er.wins}–{er.losses}</div>
                      </div>
                      <span style={{fontSize:'0.9rem'}}>{er.flag || '🇯🇵'}</span>
                    </>)}
                  </div>

                  <div style={{padding:'0.5rem 0.75rem',display:'flex',alignItems:'center',gap:8}}>
                    {wr && (<>
                      <span style={{fontSize:'0.9rem'}}>{wr.flag || '🇯🇵'}</span>
                      <div>
                        <div style={{fontWeight:700,fontSize:'0.85rem'}}>{lang === 'ja' && wr.shikonaJp ? wr.shikonaJp : wr.shikonaEn}</div>
                        <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{wr.wins}–{wr.losses}</div>
                      </div>
                    </>)}
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

function KimariteModal({ item, onClose, lang }) {
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
          {getKimariteCategory(item.kimarite, lang)}
        </div>
        <h2 style={{fontSize:'1.4rem',fontWeight:800,marginBottom: lang === 'ja' ? 0 : '0.75rem'}}>{lang === 'ja' ? kimariteKanji(item.kimarite) : item.kimarite}</h2>
        {lang === 'ja' && <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.75rem'}}>{item.kimarite}</div>}
        {(lang === 'ja' ? (info?.ja || info?.en) : lang === 'en' ? info?.en : info?.ua) && (
          <p style={{fontSize:'0.85rem',color:'var(--mid)',lineHeight:1.6,marginBottom:'1rem'}}>
            {lang === 'ja' ? (info.ja || info.en) : lang === 'en' ? info.en : info.ua}
          </p>
        )}
        <div style={{background:'var(--bg2)',borderRadius:2,padding:'1rem',textAlign:'center',marginBottom:'1rem',minHeight:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {info?.img ? (
            <img
              src={info.img}
              alt={item.kimarite}
              style={{maxWidth:'100%',maxHeight:220,objectFit:'contain'}}
              onError={e => { e.target.parentElement.innerHTML = '<span style="font-family:monospace;font-size:0.7rem;color:var(--mid)">—</span>' }}
            />
          ) : (
            <span style={{fontFamily:'monospace',fontSize:'0.7rem',color:'var(--mid)'}}>—</span>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>
              {t3(lang, 'Використань за всю історію', 'Uses in all-time history', '通算使用回数')}
            </div>
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

function KimariteView({ data, lang }) {
  const [selected, setSelected] = useState(null)
  if (!data?.records) return null
  const sorted = data.records.slice(0, 30)
  const maxCount = sorted[0]?.count || 1
  const totalCount = sorted.reduce((s, item) => s + item.count, 0)

  return (
    <div>
      {selected && <KimariteModal item={selected} onClose={() => setSelected(null)} lang={lang} />}
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
              <div style={{fontWeight:600,fontSize:'0.85rem',marginBottom:1}}>{lang === 'ja' ? kimariteKanji(item.kimarite) : item.kimarite}</div>
              {lang === 'ja' && <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--light)'}}>{item.kimarite}</div>}
              <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:3}}>{getKimariteCategory(item.kimarite, lang)}</div>
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
        {t3(lang, '* Загальна статистика з 1958 · Натисни на техніку для деталей', '* All-time statistics since 1958 · Click on a technique for details', '* 1958年以降の通算統計 ・ 技をクリックで詳細')}
      </div>
    </div>
  )
}

export default function SumoPageClient() {
  const [tab, setTab] = useState('banzuke')
  const [banzuke, setBanzuke] = useState(null)
  const [kimarite, setKimarite] = useState(null)
  const [loading, setLoading] = useState(true)
  const { lang } = useLang()

  useEffect(() => {
    Promise.all([
      fetch(`https://sumo-api.com/api/basho/${currentBashoId()}/banzuke/Makuuchi`).then(r => r.json()),  /* auto_current_v4 */
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
    { id: 'banzuke', label: t3(lang, 'Банзуке', 'Banzuke', '番付') },
    { id: 'kimarite', label: t3(lang, 'Кімаріте', 'Kimarite', '決まり手') },
  ]

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'0.5rem'}}>
          {bashoInfo(currentBashoId()).label[lang] /* ja_batch2 */}
        </div>
        <h1 style={{fontSize:'1.6rem',fontWeight:800,marginBottom:'1.5rem'}}>
          {t3(lang, 'Про сумо', 'About Sumo', '相撲について')}
          <span style={{color:'#b8860b'}}>{t3(lang, ' — Довідник', ' — Guide', ' — ガイド')}</span>
        </h1>

        <div style={{display:'flex',gap:1,marginBottom:'2rem',borderBottom:'2px solid var(--border)'}}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{padding:'0.6rem 1.25rem',fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.1em',textTransform:'uppercase',background:'transparent',border:'none',color: tab === t.id ? 'var(--ink)' : 'var(--mid)',borderBottom: tab === t.id ? '2px solid #b8860b' : '2px solid transparent',marginBottom:-2,cursor:'pointer'}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            {t3(lang, 'Завантаження...', 'Loading...', '読み込み中...')}
          </div>
        ) : (
          <>
            {tab === 'banzuke' && (
              <div>
                <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'1.5rem',lineHeight:1.6}}>
                  {lang === 'en'
                    ? 'Banzuke is the official ranking list of wrestlers before the tournament. East is traditionally considered the stronger side.'
                    : lang === 'ja' ? '番付は場所前に発表される公式の力士ランキング。伝統的に東が格上とされる。'  /* ja_final_tails */
                    : 'Банзуке — офіційна таблиця рангів борців перед початком турніру. Схід (East) традиційно вважається сильнішою стороною.'}
                </p>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,marginBottom:4}}>
                  <div style={{padding:'0.4rem 0.75rem',fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',textAlign:'right',color:'var(--mid)'}}>
                    {t3(lang, 'СХІД (EAST)', 'EAST', '東')}
                  </div>

                  <div style={{padding:'0.4rem 0.75rem',fontFamily:'monospace',fontSize:'0.62rem',fontWeight:700,letterSpacing:'0.1em',color:'var(--mid)'}}>
                    {t3(lang, 'ЗАХІД (WEST)', 'WEST', '西')}
                  </div>
                </div>
                <BanzukeView data={banzuke} lang={lang} />
              </div>
            )}
            {tab === 'kimarite' && (
              <div>
                <p style={{fontSize:'0.82rem',color:'var(--mid)',marginBottom:'1.5rem',lineHeight:1.6}}>
                  {lang === 'en'
                    ? 'Kimarite are the official winning techniques in sumo. There are 82 official techniques in total. Click on any technique for a description and video.'
                    : lang === 'ja' ? '決まり手は相撲の勝負を決める公式の技。82手あり、クリックで詳細と動画を表示。'
                    : 'Кімаріте — офіційні техніки завершення поєдинку в сумо. Всього існує 82 офіційні техніки. Натисни на будь-яку для опису та відео.'}
                </p>
                <KimariteView data={kimarite} lang={lang} />
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
/* kimarite_ja_v2 */
