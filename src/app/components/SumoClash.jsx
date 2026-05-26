'use client'

import { useState, useEffect, useRef } from 'react'

const MAX_HP = 50

// Колода рікіші
const RIKISHI_CARDS = [
  // Йокодзуна (2)
  { id:'Y1', type:'rikishi', rank:'Yokozuna', rankShort:'Y1e', atk:9, def:8, label:'横綱 一東', color:'#b8860b' },
  { id:'Y2', type:'rikishi', rank:'Yokozuna', rankShort:'Y1w', atk:8, def:9, label:'横綱 一西', color:'#b8860b' },
  // Озекі (4)
  { id:'O1', type:'rikishi', rank:'Ozeki', rankShort:'O1e', atk:8, def:7, label:'大関 一東', color:'#1a6b5c' },
  { id:'O2', type:'rikishi', rank:'Ozeki', rankShort:'O1w', atk:7, def:8, label:'大関 一西', color:'#1a6b5c' },
  { id:'O3', type:'rikishi', rank:'Ozeki', rankShort:'O2e', atk:7, def:7, label:'大関 二東', color:'#1a6b5c' },
  { id:'O4', type:'rikishi', rank:'Ozeki', rankShort:'O2w', atk:8, def:6, label:'大関 二西', color:'#1a6b5c' },
  // Секіваке (6)
  { id:'S1', type:'rikishi', rank:'Sekiwake', rankShort:'S1e', atk:7, def:6, label:'関脇 一東', color:'#1a4a7a' },
  { id:'S2', type:'rikishi', rank:'Sekiwake', rankShort:'S1w', atk:6, def:7, label:'関脇 一西', color:'#1a4a7a' },
  { id:'S3', type:'rikishi', rank:'Sekiwake', rankShort:'S2e', atk:6, def:6, label:'関脇 二東', color:'#1a4a7a' },
  { id:'S4', type:'rikishi', rank:'Sekiwake', rankShort:'S2w', atk:7, def:5, label:'関脇 二西', color:'#1a4a7a' },
  { id:'S5', type:'rikishi', rank:'Sekiwake', rankShort:'S3e', atk:5, def:7, label:'関脇 三東', color:'#1a4a7a' },
  { id:'S6', type:'rikishi', rank:'Sekiwake', rankShort:'S3w', atk:6, def:5, label:'関脇 三西', color:'#1a4a7a' },
  // Комусубі (8)
  { id:'K1', type:'rikishi', rank:'Komusubi', rankShort:'K1e', atk:6, def:5, label:'小結 一東', color:'#6b3fa0' },
  { id:'K2', type:'rikishi', rank:'Komusubi', rankShort:'K1w', atk:5, def:6, label:'小結 一西', color:'#6b3fa0' },
  { id:'K3', type:'rikishi', rank:'Komusubi', rankShort:'K2e', atk:5, def:5, label:'小結 二東', color:'#6b3fa0' },
  { id:'K4', type:'rikishi', rank:'Komusubi', rankShort:'K2w', atk:6, def:4, label:'小結 二西', color:'#6b3fa0' },
  { id:'K5', type:'rikishi', rank:'Komusubi', rankShort:'K3e', atk:4, def:6, label:'小結 三東', color:'#6b3fa0' },
  { id:'K6', type:'rikishi', rank:'Komusubi', rankShort:'K3w', atk:5, def:4, label:'小結 三西', color:'#6b3fa0' },
  { id:'K7', type:'rikishi', rank:'Komusubi', rankShort:'K4e', atk:4, def:5, label:'小結 四東', color:'#6b3fa0' },
  { id:'K8', type:'rikishi', rank:'Komusubi', rankShort:'K4w', atk:5, def:5, label:'小結 四西', color:'#6b3fa0' },
  // Маєґашіра (34)
  ...Array.from({length:17}, (_,i) => ({
    id:`Me${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}e`,
    atk: Math.max(1, 4 - Math.floor(i/4)), def: Math.max(1, 4 - Math.floor(i/5)),
    label:`前頭 ${i+1}東`, color:'var(--mid)',
  })),
  ...Array.from({length:17}, (_,i) => ({
    id:`Mw${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}w`,
    atk: Math.max(1, 4 - Math.floor(i/4)), def: Math.max(1, 3 - Math.floor(i/6)),
    label:`前頭 ${i+1}西`, color:'var(--mid)',
  })),
]

