/* auto_current_v3 */
'use client' /* ja_gaps_v1  kanji_names_v2 */ /* ja_batch3 */ /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */
import { HEYA_JA } from '../lib/heyaJa' /* heya_ja_lib_v1 */
import HeyaLink from './HeyaLink'  /* heya_links_v1 */

import { useEffect, useState, useRef } from 'react'  /* useref_fix_v1 */
import YT_VIDEOS from '../lib/ytVideos.json' /* yt_direct_videos_v1 */

function directVideo(bashoId, day, myJa, oppJa) {
  const bouts = YT_VIDEOS?.[bashoId]?.[String(day)]
  if (!bouts || !myJa) return null
  const me = String(myJa).split(/\s|\u3000/)[0]
  const op = oppJa ? String(oppJa).split(/\s|\u3000/)[0] : null
  const hit = bouts.find(x => (x.a === me || x.b === me) && (!op || x.a === op || x.b === op))
  return hit ? `https://www.youtube.com/watch?v=${hit.v}` : null
}

import { useLang } from './LangProvider'
import { displayName, displayRank, currentBashoId, bashoInfo, BASHO_LIST } from '../lib/bashoCalendar' /* rikishi_basho_selector_v1 */
import RikishiTopTable from './RikishiTopTable' /* rikishi_top_table_v1 */
import FavStar from './FavStar' /* favorites_v1 */
import VoteButton from './VoteButton' /* votes_v1 */
import BashoHistoryPicker from './BashoHistoryPicker' /* history_picker_wire_v1 */
import rikishiMeta from '../lib/rikishiMeta.json' /* hirank_bio_v1 */

const RESULTS_WIN = ['win', 'fusen win']
const RESULTS_LOSS = ['loss', 'fusen loss']
/* yt_query_ja_v1: poshuk po kanalu yaponskoyu u formati nazv @sumo-video */
const DAY_JA = {1:'初日',2:'二日目',3:'三日目',4:'四日目',5:'五日目',6:'六日目',7:'七日目',8:'中日',9:'九日目',10:'十日目',11:'十一日目',12:'十二日目',13:'十三日目',14:'十四日目',15:'千秋楽'}
const MONTH_JA = {'01':'一','03':'三','05':'五','07':'七','09':'九','11':'十一'}
function bashoJa(bashoId) {
  const y = parseInt(bashoId.slice(0,4)) - 2018
  const m = MONTH_JA[bashoId.slice(4)] || ''
  return `令和${y}年${m}月場所`
}


