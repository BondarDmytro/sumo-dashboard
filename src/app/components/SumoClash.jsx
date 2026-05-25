'use client'

import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { ref, set, get, onValue, update, off } from 'firebase/database'

const MAX_HP = 50
const MAX_ROUNDS = 15

const RIKISHI_CARDS = [
  { id:'Y1', type:'rikishi', rank:'Yokozuna', rankShort:'Y1e', atk:9, def:8, color:'#b8860b' },
  { id:'Y2', type:'rikishi', rank:'Yokozuna', rankShort:'Y1w', atk:8, def:9, color:'#b8860b' },
  { id:'O1', type:'rikishi', rank:'Ozeki', rankShort:'O1e', atk:8, def:7, color:'#1a6b5c' },
  { id:'O2', type:'rikishi', rank:'Ozeki', rankShort:'O1w', atk:7, def:8, color:'#1a6b5c' },
  { id:'O3', type:'rikishi', rank:'Ozeki', rankShort:'O2e', atk:7, def:7, color:'#1a6b5c' },
  { id:'O4', type:'rikishi', rank:'Ozeki', rankShort:'O2w', atk:8, def:6, color:'#1a6b5c' },
  { id:'S1', type:'rikishi', rank:'Sekiwake', rankShort:'S1e', atk:7, def:6, color:'#1a4a7a' },
  { id:'S2', type:'rikishi', rank:'Sekiwake', rankShort:'S1w', atk:6, def:7, color:'#1a4a7a' },
  { id:'S3', type:'rikishi', rank:'Sekiwake', rankShort:'S2e', atk:6, def:6, color:'#1a4a7a' },
  { id:'S4', type:'rikishi', rank:'Sekiwake', rankShort:'S2w', atk:7, def:5, color:'#1a4a7a' },
  { id:'S5', type:'rikishi', rank:'Sekiwake', rankShort:'S3e', atk:5, def:7, color:'#1a4a7a' },
  { id:'S6', type:'rikishi', rank:'Sekiwake', rankShort:'S3w', atk:6, def:5, color:'#1a4a7a' },
  { id:'K1', type:'rikishi', rank:'Komusubi', rankShort:'K1e', atk:6, def:5, color:'#6b3fa0' },
  { id:'K2', type:'rikishi', rank:'Komusubi', rankShort:'K1w', atk:5, def:6, color:'#6b3fa0' },
  { id:'K3', type:'rikishi', rank:'Komusubi', rankShort:'K2e', atk:5, def:5, color:'#6b3fa0' },
  { id:'K4', type:'rikishi', rank:'Komusubi', rankShort:'K2w', atk:6, def:4, color:'#6b3fa0' },
  { id:'K5', type:'rikishi', rank:'Komusubi', rankShort:'K3e', atk:4, def:6, color:'#6b3fa0' },
  { id:'K6', type:'rikishi', rank:'Komusubi', rankShort:'K3w', atk:5, def:4, color:'#6b3fa0' },
  { id:'K7', type:'rikishi', rank:'Komusubi', rankShort:'K4e', atk:4, def:5, color:'#6b3fa0' },
  { id:'K8', type:'rikishi', rank:'Komusubi', rankShort:'K4w', atk:5, def:5, color:'#6b3fa0' },
]

