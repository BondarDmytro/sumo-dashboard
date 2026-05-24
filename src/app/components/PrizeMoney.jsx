'use client'

import { useLang } from './LangProvider'
import { useBios } from './BiosProvider'

const PRIZE_YUSHO = 10_000_000
const PRIZE_SPECIAL = 2_000_000
const PRIZE_PER_WIN = 70_000

const SPECIAL_PRIZE_NAMES = {
  'Shukun-sho': { uk: 'Шюкун-шо (найкращий результат)', en: 'Shukun-sho (Outstanding Performance)' },
  'Kanto-sho': { uk: 'Канто-шо (бойовий дух)', en: 'Kanto-sho (Fighting Spirit)' },
  'Gino-sho': { uk: 'Гіно-шо (техніка)', en: 'Gino-sho (Technique)' },
}

function formatYen(amount) {
  return `¥${amount.toLocaleString('en-US')}`
}

function formatUSD(amount) {
  return `~$${Math.round(amount / 149).toLocaleString('en-US')}`
}

export default function PrizeMoney({ rikishi, specialPrizes = [], yushoData = [], isFinished }) {
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
      breakdown.push({ label: lang === 'en' ? 'Yusho' : 'Юшо', amount: PRIZE_YUSHO, color: '#b8860b' })
    }

    // Санко-шо
    const rikishiPrizes = specialPrizes.filter(p => String(p.rikishiId) === r._id)
    rikishiPrizes.forEach(p => {
      total += PRIZE_SPECIAL
      const name = SPECIAL_PRIZE_NAMES[p.type]
      breakdown.push({
        label: lang === 'en' ? (name?.en || p.type) : (name?.uk || p.type),
        amount: PRIZE_SPECIAL,
        color: '#1a4a7a'
      })
    })

    // Всі перемоги × ¥70,000
    if (r.wins > 0) {
      const winsAmount = r.wins * PRIZE_PER_WIN
      total += winsAmount
      breakdown.push({
        label: lang === 'en' ? `${r.wins} wins × ¥70,000` : `${r.wins} перемог × ¥70,000`,
        amount: winsAmount,
        color: '#1a6b5c'
      })
    }

    return { ...r, total, breakdown, flag: bios[r._id]?.country?.flag || '🇯🇵' }
  })
  .filter(r => r.total > 0)
  .sort((a, b) => b.total - a.total)

  const maxTotal = prizes[0]?.total || 1

  return (
    <div>
      <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:'1rem',lineHeight:1.6}}>
        {lang === 'en'
          ? 'Tournament prize money. Includes yusho prize (¥10M), special prizes (¥2M each), and ¥70,000 per win.'
          : 'Призові за турнір. Включає приз юшо (¥10M), спеціальні призи (¥2M кожен) та ¥70,000 за кожну перемогу.'}
      </div>

      {!isFinished && (
        <div style={{background:'rgba(184,134,11,0.1)',border:'1px solid rgba(184,134,11,0.3)',padding:'0.5rem 1rem',borderRadius:2,marginBottom:'1rem',fontFamily:'monospace',fontSize:'0.68rem',color:'#b8860b'}}>
          {lang === 'en' ? '⚡ Tournament in progress — prizes estimated on current results' : '⚡ Турнір триває — призові розраховані на основі поточних результатів'}
        </div>
      )}

      <div>
        {prizes.map((r, i) => (
          <div key={r._id} style={{
            display:'grid',
            gridTemplateColumns:'40px 1fr 180px',
            gap:8,
            padding:'0.6rem 0.75rem',
            borderBottom:'1px solid var(--border)',
            alignItems:'center',
          }}>
            <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',textAlign:'center'}}>
              {i + 1}
            </div>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                <span>{r.flag}</span>
                <span style={{fontWeight:600,fontSize:'0.88rem'}}>{r.name}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',background:'var(--bg2)',padding:'1px 5px',borderRadius:2}}>{r.rank}</span>
                <span style={{fontFamily:'monospace',fontSize:'0.65rem',color: r.wins >= 8 ? '#1a6b5c' : '#c0392b'}}>{r.wins}–{r.losses}</span>
              </div>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {r.breakdown.map((b, j) => (
                  <span key={j} style={{
                    fontFamily:'monospace',fontSize:'0.58rem',
                    background:`${b.color}22`,
                    color: b.color,
                    padding:'1px 6px',borderRadius:2,
                    border:`1px solid ${b.color}44`,
                  }}>
                    {b.label} · {formatYen(b.amount)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1.1rem',fontWeight:700,color:'#b8860b'}}>
                {formatYen(r.total)}
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)'}}>
                {formatUSD(r.total)}
              </div>
              <div style={{marginTop:4,height:3,background:'var(--bg2)',borderRadius:1}}>
                <div style={{height:'100%',width:`${r.total/maxTotal*100}%`,background:'#b8860b',borderRadius:1}} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:'1rem',fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)',lineHeight:1.6}}>
        {lang === 'en'
          ? '* Base salary not included. Exchange rate ~¥149/$1. Special prizes announced after tournament.'
          : '* Базова зарплата не включена. Курс ~¥149/$1. Спеціальні призи оголошуються після турніру.'}
      </div>
    </div>
  )
}