'use client'
import { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { ref, get, set, update, onValue, off } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

// ── Константи ───────────────────────────────────────────────
const MAX_HP_PLAYER = 40
const CAMPAIGN_LEVELS = [
  {
    id: 1, name: 'Маегашіра', nameEn: 'Maegashira', emoji: '🟤',
    bossHp: 30, bossArmor: 0, reward: 100, starReward: 20,
    desc: 'Новачок дохьо. Слабкий суперник, але не розслабляйся.',
    descEn: 'A dohyo newcomer. Weak opponent, but stay focused.',
    cpuDeckFilter: (card) => {
      if (card.type === 'rikishi') return card.rank === 'Maegashira'
      return ['heal'].includes(card.type)
    },
    cpuHpMax: 30,
  },
  {
    id: 2, name: 'Комусубі', nameEn: 'Komusubi', emoji: '🔵',
    bossHp: 35, bossArmor: 0, reward: 150, starReward: 25,
    desc: 'Сходинка до сан\'яку. Вже знає як битись.',
    descEn: 'A step toward sanyaku. Knows how to fight.',
    cpuDeckFilter: (card) => {
      if (card.type === 'rikishi') return ['Maegashira','Komusubi'].includes(card.rank)
      return ['heal','armor'].includes(card.type)
    },
    cpuHpMax: 35,
  },
  {
    id: 3, name: 'Секівake', nameEn: 'Sekiwake', emoji: '🟣',
    bossHp: 40, bossArmor: 5, reward: 200, starReward: 30,
    desc: 'Сан\'яку. Починає з бойовою стійкою.',
    descEn: 'Sanyaku. Starts with battle stance armor.',
    cpuDeckFilter: (card) => {
      if (card.type === 'rikishi') return ['Maegashira','Komusubi','Sekiwake'].includes(card.rank)
      return ['heal','armor','strike'].includes(card.type)
    },
    cpuHpMax: 40,
  },
  {
    id: 4, name: 'Озекі', nameEn: 'Ozeki', emoji: '🟢',
    bossHp: 45, bossArmor: 0, reward: 300, starReward: 40,
    desc: 'Майже вершина. Повна колода, розумна тактика.',
    descEn: 'Near the top. Full deck, smart tactics.',
    cpuDeckFilter: () => true,
    cpuHpMax: 45,
  },
  {
    id: 5, name: 'Йокодзуна', nameEn: 'Yokozuna', emoji: '🟡',
    bossHp: 60, bossArmor: 10, reward: 500, starReward: 50,
    desc: 'БОС. Починає з +10 броні. Має смертельний удар.',
    descEn: 'BOSS. Starts with +10 armor. Has deadly strike.',
    isBoss: true,
    cpuDeckFilter: () => true,
    cpuHpMax: 60,
  },
]

const SHOP_ITEMS = [
  { id: 'atk_boost', type: 'permanent', label: '+1 ATK', labelEn: '+1 ATK', desc: 'Обрана карта +1 до атаки назавжди (в межах кампанії)', descEn: 'Selected card +1 ATK for this campaign', price: 150, emoji: '⚔️' },
  { id: 'def_boost', type: 'permanent', label: '+1 DEF', labelEn: '+1 DEF', desc: 'Обрана карта +1 до захисту назавжди (в межах кампанії)', descEn: 'Selected card +1 DEF for this campaign', price: 150, emoji: '🛡' },
  { id: 'battle_spirit', type: 'temp', label: 'Бойовий дух', labelEn: 'Battle Spirit', desc: 'Всі ATK +2 на 1 бій', descEn: 'All ATK +2 for 1 fight', price: 80, emoji: '🔥' },
  { id: 'iron_stance', type: 'temp', label: 'Залізна стійка', labelEn: 'Iron Stance', desc: 'Починаєш бій з +5 броні', descEn: 'Start fight with +5 armor', price: 100, emoji: '🦾' },
  { id: 'water_shield', type: 'temp', label: 'Водний щит', labelEn: 'Water Shield', desc: 'Перша отримана шкода блокується', descEn: 'First damage taken is blocked', price: 130, emoji: '💧' },
]

const ENVELOPE_REWARDS = [50, 75, 100, 125, 150]

// ── Firebase Auth ────────────────────────────────────────────
let _authPromise = null
function getAnonymousUid() {
  if (!_authPromise) {
    _authPromise = new Promise((resolve) => {
      const auth = getAuth()
      onAuthStateChanged(auth, async (user) => {
        if (user) { resolve(user.uid) }
        else {
          try {
            const cred = await signInAnonymously(auth)
            resolve(cred.user.uid)
          } catch { resolve(null) }
        }
      })
    })
  }
  return _authPromise
}

async function loadUserData(uid) {
  if (!uid) return null
  const snap = await get(ref(db, `campaignUsers/${uid}`))
  return snap.val()
}

async function saveUserData(uid, data) {
  if (!uid) return
  await update(ref(db, `campaignUsers/${uid}`), data)
}

// ── Утиліти ─────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function calcStars(myHp, maxHp) {
  const pct = myHp / maxHp
  if (pct > 0.66) return 3
  if (pct > 0.33) return 2
  return 1
}