// Маєґашіра 34 карти
const MAEGASHIRA = [
  ...Array.from({length:17}, (_,i) => ({
    id:`Me${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}e`,
    atk: Math.max(1, 4 - Math.floor(i/4)), def: Math.max(1, 4 - Math.floor(i/5)), color:'var(--mid)',
  })),
  ...Array.from({length:17}, (_,i) => ({
    id:`Mw${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}w`,
    atk: Math.max(1, 4 - Math.floor(i/4)), def: Math.max(1, 3 - Math.floor(i/6)), color:'var(--mid)',
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

const FULL_DECK = [...RIKISHI_CARDS, ...MAEGASHIRA, ...HEAL_CARDS]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateCode() {
  return Math.random().toString(36).slice(2,8).toUpperCase()
}

function getCardById(id) {
  return FULL_DECK.find(c => c.id === id)
}

function cpuChooseCard(hand) {
  const rikishi = hand.filter(c => c.type === 'rikishi')
  if (rikishi.length === 0) return hand[0]
  return rikishi.sort((a,b) => (b.atk+b.def)-(a.atk+a.def))[0]
}

function resolveRound(pCard, oCard, pHp, oHp) {
  let newPHp = pHp, newOHp = oHp
  const logs = []

  if (pCard.type === 'heal') {
    const h = Math.min(MAX_HP, pHp + pCard.heal) - pHp
    newPHp = Math.min(MAX_HP, pHp + pCard.heal)
    logs.push({ text: `You: +${h} HP`, color:'#1a6b5c' })
  }
  if (oCard.type === 'heal') {
    const h = Math.min(MAX_HP, oHp + oCard.heal) - oHp
    newOHp = Math.min(MAX_HP, oHp + oCard.heal)
    logs.push({ text: `Opp: +${h} HP`, color:'#c0392b' })
  }
  if (pCard.type === 'rikishi' && oCard.type === 'rikishi') {
    const pDmg = Math.max(0, pCard.atk - oCard.def)
    const oDmg = Math.max(0, oCard.atk - pCard.def)
    newOHp = Math.max(0, newOHp - pDmg)
    newPHp = Math.max(0, newPHp - oDmg)
    if (pDmg > 0) logs.push({ text: `${pCard.rankShort} → ${pDmg} dmg`, color:'#1a6b5c' })
    if (oDmg > 0) logs.push({ text: `${oCard.rankShort} → ${oDmg} dmg`, color:'#c0392b' })
    if (pDmg === 0 && oDmg === 0) logs.push({ text: 'Both blocked!', color:'var(--mid)' })
  }
  if (pCard.type === 'rikishi' && oCard.type === 'heal') {
    newOHp = Math.max(0, newOHp - pCard.atk)
    logs.push({ text: `${pCard.rankShort} → ${pCard.atk} dmg (unblocked)`, color:'#1a6b5c' })
  }
  if (pCard.type === 'heal' && oCard.type === 'rikishi') {
    newPHp = Math.max(0, newPHp - oCard.atk)
    logs.push({ text: `${oCard.rankShort} → ${oCard.atk} dmg (unblocked)`, color:'#c0392b' })
  }

  const pDmgTotal = pCard.type==='rikishi' ? Math.max(0, pCard.atk - (oCard.type==='rikishi'?oCard.def:0)) : 0
  const oDmgTotal = oCard.type==='rikishi' ? Math.max(0, oCard.atk - (pCard.type==='rikishi'?pCard.def:0)) : 0
  const roundWinner = pDmgTotal > oDmgTotal ? 'p' : oDmgTotal > pDmgTotal ? 'o' : 'tie'

  return { newPHp, newOHp, logs, roundWinner }
}

function HPBar({ hp }) {
  const pct = Math.max(0, (hp / MAX_HP) * 100)
  const color = pct > 60 ? '#1a6b5c' : pct > 30 ? '#b8860b' : '#c0392b'
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        <span style={{fontFamily:'monospace',fontSize:'0.52rem',color:'var(--mid)'}}>HP</span>
        <span style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,color}}>{hp}/{MAX_HP}</span>
      </div>
      <div style={{height:5,background:'var(--bg2)',borderRadius:3,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:3,transition:'width 0.4s'}} />
      </div>
    </div>
  )
}

function GameCard({ card, selected, onClick, disabled, small, showBack }) {
  if (!card) return null
  if (showBack) return (
    <div style={{width:small?60:76,height:small?86:108,borderRadius:6,background:'linear-gradient(135deg,#1a1a2e,#0f3460)',border:'2px solid #b8860b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:'1.1rem',opacity:0.5}}>相</span>
    </div>
  )
  const isHeal = card.type === 'heal'
  const color = isHeal ? card.color : (card.color || 'var(--mid)')
  return (
    <div onClick={disabled ? undefined : onClick} style={{
      width:small?60:76, height:small?86:108, borderRadius:6,
      border:`2px solid ${selected ? '#b8860b' : color}`,
      background: selected ? 'rgba(184,134,11,0.2)' : 'var(--card)',
      cursor: disabled ? 'default' : 'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',
      padding:small?'4px 3px':'6px 4px',
      boxShadow: selected ? '0 0 12px rgba(184,134,11,0.5)' : 'none',
      transition:'all 0.15s', opacity: disabled ? 0.5 : 1,
      transform: selected ? 'translateY(-6px)' : 'none', flexShrink:0,
    }}>
      {isHeal ? (
        <>
          <div style={{fontSize:small?'1rem':'1.3rem'}}>{card.emoji}</div>
          <div style={{fontFamily:'monospace',fontSize:small?'0.6rem':'0.7rem',fontWeight:800,color:card.color}}>{card.label}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.4rem',color:'var(--mid)'}}>Heal</div>
        </>
      ) : (
        <>
          <div style={{fontFamily:'monospace',fontSize:small?'0.5rem':'0.56rem',color,fontWeight:700,lineHeight:1,textAlign:'center'}}>{card.rankShort}</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:1}}>
            <div style={{display:'flex',alignItems:'center',gap:2}}>
              <span style={{fontSize:'0.42rem',color:'#e74c3c'}}>⚔</span>
              <span style={{fontFamily:'monospace',fontSize:small?'0.7rem':'0.8rem',fontWeight:800,color:'#e74c3c'}}>{card.atk}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:2}}>
              <span style={{fontSize:'0.42rem',color:'#3498db'}}>🛡</span>
              <span style={{fontFamily:'monospace',fontSize:small?'0.7rem':'0.8rem',fontWeight:800,color:'#3498db'}}>{card.def}</span>
            </div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.38rem',color:'var(--light)',textAlign:'center'}}>{card.rank}</div>
        </>
      )}
    </div>
  )
}

