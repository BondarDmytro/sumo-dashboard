'use client'

import { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { ref, set, get, onValue, update, off } from 'firebase/database'

const MAX_HP = 50
const MAX_ROUNDS = 15
const DRAFT_ROUNDS = 5
const DRAFT_POOL_SIZE = 3

// ── Картки ─────────────────────────────────────────────────
const RIKISHI_CARDS = [
  { id:'Y1', type:'rikishi', rank:'Yokozuna', rankShort:'Y1e', atk:10, def:7, color:'#b8860b' },
  { id:'Y2', type:'rikishi', rank:'Yokozuna', rankShort:'Y1w', atk:9,  def:8, color:'#b8860b' },
  { id:'O1', type:'rikishi', rank:'Ozeki',    rankShort:'O1e', atk:8,  def:6, color:'#1a6b5c' },
  { id:'O2', type:'rikishi', rank:'Ozeki',    rankShort:'O1w', atk:7,  def:7, color:'#1a6b5c' },
  { id:'O3', type:'rikishi', rank:'Ozeki',    rankShort:'O2e', atk:7,  def:6, color:'#1a6b5c' },
  { id:'O4', type:'rikishi', rank:'Ozeki',    rankShort:'O2w', atk:8,  def:5, color:'#1a6b5c' },
  { id:'S1', type:'rikishi', rank:'Sekiwake', rankShort:'S1e', atk:7,  def:5, color:'#1a4a7a' },
  { id:'S2', type:'rikishi', rank:'Sekiwake', rankShort:'S1w', atk:6,  def:6, color:'#1a4a7a' },
  { id:'S3', type:'rikishi', rank:'Sekiwake', rankShort:'S2e', atk:6,  def:5, color:'#1a4a7a' },
  { id:'S4', type:'rikishi', rank:'Sekiwake', rankShort:'S2w', atk:7,  def:4, color:'#1a4a7a' },
  { id:'S5', type:'rikishi', rank:'Sekiwake', rankShort:'S3e', atk:5,  def:6, color:'#1a4a7a' },
  { id:'S6', type:'rikishi', rank:'Sekiwake', rankShort:'S3w', atk:6,  def:4, color:'#1a4a7a' },
  { id:'K1', type:'rikishi', rank:'Komusubi', rankShort:'K1e', atk:6,  def:4, color:'#6b3fa0' },
  { id:'K2', type:'rikishi', rank:'Komusubi', rankShort:'K1w', atk:5,  def:5, color:'#6b3fa0' },
  { id:'K3', type:'rikishi', rank:'Komusubi', rankShort:'K2e', atk:5,  def:4, color:'#6b3fa0' },
  { id:'K4', type:'rikishi', rank:'Komusubi', rankShort:'K2w', atk:6,  def:3, color:'#6b3fa0' },
  { id:'K5', type:'rikishi', rank:'Komusubi', rankShort:'K3e', atk:4,  def:5, color:'#6b3fa0' },
  { id:'K6', type:'rikishi', rank:'Komusubi', rankShort:'K3w', atk:5,  def:3, color:'#6b3fa0' },
  { id:'K7', type:'rikishi', rank:'Komusubi', rankShort:'K4e', atk:4,  def:4, color:'#6b3fa0' },
  { id:'K8', type:'rikishi', rank:'Komusubi', rankShort:'K4w', atk:5,  def:4, color:'#6b3fa0' },
]
const MAEGASHIRA = [
  ...Array.from({length:17},(_,i)=>({ id:`Me${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}e`, atk:Math.max(1,4-Math.floor(i/4)), def:Math.max(1,3-Math.floor(i/5)), color:'var(--mid)' })),
  ...Array.from({length:17},(_,i)=>({ id:`Mw${i+1}`, type:'rikishi', rank:'Maegashira', rankShort:`M${i+1}w`, atk:Math.max(1,4-Math.floor(i/4)), def:Math.max(1,3-Math.floor(i/6)), color:'var(--mid)' })),
]
const HEAL_CARDS = [
  { id:'H1', type:'heal', heal:5,  label:'Вода переможця', labelEn:'Victor\'s Water', color:'#c0392b', emoji:'💧' },
  { id:'H2', type:'heal', heal:5,  label:'Вода переможця', labelEn:'Victor\'s Water', color:'#c0392b', emoji:'💧' },
  { id:'H3', type:'heal', heal:5,  label:'Вода переможця', labelEn:'Victor\'s Water', color:'#c0392b', emoji:'💧' },
  { id:'H4', type:'heal', heal:7,  label:'+7 HP',          labelEn:'+7 HP',           color:'#e74c3c', emoji:'💊' },
  { id:'H5', type:'heal', heal:7,  label:'+7 HP',          labelEn:'+7 HP',           color:'#e74c3c', emoji:'💊' },
  { id:'H6', type:'heal', heal:10, label:'Сіль Дохьо',     labelEn:'Dohyo Salt',      color:'#922b21', emoji:'🧂' },
]
const ARMOR_CARDS = [
  { id:'Ar1', type:'armor', armor:5,  label:'Бойова стійка', labelEn:'Battle Stance', color:'#2980b9', emoji:'🛡' },
  { id:'Ar2', type:'armor', armor:5,  label:'Бойова стійка', labelEn:'Battle Stance', color:'#2980b9', emoji:'🛡' },
  { id:'Ar3', type:'armor', armor:10, label:'Маваші',        labelEn:'Mawashi',        color:'#1a5276', emoji:'🥋' },
  { id:'Ar4', type:'armor', armor:10, label:'Маваші',        labelEn:'Mawashi',        color:'#1a5276', emoji:'🥋' },
]
const STRIKE_CARDS = [
  { id:'St1', type:'strike', damage:5,  label:'Тачіай',   labelEn:'Tachiai',   color:'#e67e22', emoji:'👊' },
  { id:'St2', type:'strike', damage:5,  label:'Тачіай',   labelEn:'Tachiai',   color:'#e67e22', emoji:'👊' },
  { id:'St3', type:'strike', damage:10, label:'Харітете', labelEn:'Harite',    color:'#c0392b', emoji:'🤜' },
  { id:'St4', type:'strike', damage:10, label:'Харітете', labelEn:'Harite',    color:'#c0392b', emoji:'🤜' },
]
const SWAP_CARDS = [
  { id:'Sw1', type:'swap', label:'Заміна', labelEn:'Swap', color:'#27ae60', emoji:'🔄' },
  { id:'Sw2', type:'swap', label:'Заміна', labelEn:'Swap', color:'#27ae60', emoji:'🔄' },
  { id:'Sw3', type:'swap', label:'Заміна', labelEn:'Swap', color:'#27ae60', emoji:'🔄' },
  { id:'Sw4', type:'swap', label:'Заміна', labelEn:'Swap', color:'#27ae60', emoji:'🔄' },
]
const SALT_CARDS = [
  { id:'Sa1', type:'salt', label:'Сіль в обличчя', labelEn:'Salt Throw', color:'#95a5a6', emoji:'🧂' },
]
const HENKA_CARDS = [
  { id:'He1', type:'henka', label:'Хенка', labelEn:'Henka', color:'#8e44ad', emoji:'🌀' },
]

const FULL_DECK = [...RIKISHI_CARDS, ...MAEGASHIRA, ...HEAL_CARDS, ...ARMOR_CARDS, ...STRIKE_CARDS, ...SWAP_CARDS, ...SALT_CARDS, ...HENKA_CARDS]

function shuffle(arr) {
  const a=[...arr]
  for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a
}
function generateCode() { return Math.random().toString(36).slice(2,8).toUpperCase() }
function getCardById(id) { return FULL_DECK.find(c=>c.id===id) }
function getLabel(card,lang) { return lang==='en'?(card.labelEn||card.label):card.label }

function cpuChooseCard(hand, oppSkipped) {
  if (oppSkipped) {
    // Якщо суперник пропускає — CPU може хілитись або броня
    const safe = hand.filter(c=>['heal','armor','swap'].includes(c.type))
    if (safe.length>0) return safe[0]
  }
  const strikes=hand.filter(c=>c.type==='strike')
  if(strikes.length>0) return strikes.sort((a,b)=>b.damage-a.damage)[0]
  const rikishi=hand.filter(c=>c.type==='rikishi')
  if(rikishi.length>0) return rikishi.sort((a,b)=>(b.atk+b.def)-(a.atk+a.def))[0]
  const heals=hand.filter(c=>c.type==='heal')
  if(heals.length>0) return heals[0]
  return hand[0]
}

function resolveRound(pCard, oCard, pHp, oHp, pArmor, oArmor, pSkipped, oSkipped) {
  let nPHp=pHp, nOHp=oHp, nPAr=pArmor, nOAr=oArmor
  const logs=[]
  let pHenka=pCard?.type==='henka'
  let oHenka=oCard?.type==='henka'

  // Якщо гравець пропускає — його карта не грає
  const pEffective = pSkipped ? null : pCard
  const oEffective = oSkipped ? null : oCard

  function applyDmg(dmg,hp,armor,label,isOpp) {
    let nHp=hp, nAr=armor
    if(dmg<=0) return {nHp,nAr}
    if(nAr>=dmg){nAr-=dmg;logs.push({text:`${label}: ${dmg} blocked by armor`,color:'#2980b9'})}
    else if(nAr>0){const rem=dmg-nAr;nHp=Math.max(0,nHp-rem);logs.push({text:`${label}: ${dmg} dmg (${nAr} armor, ${rem} HP)`,color:isOpp?'#c0392b':'#1a6b5c'});nAr=0}
    else{nHp=Math.max(0,nHp-dmg);logs.push({text:`${label}: ${dmg} dmg`,color:isOpp?'#c0392b':'#1a6b5c'})}
    return {nHp,nAr}
  }

  if(pSkipped) logs.push({text:'You: skipped (Salt Throw)',color:'#95a5a6'})
  if(oSkipped) logs.push({text:'Opp: skipped (Salt Throw)',color:'#95a5a6'})

  // Хенка — блокує атаки суперника
  if(pHenka&&!oHenka) {
    if(oEffective?.type==='rikishi'||oEffective?.type==='strike') {
      logs.push({text:'You: Henka! Dodged opponent attack!',color:'#8e44ad'})
      // Суперник атакує але шкоди немає — обробляємо інші ефекти суперника
      if(oEffective?.type==='heal'){const h=Math.min(MAX_HP,oHp+oEffective.heal)-oHp;nOHp=Math.min(MAX_HP,oHp+oEffective.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
      if(oEffective?.type==='armor'){nOAr+=oEffective.armor;logs.push({text:`Opp: +${oEffective.armor} armor`,color:'#2980b9'})}
      const roundWinner='tie'
      return {newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner,pNextSkip:false,oNextSkip:false}
    }
  }
  if(oHenka&&!pHenka) {
    if(pEffective?.type==='rikishi'||pEffective?.type==='strike') {
      logs.push({text:'Opp: Henka! Dodged your attack!',color:'#8e44ad'})
      if(pEffective?.type==='heal'){const h=Math.min(MAX_HP,pHp+pEffective.heal)-pHp;nPHp=Math.min(MAX_HP,pHp+pEffective.heal);logs.push({text:`You: +${h} HP`,color:'#1a6b5c'})}
      if(pEffective?.type==='armor'){nPAr+=pEffective.armor;logs.push({text:`You: +${pEffective.armor} armor`,color:'#2980b9'})}
      const roundWinner='tie'
      return {newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner,pNextSkip:false,oNextSkip:false}
    }
  }

  // Сіль — суперник пропускає наступний хід
  let pNextSkip=false, oNextSkip=false
  if(pEffective?.type==='salt'){oNextSkip=true;logs.push({text:'You: 🧂 Salt Throw! Opponent skips next turn!',color:'#95a5a6'})}
  if(oEffective?.type==='salt'){pNextSkip=true;logs.push({text:'Opp: 🧂 Salt Throw! You skip next turn!',color:'#95a5a6'})}

  // Хіл
  if(pEffective?.type==='heal'){const h=Math.min(MAX_HP,nPHp+pEffective.heal)-nPHp;nPHp=Math.min(MAX_HP,nPHp+pEffective.heal);logs.push({text:`You: +${h} HP`,color:'#1a6b5c'})}
  if(oEffective?.type==='heal'){const h=Math.min(MAX_HP,nOHp+oEffective.heal)-nOHp;nOHp=Math.min(MAX_HP,nOHp+oEffective.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
  // Броня
  if(pEffective?.type==='armor'){nPAr+=pEffective.armor;logs.push({text:`You: +${pEffective.armor} armor`,color:'#2980b9'})}
  if(oEffective?.type==='armor'){nOAr+=oEffective.armor;logs.push({text:`Opp: +${oEffective.armor} armor`,color:'#2980b9'})}
  // Удар
  if(pEffective?.type==='strike'){nOHp=Math.max(0,nOHp-pEffective.damage);logs.push({text:`You: ⚡ ${pEffective.damage} direct dmg`,color:'#e67e22'})}
  if(oEffective?.type==='strike'){nPHp=Math.max(0,nPHp-oEffective.damage);logs.push({text:`Opp: ⚡ ${oEffective.damage} direct dmg`,color:'#e67e22'})}
  // Рікіші vs рікіші
  if(pEffective?.type==='rikishi'&&oEffective?.type==='rikishi'){
    const pDmg=Math.max(0,pEffective.atk-oEffective.def)
    const oDmg=Math.max(0,oEffective.atk-pEffective.def)
    if(oDmg>0){const r=applyDmg(oDmg,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr}
    if(pDmg>0){const r=applyDmg(pDmg,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr}
    if(pDmg===0&&oDmg===0) logs.push({text:'Both blocked!',color:'var(--mid)'})
  }
  if(pEffective?.type==='rikishi'&&oEffective?.type&&!['rikishi'].includes(oEffective.type)){
    const r=applyDmg(pEffective.atk,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr
  }
  if(oEffective?.type==='rikishi'&&pEffective?.type&&!['rikishi'].includes(pEffective.type)){
    const r=applyDmg(oEffective.atk,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr
  }
  if(pEffective?.type==='rikishi'&&!oEffective){
    const r=applyDmg(pEffective.atk,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr
  }
  if(oEffective?.type==='rikishi'&&!pEffective){
    const r=applyDmg(oEffective.atk,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr
  }

  const pDmgT=pEffective?.type==='rikishi'?Math.max(0,pEffective.atk-(oEffective?.type==='rikishi'?oEffective.def:0)):pEffective?.type==='strike'?pEffective.damage:0
  const oDmgT=oEffective?.type==='rikishi'?Math.max(0,oEffective.atk-(pEffective?.type==='rikishi'?pEffective.def:0)):oEffective?.type==='strike'?oEffective.damage:0
  const roundWinner=pDmgT>oDmgT?'p':oDmgT>pDmgT?'o':'tie'
  return {newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner,pNextSkip,oNextSkip}
}

// ── Web Audio ───────────────────────────────────────────────
function createAudioContext() {
  if(typeof window==='undefined') return null
  return new (window.AudioContext||window.webkitAudioContext)()
}

function playSound(ctx, type) {
  if(!ctx) return
  try {
    const now=ctx.currentTime
    const g=ctx.createGain()
    g.connect(ctx.destination)
    if(type==='clash'){
      // Удар тайко
      const o=ctx.createOscillator()
      const g2=ctx.createGain()
      o.connect(g2);g2.connect(ctx.destination)
      o.frequency.setValueAtTime(120,now)
      o.frequency.exponentialRampToValueAtTime(40,now+0.15)
      g2.gain.setValueAtTime(0.6,now)
      g2.gain.exponentialRampToValueAtTime(0.001,now+0.3)
      o.start(now);o.stop(now+0.3)
      // Шум
      const buf=ctx.createBuffer(1,ctx.sampleRate*0.1,ctx.sampleRate)
      const d=buf.getChannelData(0)
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3
      const s=ctx.createBufferSource();s.buffer=buf
      const gn=ctx.createGain();gn.gain.setValueAtTime(0.3,now);gn.gain.exponentialRampToValueAtTime(0.001,now+0.1)
      s.connect(gn);gn.connect(ctx.destination);s.start(now)
    } else if(type==='heal'){
      // Дзвіночок
      [523,659,784].forEach((freq,i)=>{
        const o=ctx.createOscillator();const gn=ctx.createGain()
        o.connect(gn);gn.connect(ctx.destination)
        o.type='sine';o.frequency.value=freq
        gn.gain.setValueAtTime(0,now+i*0.08)
        gn.gain.linearRampToValueAtTime(0.2,now+i*0.08+0.02)
        gn.gain.exponentialRampToValueAtTime(0.001,now+i*0.08+0.3)
        o.start(now+i*0.08);o.stop(now+i*0.08+0.3)
      })
    } else if(type==='armor'){
      // Металевий звук
      [400,600,800].forEach((freq,i)=>{
        const o=ctx.createOscillator();const gn=ctx.createGain()
        o.connect(gn);gn.connect(ctx.destination)
        o.type='square';o.frequency.value=freq
        gn.gain.setValueAtTime(0.15,now+i*0.03)
        gn.gain.exponentialRampToValueAtTime(0.001,now+i*0.03+0.15)
        o.start(now+i*0.03);o.stop(now+i*0.03+0.15)
      })
    } else if(type==='strike'){
      // Різкий удар
      const o=ctx.createOscillator();const gn=ctx.createGain()
      o.connect(gn);gn.connect(ctx.destination)
      o.type='sawtooth';o.frequency.setValueAtTime(300,now)
      o.frequency.exponentialRampToValueAtTime(80,now+0.1)
      gn.gain.setValueAtTime(0.5,now);gn.gain.exponentialRampToValueAtTime(0.001,now+0.2)
      o.start(now);o.stop(now+0.2)
    } else if(type==='swap'){
      // Шелест
      const buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate)
      const d=buf.getChannelData(0)
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI)
      const s=ctx.createBufferSource();s.buffer=buf
      const gn=ctx.createGain();gn.gain.value=0.15
      s.connect(gn);gn.connect(ctx.destination);s.start(now)
    } else if(type==='salt'){
      // Сипучий звук
      const buf=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate)
      const d=buf.getChannelData(0)
      for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.4*(1-i/d.length)
      const s=ctx.createBufferSource();s.buffer=buf
      const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=2000
      s.connect(filter);filter.connect(ctx.destination);s.start(now)
    } else if(type==='henka'){
      // Свист відхилення
      const o=ctx.createOscillator();const gn=ctx.createGain()
      o.connect(gn);gn.connect(ctx.destination)
      o.type='sine';o.frequency.setValueAtTime(800,now)
      o.frequency.exponentialRampToValueAtTime(200,now+0.2)
      gn.gain.setValueAtTime(0.3,now);gn.gain.exponentialRampToValueAtTime(0.001,now+0.25)
      o.start(now);o.stop(now+0.25)
    } else if(type==='win'){
      // Фанфари
      const notes=[523,659,784,1047]
      notes.forEach((freq,i)=>{
        const o=ctx.createOscillator();const gn=ctx.createGain()
        o.connect(gn);gn.connect(ctx.destination)
        o.type='triangle';o.frequency.value=freq
        gn.gain.setValueAtTime(0,now+i*0.12)
        gn.gain.linearRampToValueAtTime(0.3,now+i*0.12+0.05)
        gn.gain.exponentialRampToValueAtTime(0.001,now+i*0.12+0.4)
        o.start(now+i*0.12);o.stop(now+i*0.12+0.4)
      })
    } else if(type==='lose'){
      const notes=[400,350,300]
      notes.forEach((freq,i)=>{
        const o=ctx.createOscillator();const gn=ctx.createGain()
        o.connect(gn);gn.connect(ctx.destination)
        o.type='sine';o.frequency.value=freq
        gn.gain.setValueAtTime(0.25,now+i*0.15)
        gn.gain.exponentialRampToValueAtTime(0.001,now+i*0.15+0.3)
        o.start(now+i*0.15);o.stop(now+i*0.15+0.3)
      })
    } else if(type==='click'){
      const o=ctx.createOscillator();const gn=ctx.createGain()
      o.connect(gn);gn.connect(ctx.destination)
      o.frequency.value=800;gn.gain.setValueAtTime(0.1,now)
      gn.gain.exponentialRampToValueAtTime(0.001,now+0.05)
      o.start(now);o.stop(now+0.05)
    }
  } catch(e){}
}

// Фонова музика — пентатонічна медитативна
function startBgMusic(ctx, gainNode) {
  if(!ctx||!gainNode) return null
  const scale=[220,247,277,330,370,440,494,554,659,740]
  let stopped=false
  let timeouts=[]
  function playNote(t) {
    if(stopped) return
    const freq=scale[Math.floor(Math.random()*scale.length)]
    const o=ctx.createOscillator()
    const g=ctx.createGain()
    o.connect(g);g.connect(gainNode)
    o.type=Math.random()>0.7?'triangle':'sine'
    o.frequency.value=freq
    const now=ctx.currentTime
    g.gain.setValueAtTime(0,now)
    g.gain.linearRampToValueAtTime(0.06,now+0.1)
    g.gain.setValueAtTime(0.06,now+t*0.4)
    g.gain.exponentialRampToValueAtTime(0.001,now+t*0.9)
    o.start(now);o.stop(now+t)
    const id=setTimeout(()=>playNote(0.8+Math.random()*1.2),(t*0.6)*1000)
    timeouts.push(id)
  }
  // Стартуємо кілька голосів
  for(let i=0;i<3;i++){
    const id=setTimeout(()=>playNote(1+Math.random()),i*600)
    timeouts.push(id)
  }
  return ()=>{stopped=true;timeouts.forEach(clearTimeout)}
}

// ── CSS анімації ────────────────────────────────────────────
const ANIM_STYLES=`
@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes clash{0%{transform:translateX(0)}30%{transform:translateX(14px)}60%{transform:translateX(-8px)}100%{transform:translateX(0)}}
@keyframes clashR{0%{transform:translateX(0)}30%{transform:translateX(-14px)}60%{transform:translateX(8px)}100%{transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
`

const CARD_TYPES_INFO=[
  {type:'rikishi',emoji:'⚔️',label:{uk:'Рікіші',en:'Rikishi'},desc:{uk:'Атакує суперника. ATK − DEF = шкода. Шкода б\'є броню першою.',en:'Attacks opponent. ATK − DEF = damage. Hits armor first.'}},
  {type:'heal',emoji:'💧',label:{uk:'Хіл',en:'Heal'},desc:{uk:'Відновлює HP. Вода переможця (+5) або Сіль Дохьо (+10).',en:'Restores HP. Victor\'s Water (+5) or Dohyo Salt (+10).'}},
  {type:'armor',emoji:'🛡',label:{uk:'Броня',en:'Armor'},desc:{uk:'Додає броню. Бойова стійка (+5) або Маваші (+10). Броня зберігається між раундами.',en:'Adds armor. Battle Stance (+5) or Mawashi (+10). Persists between rounds.'}},
  {type:'strike',emoji:'👊',label:{uk:'Удар',en:'Strike'},desc:{uk:'Пряма шкода по HP. Тачіай (-5) або Харітете (-10). Ігнорує броню!',en:'Direct HP damage. Tachiai (-5) or Harite (-10). Ignores armor!'}},
  {type:'swap',emoji:'🔄',label:{uk:'Заміна',en:'Swap'},desc:{uk:'Замінює карту з руки на нову з колоди. Потім обираєте карту для ходу.',en:'Swap a hand card for a new deck card. Then choose your card.'}},
  {type:'salt',emoji:'🧂',label:{uk:'Сіль в обличчя',en:'Salt Throw'},desc:{uk:'Суперник пропускає наступний хід — його карта не діє, але витрачається.',en:'Opponent skips next turn — their card has no effect but is discarded.'}},
  {type:'henka',emoji:'🌀',label:{uk:'Хенка',en:'Henka'},desc:{uk:'Якщо суперник атакує (рікіші або удар) — ви уникаєте шкоди. Не працює якщо суперник використав хіл/броню/заміну.',en:'If opponent attacks (rikishi or strike) — you dodge. No effect if opponent healed/armored/swapped.'}},
]

// ── UI компоненти ───────────────────────────────────────────
function HPBar({hp,armor=0}) {
  const pct=Math.max(0,(hp/MAX_HP)*100)
  const color=pct>60?'#1a6b5c':pct>30?'#b8860b':'#c0392b'
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)'}}>HP</span>
          <span style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,color}}>{hp}/{MAX_HP}</span>
        </div>
        {armor>0&&(
          <div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(41,128,185,0.15)',border:'1px solid rgba(41,128,185,0.4)',borderRadius:3,padding:'1px 7px'}}>
            <span style={{fontSize:'0.7rem'}}>🛡</span>
            <span style={{fontFamily:'monospace',fontSize:'0.75rem',fontWeight:700,color:'#2980b9'}}>{armor}</span>
          </div>
        )}
      </div>
      <div style={{height:8,background:'var(--bg2)',borderRadius:4,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:4,transition:'width 0.6s cubic-bezier(.4,0,.2,1)'}}/>
      </div>
    </div>
  )
}

function GameCard({card,selected,onClick,disabled,small,showBack,lang='uk'}) {
  if(!card) return null
  if(showBack) return (
    <div style={{width:small?64:90,height:small?90:126,borderRadius:8,background:'linear-gradient(135deg,#1a1a2e,#0f3460)',border:'2px solid #b8860b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:'1.2rem',opacity:0.5}}>相</span>
    </div>
  )
  const isRikishi=card.type==='rikishi'
  const color=card.color||(isRikishi?'var(--mid)':'#888')
  const lbl=getLabel(card,lang)
  return (
    <div onClick={disabled?undefined:onClick} style={{
      width:small?64:90,height:small?90:126,borderRadius:8,
      border:`2px solid ${selected?'#b8860b':color}`,
      background:selected?'rgba(184,134,11,0.15)':'var(--card)',
      cursor:disabled?'default':'pointer',
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'space-between',
      padding:small?'4px 3px':'7px 5px',
      boxShadow:selected?'0 0 16px rgba(184,134,11,0.6)':'none',
      transition:'all 0.18s',opacity:disabled?0.6:1,
      transform:selected?'translateY(-10px) scale(1.04)':'none',flexShrink:0,
    }}>
      {isRikishi?(
        <>
          <div style={{fontFamily:'monospace',fontSize:small?'0.58rem':'0.68rem',color,fontWeight:700,lineHeight:1,textAlign:'center'}}>{card.rankShort}</div>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
            <div style={{display:'flex',alignItems:'center',gap:2}}><span style={{fontSize:'0.5rem',color:'#e74c3c'}}>⚔</span><span style={{fontFamily:'monospace',fontSize:small?'0.85rem':'1rem',fontWeight:800,color:'#e74c3c'}}>{card.atk}</span></div>
            <div style={{display:'flex',alignItems:'center',gap:2}}><span style={{fontSize:'0.5rem',color:'#3498db'}}>🛡</span><span style={{fontFamily:'monospace',fontSize:small?'0.85rem':'1rem',fontWeight:800,color:'#3498db'}}>{card.def}</span></div>
          </div>
          <div style={{fontFamily:'monospace',fontSize:'0.42rem',color:'var(--light)',textAlign:'center'}}>{card.rank}</div>
        </>
      ):(
        <>
          <div style={{fontSize:small?'1rem':'1.4rem'}}>{card.emoji}</div>
          <div style={{fontFamily:'monospace',fontSize:small?'0.52rem':'0.62rem',fontWeight:800,color,textAlign:'center',lineHeight:1.2,wordBreak:'break-word',maxWidth:'100%'}}>{lbl}</div>
          <div style={{fontFamily:'monospace',fontSize:'0.4rem',color:'var(--mid)',textAlign:'center'}}>
            {card.type==='heal'?'Heal':card.type==='armor'?'Armor':card.type==='strike'?'Strike':card.type==='swap'?'Swap':card.type==='salt'?'Salt':card.type==='henka'?'Henka':''}
          </div>
        </>
      )}
    </div>
  )
}

function AudioControls({sfxOn,musicOn,onToggleSfx,onToggleMusic,lang}) {
  const t=(uk,en)=>lang==='en'?en:uk
  return (
    <div style={{display:'flex',gap:6,alignItems:'center'}}>
      <button onClick={onToggleSfx} title={t('Звуки','SFX')} style={{
        background:sfxOn?'rgba(184,134,11,0.2)':'var(--bg2)',
        border:`1px solid ${sfxOn?'#b8860b':'var(--border)'}`,
        color:sfxOn?'#b8860b':'var(--mid)',
        borderRadius:4,padding:'3px 8px',cursor:'pointer',
        fontFamily:'monospace',fontSize:'0.6rem',
      }}>
        {sfxOn?'🔊':'🔇'} {t('Звук','SFX')}
      </button>
      <button onClick={onToggleMusic} title={t('Музика','Music')} style={{
        background:musicOn?'rgba(184,134,11,0.2)':'var(--bg2)',
        border:`1px solid ${musicOn?'#b8860b':'var(--border)'}`,
        color:musicOn?'#b8860b':'var(--mid)',
        borderRadius:4,padding:'3px 8px',cursor:'pointer',
        fontFamily:'monospace',fontSize:'0.6rem',
      }}>
        {musicOn?'🎵':'🎵'} {t('Музика','Music')}
      </button>
    </div>
  )
}

function CardGuide({lang}) {
  const [open,setOpen]=useState(false)
  const t=(uk,en)=>lang==='en'?en:uk
  return (
    <div style={{marginBottom:'0.75rem'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.62rem',padding:'4px 10px',borderRadius:4,cursor:'pointer',letterSpacing:'0.05em'}}>
        {open?'▲':'▼'} {t('Типи карт','Card types')}
      </button>
      {open&&(
        <div style={{marginTop:6,background:'var(--bg2)',borderRadius:4,padding:'0.75rem',display:'flex',flexDirection:'column',gap:6,animation:'slideIn 0.2s ease'}}>
          {CARD_TYPES_INFO.map(ct=>(
            <div key={ct.type} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{fontSize:'1rem',flexShrink:0,width:22}}>{ct.emoji}</span>
              <div>
                <div style={{fontFamily:'monospace',fontSize:'0.65rem',fontWeight:700,color:'var(--ink)',marginBottom:1}}>{lang==='en'?ct.label.en:ct.label.uk}</div>
                <div style={{fontFamily:'monospace',fontSize:'0.58rem',color:'var(--mid)',lineHeight:1.4}}>{lang==='en'?ct.desc.en:ct.desc.uk}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SwapScreen({hand,drawOptions,onSwap,lang}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [selected,setSelected]=useState(null)
  return (
    <div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{fontFamily:'monospace',fontSize:'0.85rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>🔄 {t('Заміна карти','Card Swap')}</div>
      <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Оберіть карту з колоди','Choose a card from the deck')}</div>
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:'1.25rem'}}>
        {drawOptions.map((c,i)=>c&&(
          <div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}>
            <GameCard card={c} selected={selected?.id===c.id} onClick={()=>setSelected(c)} lang={lang}/>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:'1rem'}}>
        {hand.filter(c=>c.type!=='swap').map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}
        {selected&&<GameCard card={selected} small lang={lang}/>}
      </div>
      <button onClick={()=>selected&&onSwap(selected)} disabled={!selected} style={{width:'100%',padding:'0.75rem',background:selected?'#27ae60':'var(--bg2)',color:selected?'#fff':'var(--mid)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.82rem',letterSpacing:'0.1em',cursor:selected?'pointer':'default',fontWeight:700}}>
        {selected?t('Підтвердити','Confirm'):t('Оберіть карту','Select a card')}
      </button>
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
          <div style={{animation:step>=1?'clash 0.5s ease 0.2s both':'none'}}><GameCard card={myCard} disabled lang={lang}/></div>
        </div>
        <div style={{fontFamily:'Georgia,serif',fontSize:'1.3rem',fontWeight:800,color:'#b8860b',animation:step>=1?'pop 0.4s ease 0.4s both':'none'}}>VS</div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{oppLabel}</div>
          <div style={{animation:step>=1?'clashR 0.5s ease 0.2s both':'none'}}><GameCard card={oppCard} disabled lang={lang}/></div>
        </div>
      </div>
      <div style={{background:'var(--bg2)',borderRadius:4,padding:'1rem',marginBottom:'1rem',opacity:step>=2?1:0,transform:step>=2?'none':'translateY(8px)',transition:'all 0.3s'}}>
        {roundLog.length===0?<div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)'}}>—</div>
          :roundLog.map((l,i)=><div key={i} style={{fontFamily:'monospace',fontSize:'0.75rem',color:l.color,lineHeight:1.8,animation:`fadeIn 0.3s ease ${0.08*i}s both`}}>{l.text}</div>)
        }
      </div>
      <button onClick={onNext} style={{width:'100%',padding:'0.8rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,opacity:step>=3?1:0,transform:step>=3?'none':'translateY(8px)',transition:'all 0.3s'}}>
        {roundNum>=MAX_ROUNDS?t('Результат','Results'):t('Наступний раунд ›','Next round ›')}
      </button>
    </div>
  )
}

function BattleLayout({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,roundNum,myLabel,oppLabel,myHand,oppHand,playerSelected,onSelect,myReady,oppReady,onSubmit,roundLog,phase,onNext,lang,myCard,oppCard,drawPile,onSwapDone,mySkipped,sfx}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const isRoundResult=phase==='roundResult'
  const [swapping,setSwapping]=useState(false)
  const [swapOptions,setSwapOptions]=useState([])
  const deduped=arr=>[...new Map(arr.filter(Boolean).map(c=>[c.id,c])).values()]

  function activateSwap(){
    if(sfx) sfx('swap')
    const pool=drawPile.filter(c=>!myHand.find(h=>h.id===c.id)).slice(0,DRAFT_POOL_SIZE)
    setSwapOptions(pool);setSwapping(true)
  }
  function doSwap(card){setSwapping(false);onSwapDone(card)}

  if(swapping) return <SwapScreen hand={myHand} drawOptions={swapOptions} onSwap={doSwap} lang={lang}/>

  return (
    <div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.78rem',color:'var(--mid)'}}>{t('Раунд','Round')} {roundNum}/{MAX_ROUNDS}</div>
        <div style={{fontFamily:'monospace',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>{myWins}–{oppWins}</div>
      </div>
      {mySkipped&&(
        <div style={{background:'rgba(149,165,166,0.15)',border:'1px solid #95a5a6',borderRadius:4,padding:'0.5rem 0.75rem',marginBottom:'0.75rem',fontFamily:'monospace',fontSize:'0.72rem',color:'#95a5a6',textAlign:'center',animation:'pulse 1s ease 2'}}>
          🧂 {t('Ви пропускаєте цей хід!','You skip this turn!')}
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{myLabel}</div>
          <HPBar hp={myHp} armor={myArmor}/>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#c0392b',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{oppLabel}</div>
          <HPBar hp={oppHp} armor={oppArmor}/>
        </div>
      </div>
      {isRoundResult?(
        <RoundResult myCard={myCard} oppCard={oppCard} roundLog={roundLog} myLabel={myLabel} oppLabel={oppLabel} onNext={onNext} roundNum={roundNum} lang={lang}/>
      ):(
        <>
          <div style={{marginBottom:'0.75rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.08em'}}>
              {t('Ваша рука','Your hand')} ({deduped(myHand).length}) · {t('Колода','Deck')}: {drawPile.length}
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {deduped(myHand).map((c,i)=>(
                <div key={c.id} style={{animation:`slideIn 0.2s ease ${i*0.05}s both`,position:'relative'}}>
                  {c.type==='swap'&&!myReady?(
                    <>
                      <GameCard card={c} selected={false} onClick={activateSwap} disabled={myReady} lang={lang}/>
                      <div style={{position:'absolute',bottom:-16,left:'50%',transform:'translateX(-50%)',fontFamily:'monospace',fontSize:'0.42rem',color:'#27ae60',whiteSpace:'nowrap'}}>{t('активувати','tap')}</div>
                    </>
                  ):(
                    <GameCard card={c} selected={playerSelected?.id===c.id}
                      onClick={()=>{
                        if(!myReady&&c.type!=='swap'){
                          if(sfx) sfx('click')
                          onSelect(c)
                        }
                      }}
                      disabled={myReady||c.type==='swap'||mySkipped} lang={lang}/>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div style={{marginBottom:'0.75rem',marginTop:'0.5rem'}}>
            <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.08em'}}>{oppLabel} ({oppHand})</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {Array.from({length:Math.min(oppHand,8)}).map((_,i)=>(
                <div key={i} style={{animation:`slideIn 0.2s ease ${i*0.04}s both`}}>
                  <GameCard card={FULL_DECK[0]} showBack small/>
                </div>
              ))}
            </div>
          </div>
          {oppReady&&!myReady&&<div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'#1a6b5c',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>✓ {t('Суперник готовий','Opponent ready')}</div>}
          {myReady&&<div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting for opponent...')}</div>}
          <button
            onClick={()=>{if(sfx)sfx('click');onSubmit()}}
            disabled={(!playerSelected&&!mySkipped)||myReady}
            style={{
              width:'100%',padding:'0.8rem',
              background:((!playerSelected&&!mySkipped)||myReady)?'var(--bg2)':'#b8860b',
              color:((!playerSelected&&!mySkipped)||myReady)?'var(--mid)':'#fff',
              border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.85rem',
              letterSpacing:'0.1em',cursor:((!playerSelected&&!mySkipped)||myReady)?'default':'pointer',fontWeight:700,
            }}>
            {myReady?t('Підтверджено ✓','Confirmed ✓'):mySkipped?t('⏩ Пропустити хід','⏩ Skip turn'):!playerSelected?t('Оберіть карту','Select a card'):t('⚔ Підтвердити','⚔ Confirm')}
          </button>
        </>
      )}
    </div>
  )
}

function GameOverScreen({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,myLabel,oppLabel,onBack,lang,sfx}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const playerWon=myHp>oppHp||(myHp>0&&oppHp<=0)
  const isKachiKoshi=myWins>oppWins
  const ties=MAX_ROUNDS-myWins-oppWins
  const isKyujo=(oppHp<=0&&myHp>0)||(myHp<=0&&oppHp>0)
  useEffect(()=>{ if(sfx) sfx(playerWon?'win':'lose') },[])
  let title,subtitle
  if(isKyujo&&playerWon){title=t('Кюджо суперника!','Opponent Kyujo!');subtitle=t('Ви змусили суперника визнати кюджо і повернутися до стайні','You forced your opponent to withdraw — Kyujo!')}
  else if(isKyujo&&!playerWon){title=t('Кюджо!','Kyujo!');subtitle=t('Ви повертаєтесь до стайні відновлюватись після важкої поразки','You withdraw to your stable to recover after a heavy defeat.')}
  else if(playerWon){title=t('Юшо!','Yusho!');subtitle=t('Ви перемогли!','You win!')}
  else{title=t('Маке-коші','Make-koshi');subtitle=t('Суперник переміг.','Opponent wins.')}
  return (
    <div style={{textAlign:'center',animation:'slideIn 0.3s ease'}}>
      <div style={{fontSize:'3.5rem',marginBottom:'0.5rem',animation:'pop 0.5s ease'}}>{isKyujo&&playerWon?'🏆':isKyujo&&!playerWon?'🏥':playerWon?'🏆':'💪'}</div>
      <div style={{fontFamily:'Georgia,serif',fontSize:'1.4rem',fontWeight:800,color:playerWon?'#b8860b':'#c0392b',marginBottom:'0.5rem'}}>{title}</div>
      <div style={{fontFamily:'monospace',fontSize:'0.72rem',color:'var(--mid)',marginBottom:'1rem',lineHeight:1.5,padding:'0 1rem'}}>{subtitle}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'1rem 0'}}>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:4}}>{myLabel}</div>
          <HPBar hp={myHp} armor={myArmor}/>
        </div>
        <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'#c0392b',marginBottom:4}}>{oppLabel}</div>
          <HPBar hp={oppHp} armor={oppArmor}/>
        </div>
      </div>
      <div style={{background:'var(--bg2)',padding:'1rem',borderRadius:4,marginBottom:'1.25rem'}}>
        <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',marginBottom:6}}>{t('Раунди','Rounds')}: {myWins}W – {oppWins}L – {ties}D</div>
        <div style={{fontFamily:'monospace',fontSize:'1rem',fontWeight:800,color:isKachiKoshi?'#1a6b5c':'#c0392b'}}>{isKachiKoshi?'勝ち越し Kachi-koshi':'負け越し Make-koshi'}</div>
      </div>
      <button onClick={onBack} style={{background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,padding:'0.8rem 2.5rem',fontFamily:'monospace',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>{t('В меню','Menu')}</button>
    </div>
  )
}

// ── CPU гра ─────────────────────────────────────────────────
function CpuGame({lang,onBack,sfx}) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [phase,setPhase]=useState('draft')
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)
  const [playerHand,setPlayerHand]=useState([])
  const [cpuHand,setCpuHand]=useState([])
  const [drawPile,setDrawPile]=useState([])
  const [playerHp,setPlayerHp]=useState(MAX_HP)
  const [cpuHp,setCpuHp]=useState(MAX_HP)
  const [playerArmor,setPlayerArmor]=useState(0)
  const [cpuArmor,setCpuArmor]=useState(0)
  const [playerSelected,setPlayerSelected]=useState(null)
  const [lastMyCard,setLastMyCard]=useState(null)
  const [lastOppCard,setLastOppCard]=useState(null)
  const [roundLog,setRoundLog]=useState([])
  const [roundNum,setRoundNum]=useState(0)
  const [playerWins,setPlayerWins]=useState(0)
  const [cpuWins,setCpuWins]=useState(0)
  const [playerSkip,setPlayerSkip]=useState(false)
  const [cpuSkip,setCpuSkip]=useState(false)

  useEffect(()=>{
    const shuffled=shuffle(FULL_DECK)
    const cpuCards=shuffle(shuffled.slice(0,20)).slice(0,5)
    setCpuHand(cpuCards)
    const remaining=shuffled.filter(c=>!cpuCards.find(cc=>cc.id===c.id))
    setDrawPile(remaining);setDraftPool(remaining.slice(0,DRAFT_POOL_SIZE))
  },[])

  function pickDraft(card) {
    if(sfx) sfx('click')
    const newHand=[...playerHand,card]
    const newDraw=drawPile.filter(c=>!draftPool.find(d=>d.id===c.id))
    if(draftRound<DRAFT_ROUNDS-1){setPlayerHand(newHand);setDrawPile(newDraw);setDraftPool(newDraw.slice(0,DRAFT_POOL_SIZE));setDraftRound(r=>r+1)}
    else{setPlayerHand(newHand);setDrawPile(newDraw);setPhase('battle')}
  }

  function handleSwapDone(newCard) {
    setPlayerHand(prev=>[...prev.filter(c=>c.type!=='swap'),newCard])
    setDrawPile(prev=>prev.filter(c=>c.id!==newCard.id))
  }

  function fight() {
    const pCard = playerSkip ? null : playerSelected
    if(!playerSkip&&!playerSelected) return
    const cCard = cpuSkip ? null : cpuChooseCard(cpuHand, playerSkip)

    // Визначаємо картку для показу
    const pDisplay = playerSkip ? {type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'} : playerSelected
    const cDisplay = cpuSkip ? {type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'} : cCard

    setLastMyCard(pDisplay);setLastOppCard(cDisplay)

    // Звук
    if(sfx){
      const card=pCard||cCard
      if(card?.type==='rikishi') sfx('clash')
      else if(card?.type==='heal') sfx('heal')
      else if(card?.type==='armor') sfx('armor')
      else if(card?.type==='strike') sfx('strike')
      else if(card?.type==='salt') sfx('salt')
      else if(card?.type==='henka') sfx('henka')
    }

    const {newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(pCard,cCard,playerHp,cpuHp,playerArmor,cpuArmor,playerSkip,cpuSkip)
    setPlayerHp(newPHp);setCpuHp(newOHp);setPlayerArmor(newPArmor);setCpuArmor(newOArmor);setRoundLog(logs)
    setPlayerSkip(pNextSkip);setCpuSkip(oNextSkip)
    if(roundWinner==='p') setPlayerWins(w=>w+1)
    else if(roundWinner==='o') setCpuWins(w=>w+1)

    // Оновлення рук
    let newPH = playerSkip ? playerHand : playerHand.filter(c=>c.id!==playerSelected?.id)
    let newCH = cpuSkip ? cpuHand : (cCard ? cpuHand.filter(c=>c.id!==cCard.id) : cpuHand)
    let newDraw=drawPile
    if(newDraw.length>0){newPH=[...newPH,newDraw[0]];newDraw=newDraw.slice(1)}
    if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
    setPlayerHand(newPH);setCpuHand(newCH);setDrawPile(newDraw)
    if(newPHp<=0||newOHp<=0){setPhase('gameOver');return}
    setPhase('roundResult')
  }

  function nextRound(){
    const nr=roundNum+1;setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    if(nr>=MAX_ROUNDS||playerHand.length===0) setPhase('gameOver')
    else setPhase('battle')
  }

  const oya1=t('Ояката 1','Oyakata 1');const cpu=t('CPU (Ояката 2)','CPU (Oyakata 2)')
  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>‹ {t('Назад','Back')}</button>
      <CardGuide lang={lang}/>
      {phase==='draft'&&(
        <div style={{animation:'slideIn 0.25s ease'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
          {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'monospace',fontSize:'0.68rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
          {playerHand.length>0&&(
            <div style={{marginBottom:'1.25rem'}}>
              <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length}/{DRAFT_ROUNDS})</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div>
            </div>
          )}
          <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
            {draftPool.map((c,i)=><div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}
          </div>
        </div>
      )}
      {(phase==='battle'||phase==='roundResult')&&(
        <BattleLayout
          myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor}
          myWins={playerWins} oppWins={cpuWins} roundNum={roundNum+1}
          myLabel={oya1} oppLabel={cpu}
          myHand={playerHand} oppHand={cpuHand.length}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={false} oppReady={false} onSubmit={fight}
          roundLog={roundLog} phase={phase} onNext={nextRound}
          myCard={lastMyCard} oppCard={lastOppCard}
          drawPile={drawPile} onSwapDone={handleSwapDone}
          mySkipped={playerSkip} lang={lang} sfx={sfx}
        />
      )}
      {phase==='gameOver'&&<GameOverScreen myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} myLabel={oya1} oppLabel={cpu} onBack={onBack} lang={lang} sfx={sfx}/>}
    </div>
  )
}

// ── Мультиплеєр ─────────────────────────────────────────────
function MultiGame({lang,onBack,sfx}) {
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
  const [localDrawPile,setLocalDrawPile]=useState([])
  const roleRef=useRef(null);const sessionIdRef=useRef('');const processingRef=useRef(false)

  useEffect(()=>{
    if(!sessionId) return
    const dbRef=ref(db,`clash/${sessionId}`)
    const unsub=onValue(dbRef,snap=>{
      const data=snap.val();if(!data) return
      setSession(data)
      if(roleRef.current==='host'&&!processingRef.current&&!data.processing&&data.status==='battle'&&data.p1?.ready===true&&data.p2?.ready===true&&data.p1?.selectedCard&&data.p2?.selectedCard){
        processingRef.current=true
        doResolveRound(data,sessionIdRef.current).then(()=>processingRef.current=false).catch(()=>processingRef.current=false)
      }
    })
    return()=>off(dbRef)
  },[sessionId])

  async function doResolveRound(data,sid) {
    await update(ref(db,`clash/${sid}`),{processing:true})
    const p1SkipThis=data.p1?.skipNext||false
    const p2SkipThis=data.p2?.skipNext||false
    const p1Card=p1SkipThis?null:getCardById(data.p1.selectedCard)
    const p2Card=p2SkipThis?null:getCardById(data.p2.selectedCard)
    const {newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(p1Card,p2Card,data.p1.hp,data.p2.hp,data.p1.armor||0,data.p2.armor||0,p1SkipThis,p2SkipThis)
    const newRound=(data.roundNum||0)+1
    const usedIds=new Set([data.p1.selectedCard,data.p2.selectedCard].filter(Boolean))
    const deckArr=(data.deck||[]).map(id=>getCardById(id)).filter(Boolean)
    const p1HandFiltered=(data.p1.hand||[]).filter(id=>id!==data.p1.selectedCard)
    const p2HandFiltered=(data.p2.hand||[]).filter(id=>id!==data.p2.selectedCard)
    const drawRemaining=deckArr.filter(c=>!usedIds.has(c.id)&&!p1HandFiltered.includes(c.id)&&!p2HandFiltered.includes(c.id))
    let fp1=[...p1HandFiltered],fp2=[...p2HandFiltered]
    if(drawRemaining.length>0) fp1=[...fp1,drawRemaining[0].id]
    if(drawRemaining.length>1) fp2=[...fp2,drawRemaining[1].id]
    const kyujo=newPHp<=0||newOHp<=0
    const isOver=newRound>=MAX_ROUNDS||fp1.length===0||fp2.length===0||kyujo
    await update(ref(db),{
      [`clash/${sid}/p1/hp`]:newPHp,[`clash/${sid}/p2/hp`]:newOHp,
      [`clash/${sid}/p1/armor`]:newPArmor,[`clash/${sid}/p2/armor`]:newOArmor,
      [`clash/${sid}/p1/hand`]:fp1,[`clash/${sid}/p2/hand`]:fp2,
      [`clash/${sid}/p1/wins`]:(data.p1.wins||0)+(roundWinner==='p'?1:0),
      [`clash/${sid}/p2/wins`]:(data.p2.wins||0)+(roundWinner==='o'?1:0),
      [`clash/${sid}/p1/ready`]:false,[`clash/${sid}/p2/ready`]:false,
      [`clash/${sid}/p1/skipNext`]:pNextSkip,[`clash/${sid}/p2/skipNext`]:oNextSkip,
      [`clash/${sid}/lastCards`]:{p1:data.p1.selectedCard||'skip',p2:data.p2.selectedCard||'skip'},
      [`clash/${sid}/p1/selectedCard`]:null,[`clash/${sid}/p2/selectedCard`]:null,
      [`clash/${sid}/roundNum`]:newRound,[`clash/${sid}/roundLog`]:logs,
      [`clash/${sid}/status`]:isOver?'gameOver':'roundResult',[`clash/${sid}/processing`]:false,
    })
  }

  useEffect(()=>{
    if(!session||!role) return
    const mk=role==='host'?'p1':'p2';const status=session.status
    if(status==='waiting'&&role==='host'&&session.p2?.joined) update(ref(db,`clash/${sessionId}`),{status:'draft'})
    if(status==='draft'&&screen==='waiting'){setDraftPool((session[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean));setDraftRound(session[mk]?.draftRound||0);setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setScreen('draft')}
    if(status==='battle'&&screen==='draft'){setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setPlayerSelected(null);setSubmitting(false);setRoundNum(session.roundNum||0);setScreen('battle')}
    if(status==='battle'&&screen==='roundResult'){setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setPlayerSelected(null);setSubmitting(false);setRoundNum(session.roundNum||0);setScreen('battle')}
    if(status==='roundResult'&&screen==='battle') setScreen('roundResult')
    if(status==='gameOver'&&screen!=='gameOver') setScreen('gameOver')
  },[session?.status,session?.roundNum,session?.p2?.joined,session?.battleTrigger])

  async function createSession(){
    const code=generateCode();const shuffled=shuffle(FULL_DECK);const ids=shuffled.map(c=>c.id)
    await set(ref(db,`clash/${code}`),{status:'waiting',deck:ids,roundNum:0,roundLog:[],lastCards:null,processing:false,
      p1:{joined:true,hp:MAX_HP,armor:0,hand:[],draftPool:ids.slice(0,DRAFT_POOL_SIZE),draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
      p2:{joined:false,hp:MAX_HP,armor:0,hand:[],draftPool:ids.slice(DRAFT_POOL_SIZE,DRAFT_POOL_SIZE*2),draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
    })
    setLocalDrawPile(shuffled.slice(DRAFT_POOL_SIZE*2))
    roleRef.current='host';sessionIdRef.current=code;setRole('host');setSessionId(code);setScreen('waiting')
  }

  async function joinSession(){
    const code=inputCode.toUpperCase().trim();if(!code) return
    const snap=await get(ref(db,`clash/${code}`));if(!snap.exists()){setError(t('Сесію не знайдено','Session not found'));return}
    const data=snap.val();if(data.p2?.joined){setError(t('Гра вже заповнена','Game is full'));return}
    await update(ref(db,`clash/${code}/p2`),{joined:true,hp:MAX_HP,armor:0,hand:[],wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false})
    const deck=data.deck.map(id=>getCardById(id)).filter(Boolean);setLocalDrawPile(deck.slice(DRAFT_POOL_SIZE*2))
    roleRef.current='guest';sessionIdRef.current=code;setRole('guest');setSessionId(code);setScreen('waiting')
  }

  async function pickDraft(card){
    if(sfx) sfx('click')
    const snap=await get(ref(db,`clash/${sessionId}`));const data=snap.val()
    const mk=role==='host'?'p1':'p2';const myData=data[mk]
    const currentHand=[...new Set([...(myData.hand||[]),card.id])];const newDraftRound=(myData.draftRound||0)+1;const isDone=newDraftRound>=DRAFT_ROUNDS
    const deck=data.deck;const baseOffset=role==='host'?0:DRAFT_POOL_SIZE;const nextPoolStart=baseOffset+newDraftRound*(DRAFT_POOL_SIZE*2)
    let updates={[`clash/${sessionId}/${mk}/hand`]:currentHand,[`clash/${sessionId}/${mk}/draftRound`]:newDraftRound,[`clash/${sessionId}/${mk}/draftDone`]:isDone}
    if(!isDone&&nextPoolStart+DRAFT_POOL_SIZE<=deck.length) updates[`clash/${sessionId}/${mk}/draftPool`]=deck.slice(nextPoolStart,nextPoolStart+DRAFT_POOL_SIZE)
    await update(ref(db),updates)
    setPlayerHand(currentHand.map(id=>getCardById(id)).filter(Boolean));setDraftRound(newDraftRound)
    const otherKey=role==='host'?'p2':'p1'
    if(isDone&&data[otherKey]?.draftDone) await update(ref(db,`clash/${sessionId}`),{status:'battle'})
    if(!isDone&&nextPoolStart+DRAFT_POOL_SIZE<=deck.length) setDraftPool(deck.slice(nextPoolStart,nextPoolStart+DRAFT_POOL_SIZE).map(id=>getCardById(id)).filter(Boolean))
  }

  async function handleSwapDone(newCard){
    const mk=role==='host'?'p1':'p2'
    const snap=await get(ref(db,`clash/${sessionId}/${mk}/hand`))
    const handIds=(snap.val()||[]).filter(id=>getCardById(id)?.type!=='swap')
    const newHand=[...handIds,newCard.id]
    await update(ref(db,`clash/${sessionId}/${mk}`),{hand:newHand})
    setPlayerHand(newHand.map(id=>getCardById(id)).filter(Boolean))
    setLocalDrawPile(prev=>prev.filter(c=>c.id!==newCard.id))
  }

  async function submitCard(){
    const mk=role==='host'?'p1':'p2'
    const mySkip=session?.[mk]?.skipNext||false
    if(!mySkip&&!playerSelected||submitting) return
    setSubmitting(true)
    // Якщо пропуск — записуємо dummy selectedCard
    const cardId=mySkip?'SKIP':(playerSelected?.id||'SKIP')
    await update(ref(db,`clash/${sessionId}/${mk}`),{selectedCard:cardId,ready:true})
  }

  const mk=role==='host'?'p1':'p2';const ok=role==='host'?'p2':'p1'
  const myHp=session?.[mk]?.hp??MAX_HP;const oppHp=session?.[ok]?.hp??MAX_HP
  const myArmor=session?.[mk]?.armor??0;const oppArmor=session?.[ok]?.armor??0
  const myWins=session?.[mk]?.wins??0;const oppWins=session?.[ok]?.wins??0
  const myReady=session?.[mk]?.ready??false;const oppReady=session?.[ok]?.ready??false
  const totalRounds=session?.roundNum??0;const oppHandCount=(session?.[ok]?.hand||[]).length
  const mySkip=session?.[mk]?.skipNext||false
  const myHandCards=playerHand.length>0?playerHand:(session?.[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean)
  const myDraftPool=draftPool.length>0?draftPool:(session?.[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean)
  const lastCards=session?.lastCards
  const myLastCard=lastCards?getCardById(lastCards[mk]):null
  const oppLastCard=lastCards?getCardById(lastCards[ok]):null
  const deckForSwap=localDrawPile.length>0?localDrawPile:(session?.deck||[]).map(id=>getCardById(id)).filter(Boolean)
  const oya1=t('Ояката 1','Oyakata 1');const oya2=t('Ояката 2','Oyakata 2')
  const myLabel=role==='host'?oya1:oya2;const oppLabel=role==='host'?oya2:oya1

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
      <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'monospace',fontSize:'0.72rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>‹ {t('Назад','Back')}</button>
      {(screen==='battle'||screen==='roundResult')&&<CardGuide lang={lang}/>}

      {screen==='lobby'&&(
        <div style={{textAlign:'center',animation:'slideIn 0.25s ease'}}>
          <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>🌐</div>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,marginBottom:'1.5rem'}}>{t('Мультиплеєр','Multiplayer')}</div>
          <button onClick={createSession} style={{width:'100%',padding:'0.8rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.8rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,marginBottom:'1rem'}}>{t('Створити гру (Ояката 1)','Create game (Oyakata 1)')}</button>
          <div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.75rem'}}>{t('або','or')}</div>
          <div style={{display:'flex',gap:8,marginBottom:'0.5rem'}}>
            <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} placeholder={t('Код сесії...','Session code...')} maxLength={6} style={{flex:1,padding:'0.65rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'monospace',fontSize:'0.9rem',borderRadius:4,outline:'none',letterSpacing:'0.2em',textTransform:'uppercase'}}/>
            <button onClick={joinSession} style={{padding:'0.65rem 1.25rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.78rem',cursor:'pointer',fontWeight:700}}>{t('Ояката 2','Oyakata 2')}</button>
          </div>
          {error&&<div style={{fontFamily:'monospace',fontSize:'0.7rem',color:'#c0392b',marginTop:4}}>{error}</div>}
        </div>
      )}
      {screen==='waiting'&&(
        <div style={{textAlign:'center',paddingTop:'2rem',animation:'slideIn 0.25s ease'}}>
          <div style={{fontSize:'2rem',marginBottom:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳</div>
          <div style={{fontFamily:'monospace',fontSize:'0.8rem',color:'var(--mid)',marginBottom:'0.5rem'}}>{role==='host'?t('Ояката 1 чекає на Ояката 2...','Oyakata 1 waiting...'):t('Ояката 2 підключається...','Oyakata 2 connecting...')}</div>
          {role==='host'&&<div style={{background:'var(--bg2)',padding:'1.5rem',borderRadius:4,display:'inline-block',animation:'pop 0.4s ease',marginTop:'1rem'}}><div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{t('Код для Ояката 2','Code for Oyakata 2')}</div><div style={{fontFamily:'monospace',fontSize:'2.8rem',fontWeight:800,color:'#b8860b',letterSpacing:'0.35em'}}>{sessionId}</div></div>}
        </div>
      )}
      {screen==='draft'&&(
        <div style={{animation:'slideIn 0.25s ease'}}>
          <div style={{fontFamily:'monospace',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
          {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'monospace',fontSize:'0.68rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
          {myHandCards.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'monospace',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({myHandCards.length})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{[...new Map(myHandCards.filter(Boolean).map(c=>[c.id,c])).values()].map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
          {!session?.[mk]?.draftDone?(
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              {myDraftPool.map((c,i)=>c&&<div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}
            </div>
          ):(<div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',textAlign:'center',marginTop:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting for opponent...')}</div>)}
        </div>
      )}
      {(screen==='battle'||screen==='roundResult')&&(
        <BattleLayout
          myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor}
          myWins={myWins} oppWins={oppWins} roundNum={totalRounds+1}
          myLabel={myLabel} oppLabel={oppLabel}
          myHand={myHandCards} oppHand={oppHandCount}
          playerSelected={playerSelected} onSelect={setPlayerSelected}
          myReady={myReady} oppReady={oppReady} onSubmit={submitCard}
          roundLog={session?.roundLog||[]} phase={screen}
          onNext={async()=>{if(role==='host') await update(ref(db,`clash/${sessionId}`),{status:'battle',battleTrigger:(session?.battleTrigger||0)+1})}}
          myCard={myLastCard} oppCard={oppLastCard}
          drawPile={deckForSwap} onSwapDone={handleSwapDone}
          mySkipped={mySkip} lang={lang} sfx={sfx}
        />
      )}
      {screen==='gameOver'&&<GameOverScreen myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myWins={myWins} oppWins={oppWins} myLabel={myLabel} oppLabel={oppLabel} onBack={onBack} lang={lang} sfx={sfx}/>}
    </div>
  )
}

// ── Головний компонент ──────────────────────────────────────
export default function SumoClash({onClose,lang='uk'}) {
  const [mode,setMode]=useState('menu')
  const t=(uk,en)=>lang==='en'?en:uk
  const audioCtxRef=useRef(null)
  const musicGainRef=useRef(null)
  const stopMusicRef=useRef(null)
  const [sfxOn,setSfxOn]=useState(true)
  const [musicOn,setMusicOn]=useState(false)

  function ensureCtx(){
    if(!audioCtxRef.current) audioCtxRef.current=createAudioContext()
    if(!musicGainRef.current&&audioCtxRef.current){
      const g=audioCtxRef.current.createGain();g.gain.value=0.15;g.connect(audioCtxRef.current.destination);musicGainRef.current=g
    }
    return audioCtxRef.current
  }

  function sfx(type){ if(sfxOn){ const ctx=ensureCtx(); playSound(ctx,type) } }

  function toggleSfx(){ sfx('click'); setSfxOn(v=>!v) }

  function toggleMusic(){
    const ctx=ensureCtx()
    if(musicOn){
      if(stopMusicRef.current){stopMusicRef.current();stopMusicRef.current=null}
      if(musicGainRef.current) musicGainRef.current.gain.value=0
      setMusicOn(false)
    } else {
      if(musicGainRef.current) musicGainRef.current.gain.value=0.15
      stopMusicRef.current=startBgMusic(ctx,musicGainRef.current)
      setMusicOn(true)
    }
  }

  // Зупиняємо музику при закритті
  useEffect(()=>()=>{if(stopMusicRef.current) stopMusicRef.current()},[])

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
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <AudioControls sfxOn={sfxOn} musicOn={musicOn} onToggleSfx={toggleSfx} onToggleMusic={toggleMusic} lang={lang}/>
              <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.3rem',cursor:'pointer',lineHeight:1}}>✕</button>
            </div>
          </div>
          {mode==='menu'&&(
            <div style={{flex:1,padding:'2rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'1.25rem',animation:'slideIn 0.3s ease'}}>
              <div style={{fontSize:'2.8rem',animation:'pop 0.4s ease'}}>⚔️</div>
              <div style={{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:800,color:'#b8860b'}}>{t('Сумо Клеш','Sumo Clash')}</div>
              <div style={{fontFamily:'monospace',fontSize:'0.75rem',color:'var(--mid)',textAlign:'center',lineHeight:1.7,marginBottom:'0.5rem'}}>
                {t('15 раундів · Ояката · Рікіші · Броня · Удари · Хенка','15 rounds · Oyakata · Rikishi · Armor · Strikes · Henka')}
              </div>
              <button onClick={()=>{sfx('click');setMode('cpu')}} style={{width:'100%',maxWidth:320,padding:'0.9rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.88rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🤖 {t('Проти CPU','vs CPU')}
              </button>
              <button onClick={()=>{sfx('click');setMode('multi')}} style={{width:'100%',maxWidth:320,padding:'0.9rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'monospace',fontSize:'0.88rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                🌐 {t('Мультиплеєр','Multiplayer')}
              </button>
            </div>
          )}
          {mode==='cpu'&&<CpuGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx}/>}
          {mode==='multi'&&<MultiGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx}/>}
        </div>
      </div>
    </>
  )
}