const HEAL_CARDS = [
  { id:'H1', type:'heal', heal:5,  label:'+5 HP',  color:'#c0392b', emoji:'🩹' },
  { id:'H2', type:'heal', heal:5,  label:'+5 HP',  color:'#c0392b', emoji:'🩹' },
  { id:'H3', type:'heal', heal:5,  label:'+5 HP',  color:'#c0392b', emoji:'🩹' },
  { id:'H4', type:'heal', heal:7,  label:'+7 HP',  color:'#e74c3c', emoji:'💊' },
  { id:'H5', type:'heal', heal:7,  label:'+7 HP',  color:'#e74c3c', emoji:'💊' },
  { id:'H6', type:'heal', heal:10, label:'+10 HP', color:'#922b21', emoji:'❤️‍🔥' },
]

const FULL_DECK = [...RIKISHI_CARDS, ...HEAL_CARDS]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRankOrder(card) {
  if (card.type === 'heal') return -1
  const orders = { Yokozuna: 6, Ozeki: 5, Sekiwake: 4, Komusubi: 3, Maegashira: 2 }
  return orders[card.rank] || 1
}

function cpuChooseCard(hand, playerCard) {
  const rikishi = hand.filter(c => c.type === 'rikishi')
  const heals = hand.filter(c => c.type === 'heal')

  // Якщо HP < 20 і є хілер — хіляємось
  // (передаємо cpuHp через closure — спрощено: якщо є хілер і rikishi слабкі)
  if (heals.length > 0 && rikishi.length === 0) return heals[0]

  if (!playerCard) {
    // CPU ходить першим — обирає найсильнішу атаку
    return rikishi.sort((a,b) => (b.atk+b.def) - (a.atk+a.def))[0] || hand[0]
  }

  if (playerCard.type === 'heal') {
    // Гравець хіляється — CPU атакує найсильнішою картою
    return rikishi.sort((a,b) => b.atk - a.atk)[0] || hand[0]
  }

  // Шукаємо карту яка б'є гравця і мінімізує втрати
  const beaters = rikishi.filter(c => c.atk > playerCard.def)
  if (beaters.length > 0) {
    // Вибираємо найслабшу з тих що б'ють (зберігаємо сильні)
    return beaters.sort((a,b) => (a.atk+a.def) - (b.atk+b.def))[0]
  }

  // Не можемо перемогти — кидаємо найслабшу карту
  return rikishi.sort((a,b) => (a.atk+a.def) - (b.atk+b.def))[0] || hand[0]
}