function BattleLayout({ myHp, oppHp, myWins, oppWins, roundNum, myLabel, oppLabel, myHand, oppHand, playerSelected, onSelect, myReady, oppReady, onSubmit, roundLog, phase, onNext, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const isRoundResult = phase === 'roundResult'

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
          {t('Раунд','Round')} {roundNum}/{MAX_ROUNDS}
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)'}}>
          {myWins}–{oppWins}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:'1rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#1a6b5c',marginBottom:4,textTransform:'uppercase'}}>{myLabel}</div>
          <HPBar hp={myHp} />
        </div>
        <div style={{background:'var(--bg2)',padding:'0.6rem',borderRadius:2,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#c0392b',marginBottom:4,textTransform:'uppercase'}}>{oppLabel}</div>
          <HPBar hp={oppHp} />
        </div>
      </div>

      {isRoundResult ? (
        <>
          <div style={{background:'var(--bg2)',borderRadius:2,padding:'0.75rem',marginBottom:'1rem'}}>
            {roundLog.map((l,i) => <div key={i} style={{fontFamily:'monospace',fontSize:'0.62rem',color:l.color,lineHeight:1.6}}>{l.text}</div>)}
          </div>
          <button onClick={onNext} style={{width:'100%',padding:'0.65rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>
            {roundNum >= MAX_ROUNDS ? t('Результат','Results') : t('Наступний раунд','Next round')}
          </button>
        </>
      ) : (
        <>
          <div style={{marginBottom:'0.75rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:6}}>
              {t('Ваша рука','Your hand')} ({myHand.length})
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {myHand.map(c => (
                <GameCard key={c.id} card={c} selected={playerSelected?.id===c.id} onClick={() => !myReady && onSelect(c)} disabled={myReady} />
              ))}
            </div>
          </div>
          <div style={{marginBottom:'0.75rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:6}}>
              {oppLabel} ({oppHand})
            </div>
            <div style={{display:'flex',gap:4}}>
              {Array.from({length:Math.min(oppHand,6)}).map((_,i) => <GameCard key={i} card={FULL_DECK[0]} showBack small />)}
            </div>
          </div>
          {oppReady && !myReady && (
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'#1a6b5c',marginBottom:'0.5rem',textAlign:'center'}}>
              ✓ {t('Суперник готовий','Opponent ready')}
            </div>
          )}
          {myReady && (
            <div style={{fontFamily:'monospace',fontSize:'0.6rem',color:'var(--mid)',marginBottom:'0.5rem',textAlign:'center'}}>
              {t('Очікуємо суперника...','Waiting for opponent...')}
            </div>
          )}
          <button onClick={onSubmit} disabled={!playerSelected || myReady} style={{
            width:'100%',padding:'0.65rem',
            background:(!playerSelected||myReady)?'var(--bg2)':'#b8860b',
            color:(!playerSelected||myReady)?'var(--mid)':'#fff',
            border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.72rem',
            letterSpacing:'0.1em',cursor:(!playerSelected||myReady)?'default':'pointer',fontWeight:700,
          }}>
            {myReady ? t('Підтверджено ✓','Confirmed ✓') : !playerSelected ? t('Оберіть карту','Select a card') : t('Підтвердити','Confirm')}
          </button>
        </>
      )}
    </div>
  )
}

function GameOverScreen({ myHp, oppHp, myWins, oppWins, myLabel, oppLabel, onBack, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const playerWon = myHp > oppHp || (myHp > 0 && oppHp <= 0)
  const isKachiKoshi = myWins > oppWins
  const ties = MAX_ROUNDS - myWins - oppWins
  return (
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>{playerWon ? '🏆' : '💪'}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:'1.3rem',fontWeight:800,color:playerWon?'#b8860b':'#c0392b',marginBottom:'0.5rem'}}>
        {playerWon ? t('Юшо! Ви перемогли!','Yusho! You win!') : t('Маке-коші.','Make-koshi.')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,margin:'1rem 0'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:2,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#1a6b5c',marginBottom:4}}>{myLabel} HP</div>
          <HPBar hp={myHp} />
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:2,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'#c0392b',marginBottom:4}}>{oppLabel} HP</div>
          <HPBar hp={oppHp} />
        </div>
      </div>
      <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:2,marginBottom:'1rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',marginBottom:4}}>
          {t('Раунди','Rounds')}: {myWins}W – {oppWins}L – {ties}D
        </div>
        <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:800,color:isKachiKoshi?'#1a6b5c':'#c0392b'}}>
          {isKachiKoshi ? '勝ち越し Kachi-koshi' : '負け越し Make-koshi'}
        </div>
      </div>
      <button onClick={onBack} style={{background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:2,padding:'0.6rem 1.5rem',fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.1em',cursor:'pointer'}}>
        {t('В меню','Menu')}
      </button>
    </div>
  )
}