const DAY_VIDEOS = {}
DAY_VIDEOS['202605'] = {
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
  '202605-7-day16': 'https://www.youtube.com/watch?v=dqkC7MPlufc',  /* toi samyi bii z boku Kirishimy */
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

import RikishiCompare from './RikishiCompare' /* rikishi_compare_tab_v1 */
import OvrBadge from './OvrBadge' /* ovr_profile_v1 */
import eloData from '../lib/eloRatings.json' /* ovr_hero_v1 */
import DohyoRating from './DohyoRating' /* dohyo_rating_wire_v1 */
/* heya_ja_lib_v1: import perenesenyi uhoru */
const SANSHO_JA = { 'Gino-sho': '技能賞', 'Kanto-sho': '敢闘賞', 'Shukun-sho': '殊勲賞' }  /* ja_gaps_v4 */
const DIVISION_JA = { Makuuchi: '幕内', Juryo: '十両', Makushita: '幕下', Sandanme: '三段目', Jonidan: '序二段', Jonokuchi: '序ノ口' }  /* ja_gaps_v1 */
function RikishiListCard({ r, onClick, selected }) {
  const { lang } = useLang()  /* listcard_lang_v1 */
  return (
    <div onClick={() => onClick(r)} className="rikishi-list-item" style={{
      background: selected ? 'var(--ink)' : 'var(--card)',
      color: selected ? 'var(--bg)' : 'var(--ink)',
      borderTop:`1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
      borderRight:`1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
      borderBottom:`1px solid ${selected ? 'var(--ink)' : 'var(--border)'}`,
      borderLeft:'3px solid var(--border)',  /* bio_render_v1: yusho-ramka znialy - stats bilshe ne v spysku */
      padding:'0.65rem 0.9rem',
      cursor:'pointer',
    }}>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        
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

export function RikishiDetail({ r, lang, onBack, isMobile, jpMap }) { /* rikishi_hub_v1: export dlia profil-khabiv */
  /* rikishi_basho_selector_v1 */
  const [rikHistory, setRikHistory] = useState(null)  /* history_selector_v1 */
  useEffect(() => {
    let alive = true
    import('../lib/rikishiHistory.json').then(mod => { if (alive) setRikHistory(mod.default || mod) }).catch(() => {})
    return () => { alive = false }
  }, [])
  const [selBasho, setSelBasho] = useState(currentBashoId())
  const [pastData, setPastData] = useState(null)
  const [pastLoading, setPastLoading] = useState(false)
  const pastCache = useRef({})
  useEffect(() => { setSelBasho(currentBashoId()); setPastData(null) }, [r?.id])
  /* bio_fetch_v1: bio+stats dovantazhuiutsia po kliku z /api/rikishi-info, kesh po id */
  const [bio, setBio] = useState(null)
  const bioCache = useRef({})
  useEffect(() => {
    if (!r?.id) { setBio(null); return }
    if (bioCache.current[r.id]) { setBio(bioCache.current[r.id]); return }
    setBio(null)
    fetch(`/api/rikishi-info?id=${r.id}`)
      .then(res => res.json())
      .then(d => { if (!d.error) { bioCache.current[r.id] = d; setBio(d) } })
      .catch(() => {})
  }, [r?.id])
  useEffect(() => {
    if (!r || selBasho === currentBashoId()) { setPastData(null); return }
    const key = `${selBasho}-${r.id}`
    if (pastCache.current[key]) { setPastData(pastCache.current[key]); return }
    setPastLoading(true)
    fetch(`/api/rikishi-matches?rikishiId=${r.id}&bashoId=${selBasho}`)
      .then(res => res.json())
      .then(d => { pastCache.current[key] = d; setPastData(d); setPastLoading(false) })
      .catch(() => { setPastData({ record: [] }); setPastLoading(false) })
  }, [selBasho, r?.id])
  const shownRecord = pastData ? (pastData.record || []) : (r?.record || [])
  const shownWins = pastData ? pastData.wins : r?.wins
  const shownLosses = pastData ? pastData.losses : r?.losses

  if (!r) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,color:'var(--mid)',fontFamily:'monospace',fontSize:'0.8rem'}}>
      {t3(lang, '← Виберіть рікіші зі списку', '← Select a rikishi from the list', '← 一覧から力士を選択')}
    </div>
  )

  const sanshoList = Object.entries(bio?.stats?.sansho || {}).filter(([,v]) => v > 0)  /* bio_render_v1 */
  const bioLabels = lang === 'en'
    ? ['Country', 'Age', 'Height', 'Weight', 'Stable', 'Debut', 'Highest rank']  /* hirank_bio_v1 */
    : lang === 'ja' ? ['出身', '年齢', '身長', '体重', '部屋', '初土俯', '最高位']  /* ja_tails_v1 */
    : ['Країна', 'Вік', 'Зріст', 'Вага', 'Стайня', 'Дебют', 'Найвищий ранг']
  const bioValues = [
    (bio ? (typeof bio.country?.name === 'object' ? (bio.country.name[lang] || bio.country.name.uk) : bio.country?.name) : '…'),  /* country_name_i18n_v1 */
    bio ? (bio.age ? `${bio.age} ${t3(lang, 'р.', 'y.o.', '歳')}` : '—') : '…',
    bio ? (bio.height ? `${bio.height} ${t3(lang, 'см', 'cm', 'cm')}` : '—') : '…',
    bio ? (bio.weight ? `${bio.weight} ${t3(lang, 'кг', 'kg', 'kg')}` : '—') : '…',
    bio ? ((lang === 'ja' && bio.heya && HEYA_JA[bio.heya]) ? HEYA_JA[bio.heya] : (bio.heya || '—')) : '…',
    bio?.debut ? `${bio.debut.slice(0,4)}/${bio.debut.slice(4)}` : (bio ? '—' : '…'),
    (() => { const h = rikishiMeta.find(m => m.id === r.id)?.hiRank; return h ? displayRank(h, lang) : '—' })(),  /* hirank_ja_v1 */
  ]
  /* playoff_generic_v1 */
  const regularMatches = shownRecord.filter(m => (m.day || 0) <= 15)
  const playoffMatches = shownRecord.filter(m => (m.day || 0) > 15)

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

      {/* Верхній блок: фото-колонка + сітка плиток 3x3 (profile_hero_v4) */}
      {(() => {
        const eRt = eloData.ratings[String(r.id || r._id)]
        const tcRt = eRt ? (eRt.ovr >= 90 ? '#c0392b' : eRt.ovr >= 75 ? '#7d3c98' : eRt.ovr >= 60 ? '#1a4a7a' : eRt.ovr >= 40 ? '#1a6b5c' : '#5a544a') : null
        const tile = {background:'var(--bg2)',padding: isMobile ? '0.3rem 0.4rem' : '0.5rem 0.6rem',borderRadius:2,textAlign:'center',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center'}  /* profile_hero_v5 profile_mobile_v3 */
        const tLbl = {fontFamily:'monospace',fontSize: isMobile ? '0.44rem' : '0.7rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom: isMobile ? 1 : 4}
        const tVal = {fontWeight:700,fontSize: isMobile ? '0.6rem' : '1.1rem'}
        const hiRank = (() => { const h = rikishiMeta.find(m => m.id === r.id)?.hiRank; return h ? displayRank(h, lang) : null })()
        const cName = bio ? (typeof bio.country?.name === 'object' ? (bio.country.name[lang] || bio.country.name.uk) : bio.country?.name) : null
        return (
          <div style={{display:'flex',alignItems:'flex-start',gap: isMobile ? '0.5rem' : '1rem',marginBottom:'1rem',flexWrap: isMobile ? 'nowrap' : 'wrap'}}>  {/* profile_mobile_v2 */}
            <div style={{flexShrink:0,width: isMobile ? 72 : 108,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
              <div style={{fontWeight:800,fontSize: isMobile ? '0.95rem' : '1.05rem',textAlign:'center',lineHeight:1.1}}>{displayName(r, lang)}</div>
              <img src={`/rikishi/${r.id}.webp`} alt={r.name}
                style={{width:'100%',height: isMobile ? 158 : 189,objectFit:'cover',objectPosition:'top',borderRadius:4,border:'2px solid var(--border)',display:'block'}}
                onError={e => { e.target.style.display = 'none' }}
                onLoad={e => { e.target.style.display = 'block' }} />
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <FavStar id={r.id || r._id} size={20} /><VoteButton id={r.id || r._id} />
              </div>
              {eRt && eRt.bouts > 0 && (
                <div style={{width:'100%',background:tcRt,color:'#fff',borderRadius:6,padding:'0.45rem 0.4rem',textAlign:'center'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.46rem',letterSpacing:'0.1em',textTransform:'uppercase',opacity:0.85,marginBottom:2}}>{t3(lang, 'Рейтинг Dohyo', 'Dohyo Rating', 'レーティング')}</div>
                  <div style={{fontFamily:'monospace',fontWeight:800,fontSize:'1.4rem',lineHeight:1}}>{eRt.ovr}</div>
                  {eRt.delta !== 0 && <div style={{fontFamily:'monospace',fontSize:'0.6rem',fontWeight:700,marginTop:2,opacity:0.95}}>{eRt.delta > 0 ? '↑' + eRt.delta : '↓' + Math.abs(eRt.delta)}</div>}
                </div>
              )}
            </div>
            <div style={{flex:1,minWidth:0,display:'grid',gridTemplateColumns: 'repeat(3,1fr)',gap: isMobile ? 3 : 6,gridAutoRows:'1fr',alignSelf:'stretch'  /* profile_mobile_v4 */}}>
              <div style={{...tile,padding:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,alignItems:'stretch'}}>
                <div style={{padding:'0.5rem 0.4rem',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={tLbl}>{t3(lang, 'Ранг', 'Rank', '番付')}</div>
                  <div style={{...tVal,fontFamily:'monospace'}}>{displayRank(r.rank, lang)}</div>
                </div>
                <div style={{padding:'0.5rem 0.4rem',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  <div style={tLbl}>{t3(lang, 'Найвищий ранг', 'Highest rank', '最高位')}</div>
                  <div style={{...tVal,fontFamily:'monospace'}}>{hiRank || '—'}</div>
                </div>
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Країна', 'Country', '出身')}</div>
                <div style={tVal}>{bio?.country?.flag ? bio.country.flag + ' ' : ''}{cName || (bio ? '—' : '…')}</div>
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Вік', 'Age', '年齢')}</div>
                <div style={tVal}>{bio ? (bio.age ? `${bio.age} ${t3(lang, 'р.', 'y.o.', '歳')}` : '—') : '…'}</div>
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Юшо', 'Yusho', '優勝')}</div>
                {(bio?.stats?.yusho || 0) > 0 ? (
                  <>
                    <div style={{display:'flex',alignItems:'center',gap:3,flexWrap:'wrap',marginBottom:4}}>
                      {Array.from({length: Math.min(bio.stats.yusho, 6)}).map((_,i) => (<span key={i} style={{fontSize:'0.8rem'}}>{'🏆'}</span>))}
                      <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'#b8860b',marginLeft:2}}>{bio.stats.yusho}{'×'}</span>
                    </div>
                    <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                      {Object.entries(bio.stats.yushoByDivision || {}).filter(([, c]) => c > 0).map(([division, count]) => (
                        <span key={division} style={{fontFamily:'monospace',fontSize:'0.55rem',background: division === 'Makuuchi' ? 'rgba(184,134,11,0.15)' : 'var(--bg)',border:'1px solid var(--border)',color: division === 'Makuuchi' ? '#b8860b' : 'var(--mid)',padding:'1px 5px',borderRadius:2}}>{lang === 'ja' ? (DIVISION_JA[division] || division) : division} {count}{'×'}</span>
                      ))}
                    </div>
                  </>
                ) : <div style={tVal}>{'—'}</div>}
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Дебют', 'Debut', '初土俵')}</div>
                <div style={tVal}>{bio?.debut ? `${bio.debut.slice(0,4)}/${bio.debut.slice(4)}` : (bio ? '—' : '…')}</div>
                {bio?.debut && <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginTop:2}}>{({'01':t3(lang,'Хацу','Hatsu','初'),'03':t3(lang,'Хару','Haru','春'),'05':t3(lang,'Нацу','Natsu','夏'),'07':t3(lang,'Наґоя','Nagoya','名古屋'),'09':t3(lang,'Акі','Aki','秋'),'11':t3(lang,'Кюсю','Kyushu','九州')})[bio.debut.slice(4)] || ''}</div>}
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Зріст', 'Height', '身長')}</div>
                <div style={tVal}>{bio ? (bio.height ? `${bio.height} ${t3(lang, 'см', 'cm', 'cm')}` : '—') : '…'}</div>
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Санко', 'Sansho', '三賞')}</div>
                {sanshoList.length > 0 ? (
                  <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                    {sanshoList.map(([name, count]) => (
                      <span key={name} style={{fontFamily:'monospace',fontSize:'0.55rem',background:'var(--bg)',border:'1px solid var(--border)',padding:'1px 5px',borderRadius:2,color:'var(--mid)'}}>{lang === 'ja' ? (SANSHO_JA[name] || name) : name} {count}{'×'}</span>
                    ))}
                  </div>
                ) : <div style={tVal}>{'—'}</div>}
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Стайня', 'Stable', '部屋')}</div>
                <div style={tVal}>{bio ? (bio.heya ? <HeyaLink heya={bio.heya} lang={lang} /> : '—') : '…'}</div>
              </div>
              <div style={tile}>
                <div style={tLbl}>{t3(lang, 'Вага', 'Weight', '体重')}</div>
                <div style={tVal}>{bio ? (bio.weight ? `${bio.weight} ${t3(lang, 'кг', 'kg', 'kg')}` : '—') : '…'}</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Кар'єрна статистика */}
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        {lang === 'ja' ? '通算成績' : lang === 'en' ? 'Career statistics' : "Кар'єрна статистика"}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>{lang === 'ja' ? '幕内' : 'Makuuchi'}</div>  {/* makuuchi_label_ja */}
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {bio ? `${bio.stats?.makuuchiWins||0}–${(bio.stats?.makuuchiMatches||0) - (bio.stats?.makuuchiWins||0)}` : '…'}
          </div>
          <WinRate wins={bio?.stats?.makuuchiWins||0} total={bio?.stats?.makuuchiMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {bio?.stats?.makuuchiBasho ?? '…'} {t3(lang, 'турнірів', 'tournaments', '場所')}
          </div>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem 1rem',borderRadius:2}}>
          <div style={{fontSize:'0.7rem',color:'var(--mid)',marginBottom:4}}>
            {lang === 'ja' ? '通算合計' : lang === 'en' ? 'Career total' : "Кар'єра загалом"}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'1.1rem',fontWeight:700,marginBottom:6}}>
            {bio ? `${bio.stats?.totalWins||0}–${bio.stats?.totalLosses||0}` : '…'}
          </div>
          <WinRate wins={bio?.stats?.totalWins||0} total={bio?.stats?.totalMatches||0} />
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginTop:4}}>
            {bio?.stats?.totalMatches ?? '…'} {t3(lang, 'матчів', 'matches', '番')}
          </div>
        </div>
      </div>

      {/* Результати турніру */}
      <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
        <BashoHistoryPicker hist={rikHistory?.[String(r.id)] || []} value={selBasho} onChange={setSelBasho} lang={lang} current={{ b: currentBashoId(), w: r.wins, l: r.losses, r: r.rank }} />  {/* history_picker_wire_v1 */}{pastLoading && <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginLeft:6}}>...</span>}  {/* history_tail_v2 */}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4}}>
        {regularMatches.map(m => {
          if (!m.result && !m.opponent) return null
          const isWin = RESULTS_WIN.includes(m.result)
          const isLoss = RESULTS_LOSS.includes(m.result)
          const isFusen = m.kimarite === 'fusen'
          const isAbsent = m.result === 'absent'
          const isEmpty = !m.result
          const pinnedKey = `${selBasho}-${r.id}-day${m.day}`
          const pinnedUrl = PINNED_VIDEOS[pinnedKey] || directVideo(selBasho, m.day, r.nameJp, m.opponentJp || jpMap?.[m.opponent]) || DAY_VIDEOS[selBasho]?.[m.day]
          const oppJa = m.opponentJp || jpMap?.[m.opponent] || m.opponent || ''
          const ytQuery = encodeURIComponent(`${r.nameJp || r.name} ${oppJa} ${bashoJa(selBasho)} ${DAY_JA[m.day] || `Day ${m.day}`}`)
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
                  width:9,height:9,borderRadius: isFusen ? 0 : '50%',flexShrink:0,  /* rp_fusen_square_v1 */
                  background: isWin ? '#f5f0e8' : isLoss ? '#1a1a1a' : isAbsent ? '#aaa' : 'transparent',
border: isWin ? '1.5px solid var(--ink)' : isLoss ? '1.5px solid var(--ink)' : isAbsent ? '1.5px solid #aaa' : isEmpty ? '1px dashed var(--light)' : 'none',
                  opacity: isFusen ? 0.5 : 1,
                }} />
                <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
                  {lang === 'ja' ? `${m.day}日目` : (lang === 'en' ? `Day ${m.day}` : `День ${m.day}`)}
                </span>
              </div>
              {m.opponent ? (
                <div style={{fontSize:'0.68rem',fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lang === 'ja' && m.opponentJp ? m.opponentJp : m.opponent}</div>
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

      {playoffMatches.length > 0 && (
        <div style={{marginTop:'1rem'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.6rem',letterSpacing:'0.12em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.4rem',marginBottom:'0.75rem'}}>
            {t3(lang, 'Плей-оф', 'Playoff', '優勝決定戦')}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:4}}>
            {playoffMatches.map((m, pi) => {
              const isWin = RESULTS_WIN.includes(m.result)
              const pinnedKey = `${selBasho}-${r.id}-day${m.day}`
              const pinnedUrl = PINNED_VIDEOS[pinnedKey] || directVideo(selBasho, m.day, r.nameJp, m.opponentJp || jpMap?.[m.opponent]) || DAY_VIDEOS[selBasho]?.[m.day]
              const oppJa = m.opponentJp || jpMap?.[m.opponent] || m.opponent || ''
              const ytQuery = encodeURIComponent(`${r.nameJp || r.name} ${oppJa} ${bashoJa(selBasho)} 優勝決定戦`)
              const ytUrl = pinnedUrl || `https://www.youtube.com/@sumo-video/search?query=${ytQuery}`
              const label = t3(lang, 'Плей-оф', 'Playoff', '優勝決定戦') + (playoffMatches.length > 1 ? ` ${pi+1}` : '')
              return (
                <div key={`po-${m.day}-${pi}`} style={{background:'var(--bg2)',border:`1px solid ${isWin ? 'rgba(184,134,11,0.5)' : 'rgba(192,57,43,0.4)'}`,padding:'0.4rem 0.6rem',borderRadius:2}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                    <span style={{width:9,height:9,borderRadius:'50%',flexShrink:0,background: isWin ? '#f5f0e8' : '#1a1a1a',border:'1.5px solid var(--ink)'}} />
                    <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>{label}</span>
                  </div>
                  <div style={{fontSize:'0.68rem',fontWeight:600,marginBottom:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{lang === 'ja' && m.opponentJp ? m.opponentJp : m.opponent}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2,gap:4}}>
                    <div style={{fontFamily:'monospace',fontSize:'0.56rem',color:'var(--light)'}}>{m.kimarite} {'\u26a1'}</div>
                    <a href={ytUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      style={{display:'inline-flex',alignItems:'center',fontFamily:'monospace',fontSize:'0.5rem',color:'#fff',background:'#c00',padding:'1px 5px',borderRadius:2,textDecoration:'none',flexShrink:0,lineHeight:1.4}}>
                      {'\u25B6'}
                    </a>
                  </div>
                </div>
              )
            })}
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
        /* rikishi_deeplink_v1: ?id= vede na konkretnogo rikishi */
        const urlId = new URLSearchParams(window.location.search).get('id')
        const target = urlId ? d.rikishi?.find(x => String(x._id) === urlId || String(x.id) === urlId) : null
        if (target) {
          setSelected(target)
          if (window.innerWidth <= 860) setShowDetail(true)
        } else if (d.rikishi?.length) setSelected(d.rikishi[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  /* div_sections_v1: sektsii dyvizioniv, nyzhni zghornuti; poshuk rozghortaie vse */
  const [pageView, setPageView] = useState('list')  /* rikishi_compare_tab_v1 */
  const [openDivs, setOpenDivs] = useState({ Makuuchi: true, Juryo: true })
  useEffect(() => {  /* divs_mobile_collapsed_v2: mob - vse zghorneno pislia mauntu, bez hidratsiinoho mismatchu */
    if (window.innerWidth <= 860) setOpenDivs({})
  }, [])
  const DIVS = ['Makuuchi','Juryo','Makushita','Sandanme','Jonidan','Jonokuchi']
  const DIV_LABEL = { Makuuchi: t3(lang,'Макуучі','Makuuchi','幕内'), Juryo: t3(lang,'Джюрьо','Juryo','十両'), Makushita: t3(lang,'Макушіта','Makushita','幕下'), Sandanme: t3(lang,'Сандамме','Sandanme','三段目'), Jonidan: t3(lang,'Джонідан','Jonidan','序二段'), Jonokuchi: t3(lang,'Джонокучі','Jonokuchi','序ノ口') }
  const renderSections = (onClickFn) => DIVS.map(div => {
    const items = (filtered || []).filter(x => x.division === div)
    if (!items.length) return null
    const open = search.trim() ? true : (openDivs[div] ?? false)
    return (
      <div key={div}>
        <div onClick={() => setOpenDivs(o => ({...o, [div]: !(o[div] ?? false)}))}
          style={{display:'flex',justifyContent:'space-between',alignItems:'center',cursor:'pointer',padding:'0.45rem 0.75rem',background:'var(--ink)',color:'var(--card)',fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.14em',textTransform:'uppercase',position:'sticky',top:0,zIndex:2}}>
          <span>{DIV_LABEL[div]} ({items.length})</span>
          <span>{open ? '▾' : '▸'}</span>
        </div>
        {open && items.map(r => (
          <RikishiListCard key={r.id} r={r} onClick={onClickFn} selected={selected?.id === r.id} />
        ))}
      </div>
    )
  })
  const filtered = data?.rikishi?.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.rank.toLowerCase().includes(search.toLowerCase()) ||
    (typeof r.country?.name === 'object' ? Object.values(r.country.name).join(' ') : (r.country?.name || '')).toLowerCase().includes(search.toLowerCase())  /* rikishi_page_fixes_v1 */
  ) || []
  const jpMap = {}
  data?.rikishi?.forEach(x => { if (x.nameJp) jpMap[x.name] = x.nameJp })  /* yt_query_ja_v1 */

  function handleSelect(r) {
    setSelected(r)
    if (isMobile) setShowDetail(true)
  }

  return (
    <main style={{fontFamily:"'Noto Sans JP',sans-serif",background:'var(--bg)',minHeight:'100vh',color:'var(--ink)'}}>
      <div style={{maxWidth:1280,margin:'0 auto',padding:'2rem 1.5rem 4rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.2em',textTransform:'uppercase',color:'var(--mid)',borderBottom:'1px solid var(--border)',paddingBottom:'0.5rem',marginBottom:'1.5rem'}}>
          {(lang === 'ja' ? '力士 — ' : lang === 'en' ? 'Rikishi — ' : 'Рікіші — ') + bashoInfo(currentBashoId()).label[lang]}
        </div>

        <div style={{display:'flex',gap:8,marginBottom:'1.2rem'}}>
          {['list','compare','rating'].map(v => (  /* dohyo_rating_wire_v1 */
            <button key={v} onClick={() => setPageView(v)} style={{fontFamily:'monospace',fontSize:'0.62rem',letterSpacing:'0.1em',textTransform:'uppercase',padding:'0.35rem 0.9rem',cursor:'pointer',borderRadius:2,border:'1px solid var(--border)',background: pageView === v ? '#8a6a00' : 'var(--bg2)',color: pageView === v ? '#fff' : 'var(--mid)'}}>
              {v === 'list' ? t3(lang, 'Список', 'List', '一覧') : v === 'compare' ? t3(lang, 'Порівняти', 'Compare', '比較') : t3(lang, 'Рейтинг Dohyo', 'Dohyo Rating', '土俵レーティング')}
            </button>
          ))}
        </div>

        {pageView === 'rating' ? (
          <DohyoRating />
        ) : pageView === 'compare' ? (
          <RikishiCompare />
        ) : loading ? (
          <div style={{padding:'3rem',textAlign:'center',fontFamily:'monospace',color:'var(--mid)'}}>
            {t3(lang, 'Завантаження даних...', 'Loading...', '読み込み中...')}
          </div>
        ) : isMobile ? (
          /* Мобільний layout */
          showDetail ? (
            <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1rem'}}>
              <RikishiDetail
                jpMap={jpMap}
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
                {renderSections(handleSelect)}
              </div>
              <RikishiTopTable onSelect={(id) => {  /* toptable_mobile_v1 */
                const t = data?.rikishi?.find(x => x.id === id)
                if (t) { setSelected(t); setShowDetail(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
              }} />
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
                {renderSections(setSelected)}
              </div>
            </div>
            <div style={{minWidth:0}}>{/* toptable_moved_v1 */}
              <div style={{background:'var(--card)',border:'1px solid var(--border)',padding:'1rem 1.25rem'}}>{/* detail_compact_v1 */}
                <RikishiDetail r={selected} lang={lang} isMobile={false} jpMap={jpMap} />
              </div>
              <RikishiTopTable onSelect={(id) => {  /* rikishi_top_table_v1 */
          const t = data?.rikishi?.find(x => x.id === id)
          if (t) {
            setSelected(t)
            if (window.innerWidth <= 860) setShowDetail(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
/* rikishi_page_fixes_v1 */

/* rikishi_deeplink_v1 */

/* rikishi_basho_selector_v1 */

/* playoff_generic_v1 */

/* yt_query_ja_v1 */

/* yt_direct_videos_v1 */