function HPBar({ hp, max = MAX_HP, color }) {
  const pct = Math.max(0, (hp / max) * 100)
  const barColor = pct > 60 ? '#1a6b5c' : pct > 30 ? '#b8860b' : '#c0392b'
  return (
    <div style={{width:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>HP</span>
        <span style={{fontFamily:'monospace',fontSize:'0.72rem',fontWeight:700,color: barColor}}>{hp}/{max}</span>
      </div>
      <div style={{height:6,background:'var(--bg2)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:barColor,borderRadius:3,transition:'width 0.4s'}} />
      </div>
    </div>
  )
}

function GameCard({ card, selected, onClick, disabled, small, lang, showBack }) {
  if (!card) return null

  if (showBack) return (
    <div style={{
      width: small ? 64 : 80, height: small ? 90 : 112,
      borderRadius:6, cursor:'default',
      background:'linear-gradient(135deg,#1a1a2e,#0f3460)',
      border:'2px solid #b8860b',
      display:'flex',alignItems:'center',justifyContent:'center',
    }}>
      <span style={{fontSize:'1.4rem',opacity:0.5}}>相</span>
    </div>
  )

  const isHeal = card.type === 'heal'
  const color = isHeal ? card.color : (card.color || 'var(--mid)')
  const isHighRank = ['Yokozuna','Ozeki'].includes(card.rank)

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: small ? 64 : 80,
        height: small ? 90 : 112,
        borderRadius: 6,
        border: `2px solid ${selected ? '#b8860b' : color}`,
        background: selected
          ? 'rgba(184,134,11,0.2)'
          : isHighRank
            ? 'linear-gradient(135deg,rgba(184,134,11,0.1),var(--card))'
            : 'var(--card)',
        cursor: disabled ? 'default' : 'pointer',
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'space-between',
        padding: small ? '4px 3px' : '6px 4px',
        boxShadow: selected ? `0 0 12px rgba(184,134,11,0.5)` : isHighRank ? `0 0 6px ${color}30` : 'none',
        transition:'all 0.15s',
        position:'relative',
        opacity: disabled ? 0.5 : 1,
        transform: selected ? 'translateY(-6px)' : 'none',
      }}
    >
      {isHeal ? (
        <>
          <div style={{fontSize: small ? '1.2rem' : '1.6rem'}}>{card.emoji}</div>
          <div style={{fontFamily:'monospace',fontSize: small ? '0.65rem' : '0.75rem',fontWeight:800,color:card.color}}>
            {card.label}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.45rem',color:'var(--mid)',textAlign:'center'}}>
            {lang === 'en' ? 'Heal' : 'Хіл'}
          </div>
        </>
      ) : (
        <>
          <div style={{fontFamily:'monospace',fontSize: small ? '0.55rem' : '0.6rem',color,fontWeight:700,lineHeight:1,textAlign:'center'}}>
            {card.rankShort}
          </div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <div style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#e74c3c'}}>⚔</span>
              <span style={{fontFamily:'monospace',fontSize: small ? '0.75rem' : '0.85rem',fontWeight:800,color:'#e74c3c'}}>{card.atk}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#3498db'}}>🛡</span>
              <span style={{fontFamily:'monospace',fontSize: small ? '0.75rem' : '0.85rem',fontWeight:800,color:'#3498db'}}>{card.def}</span>
            </div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.42rem',color:'var(--light)',textAlign:'center',lineHeight:1.1}}>
            {card.rank}
          </div>
        </>
      )}
    </div>
  )
}

export default function SumoClash({ onClose, lang = 'uk' }) {
  const [phase, setPhase] = useState('intro') // intro|draft|battle|roundResult|gameOver
  const [deck, setDeck] = useState([])
  const [draftPool, setDraftPool] = useState([])
  const [draftRound, setDraftRound] = useState(0) // 0-4
  const [playerHand, setPlayerHand] = useState([])
  const [cpuHand, setCpuHand] = useState([])
  const [drawPile, setDrawPile] = useState([])
  const [playerHp, setPlayerHp] = useState(MAX_HP)
  const [cpuHp, setCpuHp] = useState(MAX_HP)
  const [playerSelected, setPlayerSelected] = useState(null)
  const [cpuSelected, setCpuSelected] = useState(null)
  const [roundLog, setRoundLog] = useState([])
  const [roundNum, setRoundNum] = useState(0)
  const [animating, setAnimating] = useState(false)

  const t = {
    title:       lang === 'en' ? 'Sumo Clash' : 'Сумо Клеш',
    start:       lang === 'en' ? 'Start' : 'Почати',
    draft:       lang === 'en' ? 'Draft your team' : 'Оберіть команду',
    draftSub:    lang === 'en' ? 'Choose 1 card from 5 · Round' : 'Оберіть 1 карту з 5 · Раунд',
    battle:      lang === 'en' ? 'Choose your fighter' : 'Оберіть бійця',
    fight:       lang === 'en' ? 'Fight!' : 'Бій!',
    youWin:      lang === 'en' ? '🏆 Yusho! You win!' : '🏆 Юшо! Ви перемогли!',
    cpuWins:     lang === 'en' ? 'Make-koshi. CPU wins.' : 'Маке-коші. Суперник переміг.',
    rematch:     lang === 'en' ? 'Rematch' : 'Реванш',
    close:       lang === 'en' ? 'Close' : 'Закрити',
    yourHand:    lang === 'en' ? 'Your hand' : 'Ваша рука',
    cpuHand:     lang === 'en' ? 'CPU hand' : 'Рука CPU',
    round:       lang === 'en' ? 'Round' : 'Раунд',
    draw:        lang === 'en' ? 'Draw pile' : 'Колода',
    noCards:     lang === 'en' ? 'No cards left — game over!' : 'Карти закінчились — гра завершена!',
    selectFirst: lang === 'en' ? 'Select a card first' : 'Спочатку оберіть карту',
  }

  function startDraft() {
    const shuffled = shuffle(FULL_DECK)
    setDeck(shuffled)
    setPlayerHand([])
    setCpuHand([])
    setPlayerHp(MAX_HP)
    setCpuHp(MAX_HP)
    setRoundNum(0)
    setRoundLog([])
    setPlayerSelected(null)
    setCpuSelected(null)

    // CPU обирає 5 карт випадково з першої половини
    const cpuCards = shuffle(shuffled.slice(0, 30)).slice(0, 5)
    setCpuHand(cpuCards)

    // Залишок — draw pile
    const remaining = shuffled.filter(c => !cpuCards.find(cc => cc.id === c.id))
    setDrawPile(remaining)

    // Перший пул для драфту
    setDraftPool(remaining.slice(0, 5))
    setDraftRound(0)
    setPhase('draft')
  }

  function pickDraftCard(card) {
    const newHand = [...playerHand, card]
    const newPool = draftPool.filter(c => c.id !== card.id)
    const newDrawPile = drawPile.filter(c => !draftPool.find(dp => dp.id === c.id))

    if (draftRound < 4) {
      setPlayerHand(newHand)
      setDrawPile(newDrawPile)
      setDraftPool(newDrawPile.slice(0, 5))
      setDraftRound(r => r + 1)
    } else {
      // Драфт завершено
      setPlayerHand(newHand)
      setDrawPile(newDrawPile)
      setPhase('battle')
    }
  }

  function fightRound() {
    if (!playerSelected) return
    if (animating) return
    setAnimating(true)

    const pCard = playerSelected
    const cCard = cpuChooseCard(cpuHand, pCard)
    setCpuSelected(cCard)

    setTimeout(() => {
      let newPlayerHp = playerHp
      let newCpuHp = cpuHp
      const logs = []

      // Хіл гравця
      if (pCard.type === 'heal') {
        const healed = Math.min(MAX_HP, playerHp + pCard.heal) - playerHp
        newPlayerHp = Math.min(MAX_HP, playerHp + pCard.heal)
        logs.push({ text: lang === 'en' ? `You healed +${healed} HP` : `Ви відновили +${healed} HP`, color:'#1a6b5c' })
      }

      // Хіл CPU
      if (cCard.type === 'heal') {
        const healed = Math.min(MAX_HP, cpuHp + cCard.heal) - cpuHp
        newCpuHp = Math.min(MAX_HP, cpuHp + cCard.heal)
        logs.push({ text: lang === 'en' ? `CPU healed +${healed} HP` : `CPU відновив +${healed} HP`, color:'#c0392b' })
      }

      // Бій рікіші
      if (pCard.type === 'rikishi' && cCard.type === 'rikishi') {
        const pDmg = Math.max(0, pCard.atk - cCard.def)
        const cDmg = Math.max(0, cCard.atk - pCard.def)
        newCpuHp = Math.max(0, newCpuHp - pDmg)
        newPlayerHp = Math.max(0, newPlayerHp - cDmg)
        if (pDmg > 0) logs.push({ text: lang === 'en' ? `Your ${pCard.rankShort} deals ${pDmg} dmg` : `Ваш ${pCard.rankShort} завдає ${pDmg} шкоди`, color:'#1a6b5c' })
        if (cDmg > 0) logs.push({ text: lang === 'en' ? `CPU ${cCard.rankShort} deals ${cDmg} dmg` : `CPU ${cCard.rankShort} завдає ${cDmg} шкоди`, color:'#c0392b' })
        if (pDmg === 0 && cDmg === 0) logs.push({ text: lang === 'en' ? 'Both blocked!' : 'Обидва заблокували!', color:'var(--mid)' })
      }

      if (pCard.type === 'rikishi' && cCard.type === 'heal') {
        const pDmg = pCard.atk
        newCpuHp = Math.max(0, newCpuHp - pDmg)
        logs.push({ text: lang === 'en' ? `Your ${pCard.rankShort} deals ${pDmg} dmg (unblocked)` : `Ваш ${pCard.rankShort} завдає ${pDmg} шкоди (без захисту)`, color:'#1a6b5c' })
      }

      if (pCard.type === 'heal' && cCard.type === 'rikishi') {
        const cDmg = cCard.atk
        newPlayerHp = Math.max(0, newPlayerHp - cDmg)
        logs.push({ text: lang === 'en' ? `CPU ${cCard.rankShort} deals ${cDmg} dmg (unblocked)` : `CPU ${cCard.rankShort} завдає ${cDmg} шкоди (без захисту)`, color:'#c0392b' })
      }

      // Оновлення рук
      const newPlayerHand = playerHand.filter(c => c.id !== pCard.id)
      const newCpuHand = cpuHand.filter(c => c.id !== cCard.id)

      // Добір карти з колоди
      let finalPlayerHand = newPlayerHand
      let finalDrawPile = drawPile
      if (drawPile.length > 0) {
        const drawn = drawPile[0]
        finalPlayerHand = [...newPlayerHand, drawn]
        finalDrawPile = drawPile.slice(1)
        logs.push({ text: lang === 'en' ? `Drew: ${drawn.type === 'heal' ? drawn.label : drawn.rankShort}` : `Добір: ${drawn.type === 'heal' ? drawn.label : drawn.rankShort}`, color:'var(--mid)' })
      }

      // CPU теж добирає
      let finalCpuHand = newCpuHand
      if (finalDrawPile.length > 0) {
        const cpuDrawn = finalDrawPile[Math.floor(Math.random() * Math.min(5, finalDrawPile.length))]
        finalCpuHand = [...newCpuHand, cpuDrawn]
        finalDrawPile = finalDrawPile.filter(c => c.id !== cpuDrawn.id)
      }

      setPlayerHp(newPlayerHp)
      setCpuHp(newCpuHp)
      setPlayerHand(finalPlayerHand)
      setCpuHand(finalCpuHand)
      setDrawPile(finalDrawPile)
      setRoundLog(logs)
      setRoundNum(r => r + 1)
      setAnimating(false)

      // Перевірка кінця гри
      if (newPlayerHp <= 0 || newCpuHp <= 0 || finalPlayerHand.length === 0) {
        setTimeout(() => setPhase('gameOver'), 600)
      } else {
        setPhase('roundResult')
      }
    }, 500)
  }

  function nextRound() {
    setPlayerSelected(null)
    setCpuSelected(null)
    setRoundLog([])
    setPhase('battle')
  }

  const playerWon = cpuHp <= 0 && playerHp > 0

  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,
      background:'rgba(0,0,0,0.92)',
      zIndex:2000,
      display:'flex',alignItems:'center',justifyContent:'center',
      padding:'0.75rem',
      backdropFilter:'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--card)',
        border:'1px solid var(--border)',
        borderRadius:4,
        maxWidth:500,width:'100%',
        maxHeight:'92vh',
        display:'flex',flexDirection:'column',
        overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{
          borderBottom:'1px solid var(--border)',
          padding:'0.65rem 1rem',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          flexShrink:0,
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span>⚔️</span>
            <span style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)'}}>
              {t.title}
            </span>
            {phase === 'battle' || phase === 'roundResult' ? (
              <span style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--light)'}}>
                · {t.round} {roundNum + 1}
              </span>
            ) : null}
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'1rem'}}>

          {/* INTRO */}
          {phase === 'intro' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>⚔️</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1.4rem',fontWeight:800,color:'#b8860b',marginBottom:'0.5rem'}}>{t.title}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'var(--mid)',marginBottom:'1.5rem',lineHeight:1.6}}>
                {lang === 'en' ? 'Build your team. Defeat the CPU. Reach 0 HP to win.' : 'Зберіть команду. Переможіть CPU. Доведіть HP до 0.'}
              </div>
              <div style={{background:'var(--bg2)',borderRadius:2,padding:'1rem',marginBottom:'1.5rem',textAlign:'left'}}>
                <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.75rem'}}>
                  {lang === 'en' ? 'Rules' : 'Правила'}
                </div>
                {[
                  lang === 'en' ? 'Draft phase: choose 1 card from 5, repeat 5 times' : 'Драфт: обирайте 1 карту з 5, повторіть 5 разів',
                  lang === 'en' ? 'Battle: pick a card each round, both fight simultaneously' : 'Бій: обирайте карту щораунду, бій одночасний',
                  lang === 'en' ? 'Damage = attacker ATK − defender DEF (min 0)' : 'Шкода = ATK атакуючого − DEF захисника (мін 0)',
                  lang === 'en' ? 'Heal cards restore HP (max 50)' : 'Карти хілу відновлюють HP (макс 50)',
                  lang === 'en' ? 'After each round: +1 card from draw pile' : 'Після кожного раунду: +1 карта з колоди',
                  lang === 'en' ? 'First to 0 HP loses · No cards = game over' : 'Перший до 0 HP програє · Немає карт = кінець гри',
                ].map((r,i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:4}}>
                    <span style={{color:'#b8860b',fontFamily:'monospace',fontSize:'0.6rem',flexShrink:0}}>›</span>
                    <span style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--ink)',lineHeight:1.4}}>{r}</span>
                  </div>
                ))}
              </div>
              <button onClick={startDraft} style={{
                background:'#b8860b',color:'#fff',border:'none',borderRadius:2,
                padding:'0.7rem 2rem',fontFamily:'monospace',fontSize:'0.78rem',
                letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,
              }}>
                {t.start}
              </button>
            </div>
          )}

          {/* DRAFT */}
          {phase === 'draft' && (
            <div>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.25rem',textAlign:'center'}}>
                {t.draftSub} {draftRound + 1}/5
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.75rem',fontWeight:700,textAlign:'center',marginBottom:'1rem',color:'var(--ink)'}}>
                {t.draft}
              </div>

              {/* Поточна рука */}
              {playerHand.length > 0 && (
                <div style={{marginBottom:'1rem'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>
                    {t.yourHand} ({playerHand.length}/5)
                  </div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                    {playerHand.map(c => <GameCard key={c.id} card={c} small disabled lang={lang} />)}
                  </div>
                </div>
              )}

              {/* Пул для вибору */}
              <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                {draftPool.map(c => (
                  <GameCard
                    key={c.id} card={c} lang={lang}
                    onClick={() => pickDraftCard(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* BATTLE */}
          {phase === 'battle' && (
            <div>
              {/* HP обох */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
                <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(26,107,92,0.3)'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#1a6b5c',marginBottom:4,textTransform:'uppercase'}}>
                    {lang === 'en' ? 'You' : 'Ви'}
                  </div>
                  <HPBar hp={playerHp} />
                </div>
                <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(192,57,43,0.3)'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#c0392b',marginBottom:4,textTransform:'uppercase'}}>CPU</div>
                  <HPBar hp={cpuHp} />
                </div>
              </div>

              {/* Рука гравця */}
              <div style={{marginBottom:'1rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
                    {t.yourHand} ({playerHand.length})
                  </div>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)'}}>
                    {t.draw}: {drawPile.length}
                  </div>
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {playerHand.map(c => (
                    <GameCard
                      key={c.id} card={c} lang={lang}
                      selected={playerSelected?.id === c.id}
                      onClick={() => setPlayerSelected(c)}
                    />
                  ))}
                </div>
              </div>

              {/* CPU рука (сховані) */}
              <div style={{marginBottom:'1rem'}}>
                <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>
                  {t.cpuHand} ({cpuHand.length})
                </div>
                <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                  {cpuHand.map(c => <GameCard key={c.id} card={c} showBack small lang={lang} />)}
                </div>
              </div>

              <button
                onClick={fightRound}
                disabled={!playerSelected || animating}
                style={{
                  width:'100%',padding:'0.7rem',
                  background: !playerSelected ? 'var(--bg2)' : '#b8860b',
                  color: !playerSelected ? 'var(--mid)' : '#fff',
                  border:'none',borderRadius:2,
                  fontFamily:'monospace',fontSize:'0.78rem',
                  letterSpacing:'0.1em',cursor: !playerSelected ? 'default' : 'pointer',
                  fontWeight:700,transition:'all 0.2s',
                }}
              >
                {!playerSelected ? t.selectFirst : t.fight}
              </button>
            </div>
          )}

          {/* ROUND RESULT */}
          {phase === 'roundResult' && (
            <div>
              {/* HP */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
                <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(26,107,92,0.3)'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#1a6b5c',marginBottom:4,textTransform:'uppercase'}}>
                    {lang === 'en' ? 'You' : 'Ви'}
                  </div>
                  <HPBar hp={playerHp} />
                </div>
                <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(192,57,43,0.3)'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#c0392b',marginBottom:4,textTransform:'uppercase'}}>CPU</div>
                  <HPBar hp={cpuHp} />
                </div>
              </div>

              {/* Карти раунду */}
              <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',marginBottom:'1rem',gap:12}}>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',marginBottom:4}}>{lang === 'en' ? 'You played' : 'Ви зіграли'}</div>
                  <GameCard card={playerSelected} lang={lang} disabled />
                </div>
                <div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'var(--light)'}}>vs</div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)',marginBottom:4}}>{lang === 'en' ? 'CPU played' : 'CPU зіграв'}</div>
                  <GameCard card={cpuSelected} lang={lang} disabled />
                </div>
              </div>

              {/* Лог раунду */}
              <div style={{background:'var(--bg2)',borderRadius:2,padding:'0.75rem',marginBottom:'1rem'}}>
                {roundLog.map((l,i) => (
                  <div key={i} style={{fontFamily:'monospace',fontSize:'0.65rem',color:l.color,lineHeight:1.6}}>
                    {l.text}
                  </div>
                ))}
              </div>

              <button onClick={nextRound} style={{
                width:'100%',padding:'0.7rem',
                background:'var(--ink)',color:'var(--bg)',
                border:'none',borderRadius:2,
                fontFamily:'monospace',fontSize:'0.78rem',
                letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,
              }}>
                {lang === 'en' ? 'Next round' : 'Наступний раунд'}
              </button>
            </div>
          )}

          {/* GAME OVER */}
          {phase === 'gameOver' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>{playerWon ? '🏆' : '💪'}</div>
              <div style={{
                fontFamily:'Georgia,serif',fontSize:'1.4rem',fontWeight:800,
                color: playerWon ? '#b8860b' : '#c0392b',
                marginBottom:'0.5rem',
              }}>
                {playerWon ? t.youWin : t.cpuWins}
              </div>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.25rem'}}>
                {lang === 'en' ? `${roundNum} rounds played` : `Зіграно ${roundNum} раундів`}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'1rem 0'}}>
                <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:2}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#1a6b5c',marginBottom:4}}>{lang === 'en' ? 'Your HP' : 'Ваш HP'}</div>
                  <HPBar hp={playerHp} />
                </div>
                <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:2}}>
                  <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'#c0392b',marginBottom:4}}>CPU HP</div>
                  <HPBar hp={cpuHp} />
                </div>
              </div>
              <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                <button onClick={startDraft} style={{
                  background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:2,
                  padding:'0.6rem 1.5rem',fontFamily:'monospace',fontSize:'0.72rem',
                  letterSpacing:'0.1em',cursor:'pointer',
                }}>{t.rematch}</button>
                <button onClick={onClose} style={{
                  background:'var(--bg2)',color:'var(--mid)',
                  border:'1px solid var(--border)',borderRadius:2,
                  padding:'0.6rem 1.5rem',fontFamily:'monospace',fontSize:'0.72rem',
                  letterSpacing:'0.1em',cursor:'pointer',
                }}>{t.close}</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