// ── CPU режим ──────────────────────────────────────────────
function CpuGame({ lang, onBack }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [phase, setPhase] = useState('draft')
  const [draftPool, setDraftPool] = useState([])
  const [draftRound, setDraftRound] = useState(0)
  const [playerHand, setPlayerHand] = useState([])
  const [cpuHand, setCpuHand] = useState([])
  const [drawPile, setDrawPile] = useState([])
  const [playerHp, setPlayerHp] = useState(MAX_HP)
  const [cpuHp, setCpuHp] = useState(MAX_HP)
  const [playerSelected, setPlayerSelected] = useState(null)
  const [cpuSelected, setCpuSelected] = useState(null)
  const [roundLog, setRoundLog] = useState([])
  const [roundNum, setRoundNum] = useState(0)
  const [playerWins, setPlayerWins] = useState(0)
  const [cpuWins, setCpuWins] = useState(0)

  useEffect(() => {
    const shuffled = shuffle(FULL_DECK)
    const cpuCards = shuffle(shuffled.slice(0,30)).slice(0,5)
    setCpuHand(cpuCards)
    const remaining = shuffled.filter(c => !cpuCards.find(cc => cc.id===c.id))
    setDrawPile(remaining)
    setDraftPool(remaining.slice(0,5))
  }, [])

  function pickDraft(card) {
    const newHand = [...playerHand, card]
    const newDraw = drawPile.filter(c => !draftPool.find(d => d.id===c.id))
    if (draftRound < 4) {
      setPlayerHand(newHand)
      setDrawPile(newDraw)
      setDraftPool(newDraw.slice(0,5))
      setDraftRound(r => r+1)
    } else {
      setPlayerHand(newHand)
      setDrawPile(newDraw)
      setPhase('battle')
    }
  }

  function fight() {
    if (!playerSelected) return
    const cCard = cpuChooseCard(cpuHand)
    setCpuSelected(cCard)
    const { newPHp, newOHp, logs, roundWinner } = resolveRound(playerSelected, cCard, playerHp, cpuHp)
    setPlayerHp(newPHp)
    setCpuHp(newOHp)
    setRoundLog(logs)
    if (roundWinner === 'p') setPlayerWins(w => w+1)
    else if (roundWinner === 'o') setCpuWins(w => w+1)

    let newPlayerHand = playerHand.filter(c => c.id !== playerSelected.id)
    let newCpuHand = cpuHand.filter(c => c.id !== cCard.id)
    let newDraw = drawPile
    if (newDraw.length > 0) { newPlayerHand = [...newPlayerHand, newDraw[0]]; newDraw = newDraw.slice(1) }
    if (newDraw.length > 0) {
      const idx = Math.floor(Math.random() * Math.min(3, newDraw.length))
      newCpuHand = [...newCpuHand, newDraw[idx]]
      newDraw = newDraw.filter((_,i) => i !== idx)
    }
    setPlayerHand(newPlayerHand)
    setCpuHand(newCpuHand)
    setDrawPile(newDraw)
    setPhase('roundResult')
  }

  function nextRound() {
    const nr = roundNum + 1
    setRoundNum(nr)
    setPlayerSelected(null)
    setCpuSelected(null)
    setRoundLog([])
    if (nr >= MAX_ROUNDS || playerHand.length === 0) setPhase('gameOver')
    else setPhase('battle')
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.62rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>
        ‹ {t('Назад','Back')}
      </button>

      {phase === 'draft' && (
        <div>
          <div style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>
            {t('Оберіть команду','Draft your team')}
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>
            {t('Раунд','Round')} {draftRound+1}/5
          </div>
          {playerHand.length > 0 && (
            <div style={{marginBottom:'1rem'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:6}}>{t('Рука','Hand')} ({playerHand.length}/5)</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c => <GameCard key={c.id} card={c} small disabled />)}</div>
            </div>
          )}
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
            {draftPool.map(c => <GameCard key={c.id} card={c} onClick={() => pickDraft(c)} />)}
          </div>
        </div>
      )}

      {(phase === 'battle' || phase === 'roundResult') && (
        <BattleLayout
          myHp={playerHp} oppHp={cpuHp}
          myWins={playerWins} oppWins={cpuWins}
          roundNum={roundNum+1}
          myLabel={t('Ви','You')} oppLabel="CPU"
          myHand={playerHand} oppHand={cpuHand.length}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={false} oppReady={false}
          onSubmit={fight}
          roundLog={roundLog} phase={phase} onNext={nextRound}
          lang={lang}
        />
      )}

      {phase === 'gameOver' && (
        <GameOverScreen
          myHp={playerHp} oppHp={cpuHp}
          myWins={playerWins} oppWins={cpuWins}
          myLabel={t('Ви','You')} oppLabel="CPU"
          onBack={onBack} lang={lang}
        />
      )}
    </div>
  )
}