// ── Анімації ────────────────────────────────────────────────
const CAMP_ANIM = `
@keyframes campSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes campPop{0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes campShake{0%,100%{transform:translate(0)}20%{transform:translate(-8px,4px)}40%{transform:translate(8px,-4px)}60%{transform:translate(-4px,2px)}80%{transform:translate(4px,-2px)}}
@keyframes yokoinFloat{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(1.4)}}
@keyframes bossEntrance{0%{opacity:0;transform:scale(2) rotate(-10deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
@keyframes starPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
@keyframes envelopeOpen{0%{transform:rotateX(0)}50%{transform:rotateX(-30deg)}100%{transform:rotateX(0)}}
`

// ── Компоненти ───────────────────────────────────────────────
function YokoinDisplay({ amount, flash }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(184,134,11,0.15)', border: '1px solid rgba(184,134,11,0.4)',
      borderRadius: 4, padding: '4px 10px',
      animation: flash ? 'campPop 0.4s ease' : undefined,
    }}>
      <span style={{ fontSize: '0.9rem' }}>🪙</span>
      <span style={{ fontFamily: 'Georgia,serif', fontSize: '0.9rem', fontWeight: 800, color: '#b8860b' }}>{amount}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#b8860b' }}>¥</span>
    </div>
  )
}

function StarsDisplay({ stars, animate }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          fontSize: '1.2rem',
          filter: i <= stars ? 'none' : 'grayscale(1) opacity(0.3)',
          animation: animate && i <= stars ? `starPop 0.4s ease ${i * 0.15}s both` : undefined,
        }}>⭐</span>
      ))}
    </div>
  )
}

function HPBar({ hp, maxHp, armor = 0, label, color }) {
  const pct = Math.max(0, (hp / maxHp) * 100)
  const barColor = pct > 60 ? '#1a6b5c' : pct > 30 ? '#b8860b' : '#c0392b'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--mid)' }}>{label}</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: barColor }}>{hp}/{maxHp}</span>
        </div>
        {armor > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(31,97,141,0.15)', border: '1px solid rgba(31,97,141,0.4)', borderRadius: 3, padding: '1px 7px' }}>
            <span style={{ fontSize: '0.7rem' }}>🛡</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700, color: '#1f618d' }}>{armor}</span>
          </div>
        )}
      </div>
      <div style={{ height: 8, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)' }} />
      </div>
    </div>
  )
}

