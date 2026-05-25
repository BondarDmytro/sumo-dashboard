'use client'

import { trackGameLaunch } from '../lib/gameAnalytics'
trackGameLaunch('yushoGame')
import { useState, useEffect } from 'react'


const SUITS = ['🔴', '🔵', '🟡', '🟢']
const SUIT_NAMES = {
  '🔴': { ua: 'Схід', en: 'East' },
  '🔵': { ua: 'Захід', en: 'West' },
  '🟡': { ua: 'Північ', en: 'North' },
  '🟢': { ua: 'Південь', en: 'South' },
}

const RANKS = [
  { value: 2,  label: 'M17', name: { ua: 'Маєґашіра 17', en: 'Maegashira 17' } },
  { value: 3,  label: 'M15', name: { ua: 'Маєґашіра 15', en: 'Maegashira 15' } },
  { value: 4,  label: 'M13', name: { ua: 'Маєґашіра 13', en: 'Maegashira 13' } },
  { value: 5,  label: 'M11', name: { ua: 'Маєґашіра 11', en: 'Maegashira 11' } },
  { value: 6,  label: 'M9',  name: { ua: 'Маєґашіра 9',  en: 'Maegashira 9'  } },
  { value: 7,  label: 'M7',  name: { ua: 'Маєґашіра 7',  en: 'Maegashira 7'  } },
  { value: 8,  label: 'M5',  name: { ua: 'Маєґашіра 5',  en: 'Maegashira 5'  } },
  { value: 9,  label: 'M3',  name: { ua: 'Маєґашіра 3',  en: 'Maegashira 3'  } },
  { value: 10, label: 'M1',  name: { ua: 'Маєґашіра 1',  en: 'Maegashira 1'  } },
  { value: 11, label: 'K',   name: { ua: 'Комусубі',     en: 'Komusubi'      } },
  { value: 12, label: 'S',   name: { ua: 'Секіваке',     en: 'Sekiwake'      } },
  { value: 13, label: 'O',   name: { ua: 'Озекі',        en: 'Ozeki'         } },
  { value: 14, label: 'Y',   name: { ua: 'Йокодзуна',    en: 'Yokozuna'      } },
]

const RANK_COLORS = {
  14: '#b8860b',
  13: '#1a6b5c',
  12: '#1a4a7a',
  11: '#8e44ad',
}

function getRankColor(value) {
  return RANK_COLORS[value] || 'var(--mid)'
}

function buildDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, ...rank, id: `${suit}-${rank.value}` })
    }
  }
  return deck
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getWinner(a, b) {
  // Йокодзуна програє найменшій карті (value=2) — кінбоші
  if (a.value === 14 && b.value === 2) return 'b'
  if (b.value === 14 && a.value === 2) return 'a'
  if (a.value > b.value) return 'a'
  if (b.value > a.value) return 'b'
  return 'tie'
}

