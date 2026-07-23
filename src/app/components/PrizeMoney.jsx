'use client'
/* rank_color_pm_v1 */
import { useState, useEffect } from 'react'
import { rankColor } from '../lib/rankColors' /* rank_color_pm_v1 */
import RikishiLink from './RikishiLink' /* rikishi_links_batch2_v1 */
import OvrBadge from './OvrBadge' /* ovr_round4b_v1 */
import { displayName, displayRank, shortRank } from '../lib/bashoCalendar' /* ja_names_sweep_v1 */ /* ja_batch2_t */
import { t3 } from '../i18n' /* ja_batch1 */

import { useLang } from './LangProvider'
import rikishiMeta from '../lib/rikishiMeta.json' /* pm_career_v1 */
const CAREER = Object.fromEntries(rikishiMeta.map(m => [String(m.id), m.wins * 70000 + (m.yusho || 0) * 10000000]))
import { useBios } from './BiosProvider'

const PRIZE_YUSHO = 10_000_000
const PRIZE_SPECIAL = 2_000_000
const PRIZE_PER_WIN = 70_000

const SPECIAL_PRIZE_NAMES = {
  'Shukun-sho': { uk: 'Шюкун-шо (найкращий результат)', en: 'Shukun-sho (Outstanding Performance)', ja: '殊勲賞' },
  'Kanto-sho': { uk: 'Канто-шо (бойовий дух)', en: 'Kanto-sho (Fighting Spirit)', ja: '敢闘賞' },
  'Gino-sho': { uk: 'Гіно-шо (техніка)', en: 'Gino-sho (Technique)', ja: '技能賞' },  /* ja_batch4b */
}

function formatYen(amount) {
  return `¥${amount.toLocaleString('en-US')}`
}