// ── Мультиплеєр ────────────────────────────────────────────
function MultiGame({ lang, onBack }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [screen, setScreen] = useState('lobby')
  const [role, setRole] = useState(null)
  const [sessionId, setSessionId] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [error, setError] = useState('')
  const [session, setSession] = useState(null)
  const [playerHand, setPlayerHand] = useState([])
  const [draftPool, setDraftPool] = useState([])
  const [draftRound, setDraftRound] = useState(0)
  const [playerSelected, setPlayerSelected] = useState(null)
  const [roundNum, setRoundNum] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const myKey = role === 'host' ? 'p1' : 'p2'
  const oppKey = role === 'host' ? 'p2' : 'p1'

  useEffect(() => {
    if (!sessionId) return
    const sessionRef = ref(db, `clash/${sessionId}`)
    const unsub = onValue(sessionRef, snap => {
      const data = snap.val()
      if (!data) return
      setSession(data)
    })
    return () => off(sessionRef)
  }, [sessionId])

  useEffect(() => {
    if (!session || !role) return
    const status = session.status

    if (status === 'waiting' && role === 'host' && session.p2?.joined) {
      update(ref(db, `clash/${sessionId}`), { status: 'draft' })
    }
    if (status === 'draft' && screen === 'waiting') {
      const pool = (session[myKey]?.draftPool || []).map(id => getCardById(id)).filter(Boolean)
      setDraftPool(pool)
      setDraftRound(session[myKey]?.draftRound || 0)
      const hand = (session[myKey]?.hand || []).map(id => getCardById(id)).filter(Boolean)
      setPlayerHand(hand)
      setScreen('draft')
    }
    if (status === 'battle' && (screen === 'draft' || screen === 'roundResult')) {
      const hand = (session[myKey]?.hand || []).map(id => getCardById(id)).filter(Boolean)
      setPlayerHand(hand)
      setPlayerSelected(null)
      setSubmitting(false)
      setRoundNum(session.roundNum || 0)
      setScreen('battle')
    }
    if (status === 'roundResult' && screen === 'battle') {
      setScreen('roundResult')
    }
    if (status === 'gameOver' && screen !== 'gameOver') {
      setScreen('gameOver')
    }
  }, [session?.status, session?.roundNum, session?.p2?.joined])

  async function createSession() {
    const code = generateCode()
    const shuffled = shuffle(FULL_DECK)
    const p1Pool = shuffled.slice(0,5).map(c => c.id)
    const p2Pool = shuffled.slice(5,10).map(c => c.id)
    await set(ref(db, `clash/${code}`), {
      status: 'waiting',
      deck: shuffled.map(c => c.id),
      deckIdx: 10,
      roundNum: 0,
      roundLog: [],
      p1: { joined:true, hp:MAX_HP, hand:[], draftPool:p1Pool, draftRound:0, wins:0, ready:false, draftDone:false },
      p2: { joined:false, hp:MAX_HP, hand:[], draftPool:p2Pool, draftRound:0, wins:0, ready:false, draftDone:false },
    })
    setSessionId(code)
    setRole('host')
    setScreen('waiting')
  }

  async function joinSession() {
    const code = inputCode.toUpperCase().trim()
    if (!code) return
    const snap = await get(ref(db, `clash/${code}`))
    if (!snap.exists()) { setError(t('Сесію не знайдено','Session not found')); return }
    const data = snap.val()
    if (data.p2?.joined) { setError(t('Гра вже заповнена','Game is full')); return }
    await update(ref(db, `clash/${code}/p2`), { joined:true, hp:MAX_HP, hand:[], wins:0, ready:false, draftDone:false })
    setSessionId(code)
    setRole('guest')
    setScreen('waiting')
  }

  async function pickDraft(card) {
    const snap = await get(ref(db, `clash/${sessionId}`))
    const data = snap.val()
    const myData = data[myKey]
    const currentHand = [...(myData.hand || []), card.id]
    const newDraftRound = (myData.draftRound || 0) + 1
    const isDone = newDraftRound >= 5

    let updates = {}
    updates[`clash/${sessionId}/${myKey}/hand`] = currentHand
    updates[`clash/${sessionId}/${myKey}/draftRound`] = newDraftRound
    updates[`clash/${sessionId}/${myKey}/draftDone`] = isDone

    if (!isDone) {
      const deckIdx = data.deckIdx || 10
      const deck = data.deck
      const offset = role === 'host' ? 0 : 5
      const nextPool = deck.slice(deckIdx + offset, deckIdx + offset + 5)
      updates[`clash/${sessionId}/${myKey}/draftPool`] = nextPool
      if (role === 'host') updates[`clash/${sessionId}/deckIdx`] = deckIdx + 10
    }

    await update(ref(db), updates)

    const newHandCards = currentHand.map(id => getCardById(id)).filter(Boolean)
    setPlayerHand(newHandCards)
    setDraftRound(newDraftRound)

    if (isDone && data[oppKey]?.draftDone) {
      await update(ref(db, `clash/${sessionId}`), { status: 'battle' })
    }

    if (!isDone) {
      const newSnap = await get(ref(db, `clash/${sessionId}/${myKey}/draftPool`))
      const pool = (newSnap.val() || []).map(id => getCardById(id)).filter(Boolean)
      setDraftPool(pool)
    }
  }

  async function submitCard() {
    if (!playerSelected || submitting) return
    setSubmitting(true)
    await update(ref(db, `clash/${sessionId}/${myKey}`), { selectedCard: playerSelected.id, ready: true })

    const snap = await get(ref(db, `clash/${sessionId}`))
    const data = snap.val()
    if (data[oppKey]?.ready && role === 'host') {
      const p1Card = getCardById(data.p1.selectedCard)
      const p2Card = getCardById(data.p2.selectedCard)
      const { newPHp, newOHp, logs, roundWinner } = resolveRound(p1Card, p2Card, data.p1.hp, data.p2.hp)
      const newRound = (data.roundNum || 0) + 1

      const usedIds = new Set([data.p1.selectedCard, data.p2.selectedCard])
      const deckArr = (data.deck || []).map(id => getCardById(id)).filter(Boolean)
      const p1HandFiltered = (data.p1.hand||[]).filter(id => id !== data.p1.selectedCard)
      const p2HandFiltered = (data.p2.hand||[]).filter(id => id !== data.p2.selectedCard)
      const drawRemaining = deckArr.filter(c => !usedIds.has(c.id) && !p1HandFiltered.includes(c.id) && !p2HandFiltered.includes(c.id))

      let fp1 = p1HandFiltered, fp2 = p2HandFiltered
      if (drawRemaining.length > 0) { fp1 = [...fp1, drawRemaining[0].id] }
      if (drawRemaining.length > 1) { fp2 = [...fp2, drawRemaining[1].id] }

      const isOver = newRound >= MAX_ROUNDS || fp1.length === 0 || fp2.length === 0

      await update(ref(db), {
        [`clash/${sessionId}/p1/hp`]: newPHp,
        [`clash/${sessionId}/p2/hp`]: newOHp,
        [`clash/${sessionId}/p1/hand`]: fp1,
        [`clash/${sessionId}/p2/hand`]: fp2,
        [`clash/${sessionId}/p1/wins`]: (data.p1.wins||0) + (roundWinner==='p'?1:0),
        [`clash/${sessionId}/p2/wins`]: (data.p2.wins||0) + (roundWinner==='o'?1:0),
        [`clash/${sessionId}/p1/ready`]: false,
        [`clash/${sessionId}/p2/ready`]: false,
        [`clash/${sessionId}/p1/selectedCard`]: null,
        [`clash/${sessionId}/p2/selectedCard`]: null,
        [`clash/${sessionId}/roundNum`]: newRound,
        [`clash/${sessionId}/roundLog`]: logs,
        [`clash/${sessionId}/status`]: isOver ? 'gameOver' : 'roundResult',
      })
    }
  }

  const myHp = session?.[myKey]?.hp ?? MAX_HP
  const oppHp = session?.[oppKey]?.hp ?? MAX_HP
  const myWins = session?.[myKey]?.wins ?? 0
  const oppWins = session?.[oppKey]?.wins ?? 0
  const myReady = session?.[myKey]?.ready ?? false
  const oppReady = session?.[oppKey]?.ready ?? false
  const totalRounds = session?.roundNum ?? 0
  const oppHandCount = (session?.[oppKey]?.hand || []).length
  const myHandCards = playerHand.length > 0 ? playerHand : (session?.[myKey]?.hand || []).map(id => getCardById(id)).filter(Boolean)
  const myDraftPool = draftPool.length > 0 ? draftPool : (session?.[myKey]?.draftPool || []).map(id => getCardById(id)).filter(Boolean)

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.62rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>
        ‹ {t('Назад','Back')}
      </button>

      {screen === 'lobby' && (
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'1.5rem',marginBottom:'0.75rem'}}>🌐</div>
          <div style={{fontFamily:'monospace',fontSize:'0.7rem',fontWeight:700,marginBottom:'1.5rem'}}>{t('Мультиплеєр','Multiplayer')}</div>
          <button onClick={createSession} style={{width:'100%',padding:'0.7rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.72rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,marginBottom:'1rem'}}>
            {t('Створити гру','Create game')}
          </button>
          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:'0.5rem'}}>{t('або','or')}</div>
          <div style={{display:'flex',gap:8,marginBottom:'0.5rem'}}>
            <input value={inputCode} onChange={e => setInputCode(e.target.value.toUpperCase())} placeholder={t('Код сесії...','Session code...')} maxLength={6}
              style={{flex:1,padding:'0.6rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'monospace',fontSize:'0.8rem',borderRadius:2,outline:'none',letterSpacing:'0.15em',textTransform:'uppercase'}} />
            <button onClick={joinSession} style={{padding:'0.6rem 1rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.7rem',cursor:'pointer',fontWeight:700}}>
              {t('Приєднатись','Join')}
            </button>
          </div>
          {error && <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'#c0392b'}}>{error}</div>}
        </div>
      )}

      {screen === 'waiting' && (
        <div style={{textAlign:'center',paddingTop:'1rem'}}>
          <div style={{fontSize:'1.5rem',marginBottom:'0.75rem'}}>⏳</div>
          <div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'var(--mid)',marginBottom:'1rem'}}>
            {role === 'host' ? t('Очікуємо суперника...','Waiting for opponent...') : t('Підключаємось...','Connecting...')}
          </div>
          {role === 'host' && (
            <div style={{background:'var(--bg2)',padding:'1rem',borderRadius:2,display:'inline-block'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',marginBottom:4}}>{t('Код сесії','Session code')}</div>
              <div style={{fontFamily:'monospace',fontSize:'2rem',fontWeight:800,color:'#b8860b',letterSpacing:'0.3em'}}>{sessionId}</div>
            </div>
          )}
        </div>
      )}

      {screen === 'draft' && (
        <div>
          <div style={{fontFamily:'monospace',fontSize:'0.68rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/5</div>
          {myHandCards.length > 0 && (
            <div style={{marginBottom:'1rem'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:6}}>{t('Рука','Hand')} ({myHandCards.length})</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{myHandCards.map(c => <GameCard key={c.id} card={c} small disabled />)}</div>
            </div>
          )}
          {draftRound < 5 && !session?.[myKey]?.draftDone ? (
            <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
              {myDraftPool.map(c => c && <GameCard key={c.id} card={c} onClick={() => pickDraft(c)} />)}
            </div>
          ) : (
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',marginTop:'1rem'}}>
              {t('Очікуємо суперника...','Waiting for opponent...')}
            </div>
          )}
        </div>
      )}

      {(screen === 'battle' || screen === 'roundResult') && (
        <BattleLayout
          myHp={myHp} oppHp={oppHp}
          myWins={myWins} oppWins={oppWins}
          roundNum={totalRounds+1}
          myLabel={t('Ви','You')} oppLabel={t('Суперник','Opponent')}
          myHand={myHandCards} oppHand={oppHandCount}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={myReady} oppReady={oppReady}
          onSubmit={submitCard}
          roundLog={session?.roundLog||[]} phase={screen}
          onNext={() => {}}
          lang={lang}
        />
      )}

      {screen === 'gameOver' && (
        <GameOverScreen
          myHp={myHp} oppHp={oppHp}
          myWins={myWins} oppWins={oppWins}
          myLabel={t('Ви','You')} oppLabel={t('Суперник','Opponent')}
          onBack={onBack} lang={lang}
        />
      )}
    </div>
  )
}