function Card({ card, hidden, small, lang }) {
  if (!card) return (
    <div style={{
      width: small ? 60 : 90, height: small ? 84 : 126,
      borderRadius: 6, background: 'var(--bg2)',
      border: '1px dashed var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ color: 'var(--light)', fontSize: '0.6rem', fontFamily: 'monospace' }}>—</span>
    </div>
  )

  if (hidden) return (
    <div style={{
      width: small ? 60 : 90, height: small ? 84 : 126,
      borderRadius: 6,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      border: '2px solid #b8860b',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      <span style={{ fontSize: small ? '1.2rem' : '1.8rem', opacity: 0.6 }}>相</span>
    </div>
  )

  const color = getRankColor(card.value)
  const isYokozuna = card.value === 14
  const isSanyaku = card.value >= 11

  return (
    <div style={{
      width: small ? 60 : 90,
      height: small ? 84 : 126,
      borderRadius: 6,
      background: isYokozuna ? 'linear-gradient(135deg, #2a1a00, #1a1000)' : 'var(--card)',
      border: `2px solid ${color}`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: small ? '4px' : '8px',
      boxShadow: isYokozuna ? `0 0 12px ${color}40` : '0 2px 6px rgba(0,0,0,0.2)',
      position: 'relative', overflow: 'hidden',
      cursor: 'default',
    }}>
      {/* Масть зверху зліва */}
      <div style={{
        position: 'absolute', top: small ? 3 : 5, left: small ? 3 : 5,
        fontSize: small ? '0.5rem' : '0.65rem', lineHeight: 1,
      }}>
        {card.suit}
      </div>

      {/* Ранг по центру */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 2,
      }}>
        <div style={{
          fontFamily: 'monospace',
          fontSize: small ? '0.9rem' : '1.3rem',
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}>
          {card.label}
        </div>
        {!small && (
          <div style={{
            fontFamily: 'monospace',
            fontSize: '0.45rem',
            color: isSanyaku ? color : 'var(--mid)',
            textAlign: 'center',
            lineHeight: 1.2,
            opacity: 0.8,
          }}>
            {lang === 'en' ? card.name.en : card.name.ua}
          </div>
        )}
      </div>

      {/* Масть знизу справа (перевернута) */}
      <div style={{
        position: 'absolute', bottom: small ? 3 : 5, right: small ? 3 : 5,
        fontSize: small ? '0.5rem' : '0.65rem', lineHeight: 1,
        transform: 'rotate(180deg)',
      }}>
        {card.suit}
      </div>
    </div>
  )
}

function DeckCounter({ count, label, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <div style={{
        fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800,
        color: color || 'var(--ink)',
      }}>
        {count}
      </div>
      <div style={{
        fontFamily: 'monospace', fontSize: '0.55rem',
        color: 'var(--mid)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>
        {label}
      </div>
    </div>
  )
}

export default function YushoGame({ onClose, lang = 'uk' }) {
  const [phase, setPhase] = useState('intro') // intro | playing | roundResult | gameOver
  const [playerDeck, setPlayerDeck] = useState([])
  const [cpuDeck, setCpuDeck] = useState([])
  const [playerCard, setPlayerCard] = useState(null)
  const [cpuCard, setCpuCard] = useState(null)
  const [roundResult, setRoundResult] = useState(null) // 'player' | 'cpu' | 'tie'
  const [tieStack, setTieStack] = useState([])
  const [round, setRound] = useState(0)
  const [isKinboshi, setIsKinboshi] = useState(false)
  const [animating, setAnimating] = useState(false)

  const t = {
    title:      lang === 'en' ? 'Yusho' : 'Юшо',
    subtitle:   lang === 'en' ? 'Collect all 52 cards to win!' : 'Зберіть всі 52 карти — і юшо ваше!',
    start:      lang === 'en' ? 'Start Game' : 'Почати гру',
    flip:       lang === 'en' ? 'Flip card' : 'Відкрити карту',
    next:       lang === 'en' ? 'Next round' : 'Наступний раунд',
    youWin:     lang === 'en' ? 'You win the round!' : 'Ви виграли раунд!',
    cpuWins:    lang === 'en' ? 'CPU wins the round!' : 'Суперник виграв раунд!',
    tie:        lang === 'en' ? 'Tie! Cards go to stake.' : 'Нічия! Карти йдуть на кін.',
    kinboshi:   lang === 'en' ? '⭐ Kinboshi! Maegashira beats Yokozuna!' : '⭐ Кінбоші! Маєґашіра б\'є Йокодзуну!',
    youWinGame: lang === 'en' ? '🏆 Yusho! You win!' : '🏆 Юшо! Ви перемогли!',
    cpuWinGame: lang === 'en' ? 'Make-koshi. CPU wins.' : 'Маке-коші. Суперник переміг.',
    playAgain:  lang === 'en' ? 'Rematch' : 'Реванш',
    close:      lang === 'en' ? 'Close' : 'Закрити',
    yourCards:  lang === 'en' ? 'Your cards' : 'Ваші карти',
    cpuCards:   lang === 'en' ? 'CPU cards' : 'Карти суперника',
    stake:      lang === 'en' ? 'Stake' : 'На кону',
    round:      lang === 'en' ? 'Round' : 'Раунд',
    rules:      lang === 'en'
      ? 'Higher rank wins · Yokozuna (Y) loses to Maegashira 17 (M17) — Kinboshi!'
      : 'Вищий ранг б\'є нижчий · Йокодзуна (Y) програє Маєґашірі 17 (M17) — Кінбоші!',
  }

  function startGame() {
    const deck = shuffle(buildDeck())
    setPlayerDeck(deck.slice(0, 26))
    setCpuDeck(deck.slice(26))
    setPlayerCard(null)
    setCpuCard(null)
    setRoundResult(null)
    setTieStack([])
    setRound(0)
    setIsKinboshi(false)
    setPhase('playing')
  }

  function flipCards() {
    if (animating) return
    setAnimating(true)

    const pCard = playerDeck[0]
    const cCard = cpuDeck[0]
    const newPlayerDeck = playerDeck.slice(1)
    const newCpuDeck = cpuDeck.slice(1)

    setPlayerCard(pCard)
    setCpuCard(cCard)
    setRound(r => r + 1)

    const result = getWinner(pCard, cCard)
    const kinboshi = (pCard.value === 2 && cCard.value === 14) || (cCard.value === 2 && pCard.value === 14)
    setIsKinboshi(kinboshi)

    setTimeout(() => {
      const stake = [...tieStack, pCard, cCard]

      if (result === 'tie') {
        setTieStack(stake)
        setPlayerDeck(newPlayerDeck)
        setCpuDeck(newCpuDeck)
        setRoundResult('tie')
      } else if (result === 'a') {
        setPlayerDeck(shuffle([...newPlayerDeck, ...stake]))
        setCpuDeck(newCpuDeck)
        setRoundResult('player')
        setTieStack([])
      } else {
        setCpuDeck(shuffle([...newCpuDeck, ...stake]))
        setPlayerDeck(newPlayerDeck)
        setRoundResult('cpu')
        setTieStack([])
      }

      setAnimating(false)

      // Перевірка кінця гри
      const finalPlayerCount = result === 'a'
        ? newPlayerDeck.length + stake.length
        : newPlayerDeck.length
      const finalCpuCount = result === 'b'
        ? newCpuDeck.length + stake.length
        : newCpuDeck.length

      if (finalPlayerCount === 0 || finalCpuCount === 52) {
        setTimeout(() => setPhase('gameOver'), 800)
      } else if (finalCpuCount === 0 || finalPlayerCount === 52) {
        setTimeout(() => setPhase('gameOver'), 800)
      }
    }, 400)
  }

  const playerCount = playerDeck.length + (playerCard && roundResult !== null ? (roundResult === 'player' ? 2 : roundResult === 'tie' ? 0 : 0) : 0)
  const cpuCount = cpuDeck.length
  const playerWon = playerDeck.length >= 52 || cpuDeck.length === 0

  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0,
      background:'rgba(0,0,0,0.9)',
      zIndex:2000,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'1rem',
      backdropFilter:'blur(4px)',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--card)',
        border:'1px solid var(--border)',
        borderRadius:4,
        maxWidth:480, width:'100%',
        overflow:'hidden',
        maxHeight:'90vh',
        display:'flex', flexDirection:'column',
      }}>
        {/* Header */}
        <div style={{
          borderBottom:'1px solid var(--border)',
          padding:'0.75rem 1rem',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexShrink:0,
        }}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <span style={{fontSize:'1.1rem'}}>🃏</span>
            <div style={{fontFamily:'monospace', fontSize:'0.72rem', letterSpacing:'0.15em', textTransform:'uppercase', color:'var(--mid)'}}>
              {t.title}
            </div>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.1rem',cursor:'pointer'}}>
            {'✕'}
          </button>
        </div>

        <div style={{flex:1, overflowY:'auto', padding:'1.25rem'}}>

          {/* INTRO */}
          {phase === 'intro' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'3rem', marginBottom:'1rem'}}>🃏</div>
              <div style={{fontFamily:'Georgia,serif', fontSize:'1.4rem', fontWeight:800, color:'#b8860b', marginBottom:'0.5rem'}}>
                {t.title}
              </div>
              <div style={{fontFamily:'monospace', fontSize:'0.72rem', color:'var(--mid)', marginBottom:'1.5rem', lineHeight:1.6}}>
                {t.subtitle}
              </div>

              {/* Правила */}
              <div style={{background:'var(--bg2)', borderRadius:2, padding:'1rem', marginBottom:'1.5rem', textAlign:'left'}}>
                <div style={{fontFamily:'monospace', fontSize:'0.6rem', color:'var(--mid)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'0.75rem'}}>
                  {lang === 'en' ? 'Rules' : 'Правила'}
                </div>
                {[
                  lang === 'en' ? '52 cards split equally between you and CPU' : '52 карти діляться порівну між вами і суперником',
                  lang === 'en' ? 'Both flip a card — higher rank wins both' : 'Обидва відкривають по карті — вищий ранг бере обидві',
                  lang === 'en' ? 'Ranks: M17 < M15 < ... < M1 < K < S < O < Y' : 'Ранги: M17 < M15 < ... < M1 < К < С < О < Й',
                  lang === 'en' ? 'Kinboshi: M17 beats Yokozuna!' : 'Кінбоші: М17 б\'є Йокодзуну!',
                  lang === 'en' ? 'Tie: cards go to stake, next round winner takes all' : 'Нічия: карти на кін, наступний раунд бере все',
                  lang === 'en' ? 'Collect all 52 — Yusho!' : 'Зберіть всі 52 — Юшо!',
                ].map((rule, i) => (
                  <div key={i} style={{display:'flex', gap:8, marginBottom:4, alignItems:'flex-start'}}>
                    <span style={{fontFamily:'monospace', fontSize:'0.6rem', color:'#b8860b', flexShrink:0}}>{'›'}</span>
                    <span style={{fontFamily:'monospace', fontSize:'0.65rem', color:'var(--ink)', lineHeight:1.4}}>{rule}</span>
                  </div>
                ))}
              </div>

              <button onClick={startGame} style={{
                background:'#b8860b', color:'#fff', border:'none',
                borderRadius:2, padding:'0.75rem 2rem',
                fontFamily:'monospace', fontSize:'0.8rem',
                letterSpacing:'0.1em', cursor:'pointer', fontWeight:700,
              }}>
                {t.start}
              </button>
            </div>
          )}

          {/* PLAYING */}
          {phase === 'playing' && (
            <div>
              {/* Лічильники */}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem'}}>
                <DeckCounter count={playerDeck.length} label={t.yourCards} color='#1a6b5c' />
                {tieStack.length > 0 && (
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:'monospace', fontSize:'0.8rem', fontWeight:700, color:'#b8860b'}}>{tieStack.length}</div>
                    <div style={{fontFamily:'monospace', fontSize:'0.52rem', color:'#b8860b', textTransform:'uppercase'}}>{t.stake}</div>
                  </div>
                )}
                <DeckCounter count={cpuDeck.length} label={t.cpuCards} color='#c0392b' />
              </div>

              {/* Прогрес-бар */}
              <div style={{height:4, background:'var(--bg2)', borderRadius:2, marginBottom:'1.25rem', overflow:'hidden'}}>
                <div style={{
                  height:'100%',
                  width:`${(playerDeck.length / 52) * 100}%`,
                  background:'#1a6b5c', borderRadius:2,
                  transition:'width 0.3s',
                }} />
              </div>

              {/* Карти */}
              <div style={{display:'flex', justifyContent:'space-around', alignItems:'center', marginBottom:'1.25rem', gap:16}}>
                {/* Гравець */}
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'monospace', fontSize:'0.58rem', color:'var(--mid)', marginBottom:6, textTransform:'uppercase'}}>
                    {lang === 'en' ? 'You' : 'Ви'}
                  </div>
                  <Card card={playerCard} hidden={false} lang={lang} />
                </div>

                {/* VS */}
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'monospace', fontSize:'0.65rem', color:'var(--light)'}}>vs</div>
                  {round > 0 && (
                    <div style={{fontFamily:'monospace', fontSize:'0.52rem', color:'var(--light)', marginTop:4}}>
                      #{round}
                    </div>
                  )}
                </div>

                {/* CPU */}
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:'monospace', fontSize:'0.58rem', color:'var(--mid)', marginBottom:6, textTransform:'uppercase'}}>
                    CPU
                  </div>
                  <Card card={cpuCard} hidden={cpuCard === null} lang={lang} />
                </div>
              </div>

              {/* Результат раунду */}
              {roundResult && (
                <div style={{
                  textAlign:'center', marginBottom:'1rem',
                  padding:'0.6rem',
                  background: roundResult === 'player' ? 'rgba(26,107,92,0.15)' : roundResult === 'cpu' ? 'rgba(192,57,43,0.1)' : 'rgba(184,134,11,0.1)',
                  borderRadius:2,
                  border: `1px solid ${roundResult === 'player' ? 'rgba(26,107,92,0.4)' : roundResult === 'cpu' ? 'rgba(192,57,43,0.3)' : 'rgba(184,134,11,0.3)'}`,
                }}>
                  {isKinboshi && (
                    <div style={{fontFamily:'monospace', fontSize:'0.7rem', color:'#b8860b', fontWeight:700, marginBottom:4}}>
                      {t.kinboshi}
                    </div>
                  )}
                  <div style={{fontFamily:'monospace', fontSize:'0.75rem', fontWeight:600,
                    color: roundResult === 'player' ? '#1a6b5c' : roundResult === 'cpu' ? '#c0392b' : '#b8860b',
                  }}>
                    {roundResult === 'player' ? t.youWin : roundResult === 'cpu' ? t.cpuWins : t.tie}
                  </div>
                </div>
              )}

              {/* Кнопка */}
              <button
                onClick={flipCards}
                disabled={animating}
                style={{
                  width:'100%',
                  background: animating ? 'var(--bg2)' : 'var(--ink)',
                  color: animating ? 'var(--mid)' : 'var(--bg)',
                  border:'none', borderRadius:2,
                  padding:'0.75rem',
                  fontFamily:'monospace', fontSize:'0.8rem',
                  letterSpacing:'0.1em', cursor: animating ? 'default' : 'pointer',
                  fontWeight:700,
                  transition:'all 0.2s',
                }}
              >
                {roundResult ? t.next : t.flip}
              </button>
            </div>
          )}

          {/* GAME OVER */}
          {phase === 'gameOver' && (
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'3rem', marginBottom:'0.75rem'}}>
                {playerWon ? '🏆' : '💪'}
              </div>
              <div style={{
                fontFamily:'Georgia,serif', fontSize:'1.6rem', fontWeight:800,
                color: playerWon ? '#b8860b' : '#c0392b',
                marginBottom:'0.5rem',
              }}>
                {playerWon ? t.youWinGame : t.cpuWinGame}
              </div>
              <div style={{fontFamily:'monospace', fontSize:'0.65rem', color:'var(--mid)', marginBottom:'1.5rem'}}>
                {lang === 'en' ? `${round} rounds played` : `Зіграно ${round} раундів`}
              </div>

              <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                <button onClick={startGame} style={{
                  background:'var(--ink)', color:'var(--bg)', border:'none',
                  borderRadius:2, padding:'0.6rem 1.5rem',
                  fontFamily:'monospace', fontSize:'0.72rem',
                  letterSpacing:'0.1em', cursor:'pointer',
                }}>
                  {t.playAgain}
                </button>
                <button onClick={onClose} style={{
                  background:'var(--bg2)', color:'var(--mid)',
                  border:'1px solid var(--border)', borderRadius:2,
                  padding:'0.6rem 1.5rem',
                  fontFamily:'monospace', fontSize:'0.72rem',
                  letterSpacing:'0.1em', cursor:'pointer',
                }}>
                  {t.close}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer — правила */}
        {phase === 'playing' && (
          <div style={{
            borderTop:'1px solid var(--border)',
            padding:'0.5rem 1rem',
            fontFamily:'monospace', fontSize:'0.55rem',
            color:'var(--light)', lineHeight:1.4,
            flexShrink:0,
          }}>
            {t.rules}
          </div>
        )}
      </div>
    </div>
  )
}