/* pm_mobile_v2: kompaktnyi format dlia vuzkykh ekraniv */
function formatYenShort(amount) {
  if (amount >= 1000000) return `¥${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (amount >= 1000) return `¥${Math.round(amount / 1000)}K`
  return `¥${amount}`
}

function formatUSD(amount) {
  return `~$${Math.round(amount / 149).toLocaleString('en-US')}`
}

/* pm_career_usd_v1: korotkyi USD dlia velykykh sum */
function formatUSDShort(amount) {
  const usd = amount / 149
  if (usd >= 1000000) return `~$${(usd / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (usd >= 1000) return `~$${Math.round(usd / 1000)}K`
  return `~$${Math.round(usd)}`
}

export default function PrizeMoney({ rikishi, specialPrizes = [], yushoData = [], isFinished }) {
  const [isMobile, setIsMobile] = useState(false)  /* pm_ismobile */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    setIsMobile(mq.matches)
    const h = e => setIsMobile(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  const fmt = isMobile ? formatYenShort : formatYen
  const { lang } = useLang()
  const bios = useBios()

  const yushoWinnerId = yushoData.find(y => y.type === 'Makuuchi')?.rikishiId

  const prizes = rikishi.map(r => {
    let total = 0
    const breakdown = []

    // Юшо
    const isYusho = yushoWinnerId && String(yushoWinnerId) === r._id
    if (isYusho) {
      total += PRIZE_YUSHO
      breakdown.push({ label: t3(lang, 'Юшо', 'Yusho', '優勝'), amount: PRIZE_YUSHO, color: '#b8860b' })
    }

    // Санко-шо
    const rikishiPrizes = specialPrizes.filter(p => String(p.rikishiId) === r._id)
    rikishiPrizes.forEach(p => {
      total += PRIZE_SPECIAL
      const name = SPECIAL_PRIZE_NAMES[p.type]
      breakdown.push({
        label: lang === 'ja' ? (name?.ja || p.type) : lang === 'en' ? (name?.en || p.type) : (name?.uk || p.type),
        amount: PRIZE_SPECIAL,
        color: '#1a4a7a'
      })
    })

    // Всі перемоги × ¥70,000
    if (r.wins > 0) {
      const winsAmount = r.wins * PRIZE_PER_WIN
      total += winsAmount
      breakdown.push({
        label: lang === 'ja' ? `${r.wins}勝 × ¥70,000` : lang === 'en' ? `${r.wins} wins × ¥70,000` : `${r.wins} перемог × ¥70,000`,
        amount: winsAmount,
        color: '#1a6b5c'
      })
    }

    return { ...r, total, breakdown, flag: bios[r._id]?.country?.flag || '🇯🇵' }
  })
  .filter(r => r.total > 0)
  .sort((a, b) => b.total - a.total)

  const maxTotal = prizes[0]?.total || 1
  const gridCols = isMobile ? '20px 20px minmax(0,1fr) 44px 34px 38px 60px' : '30px 26px 130px 64px 44px minmax(300px,1fr) 48px 118px 70px 105px 95px 72px'  /* ovr_round4b_v1 */  /* pm_cols_tune_v2 */

  return (
    <div>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:'1rem',lineHeight:1.6}}>
        {lang === 'en'
          ? 'Tournament prize money. Includes yusho prize (¥10M), special prizes (¥2M each), and ¥70,000 per win.'
          : lang === 'ja' ? '場所の賞金。優勝賞金（¥10M）、三賞（各¥2M）、勝利給（1勝¥70,000）を含む。'  /* ja_gaps_v3 */
          : 'Призові за турнір. Включає приз юшо (¥10M), спеціальні призи (¥2M кожен) та ¥70,000 за кожну перемогу.'}
      </div>

      {!isFinished && (
        <div style={{background:'rgba(184,134,11,0.1)',border:'1px solid rgba(184,134,11,0.3)',padding:'0.5rem 1rem',borderRadius:2,marginBottom:'1rem',fontFamily:'monospace',fontSize:'0.68rem',color:'#b8860b'}}>
          {t3(lang, '⚡ Турнір триває — призові розраховані на основі поточних результатів', '⚡ Tournament in progress — prizes estimated on current results', '⚡ 場所開催中 — 賞金は現時点の成績による推定')}
        </div>
      )}

      <div>{/* pm_breakdown_col_v1: povna shyryna, breakdown v okremii kolontsi */}
        {!isMobile && (
          <div style={{display:'grid',gridTemplateColumns:gridCols,gap:6,padding:'0.35rem 0.6rem' /* pm_cols_tune_v2 */,borderBottom:'2px solid var(--border)',fontFamily:'monospace',fontSize:'0.56rem',letterSpacing:'0.08em',textTransform:'uppercase',color:'var(--mid)'}}>{/* pm_headers_v1 */}
            <div style={{textAlign:'center'}}>#</div>
            <div />
            <div>{t3(lang, 'Рікіші', 'Rikishi', '力士')}</div>
            <div style={{textAlign:'center'}}>{t3(lang, 'Ранг', 'Rank', '番付')}</div>
            <div style={{textAlign:'center'}}>{t3(lang, 'Бал', 'Score', '点')}</div>
            <div>{t3(lang, 'Складові', 'Breakdown', '内訳')}</div>
            <div style={{textAlign:'center'}}>{t3(lang, 'В–П', 'W–L', '成績')}</div>
            <div style={{textAlign:'right'}}>{t3(lang, 'Призові', 'Prize', '賞金')}</div>
            <div style={{textAlign:'right'}}>{t3(lang, 'USD', 'USD', '米ドル')}</div>{/* pm_career_usd_v1 */}
            <div />
            <div style={{textAlign:'right'}}>{'\u03a3 '}{t3(lang, 'Кар\u2019єра', 'Career', '生涯')}</div>
            <div style={{textAlign:'right'}}>{'\u03a3 '}{t3(lang, 'USD', 'USD', '米ドル')}</div>
          </div>
        )}
        {prizes.map((r, i) => (
          <div key={r._id} style={{
            display:'grid',
            gridTemplateColumns: gridCols,  /* pm_headers_v1 */
            gap:6,  /* pm_cols_tune_v2 */
            padding:'0.6rem 0.6rem',
            borderBottom:'1px solid var(--border)',
            alignItems:'center',
          }}>
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',textAlign:'center'}}>
              {i + 1}
            </div>
            <div style={{textAlign:'center',fontSize:'0.85rem'}}>{r.flag}</div>{/* pm_6col_v1 */}
            <div style={{minWidth:0,overflow:'hidden'}}>
              <div style={{fontWeight:600,fontSize:'0.88rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}><RikishiLink id={r._id}>{displayName(r, lang)}</RikishiLink></div>
            </div>
            <div /* pm_rank_after_name_v1 */ style={{textAlign:'center'}}><span style={{fontFamily:'monospace',fontSize:'0.58rem',color:rankColor(r.rank),fontWeight:600,background:rankColor(r.rank)+'2e',padding:'1px 5px',borderRadius:2,whiteSpace:'nowrap'}}>{isMobile ? shortRank(r.rank, lang) : displayRank(r.rank, lang)}</span></div>
            <div style={{textAlign:'center'}}><OvrBadge id={r._id} /></div>
            {!isMobile && <div style={{display:'flex',gap:4,flexWrap:'wrap',alignItems:'center'}}>{/* pm_breakdown_col_v1 */}
              {r.breakdown.map((b, j) => (
                <span key={j} style={{fontFamily:'monospace',fontSize:'0.58rem',background:`${b.color}22`,color: b.color,padding:'1px 6px',borderRadius:2,border:`1px solid ${b.color}44`}}>{b.label} · {fmt(b.amount)}</span>
              ))}
            </div>}
            <div style={{textAlign:'center',fontFamily:'monospace',fontSize:'0.65rem',fontWeight:600,color: r.wins >= 8 ? '#1a6b5c' : '#c0392b'}}>{r.wins}–{r.losses}</div>
            <div className="pm-sum" style={{textAlign:'right',flexShrink:0}}>{/* pm_oneline_v2 */}
              <div style={{fontFamily:'Georgia,serif',fontSize: isMobile ? '0.82rem' : '1.05rem',fontWeight:700,color:'#b8860b',whiteSpace:'nowrap'}}>
                {fmt(r.total)}
              </div>
            </div>
            {!isMobile && (<>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',textAlign:'right',whiteSpace:'nowrap'}}>
                {formatUSD(r.total)}
              </div>
              <div style={{height:5,background:'var(--bg2)',borderRadius:1}}>
                <div style={{height:'100%',width:`${r.total/maxTotal*100}%`,background:'#b8860b',borderRadius:1}} />
              </div>
            </>)}
            {!isMobile && (<>
              <div title={t3(lang, 'Оцінка призових за кар\u2019єру: перемоги + юшо', 'Career prize estimate: wins + yusho', '生涯賞金の推定：勝利数＋優勝')} style={{textAlign:'right',whiteSpace:'nowrap',fontFamily:'Georgia,serif',fontSize:'1.05rem',fontWeight:700,color:'#b8860b'}}>{/* pm_career_usd_col_v1 */}
                {formatYenShort(CAREER[String(r._id)] || 0)}
              </div>
              <div style={{textAlign:'right',whiteSpace:'nowrap',fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>
                {formatUSDShort(CAREER[String(r._id)] || 0)}
              </div>
            </>)}
          </div>
        ))}
      </div>

      <div style={{marginTop:'1rem',fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)',lineHeight:1.6}}>
        {lang === 'en'
          ? '* Base salary not included. Exchange rate ~¥149/$1. Special prizes announced after tournament.'
          : lang === 'ja' ? '* 基本給は含まず。レート約¥149/$1。三賞は場所後に発表。'
          : '* Базова зарплата не включена. Курс ~¥149/$1. Спеціальні призи оголошуються після турніру. Σ — оцінка за кар\u2019єру (перемоги + юшо, без санко-шо).'}
      </div>
    </div>
  )
}