// ── Головний компонент ─────────────────────────────────────
export default function SumoClash({ onClose, lang = 'uk' }) {
  const [mode, setMode] = useState('menu')
  const t = (uk, en) => lang === 'en' ? en : uk

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem',backdropFilter:'blur(4px)'}}>
      <div onClick={e => e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:4,maxWidth:500,width:'100%',maxHeight:'92vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{borderBottom:'1px solid var(--border)',padding:'0.65rem 1rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <span>⚔️</span>
            <span style={{fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)'}}>
              {t('Сумо Клеш','Sumo Clash')}
            </span>
            {mode !== 'menu' && (
              <span style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--light)'}}>
                · {mode === 'cpu' ? 'vs CPU' : t('Мультиплеєр','Multiplayer')}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.1rem',cursor:'pointer'}}>✕</button>
        </div>

        {mode === 'menu' && (
          <div style={{flex:1,padding:'1.5rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1rem'}}>
            <div style={{fontSize:'2rem',marginBottom:'0.25rem'}}>⚔️</div>
            <div style={{fontFamily:'Georgia,serif',fontSize:'1.3rem',fontWeight:800,color:'#b8860b'}}>{t('Сумо Клеш','Sumo Clash')}</div>
            <div style={{fontFamily:'monospace',fontSize:'0.62rem',color:'var(--mid)',textAlign:'center',lineHeight:1.6,marginBottom:'0.5rem'}}>
              {t('15 раундів · Драфт · ATK vs DEF · HP битва','15 rounds · Draft · ATK vs DEF · HP battle')}
            </div>
            <button onClick={() => setMode('cpu')} style={{width:'100%',maxWidth:280,padding:'0.75rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.75rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>
              🤖 {t('Проти CPU','vs CPU')}
            </button>
            <button onClick={() => setMode('multi')} style={{width:'100%',maxWidth:280,padding:'0.75rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:2,fontFamily:'monospace',fontSize:'0.75rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>
              🌐 {t('Мультиплеєр','Multiplayer')}
            </button>
          </div>
        )}

        {mode === 'cpu' && <CpuGame lang={lang} onBack={() => setMode('menu')} />}
        {mode === 'multi' && <MultiGame lang={lang} onBack={() => setMode('menu')} />}
      </div>
    </div>
  )
}