// ── Головний екран кампанії ──────────────────────────────────
function CampaignMap({ progress, yokoin, onSelectLevel, onOpenShop, onBack, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--mid)', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
        ‹ {t('Назад', 'Back')}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', fontWeight: 800, color: '#b8860b' }}>⚔️ {t('Кампанія', 'Campaign')}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', marginTop: 2 }}>{t('Дорога до дохьо', 'Road to the Dohyo')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <YokoinDisplay amount={yokoin} />
          <button onClick={onOpenShop} style={{ background: '#b8860b', border: 'none', color: '#fff', borderRadius: 4, padding: '6px 14px', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 700 }}>
            🏪 {t('Магазин', 'Shop')}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CAMPAIGN_LEVELS.map(level => {
          const levelProgress = progress?.levels?.[level.id] || {}
          const isUnlocked = level.id === 1 || (progress?.levels?.[level.id - 1]?.completed)
          const isCompleted = levelProgress.completed
          const stars = levelProgress.stars || 0

          return (
            <div key={level.id} onClick={isUnlocked ? () => onSelectLevel(level) : undefined} style={{
              background: 'var(--card)', border: `1px solid ${isCompleted ? 'rgba(184,134,11,0.4)' : isUnlocked ? 'var(--border)' : 'transparent'}`,
              borderLeft: `4px solid ${isCompleted ? '#b8860b' : isUnlocked ? 'var(--border)' : '#444'}`,
              borderRadius: 4, padding: '1rem',
              cursor: isUnlocked ? 'pointer' : 'default',
              opacity: isUnlocked ? 1 : 0.4,
              animation: 'campSlideIn 0.3s ease',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => isUnlocked && (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={e => isUnlocked && (e.currentTarget.style.background = 'var(--card)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: '2rem', animation: level.isBoss ? 'campPop 0.5s ease' : undefined }}>{level.emoji}</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', letterSpacing: '0.1em' }}>
                        {t('Рівень', 'Level')} {level.id}
                      </span>
                      {level.isBoss && <span style={{ fontFamily: 'monospace', fontSize: '0.52rem', background: '#c0392b', color: '#fff', padding: '1px 6px', borderRadius: 2 }}>БОС</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>{lang === 'en' ? level.nameEn : level.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--mid)', marginTop: 2 }}>{lang === 'en' ? level.descEn : level.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  {isCompleted ? (
                    <StarsDisplay stars={stars} />
                  ) : isUnlocked ? (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#b8860b' }}>▶ {t('Грати', 'Play')}</span>
                  ) : (
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
                  )}
                  <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--mid)' }}>
                    🪙 {level.reward}¥ + ⭐{level.starReward}¥
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Магазин ──────────────────────────────────────────────────
function Shop({ yokoin, boostedCard, tempBoosts, onBuy, onBack, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [selectingCard, setSelectingCard] = useState(null)
  const [msg, setMsg] = useState(null)

  function showMsg(text, color = '#1a6b5c') {
    setMsg({ text, color })
    setTimeout(() => setMsg(null), 2000)
  }

  function handleBuy(item) {
    if (yokoin < item.price) { showMsg(t('Недостатньо Йокоінів!', 'Not enough Yokoin!'), '#c0392b'); return }
    if (item.type === 'permanent') {
      setSelectingCard(item)
    } else {
      onBuy(item, null)
      showMsg(`${item.emoji} ${lang === 'en' ? item.labelEn : item.label} ${t('придбано!', 'purchased!')}`)
    }
  }

  const RIKISHI_SAMPLE = [
    { id: 'Y1', rank: 'Yokozuna', rankShort: 'Y1e', atk: 10, def: 7, color: '#b8860b' },
    { id: 'Y2', rank: 'Yokozuna', rankShort: 'Y1w', atk: 9, def: 8, color: '#b8860b' },
    { id: 'O1', rank: 'Ozeki', rankShort: 'O1e', atk: 8, def: 6, color: '#1a6b5c' },
    { id: 'O2', rank: 'Ozeki', rankShort: 'O1w', atk: 7, def: 7, color: '#1a6b5c' },
    { id: 'S1', rank: 'Sekiwake', rankShort: 'S1e', atk: 7, def: 5, color: '#1a4a7a' },
    { id: 'S2', rank: 'Sekiwake', rankShort: 'S1w', atk: 6, def: 6, color: '#1a4a7a' },
    { id: 'K1', rank: 'Komusubi', rankShort: 'K1e', atk: 6, def: 4, color: '#6b3fa0' },
    { id: 'K2', rank: 'Komusubi', rankShort: 'K1w', atk: 5, def: 5, color: '#6b3fa0' },
  ]

  if (selectingCard) return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', animation: 'campSlideIn 0.25s ease' }}>
      <button onClick={() => setSelectingCard(null)} style={{ background: 'transparent', border: 'none', color: 'var(--mid)', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
        ‹ {t('Назад', 'Back')}
      </button>
      <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        {selectingCard.emoji} {t('Оберіть карту для бусту', 'Select card to boost')}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', marginBottom: '1.25rem' }}>
        {lang === 'en' ? selectingCard.descEn : selectingCard.desc}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {RIKISHI_SAMPLE.map(card => {
          const isBoosted = boostedCard?.cardId === card.id
          const boost = boostedCard?.cardId === card.id ? boostedCard : null
          return (
            <div key={card.id} onClick={() => {
              onBuy(selectingCard, card)
              showMsg(`${card.rankShort} ${t('отримав буст!', 'boosted!')}`)
              setSelectingCard(null)
            }} style={{
              background: isBoosted ? 'rgba(184,134,11,0.1)' : 'var(--bg2)',
              border: `1px solid ${isBoosted ? '#b8860b' : 'var(--border)'}`,
              borderRadius: 4, padding: '0.75rem 1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: card.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: card.color }}>{card.rankShort}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--mid)', marginLeft: 8 }}>{card.rank}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontFamily: 'monospace', fontSize: '0.72rem' }}>
                <span style={{ color: '#e74c3c' }}>⚔ {card.atk}{boost?.atk ? <span style={{ color: '#b8860b' }}>+{boost.atk}</span> : null}</span>
                <span style={{ color: '#3498db' }}>🛡 {card.def}{boost?.def ? <span style={{ color: '#b8860b' }}>+{boost.def}</span> : null}</span>
              </div>
              {isBoosted && <span style={{ color: '#b8860b', fontSize: '0.7rem' }}>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', animation: 'campSlideIn 0.25s ease' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--mid)', fontFamily: 'monospace', fontSize: '0.72rem', cursor: 'pointer', marginBottom: '1rem', padding: 0 }}>
        ‹ {t('Назад', 'Back')}
      </button>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.1rem', fontWeight: 800, color: '#b8860b' }}>🏪 {t('Магазин', 'Shop')}</div>
        <YokoinDisplay amount={yokoin} />
      </div>

      {msg && (
        <div style={{ background: `${msg.color}22`, border: `1px solid ${msg.color}`, borderRadius: 4, padding: '0.5rem 1rem', marginBottom: '1rem', fontFamily: 'monospace', fontSize: '0.72rem', color: msg.color, textAlign: 'center', animation: 'campPop 0.3s ease' }}>
          {msg.text}
        </div>
      )}

      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
        {t('Постійні бусти', 'Permanent boosts')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.5rem' }}>
        {SHOP_ITEMS.filter(i => i.type === 'permanent').map(item => (
          <ShopItem key={item.id} item={item} yokoin={yokoin} onBuy={() => handleBuy(item)} lang={lang} />
        ))}
      </div>

      <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
        {t('Тимчасові бусти (на 1 бій)', 'Temporary boosts (1 fight)')}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SHOP_ITEMS.filter(i => i.type === 'temp').map(item => {
          const owned = tempBoosts?.[item.id] || 0
          return <ShopItem key={item.id} item={item} yokoin={yokoin} onBuy={() => handleBuy(item)} lang={lang} owned={owned} />
        })}
      </div>

      {boostedCard && (
        <div style={{ marginTop: '1.5rem', background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)', borderRadius: 4, padding: '0.75rem 1rem' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#b8860b', textTransform: 'uppercase', marginBottom: 4 }}>{t('Активний буст', 'Active boost')}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--ink)' }}>
            {boostedCard.cardId} — {boostedCard.atk ? `+${boostedCard.atk} ATK` : ''} {boostedCard.def ? `+${boostedCard.def} DEF` : ''}
          </div>
        </div>
      )}
    </div>
  )
}

function ShopItem({ item, yokoin, onBuy, lang, owned }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const canAfford = yokoin >= item.price
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 4, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{lang === 'en' ? item.labelEn : item.label}</div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--mid)' }}>{lang === 'en' ? item.descEn : item.desc}</div>
        {owned > 0 && <div style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#1a6b5c', marginTop: 2 }}>✓ {t('Є:', 'Owned:')} {owned}</div>}
      </div>
      <button onClick={onBuy} disabled={!canAfford} style={{
        background: canAfford ? '#b8860b' : 'var(--bg2)', color: canAfford ? '#fff' : 'var(--mid)',
        border: `1px solid ${canAfford ? '#b8860b' : 'var(--border)'}`,
        borderRadius: 4, padding: '5px 12px', fontFamily: 'monospace', fontSize: '0.68rem',
        cursor: canAfford ? 'pointer' : 'default', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap',
      }}>
        🪙 {item.price}¥
      </button>
    </div>
  )
}

// ── Бій кампанії ─────────────────────────────────────────────
export function CampaignBattle({ level, boostedCard, tempBoosts, onWin, onLose, onBack, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  // Імпортуємо з основного файлу через props — колоди та логіку
  // Повертаємо результат через onWin(starsCount, yokoinEarned) або onLose()
  const [phase, setPhase] = useState('intro') // intro | battle | result
  const [introStep, setIntroStep] = useState(0)

  useEffect(() => {
    if (phase === 'intro') {
      const t1 = setTimeout(() => setIntroStep(1), 300)
      const t2 = setTimeout(() => setIntroStep(2), 1000)
      const t3 = setTimeout(() => { setIntroStep(3); setTimeout(() => setPhase('battle'), 600) }, 1800)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [phase])

  if (phase === 'intro') return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: '2rem' }}>
      <div style={{ fontSize: introStep >= 1 ? '3rem' : '0', transition: 'font-size 0.3s', animation: introStep >= 1 ? 'campPop 0.5s ease' : undefined }}>{level.emoji}</div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: 'clamp(1.2rem,5vw,2rem)', fontWeight: 900, color: '#b8860b', textAlign: 'center', opacity: introStep >= 2 ? 1 : 0, transition: 'opacity 0.4s', animation: level.isBoss && introStep >= 2 ? 'bossEntrance 0.6s ease' : undefined }}>
        {level.isBoss ? '👹 ' : ''}{lang === 'en' ? level.nameEn : level.name}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--mid)', textAlign: 'center', opacity: introStep >= 3 ? 1 : 0, transition: 'opacity 0.4s' }}>
        {t('БІЙ!', 'FIGHT!')}
      </div>
    </div>
  )

  // Передаємо управління в BattleWrapper
  return (
    <CampaignBattleCore
      level={level} boostedCard={boostedCard} tempBoosts={tempBoosts}
      onWin={onWin} onLose={onLose} onBack={onBack} lang={lang}
    />
  )
}

// ── Результат ────────────────────────────────────────────────
function CampaignResult({ won, stars, yokoinEarned, envelopes, level, onContinue, onRetry, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [step, setStep] = useState(0)
  const [openedEnvelope, setOpenedEnvelope] = useState(null)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 200)
    const t2 = setTimeout(() => setStep(2), 700)
    const t3 = setTimeout(() => setStep(3), 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', textAlign: 'center', animation: 'campSlideIn 0.3s ease' }}>
      <div style={{ fontSize: '3rem', animation: 'campPop 0.5s ease', marginBottom: '0.5rem' }}>
        {won ? (level.isBoss ? '🏆' : '✅') : '😤'}
      </div>
      <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.4rem', fontWeight: 800, color: won ? '#b8860b' : '#c0392b', marginBottom: '0.5rem' }}>
        {won ? t('Перемога!', 'Victory!') : t('Поразка', 'Defeat')}
      </div>

      {won && (
        <>
          <div style={{ opacity: step >= 1 ? 1 : 0, transition: 'opacity 0.4s', marginBottom: '1rem' }}>
            <StarsDisplay stars={stars} animate={step >= 1} />
          </div>

          <div style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'none' : 'translateY(10px)', transition: 'all 0.4s', background: 'rgba(184,134,11,0.1)', border: '1px solid rgba(184,134,11,0.3)', borderRadius: 4, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', marginBottom: 8 }}>{t('Нагорода', 'Reward')}</div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.6rem', fontWeight: 800, color: '#b8860b', animation: step >= 2 ? 'campPop 0.4s ease' : undefined }}>
              +{yokoinEarned} 🪙
            </div>
          </div>

          {envelopes > 0 && (
            <div style={{ opacity: step >= 3 ? 1 : 0, transition: 'opacity 0.4s', marginBottom: '1rem' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: 'var(--mid)', marginBottom: 8 }}>
                📨 {t('Конверти від рекламодавців', 'Sponsor envelopes')}: {envelopes}
              </div>
              {!openedEnvelope ? (
                <button onClick={() => {
                  const reward = ENVELOPE_REWARDS[Math.floor(Math.random() * ENVELOPE_REWARDS.length)]
                  setOpenedEnvelope(reward)
                }} style={{ background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 20px', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700, animation: 'envelopeOpen 0.5s ease infinite' }}>
                  📨 {t('Відкрити конверт', 'Open envelope')}
                </button>
              ) : (
                <div style={{ background: 'rgba(26,74,122,0.2)', border: '1px solid #1a4a7a', borderRadius: 4, padding: '0.75rem', animation: 'campPop 0.4s ease' }}>
                  <div style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', fontWeight: 800, color: '#1a6b5c' }}>+{openedEnvelope} 🪙</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: 'var(--mid)' }}>{t('від рекламодавця', 'from sponsor')}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: '1.5rem' }}>
        {!won && (
          <button onClick={onRetry} style={{ flex: 1, padding: '0.8rem', background: '#b8860b', color: '#fff', border: 'none', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}>
            🔄 {t('Знову', 'Retry')}
          </button>
        )}
        <button onClick={() => onContinue(openedEnvelope || 0)} style={{ flex: 1, padding: '0.8rem', background: 'var(--ink)', color: 'var(--bg)', border: 'none', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 700 }}>
          {won ? t('Далі ›', 'Continue ›') : t('В меню', 'Menu')}
        </button>
      </div>
    </div>
  )
}

// ── Основний компонент кампанії ──────────────────────────────
export default function SumoClashCampaign({ onBack, lang, GameBattle }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [screen, setScreen] = useState('map') // map | shop | battle | result
  const [uid, setUid] = useState(null)
  const [yokoin, setYokoin] = useState(0)
  const [progress, setProgress] = useState({ levels: {} })
  const [boostedCard, setBoostedCard] = useState(null)
  const [tempBoosts, setTempBoosts] = useState({})
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [yokoinFlash, setYokoinFlash] = useState(false)

  useEffect(() => {
    getAnonymousUid().then(async (id) => {
      setUid(id)
      if (id) {
        const data = await loadUserData(id)
        if (data) {
          setYokoin(data.yokoin || 0)
          setProgress(data.progress || { levels: {} })
          setBoostedCard(data.boostedCard || null)
          setTempBoosts(data.tempBoosts || {})
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function addYokoin(amount) {
    const newAmount = yokoin + amount
    setYokoin(newAmount)
    setYokoinFlash(true)
    setTimeout(() => setYokoinFlash(false), 500)
    if (uid) await saveUserData(uid, { yokoin: newAmount })
  }

  async function handleBuy(item, selectedCard) {
    if (yokoin < item.price) return
    const newYokoin = yokoin - item.price
    setYokoin(newYokoin)
    let updates = { yokoin: newYokoin }
    if (item.type === 'permanent' && selectedCard) {
      const boost = {
        cardId: selectedCard.id,
        atk: item.id === 'atk_boost' ? (boostedCard?.atk || 0) + 1 : (boostedCard?.atk || 0),
        def: item.id === 'def_boost' ? (boostedCard?.def || 0) + 1 : (boostedCard?.def || 0),
      }
      setBoostedCard(boost)
      updates.boostedCard = boost
    } else if (item.type === 'temp') {
      const newBoosts = { ...tempBoosts, [item.id]: (tempBoosts[item.id] || 0) + 1 }
      setTempBoosts(newBoosts)
      updates.tempBoosts = newBoosts
    }
    if (uid) await saveUserData(uid, updates)
  }

  function handleSelectLevel(level) {
    setSelectedLevel(level)
    setScreen('battle')
  }

  async function handleBattleWin(playerHp, playerMaxHp, envelopesEarned) {
    const stars = calcStars(playerHp, playerMaxHp)
    const yokoinEarned = selectedLevel.reward + stars * selectedLevel.starReward
    const newProgress = {
      ...progress,
      levels: {
        ...progress.levels,
        [selectedLevel.id]: { completed: true, stars: Math.max(stars, progress.levels?.[selectedLevel.id]?.stars || 0) }
      }
    }
    setProgress(newProgress)
    const newYokoin = yokoin + yokoinEarned
    setYokoin(newYokoin)
    setBattleResult({ won: true, stars, yokoinEarned, envelopes: envelopesEarned })
    setScreen('result')
    if (uid) await saveUserData(uid, { yokoin: newYokoin, progress: newProgress })
  }

  async function handleBattleLose() {
    setBattleResult({ won: false, stars: 0, yokoinEarned: 0, envelopes: 0 })
    setScreen('result')
  }

  async function handleResultContinue(bonusYokoin) {
    if (bonusYokoin > 0) {
      const newYokoin = yokoin + bonusYokoin
      setYokoin(newYokoin)
      if (uid) await saveUserData(uid, { yokoin: newYokoin })
    }
    // Скидаємо тимчасові бусти після бою
    const newBoosts = {}
    setTempBoosts(newBoosts)
    if (uid) await saveUserData(uid, { tempBoosts: newBoosts })
    setScreen('map')
  }

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--mid)', animation: 'campSlideIn 0.3s ease' }}>
        ⏳ {t('Завантаження...', 'Loading...')}
      </div>
    </div>
  )

  return (
    <>
      <style>{CAMP_ANIM}</style>
      {screen === 'map' && (
        <CampaignMap
          progress={progress} yokoin={yokoin}
          onSelectLevel={handleSelectLevel}
          onOpenShop={() => setScreen('shop')}
          onBack={onBack} lang={lang}
        />
      )}
      {screen === 'shop' && (
        <Shop
          yokoin={yokoin} boostedCard={boostedCard} tempBoosts={tempBoosts}
          onBuy={handleBuy} onBack={() => setScreen('map')} lang={lang}
        />
      )}
      {screen === 'battle' && selectedLevel && (
        <GameBattle
          level={selectedLevel} boostedCard={boostedCard} tempBoosts={tempBoosts}
          onWin={handleBattleWin} onLose={handleBattleLose}
          onBack={() => setScreen('map')} lang={lang}
        />
      )}
      {screen === 'result' && battleResult && (
        <CampaignResult
          won={battleResult.won} stars={battleResult.stars}
          yokoinEarned={battleResult.yokoinEarned} envelopes={battleResult.envelopes}
          level={selectedLevel}
          onContinue={handleResultContinue}
          onRetry={() => setScreen('battle')}
          lang={lang}
        />
      )}
    </>
  )
}
