'use client'

import { useState, useEffect, useRef } from 'react'
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

const MAEGASHIRA = [
  ...Array.from({length:17}, (_,i) => ({
    id:`Me${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}e`,
    atk: Math.max(1, 4-Math.floor(i/4)), def: Math.max(1, 4-Math.floor(i/5)), color:'var(--mid)',
  })),
  ...Array.from({length:17}, (_,i) => ({
    id:`Mw${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}w`,
    atk: Math.max(1, 4-Math.floor(i/4)), def: Math.max(1, 3-Math.floor(i/6)), color:'var(--mid)',
  })),
]

const HEAL_CARDS = [
  { id:'H1', type:'heal', heal:5,  label:'+5 HP', color:'#c0392b', emoji:'🩹' },
  { id:'H2', type:'heal', heal:5,  label:'+5 HP', color:'#c0392b', emoji:'🩹' },
  { id:'H3', type:'heal', heal:5,  label:'+5 HP', color:'#c0392b', emoji:'🩹' },
  { id:'H4', type:'heal', heal:7,  label:'+7 HP', color:'#e74c3c', emoji:'💊' },
  { id:'H5', type:'heal', heal:7,  label:'+7 HP', color:'#e74c3c', emoji:'💊' },
  { id:'H6', type:'heal', heal:10, label:'+10 HP', color:'#922b21', emoji:'❤️‍🔥' },
]

const FULL_DECK = [...RIKISHI_CARDS, ...MAEGASHIRA, ...HEAL_CARDS]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]]
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
  const rikishi = hand.filter(c => c.type==='rikishi')
  if (rikishi.length===0) return hand[0]
  return rikishi.sort((a,b) => (b.atk+b.def)-(a.atk+a.def))[0]
}

function resolveRound(pCard, oCard, pHp, oHp) {
  let newPHp=pHp, newOHp=oHp
  const logs=[]
  if (pCard.type==='heal') {
    const h=Math.min(MAX_HP,pHp+pCard.heal)-pHp
    newPHp=Math.min(MAX_HP,pHp+pCard.heal)
    logs.push({text:`You: +${h} HP`,color:'#1a6b5c'})
  }
  if (oCard.type==='heal') {
    const h=Math.min(MAX_HP,oHp+oCard.heal)-oHp
    newOHp=Math.min(MAX_HP,oHp+oCard.heal)
    logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})
  }
  if (pCard.type==='rikishi'&&oCard.type==='rikishi') {
    const pDmg=Math.max(0,pCard.atk-oCard.def)
    const oDmg=Math.max(0,oCard.atk-pCard.def)
    newOHp=Math.max(0,newOHp-pDmg)
    newPHp=Math.max(0,newPHp-oDmg)
    if (pDmg>0) logs.push({text:`${pCard.rankShort} → ${pDmg} dmg`,color:'#1a6b5c'})
    if (oDmg>0) logs.push({text:`${oCard.rankShort} → ${oDmg} dmg`,color:'#c0392b'})
    if (pDmg===0&&oDmg===0) logs.push({text:'Both blocked!',color:'var(--mid)'})
  }
  if (pCard.type==='rikishi'&&oCard.type==='heal') {
    newOHp=Math.max(0,newOHp-pCard.atk)
    logs.push({text:`${pCard.rankShort} → ${pCard.atk} dmg (unblocked)`,color:'#1a6b5c'})
  }
  if (pCard.type==='heal'&&oCard.type==='rikishi') {
    newPHp=Math.max(0,newPHp-oCard.atk)
    logs.push({text:`${oCard.rankShort} → ${oCard.atk} dmg (unblocked)`,color:'#c0392b'})
  }
  const pDmgT=pCard.type==='rikishi'?Math.max(0,pCard.atk-(oCard.type==='rikishi'?oCard.def:0)):0
  const oDmgT=oCard.type==='rikishi'?Math.max(0,oCard.atk-(pCard.type==='rikishi'?pCard.def:0)):0
  const roundWinner=pDmgT>oDmgT?'p':oDmgT>pDmgT?'o':'tie'
  return {newPHp,newOHp,logs,roundWinner}
}

const ANIM_STYLES=`
@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes clash{0%{transform:translateX(0)}30%{transform:translateX(14px)}60%{transform:translateX(-8px)}100%{transform:translateX(0)}}
@keyframes clashR{0%{transform:translateX(0)}30%{transform:translateX(-14px)}60%{transform:translateX(8px)}100%{transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
`

function HPBar({hp}) {
  const pct=Math.max(0,(hp/MAX_HP)*100)
  const color=pct>60?'#1a6b5c':pct>30?'#b8860b':'#c0392b'
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
        <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>HP</span>
        <span style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,color}}>{hp}/{MAX_HP}</span>
      </div>
      <div style={{height:8,background:'var(--bg2)',borderRadius:4,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:4,transition:'width 0.6s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
    </div>
  )
}

function GameCard({card,selected,onClick,disabled,small,showBack}) {
  if (!card) return null
  if (showBack) return (
    <div style={{width:small?72:96,height:small?100:134,borderRadius:8,background:'linear-gradient(135deg,#1a1a2e,#0f3460)',border:'2px solid #b8860b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:'1.4rem',opacity:0.5}}>相</span>
    </div>
  )
  const isHeal=card.type==='heal'
  const color=isHeal?card.color:(card.color||'var(--mid)')
  return (
    <div onClick={disabled?undefined:onClick} style={{
      width:small?72:96,height:small?100:134,borderRadius:8,
      border:`2px solid ${selected?'#b8860b':color}`,
      background:selected?'rgba(184,134,11,0.2)':'var(--card)',
      cursor:disabled?'default':'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',
      padding:small?'5px 4px':'8px 6px',
      boxShadow:selected?'0 0 16px rgba(184,134,11,0.6)':'none',
      transition:'all 0.18s',opacity:disabled?0.6:1,
      transform:selected?'translateY(-10px) scale(1.04)':'none',flexShrink:0,
    }}>
      {isHeal?(
        <>
          <div style={{fontSize:small?'1.2rem':'1.6rem'}}>{card.emoji}</div>
          <div style={{fontFamily:'monospace',fontSize:small?'0.72rem':'0.85rem',fontWeight:800,color:card.color}}>{card.label}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.55rem',color:'var(--mid)'}}>Heal</div>
        </>
      ):(
        <>
          <div style={{fontFamily:'monospace',fontSize:small?'0.62rem':'0.75rem',color,fontWeight:700,lineHeight:1,textAlign:'center'}}>{card.rankShort}</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
            <div style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{fontSize:'0.55rem',color:'#e74c3c'}}>⚔</span>
              <span style={{fontFamily:'monospace',fontSize:small?'0.9rem':'1.05rem',fontWeight:800,color:'#e74c3c'}}>{card.atk}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{fontSize:'0.55rem',color:'#3498db'}}>🛡</span>
              <span style={{fontFamily:'monospace',fontSize:small?'0.9rem':'1.05rem',fontWeight:800,color:'#3498db'}}>{card.def}</span>
            </div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.5rem',color:'var(--light)',textAlign:'center'}}>{card.rank}</div>
        </>
      )}
    </div>
  )
}

function RoundResult({myCard,oppCard,roundLog,myLabel,oppLabel,onNext,roundNum,lang}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [step,setStep]=useState(0)
  useEffect(()=>{
    const t1=setTimeout(()=>setStep(1),100)
    const t2=setTimeout(()=>setStep(2),700)
    const t3=setTimeout(()=>setStep(3),1000)
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
  },[])
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-around',alignItems:'center',marginBottom:'1.25rem',gap:16,opacity:step>=1?1:0,transition:'opacity 0.3s'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{myLabel}</div>
          <div style={{animation:step>=1?'clash 0.5s ease 0.2s both':'none'}}><GameCard card={myCard} disabled/></div>
        </div>
        <div style={{fontFamily:'Georgia,serif',fontSize:'1.3rem',fontWeight:800,color:'#b8860b',animation:step>=1?'pop 0.4s ease 0.4s both':'none'}}>VS</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{oppLabel}</div>
          <div style={{animation:step>=1?'clashR 0.5s ease 0.2s both':'none'}}><GameCard card={oppCard} disabled/></div>
        </div>
      </div>
      <div style={{background:'var(--bg2)',borderRadius:4,padding:'1rem',marginBottom:'1rem',opacity:step>=2?1:0,transform:step>=2?'none':'translateY(8px)',transition:'all 0.3s'}}>
        {roundLog.length===0
          ?<div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>—</div>
          :roundLog.map((l,i)=>(
            <div key={i} style={{fontFamily:'monospace',fontSize:'0.78rem',color:l.color,lineHeight:1.8,animation:`fadeIn 0.3s ease ${0.1*i}s both`}}>{l.text}</div>
          ))
        }
      </div>
      <button onClick={onNext} style={{width:'100%',padding:'0.8rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,opacity:step>=3?1:0,transform:step>=3?'none':'translateY(8px)',transition:'all 0.3s'}}>
        {roundNum>=MAX_ROUNDS?t('Результат','Results'):t('Наступний раунд ›','Next round ›')}
      </button>
    </div>
  )
}

function BattleLayout({myHp,oppHp,myWins,oppWins,roundNum,myLabel,oppLabel,myHand,oppHand,playerSelected,onSelect,myReady,oppReady,onSubmit,roundLog,phase,onNext,lang,myCard,oppCard}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const isRoundResult=phase==='roundResult'
  const deduped=arr=>[...new Map(arr.filter(Boolean).map(c=>[c.id,c])).values()]
  return (
    <div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.78rem',color:'var(--mid)'}}>{t('Раунд','Round')} {roundNum}/{MAX_ROUNDS}</div>
        <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>{myWins}–{oppWins}</div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1.25rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{myLabel}</div>
          <HPBar hp={myHp}/>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#c0392b',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{oppLabel}</div>
          <HPBar hp={oppHp}/>
        </div>
      </div>
      {isRoundResult?(
        <RoundResult myCard={myCard} oppCard={oppCard} roundLog={roundLog} myLabel={myLabel} oppLabel={oppLabel} onNext={onNext} roundNum={roundNum} lang={lang}/>
      ):(
        <>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.08em'}}>
              {t('Ваша рука','Your hand')} ({deduped(myHand).length})
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {deduped(myHand).map((c,i)=>(
                <div key={c.id} style={{animation:`slideIn 0.2s ease ${i*0.05}s both`}}>
                  <GameCard card={c} selected={playerSelected?.id===c.id} onClick={()=>!myReady&&onSelect(c)} disabled={myReady}/>
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.08em'}}>
              {oppLabel} ({oppHand})
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Array.from({length:Math.min(oppHand,8)}).map((_,i)=>(
                <div key={i} style={{animation:`slideIn 0.2s ease ${i*0.04}s both`}}>
                  <GameCard card={FULL_DECK[0]} showBack small/>
                </div>
              ))}
            </div>
          </div>
          {oppReady&&!myReady&&(
            <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'#1a6b5c',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>
              ✓ {t('Суперник готовий','Opponent ready')}
            </div>
          )}
          {myReady&&(
            <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>
              ⏳ {t('Очікуємо суперника...','Waiting for opponent...')}
            </div>
          )}
          <button onClick={onSubmit} disabled={!playerSelected||myReady} style={{
            width:'100%',padding:'0.8rem',
            background:(!playerSelected||myReady)?'var(--bg2)':'#b8860b',
            color:(!playerSelected||myReady)?'var(--mid)':'#fff',
            border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.85rem',
            letterSpacing:'0.1em',cursor:(!playerSelected||myReady)?'default':'pointer',fontWeight:700,
          }}>
            {myReady?t('Підтверджено ✓','Confirmed ✓'):!playerSelected?t('Оберіть карту','Select a card'):t('⚔ Підтвердити','⚔ Confirm')}
          </button>
        </>
      )}
    </div>
  )
}

function GameOverScreen({myHp,oppHp,myWins,oppWins,myLabel,oppLabel,onBack,lang}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const playerWon=myHp>oppHp||(myHp>0&&oppHp<=0)
  const isKachiKoshi=myWins>oppWins
  const ties=MAX_ROUNDS-myWins-oppWins
  return (
    <div style={{textAlign:'center',animation:'slideIn 0.3s ease'}}>
      <div style={{fontSize:'3.5rem',marginBottom:'0.5rem',animation:'pop 0.5s ease'}}>{playerWon?'🏆':'💪'}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:800,color:playerWon?'#b8860b':'#c0392b',marginBottom:'0.75rem'}}>
        {playerWon?t('Юшо! Ви перемогли!','Yusho! You win!'):t('Маке-коші.','Make-koshi.')}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'1rem 0'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:6}}>{myLabel} HP</div>
          <HPBar hp={myHp}/>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#c0392b',marginBottom:6}}>{oppLabel} HP</div>
          <HPBar hp={oppHp}/>
        </div>
      </div>
      <div style={{background:'var(--bg2)',padding:'1rem',borderRadius:4,marginBottom:'1.25rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginBottom:6}}>{t('Раунди','Rounds')}: {myWins}W – {oppWins}L – {ties}D</div>
        <div style={{fontFamily:'monospace',fontSize:'1rem',fontWeight:800,color:isKachiKoshi?'#1a6b5c':'#c0392b'}}>
          {isKachiKoshi?'勝ち越し Kachi-koshi':'負け越し Make-koshi'}
        </div>
      </div>
      <button onClick={onBack} style={{background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,padding:'0.8rem 2.5rem',fontFamily:'monospace',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>
        {t('В меню','Menu')}
      </button>
    </div>
  )
}

// ── CPU режим ──────────────────────────────────────────────
function CpuGame({lang,onBack}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [phase,setPhase]=useState('draft')
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)
  const [playerHand,setPlayerHand]=useState([])
  const [cpuHand,setCpuHand]=useState([])
  const [drawPile,setDrawPile]=useState([])
  const [playerHp,setPlayerHp]=useState(MAX_HP)
  const [cpuHp,setCpuHp]=useState(MAX_HP)
  const [playerSelected,setPlayerSelected]=useState(null)
  const [lastMyCard,setLastMyCard]=useState(null)
  const [lastOppCard,setLastOppCard]=useState(null)
  const [roundLog,setRoundLog]=useState([])
  const [roundNum,setRoundNum]=useState(0)
  const [playerWins,setPlayerWins]=useState(0)
  const [cpuWins,setCpuWins]=useState(0)

  useEffect(()=>{
    const shuffled=shuffle(FULL_DECK)
    const cpuCards=shuffle(shuffled.slice(0,30)).slice(0,5)
    setCpuHand(cpuCards)
    const remaining=shuffled.filter(c=>!cpuCards.find(cc=>cc.id===c.id))
    setDrawPile(remaining)
    setDraftPool(remaining.slice(0,5))
  },[])

  function pickDraft(card) {
    const newHand=[...playerHand,card]
    const newDraw=drawPile.filter(c=>!draftPool.find(d=>d.id===c.id))
    if (draftRound<4) {
      setPlayerHand(newHand);setDrawPile(newDraw)
      setDraftPool(newDraw.slice(0,5));setDraftRound(r=>r+1)
    } else {
      setPlayerHand(newHand);setDrawPile(newDraw);setPhase('battle')
    }
  }

  function fight() {
    if (!playerSelected) return
    const cCard=cpuChooseCard(cpuHand)
    setLastMyCard(playerSelected);setLastOppCard(cCard)
    const {newPHp,newOHp,logs,roundWinner}=resolveRound(playerSelected,cCard,playerHp,cpuHp)
    setPlayerHp(newPHp);setCpuHp(newOHp);setRoundLog(logs)
    if (roundWinner==='p') setPlayerWins(w=>w+1)
    else if (roundWinner==='o') setCpuWins(w=>w+1)
    let newPH=playerHand.filter(c=>c.id!==playerSelected.id)
    let newCH=cpuHand.filter(c=>c.id!==cCard.id)
    let newDraw=drawPile
    if (newDraw.length>0){newPH=[...newPH,newDraw[0]];newDraw=newDraw.slice(1)}
    if (newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
    setPlayerHand(newPH);setCpuHand(newCH);setDrawPile(newDraw)
    setPhase('roundResult')
  }

  function nextRound() {
    const nr=roundNum+1
    setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    if (nr>=MAX_ROUNDS||playerHand.length===0) setPhase('gameOver')
    else setPhase('battle')
  }

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem',cursor:'pointer',marginBottom:'1rem',padding:0}}>
        ‹ {t('Назад','Back')}
      </button>
      {phase==='draft'&&(
        <div style={{animation:'slideIn 0.25s ease'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',textAlign:'center',marginBottom:'1.25rem'}}>{t('Раунд','Round')} {draftRound+1}/5</div>
          {playerHand.length>0&&(
            <div style={{marginBottom:'1.25rem'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length}/5)</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled/>)}</div>
            </div>
          )}
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {draftPool.map((c,i)=>(
              <div key={c.id} style={{animation:`pop 0.3s ease ${i*0.06}s both`}}>
                <GameCard card={c} onClick={()=>pickDraft(c)}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {(phase==='battle'||phase==='roundResult')&&(
        <BattleLayout
          myHp={playerHp} oppHp={cpuHp} myWins={playerWins} oppWins={cpuWins}
          roundNum={roundNum+1} myLabel={t('Ви','You')} oppLabel="CPU"
          myHand={playerHand} oppHand={cpuHand.length}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={false} oppReady={false} onSubmit={fight}
          roundLog={roundLog} phase={phase} onNext={nextRound}
          myCard={lastMyCard} oppCard={lastOppCard} lang={lang}
        />
      )}
      {phase==='gameOver'&&(
        <GameOverScreen myHp={playerHp} oppHp={cpuHp} myWins={playerWins} oppWins={cpuWins} myLabel={t('Ви','You')} oppLabel="CPU" onBack={onBack} lang={lang}/>
      )}
    </div>
  )
}

// ── Мультиплеєр ────────────────────────────────────────────
function MultiGame({lang,onBack}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [screen,setScreen]=useState('lobby')
  const [role,setRole]=useState(null)
  const [sessionId,setSessionId]=useState('')
  const [inputCode,setInputCode]=useState('')
  const [error,setError]=useState('')
  const [session,setSession]=useState(null)
  const [playerHand,setPlayerHand]=useState([])
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)
  const [playerSelected,setPlayerSelected]=useState(null)
  const [roundNum,setRoundNum]=useState(0)
  const [submitting,setSubmitting]=useState(false)

  const roleRef=useRef(null)
  const sessionIdRef=useRef('')
  const processingRef=useRef(false)

  // Listener — тільки sessionId в залежностях
  useEffect(()=>{
    if (!sessionId) return
    const dbRef=ref(db,`clash/${sessionId}`)
    const unsub=onValue(dbRef, snap=>{
      const data=snap.val()
      if (!data) return
      setSession(data)

      // Host розраховує раунд через окрему async функцію
      if (
        roleRef.current==='host' &&
        !processingRef.current &&
        !data.processing &&
        data.status==='battle' &&
        data.p1?.ready===true &&
        data.p2?.ready===true &&
        data.p1?.selectedCard &&
        data.p2?.selectedCard
      ) {
 processingRef.current=true
        doResolveRound(data, sessionIdRef.current)
          .then(()=>{ processingRef.current=false })
          .catch(()=>{ processingRef.current=false })
      }
    })
    return ()=>off(dbRef)
  },[sessionId])

  async function doResolveRound(data, sid) {
    // Атомарно блокуємо повторний запуск через Firebase
    await update(ref(db, `clash/${sid}`), { processing: true })

    const p1Card=getCardById(data.p1.selectedCard)
    const p2Card=getCardById(data.p2.selectedCard)
    if (!p1Card||!p2Card) return

    const {newPHp,newOHp,logs,roundWinner}=resolveRound(p1Card,p2Card,data.p1.hp,data.p2.hp)
    const newRound=(data.roundNum||0)+1

    const usedIds=new Set([data.p1.selectedCard,data.p2.selectedCard])
    const deckArr=(data.deck||[]).map(id=>getCardById(id)).filter(Boolean)
    const p1HandFiltered=(data.p1.hand||[]).filter(id=>id!==data.p1.selectedCard)
    const p2HandFiltered=(data.p2.hand||[]).filter(id=>id!==data.p2.selectedCard)
    const drawRemaining=deckArr.filter(c=>
      !usedIds.has(c.id)&&!p1HandFiltered.includes(c.id)&&!p2HandFiltered.includes(c.id)
    )

    let fp1=[...p1HandFiltered],fp2=[...p2HandFiltered]
    if (drawRemaining.length>0) fp1=[...fp1,drawRemaining[0].id]
    if (drawRemaining.length>1) fp2=[...fp2,drawRemaining[1].id]

    const isOver=newRound>=MAX_ROUNDS||fp1.length===0||fp2.length===0

    await update(ref(db),{
      [`clash/${sid}/p1/hp`]:newPHp,
      [`clash/${sid}/p2/hp`]:newOHp,
      [`clash/${sid}/p1/hand`]:fp1,
      [`clash/${sid}/p2/hand`]:fp2,
      [`clash/${sid}/p1/wins`]:(data.p1.wins||0)+(roundWinner==='p'?1:0),
      [`clash/${sid}/p2/wins`]:(data.p2.wins||0)+(roundWinner==='o'?1:0),
      [`clash/${sid}/p1/ready`]:false,
      [`clash/${sid}/p2/ready`]:false,
      [`clash/${sid}/lastCards`]:{p1:data.p1.selectedCard,p2:data.p2.selectedCard},
      [`clash/${sid}/p1/selectedCard`]:null,
      [`clash/${sid}/p2/selectedCard`]:null,
      [`clash/${sid}/roundNum`]:newRound,
      [`clash/${sid}/roundLog`]:logs,
      [`clash/${sid}/status`]:isOver?'gameOver':'roundResult',
      [`clash/${sid}/processing`]: false,
    })
  }

  // Синхронізація екрану
  useEffect(()=>{
    if (!session||!role) return
    const mk=role==='host'?'p1':'p2'
    const status=session.status

    if (status==='waiting'&&role==='host'&&session.p2?.joined) {
      update(ref(db,`clash/${sessionId}`),{status:'draft'})
    }
    if (status==='draft'&&screen==='waiting') {
      setDraftPool((session[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean))
      setDraftRound(session[mk]?.draftRound||0)
      setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean))
      setScreen('draft')
    }
    if (status==='battle'&&(screen==='draft'||screen==='roundResult')) {
      setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean))
      setPlayerSelected(null)
      setSubmitting(false)
      setRoundNum(session.roundNum||0)
      setScreen('battle')
    }
    if (status==='roundResult'&&screen==='battle') {
      setScreen('roundResult')
    }
    if (status==='gameOver'&&screen!=='gameOver') {
      setScreen('gameOver')
    }
  },[session?.status,session?.roundNum,session?.p2?.joined])

  async function createSession() {
    const code=generateCode()
    const shuffled=shuffle(FULL_DECK)
    const ids=shuffled.map(c=>c.id)
    await set(ref(db,`clash/${code}`),{
      status:'waiting', deck:ids,
      roundNum:0, roundLog:[], lastCards:null,
      p1:{joined:true,hp:MAX_HP,hand:[],draftPool:ids.slice(0,5),draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null},
      p2:{joined:false,hp:MAX_HP,hand:[],draftPool:ids.slice(5,10),draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null},
    })
    roleRef.current='host'
    sessionIdRef.current=code
    setRole('host')
    setSessionId(code)
    setScreen('waiting')
  }

  async function joinSession() {
    const code=inputCode.toUpperCase().trim()
    if (!code) return
    const snap=await get(ref(db,`clash/${code}`))
    if (!snap.exists()){setError(t('Сесію не знайдено','Session not found'));return}
    const data=snap.val()
    if (data.p2?.joined){setError(t('Гра вже заповнена','Game is full'));return}
    await update(ref(db,`clash/${code}/p2`),{joined:true,hp:MAX_HP,hand:[],wins:0,ready:false,draftDone:false,selectedCard:null})
    roleRef.current='guest'
    sessionIdRef.current=code
    setRole('guest')
    setSessionId(code)
    setScreen('waiting')
  }

  async function pickDraft(card) {
    const snap=await get(ref(db,`clash/${sessionId}`))
    const data=snap.val()
    const mk=role==='host'?'p1':'p2'
    const myData=data[mk]
    const currentHand=[...new Set([...(myData.hand||[]),card.id])]
    const newDraftRound=(myData.draftRound||0)+1
    const isDone=newDraftRound>=5

    // p1: пули на позиціях 0,10,20,30,40
    // p2: пули на позиціях 5,15,25,35,45
    const deck=data.deck
    const baseOffset=role==='host'?0:5
    const nextPoolStart=baseOffset+newDraftRound*10

    let updates={
      [`clash/${sessionId}/${mk}/hand`]:currentHand,
      [`clash/${sessionId}/${mk}/draftRound`]:newDraftRound,
      [`clash/${sessionId}/${mk}/draftDone`]:isDone,
    }
    if (!isDone&&nextPoolStart+5<=deck.length) {
      updates[`clash/${sessionId}/${mk}/draftPool`]=deck.slice(nextPoolStart,nextPoolStart+5)
    }
    await update(ref(db),updates)

    setPlayerHand(currentHand.map(id=>getCardById(id)).filter(Boolean))
    setDraftRound(newDraftRound)

    const otherKey=role==='host'?'p2':'p1'
    if (isDone&&data[otherKey]?.draftDone) {
      await update(ref(db,`clash/${sessionId}`),{status:'battle'})
    }
    if (!isDone&&nextPoolStart+5<=deck.length) {
      setDraftPool(deck.slice(nextPoolStart,nextPoolStart+5).map(id=>getCardById(id)).filter(Boolean))
    }
  }

  async function submitCard() {
    if (!playerSelected||submitting) return
    setSubmitting(true)
    const mk=role==='host'?'p1':'p2'
    await update(ref(db,`clash/${sessionId}/${mk}`),{
      selectedCard:playerSelected.id,
      ready:true,
    })
  }

  const mk=role==='host'?'p1':'p2'
  const ok=role==='host'?'p2':'p1'
  const myHp=session?.[mk]?.hp??MAX_HP
  const oppHp=session?.[ok]?.hp??MAX_HP
  const myWins=session?.[mk]?.wins??0
  const oppWins=session?.[ok]?.wins??0
  const myReady=session?.[mk]?.ready??false
  const oppReady=session?.[ok]?.ready??false
  const totalRounds=session?.roundNum??0
  const oppHandCount=(session?.[ok]?.hand||[]).length
  const myHandCards=playerHand.length>0?playerHand:(session?.[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean)
  const myDraftPool=draftPool.length>0?draftPool:(session?.[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean)
  const lastCards=session?.lastCards
  const myLastCard=lastCards?getCardById(lastCards[mk]):null
  const oppLastCard=lastCards?getCardById(lastCards[ok]):null

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem',cursor:'pointer',marginBottom:'1rem',padding:0}}>
        ‹ {t('Назад','Back')}
      </button>

      {screen==='lobby'&&(
        <div style={{textAlign:'center',animation:'slideIn 0.25s ease'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>🌐</div>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,marginBottom:'1.5rem'}}>{t('Мультиплеєр','Multiplayer')}</div>
          <button onClick={createSession} style={{width:'100%',padding:'0.8rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.8rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,marginBottom:'1rem'}}>
            {t('Створити гру','Create game')}
          </button>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.75rem'}}>{t('або','or')}</div>
          <div style={{display:'flex',gap:8,marginBottom:'0.5rem'}}>
            <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} placeholder={t('Код сесії...','Session code...')} maxLength={6}
              style={{flex:1,padding:'0.65rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'monospace',fontSize:'0.9rem',borderRadius:4,outline:'none',letterSpacing:'0.2em',textTransform:'uppercase'}}/>
            <button onClick={joinSession} style={{padding:'0.65rem 1.25rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.78rem',cursor:'pointer',fontWeight:700}}>
              {t('Приєднатись','Join')}
            </button>
          </div>
          {error&&<div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'#c0392b',marginTop:4}}>{error}</div>}
        </div>
      )}

      {screen==='waiting'&&(
        <div style={{textAlign:'center',paddingTop:'2rem',animation:'slideIn 0.25s ease'}}>
          <div style={{fontSize:'2rem',marginBottom:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳</div>
          <div style={{fontFamily:'monospace',fontSize:'0.8rem',color:'var(--mid)',marginBottom:'1.5rem'}}>
            {role==='host'?t('Очікуємо суперника...','Waiting for opponent...'):t('Підключаємось...','Connecting...')}
          </div>
          {role==='host'&&(
            <div style={{background:'var(--bg2)',padding:'1.5rem',borderRadius:4,display:'inline-block',animation:'pop 0.4s ease'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{t('Код сесії','Session code')}</div>
              <div style={{fontFamily:'monospace',fontSize:'2.8rem',fontWeight:800,color:'#b8860b',letterSpacing:'0.35em'}}>{sessionId}</div>
            </div>
          )}
        </div>
      )}

      {screen==='draft'&&(
        <div style={{animation:'slideIn 0.25s ease'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',textAlign:'center',marginBottom:'1.25rem'}}>{t('Раунд','Round')} {draftRound+1}/5</div>
          {myHandCards.length>0&&(
            <div style={{marginBottom:'1.25rem'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({myHandCards.length})</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[...new Map(myHandCards.filter(Boolean).map(c=>[c.id,c])).values()].map(c=>(
                  <GameCard key={c.id} card={c} small disabled/>
                ))}
              </div>
            </div>
          )}
          {!session?.[mk]?.draftDone?(
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              {myDraftPool.map((c,i)=>c&&(
                <div key={c.id} style={{animation:`pop 0.3s ease ${i*0.06}s both`}}>
                  <GameCard card={c} onClick={()=>pickDraft(c)}/>
                </div>
              ))}
            </div>
          ):(
            <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',textAlign:'center',marginTop:'1rem',animation:'pulse 1.5s ease infinite'}}>
              ⏳ {t('Очікуємо суперника...','Waiting for opponent...')}
            </div>
          )}
        </div>
      )}

      {(screen==='battle'||screen==='roundResult')&&(
        <BattleLayout
          myHp={myHp} oppHp={oppHp} myWins={myWins} oppWins={oppWins}
          roundNum={totalRounds+1} myLabel={t('Ви','You')} oppLabel={t('Суперник','Opponent')}
          myHand={myHandCards} oppHand={oppHandCount}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={myReady} oppReady={oppReady} onSubmit={submitCard}
          roundLog={session?.roundLog||[]} phase={screen}
          onNext={async ()=>{
            if (role==='host') {
                await update(ref(db,`clash/${sessionId}`),{status:'battle'})
            }
            }}
          myCard={myLastCard} oppCard={oppLastCard} lang={lang}
        />
      )}

      {screen==='gameOver'&&(
        <GameOverScreen myHp={myHp} oppHp={oppHp} myWins={myWins} oppWins={oppWins} myLabel={t('Ви','You')} oppLabel={t('Суперник','Opponent')} onBack={onBack} lang={lang}/>
      )}
    </div>
  )
}

// ── Головний компонент ─────────────────────────────────────
export default function SumoClash({onClose,lang='uk'}) {
  const [mode,setMode]=useState('menu')
  const t=(uk,en)=>lang==='en'?en:uk
  return (
    <>
      <style>{ANIM_STYLES}</style>
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem',backdropFilter:'blur(4px)'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,maxWidth:960,width:'100%',maxHeight:'96vh',display:'flex',flexDirection:'column',overflow:'hidden',animation:'pop 0.3s ease'}}>
          <div style={{borderBottom:'1px solid var(--border)',padding:'0.8rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span>⚔️</span>
              <span style={{fontFamily:'monospace',fontSize:'0.8rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)'}}>{t('Сумо Клеш','Sumo Clash')}</span>
              {mode!=='menu'&&<span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--light)'}}>· {mode==='cpu'?'vs CPU':t('Мультиплеєр','Multiplayer')}</span>}
            </div>
            <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.3rem',cursor:'pointer',lineHeight:1}}>✕</button>
          </div>
          {mode==='menu'&&(
            <div style={{flex:1,padding:'2rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1.25rem',animation:'slideIn 0.3s ease'}}>
              <div style={{fontSize:'2.8rem',animation:'pop 0.4s ease'}}>⚔️</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:800,color:'#b8860b'}}>{t('Сумо Клеш','Sumo Clash')}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',textAlign:'center',lineHeight:1.7,marginBottom:'0.5rem'}}>
                {t('15 раундів · Драфт · ATK vs DEF · HP битва','15 rounds · Draft · ATK vs DEF · HP battle')}
              </div>
              <button onClick={()=>setMode('cpu')} style={{width:'100%',maxWidth:320,padding:'0.9rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.88rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🤖 {t('Проти CPU','vs CPU')}
              </button>
              <button onClick={()=>setMode('multi')} style={{width:'100%',maxWidth:320,padding:'0.9rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.88rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🌐 {t('Мультиплеєр','Multiplayer')}
              </button>
            </div>
          )}
          {mode==='cpu'&&<CpuGame lang={lang} onBack={()=>setMode('menu')}/>}
          {mode==='multi'&&<MultiGame lang={lang} onBack={()=>setMode('menu')}/>}
        </div>
      </div>
    </>
  )
}
