'use client'
import { trackGameLaunch, trackClashMode } from '../lib/gameAnalytics'
import { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { ref, set, get, onValue, update, off } from 'firebase/database'
import SumoClashCampaign from './SumoClashCampaign'

const MAX_HP = 40
const MAX_ROUNDS = 15
const DRAFT_ROUNDS = 5
const DRAFT_POOL_SIZE = 3

const RIKISHI_CARDS = [
  { id:'Y1e', type:'rikishi', rank:'Yokozuna', atk:10, def:7, color:'#b8860b' },
  { id:'Y1w', type:'rikishi', rank:'Yokozuna', atk:9,  def:8, color:'#b8860b' },
  { id:'O1e', type:'rikishi', rank:'Ozeki', atk:8, def:6, color:'#8b1a1a' },
  { id:'O1w', type:'rikishi', rank:'Ozeki', atk:7, def:7, color:'#8b1a1a' },
  { id:'O2e', type:'rikishi', rank:'Ozeki', atk:7, def:6, color:'#8b1a1a' },
  { id:'O2w', type:'rikishi', rank:'Ozeki', atk:8, def:5, color:'#8b1a1a' },
  { id:'S1e', type:'rikishi', rank:'Sekiwake', atk:7, def:5, color:'#1a4a7a' },
  { id:'S1w', type:'rikishi', rank:'Sekiwake', atk:6, def:6, color:'#1a4a7a' },
  { id:'S2e', type:'rikishi', rank:'Sekiwake', atk:6, def:5, color:'#1a4a7a' },
  { id:'S2w', type:'rikishi', rank:'Sekiwake', atk:7, def:4, color:'#1a4a7a' },
  { id:'S3e', type:'rikishi', rank:'Sekiwake', atk:5, def:6, color:'#1a4a7a' },
  { id:'S3w', type:'rikishi', rank:'Sekiwake', atk:6, def:4, color:'#1a4a7a' },
  { id:'K1e', type:'rikishi', rank:'Komusubi', atk:6, def:4, color:'#1f7a3a' },
  { id:'K1w', type:'rikishi', rank:'Komusubi', atk:5, def:5, color:'#1f7a3a' },
  { id:'K2e', type:'rikishi', rank:'Komusubi', atk:5, def:4, color:'#1f7a3a' },
  { id:'K2w', type:'rikishi', rank:'Komusubi', atk:6, def:3, color:'#1f7a3a' },
  { id:'K3e', type:'rikishi', rank:'Komusubi', atk:4, def:5, color:'#1f7a3a' },
  { id:'K3w', type:'rikishi', rank:'Komusubi', atk:5, def:3, color:'#1f7a3a' },
  { id:'K4e', type:'rikishi', rank:'Komusubi', atk:4, def:4, color:'#1f7a3a' },
  { id:'K4w', type:'rikishi', rank:'Komusubi', atk:5, def:4, color:'#1f7a3a' },
]
const MAEGASHIRA = [
  ...Array.from({length:15},(_,i)=>({ id:`M${i+1}e`, type:'rikishi', rank:'Maegashira', atk:Math.max(1,4-Math.floor(i/4)), def:Math.max(1,3-Math.floor(i/5)), color:'#6f6f6f' })),
  ...Array.from({length:15},(_,i)=>({ id:`M${i+1}w`, type:'rikishi', rank:'Maegashira', atk:Math.max(1,4-Math.floor(i/4)), def:Math.max(1,3-Math.floor(i/6)), color:'#6f6f6f' })),
]
const HEAL_CARDS = [
  { id:'H1', type:'heal', heal:5,  label:'Вода переможця', labelEn:"Victor's Water", effect:'+5 HP', color:'#2471a3', emoji:'💧' },
  { id:'H2', type:'heal', heal:5,  label:'Вода переможця', labelEn:"Victor's Water", effect:'+5 HP', color:'#2471a3', emoji:'💧' },
  { id:'H3', type:'heal', heal:5,  label:'Вода переможця', labelEn:"Victor's Water", effect:'+5 HP', color:'#2471a3', emoji:'💧' },
  { id:'H6', type:'heal', heal:10, label:'Сіль Дохьо',     labelEn:'Dohyo Salt',     effect:'+10 HP', color:'#1a5276', emoji:'🧂' },
]
const ARMOR_CARDS = [
  { id:'Ar1', type:'armor', armor:5,  label:'Бойова стійка', labelEn:'Battle Stance', effect:'+5 🛡', color:'#1f618d', emoji:'🥋' },
  { id:'Ar2', type:'armor', armor:5,  label:'Бойова стійка', labelEn:'Battle Stance', effect:'+5 🛡', color:'#1f618d', emoji:'🥋' },
  { id:'Ar3', type:'armor', armor:10, label:'Маваші',        labelEn:'Mawashi',       effect:'+10 🛡', color:'#154360', emoji:'🛡' },
  { id:'Ar4', type:'armor', armor:10, label:'Маваші',        labelEn:'Mawashi',       effect:'+10 🛡', color:'#154360', emoji:'🛡' },
]
const STRIKE_CARDS = [
  { id:'St1', type:'strike', damage:5,  label:'Тачіай',   labelEn:'Tachiai', effect:'-5 HP ⚡',  color:'#e67e22', emoji:'👊' },
  { id:'St2', type:'strike', damage:5,  label:'Тачіай',   labelEn:'Tachiai', effect:'-5 HP ⚡',  color:'#e67e22', emoji:'👊' },
  { id:'St3', type:'strike', damage:10, label:'Харітете', labelEn:'Harite',  effect:'-10 HP ⚡', color:'#c0392b', emoji:'🤜' },
  { id:'St4', type:'strike', damage:10, label:'Харітете', labelEn:'Harite',  effect:'-10 HP ⚡', color:'#c0392b', emoji:'🤜' },
]
const SWAP_CARDS = [
  { id:'Sw1', type:'swap', label:'Заміна', labelEn:'Swap', effect:'↔ Карта', color:'#27ae60', emoji:'🔄' },
  { id:'Sw2', type:'swap', label:'Заміна', labelEn:'Swap', effect:'↔ Карта', color:'#27ae60', emoji:'🔄' },
  { id:'Sw3', type:'swap', label:'Заміна', labelEn:'Swap', effect:'↔ Карта', color:'#27ae60', emoji:'🔄' },
  { id:'Sw4', type:'swap', label:'Заміна', labelEn:'Swap', effect:'↔ Карта', color:'#27ae60', emoji:'🔄' },
]
const SALT_CARDS  = [{ id:'Sa1', type:'salt',  label:'Сіль в обличчя', labelEn:'Salt Throw', effect:'⏩ Пропуск',    color:'#7f8c8d', emoji:'🧂' }]
const HENKA_CARDS = [{ id:'He1', type:'henka', label:'Хенка',          labelEn:'Henka',      effect:'🌀 Ухилення', color:'#8e44ad', emoji:'🌀' }]
const FULL_DECK = [...RIKISHI_CARDS,...MAEGASHIRA,...HEAL_CARDS,...ARMOR_CARDS,...STRIKE_CARDS,...SWAP_CARDS,...SALT_CARDS,...HENKA_CARDS]

// ── Описи карт для CardBook ──────────────────────────────────
const CARD_LORE = {
  // Yokozuna
  Y1e: 'Вершина сумо. Він не бореться — він судить. Кожен вихід на дохьо — як сонячне затемнення: рідкісний, величний і незворотній.',
  Y1w: 'Захід породжує своїх богів. Цей рікіші досяг йокодзуна через терпіння, а не силу. Його тіло — храм, його воля — закон.',
  // Ozeki
  O1e: 'Майстер рівноваги. Атака і захист для нього — одне. Говорять, він ніколи не робив зайвого кроку.',
  O1w: 'Залізна воля заходу. Він програвав двічі — і обидва рази навмисно, щоб вивчити суперника зсередини.',
  O2e: 'Народився в маленькому селі, де не було дохьо. Перший круг намалював паличкою на землі. Тепер його поважають у всій країні.',
  O2w: 'Швидкий як думка, важкий як каміння. Його тачіай розбиває противників ще до того, як вони встигають зрозуміти, що сталось.',
  // Sekiwake
  S1e: 'Він прийшов із гір, де вітер навчив його читати рух тіла. Каже, що кожен суперник — це нова буря.',
  S1w: 'Три роки поспіль виходив до фіналу. Три роки поспіль програвав в останньому бою. Четвертого року — не програв.',
  S2e: 'Його ліва рука — для захисту. Права — для перемоги. Між ними — мовчання, в якому народжується техніка.',
  S2w: 'Молодий, але вже мудрий. Вчиться у поразок більше, ніж більшість — у перемог.',
  S3e: 'Говорить мало, рухається тихо. Але коли він входить на дохьо — зал завмирає.',
  S3w: 'Його батько був рікіші. Дід — теж. Він продовжує лінію, але за власними правилами.',
  // Komusubi
  K1e: 'Піднявся з маєгашіри за один басьо. Критики казали — щастя. Він повторив наступного місяця.',
  K1w: 'Бореться з усмішкою. Кажуть, це нерви. Насправді — це спокій людини, яка вже прийняла результат.',
  K2e: 'Технічний геній. Знає сотні прийомів, але використовує лише три. Решта — щоб суперник думав.',
  K2w: 'Невисокий на зріст. Це його перевага: центр ваги нижче, а удар — несподіваніший.',
  K3e: 'Мовчазний боєць. Ніколи не дає інтерв\'ю. Його суmo говорить за нього.',
  K3w: 'Прийшов пізно — почав у 22 роки. Надолужує кожен день. Конкурент зі сходу вчиться у нього наполегливості.',
  K4e: 'Любить довгі бої. Чекає, коли суперник зробить помилку. Іноді чекає довше, ніж глядачі витримують.',
  K4w: 'Кажуть, він медитує перед кожним виходом. Дохьо для нього — не арена, а вівтар.',
  // Heal
  H1: 'Вода після бою — священна. Переможець п\'є першим. Вона несе силу перемоги і змиває втому поразки.',
  H2: 'Вода переможця передається з рук тренера. Жест довіри, який коштує дорожче будь-якої нагороди.',
  H3: 'Після кожного раунду — ковток. Після кожного ковтка — новий початок. Тіло забуває біль швидше, ніж розум.',
  H6: 'Сіль очищує дохьо від злих духів. Але ця — особлива. Зібрана біля храму, вона відновлює не тільки тіло.',
  // Armor
  Ar1: 'Стійка — це не поза. Це стан духу. Коли ноги вкоренились у землі, жодна сила не зрушить тебе з місця.',
  Ar2: 'Майстер навчив його одному: перш ніж атакувати — стань непорушним. Атака без основи — це падіння.',
  Ar3: 'Маваші — не просто пояс. Це зброя, щит і честь одночасно. Той, хто тримає його — тримає всього бійця.',
  Ar4: 'Якість маваші визначає якість рікіші. Цей зшитий вручну, просочений волею майстра-кравця, який сам колись боровся.',
  // Strike
  St1: 'Тачіай — зіткнення на старті. Одна секунда вирішує все. Хто б\'є першим і точніше — той і задає тон бою.',
  St2: 'Техніка тачіаю передається від майстра до учня. Але справжній удар народжується тільки в момент — не в тренуванні.',
  St3: 'Харіте — відкритою долонею по щоці. Не жорстокість — мистецтво. Один рух ламає концентрацію суперника назавжди.',
  St4: 'Кажуть, цей прийом заборонений у деяких школах. Занадто ефективний. Занадто болючий. Занадто чесний.',
  // Swap
  Sw1: 'Стратегія — це мистецтво вибору. Іноді сильніша карта — та, якої ще немає в руці.',
  Sw2: 'Ояката змінює план у розпал бою. Це не слабкість — це мудрість людини, яка бачить більше.',
  Sw3: 'Між раундами — тиша. У ній народжуються рішення, які змінюють хід всього поєдинку.',
  Sw4: 'Нова карта — новий шанс. Стара школа каже: тримай що маєш. Нова відповідає: бери краще.',
  // Salt
  Sa1: 'Сіль в обличчя — давній трюк. Не боляче. Але секунда сліпоти коштує раунду, а іноді — всього бою.',
  // Henka
  He1: 'Хенка — ухилення вбік у момент тачіаю. Суперечливий прийом. Одні кажуть — ганьба. Інші — геній. Всі кажуть — ефективно.',
}

function getCardLore(card, lang) {
  return CARD_LORE[card.id] || null
}

const CARD_DESCRIPTIONS = {
  rikishi: (c) => `Рікіші ${c.rank}. Атакує суперника. Шкода = ATK − DEF суперника (мін 0). Б'є броню першою.`,
  heal:    (c) => `Відновлює ${c.heal} HP. Не діє на суперника.`,
  armor:   (c) => `Додає ${c.armor} одиниць броні. Броня поглинає шкоду від рікіші. Зберігається між раундами.`,
  strike:  (c) => `Завдає ${c.damage} прямої шкоди. Ігнорує броню суперника!`,
  swap:    ()  => `Замінює одну карту з руки на нову з колоди.`,
  salt:    ()  => `Кидаєш сіль в обличчя — суперник пропускає наступний хід.`,
  henka:   ()  => `Ухиляєшся від атаки суперника (рікіші або удар). Проти хілу і броні не діє.`,
}

function getCardDesc(card, lang) {
  const fn = CARD_DESCRIPTIONS[card.type]
  return fn ? fn(card) : ''
}

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]};return a}
function generateCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function getCardById(id){return FULL_DECK.find(c=>c.id===id)}
function getLabel(card,lang){return lang==='en'?(card.labelEn||card.label||card.id):(card.label||card.id)}

// Картки без власного скіну — використовують скін іншої картки того ж типу
const CARD_SKIN_ALIAS = {
  'H2': 'H1', 'H3': 'H1',       // вода переможця — той самий скін
  'Ar2': 'Ar1', 'Ar4': 'Ar3',   // броня — два варіанти
  'St2': 'St1', 'St4': 'St3',   // удари — два варіанти
  'Sw2': 'Sw1', 'Sw3': 'Sw1', 'Sw4': 'Sw1', // заміна — один скін
}
function getCardSkinId(id) { return CARD_SKIN_ALIAS[id] || id }

function cpuChooseCard(hand,oppSkipped){
  if(oppSkipped){const safe=hand.filter(c=>['heal','armor','swap'].includes(c.type));if(safe.length>0)return safe[0]}
  const strikes=hand.filter(c=>c.type==='strike');if(strikes.length>0)return strikes.sort((a,b)=>b.damage-a.damage)[0]
  const rikishi=hand.filter(c=>c.type==='rikishi');if(rikishi.length>0)return rikishi.sort((a,b)=>(b.atk+b.def)-(a.atk+a.def))[0]
  const heals=hand.filter(c=>c.type==='heal');if(heals.length>0)return heals[0]
  return hand[0]
}

function resolveRound(pCard,oCard,pHp,oHp,pArmor,oArmor,pSkipped,oSkipped){
  let nPHp=pHp,nOHp=oHp,nPAr=pArmor,nOAr=oArmor
  const logs=[]
  const pEff=pSkipped?null:pCard
  const oEff=oSkipped?null:oCard
  let pNextSkip=false,oNextSkip=false
  if(pSkipped)logs.push({text:'You: skipped (Salt Throw)',color:'#95a5a6'})
  if(oSkipped)logs.push({text:'Opp: skipped (Salt Throw)',color:'#95a5a6'})
  if(pEff?.type==='henka'&&(oEff?.type==='rikishi'||oEff?.type==='strike')){
    logs.push({text:'You: 🌀 Henka! Dodged opponent attack!',color:'#8e44ad'})
    if(oEff?.type==='heal'){const h=Math.min(MAX_HP,nOHp+oEff.heal)-nOHp;nOHp=Math.min(MAX_HP,nOHp+oEff.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
    if(oEff?.type==='armor'){nOAr+=oEff.armor;logs.push({text:`Opp: +${oEff.armor} armor`,color:'#1f618d'})}
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false}
  }
  if(oEff?.type==='henka'&&(pEff?.type==='rikishi'||pEff?.type==='strike')){
    logs.push({text:'Opp: 🌀 Henka! Dodged your attack!',color:'#8e44ad'})
    if(pEff?.type==='heal'){const h=Math.min(MAX_HP,nPHp+pEff.heal)-nPHp;nPHp=Math.min(MAX_HP,nPHp+pEff.heal);logs.push({text:`You: +${h} HP`,color:'#2471a3'})}
    if(pEff?.type==='armor'){nPAr+=pEff.armor;logs.push({text:`You: +${pEff.armor} armor`,color:'#1f618d'})}
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false}
  }
  function applyDmg(dmg,hp,armor,label,isOpp){
    let nHp=hp,nAr=armor
    if(dmg<=0)return{nHp,nAr}
    if(nAr>=dmg){nAr-=dmg;logs.push({text:`${label}: ${dmg} blocked by armor`,color:'#2980b9'})}
    else if(nAr>0){const rem=dmg-nAr;nHp=Math.max(0,nHp-rem);logs.push({text:`${label}: ${dmg} dmg (${nAr} armor, ${rem} HP)`,color:isOpp?'#c0392b':'#1a6b5c'});nAr=0}
    else{nHp=Math.max(0,nHp-dmg);logs.push({text:`${label}: ${dmg} dmg`,color:isOpp?'#c0392b':'#1a6b5c'})}
    return{nHp,nAr}
  }
  if(pEff?.type==='salt'){oNextSkip=true;logs.push({text:'You: 🧂 Salt! Opponent skips next turn!',color:'#7f8c8d'})}
  if(oEff?.type==='salt'){pNextSkip=true;logs.push({text:'Opp: 🧂 Salt! You skip next turn!',color:'#7f8c8d'})}
  if(pEff?.type==='heal'){const h=Math.min(MAX_HP,nPHp+pEff.heal)-nPHp;nPHp=Math.min(MAX_HP,nPHp+pEff.heal);logs.push({text:`You: +${h} HP`,color:'#2471a3'})}
  if(oEff?.type==='heal'){const h=Math.min(MAX_HP,nOHp+oEff.heal)-nOHp;nOHp=Math.min(MAX_HP,nOHp+oEff.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
  if(pEff?.type==='armor'){nPAr+=pEff.armor;logs.push({text:`You: +${pEff.armor} armor`,color:'#1f618d'})}
  if(oEff?.type==='armor'){nOAr+=oEff.armor;logs.push({text:`Opp: +${oEff.armor} armor`,color:'#1f618d'})}
  if(pEff?.type==='strike'){nOHp=Math.max(0,nOHp-pEff.damage);logs.push({text:`You: ⚡ ${pEff.damage} direct dmg`,color:'#e67e22'})}
  if(oEff?.type==='strike'){nPHp=Math.max(0,nPHp-oEff.damage);logs.push({text:`Opp: ⚡ ${oEff.damage} direct dmg`,color:'#e67e22'})}
  if(pEff?.type==='rikishi'&&oEff?.type==='rikishi'){
    const pDmg=Math.max(0,pEff.atk-oEff.def);const oDmg=Math.max(0,oEff.atk-pEff.def)
    if(oDmg>0){const r=applyDmg(oDmg,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr}
    if(pDmg>0){const r=applyDmg(pDmg,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr}
    if(pDmg===0&&oDmg===0)logs.push({text:'Both blocked!',color:'var(--mid)'})
  }
  if(pEff?.type==='rikishi'&&oEff&&oEff.type!=='rikishi'){const r=applyDmg(pEff.atk,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr}
  if(oEff?.type==='rikishi'&&pEff&&pEff.type!=='rikishi'){const r=applyDmg(oEff.atk,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr}
  if(pEff?.type==='rikishi'&&!oEff){const r=applyDmg(pEff.atk,nOHp,nOAr,'You→Opp',false);nOHp=r.nHp;nOAr=r.nAr}
  if(oEff?.type==='rikishi'&&!pEff){const r=applyDmg(oEff.atk,nPHp,nPAr,'Opp→You',true);nPHp=r.nHp;nPAr=r.nAr}
  const pDmgT=pEff?.type==='rikishi'?Math.max(0,pEff.atk-(oEff?.type==='rikishi'?oEff.def:0)):pEff?.type==='strike'?pEff.damage:0
  const oDmgT=oEff?.type==='rikishi'?Math.max(0,oEff.atk-(pEff?.type==='rikishi'?pEff.def:0)):oEff?.type==='strike'?oEff.damage:0
  const roundWinner=pDmgT>oDmgT?'p':oDmgT>pDmgT?'o':'tie'
  return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner,pNextSkip,oNextSkip}
}

function createAudioContext(){if(typeof window==='undefined')return null;return new(window.AudioContext||window.webkitAudioContext)()}
function playSound(ctx,type){
  if(!ctx)return
  try{
    const now=ctx.currentTime
    if(type==='clash'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.setValueAtTime(120,now);o.frequency.exponentialRampToValueAtTime(40,now+0.15);g.gain.setValueAtTime(0.6,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.3);o.start(now);o.stop(now+0.3)}
    else if(type==='heal'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.setValueAtTime(180,now);o.frequency.exponentialRampToValueAtTime(120,now+0.2);g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(0.4,now+0.05);g.gain.exponentialRampToValueAtTime(0.001,now+0.35);o.start(now);o.stop(now+0.35)}
    else if(type==='armor'){[500,750,1000,1400].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='square';o.frequency.value=freq;g.gain.setValueAtTime(0.12,now+i*0.02);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.02+0.2);o.start(now+i*0.02);o.stop(now+i*0.02+0.2)})}
    else if(type==='strike'){const buf=ctx.createBuffer(1,ctx.sampleRate*0.12,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,0.3);const s=ctx.createBufferSource();s.buffer=buf;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=1500;const g=ctx.createGain();g.gain.value=0.6;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start(now)}
    else if(type==='salt'){const buf=ctx.createBuffer(1,ctx.sampleRate*0.25,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.4*(1-i/d.length)*Math.sin(i*0.3);const s=ctx.createBufferSource();s.buffer=buf;const f=ctx.createBiquadFilter();f.type='highpass';f.frequency.value=2500;const g=ctx.createGain();g.gain.value=0.25;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start(now)}
    else if(type==='henka'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.setValueAtTime(900,now);o.frequency.exponentialRampToValueAtTime(200,now+0.25);g.gain.setValueAtTime(0.3,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.3);o.start(now);o.stop(now+0.3)}
    else if(type==='win'){[523,659,784,1047].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(0,now+i*0.12);g.gain.linearRampToValueAtTime(0.3,now+i*0.12+0.05);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.12+0.4);o.start(now+i*0.12);o.stop(now+i*0.12+0.4)})}
    else if(type==='lose'){[400,350,300].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.25,now+i*0.18);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.18+0.35);o.start(now+i*0.18);o.stop(now+i*0.18+0.35)})}
    else if(type==='click'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=800;g.gain.setValueAtTime(0.08,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.05);o.start(now);o.stop(now+0.05)}
    else if(type==='swap'){const buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI)*0.3;const s=ctx.createBufferSource();s.buffer=buf;const g=ctx.createGain();g.gain.value=0.2;s.connect(g);g.connect(ctx.destination);s.start(now)}
  }catch(e){}
}

const MUSIC_THEMES=[
  {id:'dohyo',    label:{uk:'Дохьо',    en:'Dohyo'},    desc:{uk:'Урочиста',   en:'Ceremonial'}},
  {id:'taiko',    label:{uk:'Тайко',    en:'Taiko'},    desc:{uk:'Барабани',   en:'Drums'}},
  {id:'yokozuna', label:{uk:'Йокодзуна',en:'Yokozuna'}, desc:{uk:'Епічна',     en:'Epic'}},
  {id:'shrine',   label:{uk:'Святиня',  en:'Shrine'},   desc:{uk:'Спокійна',   en:'Peaceful'}},
]

const ANIM_STYLES=`
:root { --jp: 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif; }

@keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes clash{0%{transform:translateX(0)}30%{transform:translateX(14px)}60%{transform:translateX(-8px)}100%{transform:translateX(0)}}
@keyframes clashR{0%{transform:translateX(0)}30%{transform:translateX(-14px)}60%{transform:translateX(8px)}100%{transform:translateX(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pop{0%{transform:scale(0.8);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes shake{0%,100%{transform:translate(0,0)}15%{transform:translate(-6px,3px)}30%{transform:translate(6px,-3px)}45%{transform:translate(-4px,2px)}60%{transform:translate(4px,-2px)}75%{transform:translate(-2px,1px)}}
@keyframes floatUp{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(1.3)}}
@keyframes flashRed{0%,100%{background:var(--bg2)}50%{background:rgba(192,57,43,0.4)}}
@keyframes flashGreen{0%,100%{background:var(--bg2)}50%{background:rgba(26,107,92,0.4)}}
@keyframes flashBlue{0%,100%{background:var(--bg2)}50%{background:rgba(31,97,141,0.4)}}
@keyframes cardFlip{0%{transform:rotateY(90deg) scale(0.8);opacity:0}100%{transform:rotateY(0) scale(1);opacity:1}}
@keyframes roundBanner{0%{opacity:0;transform:scale(0.5)}40%{opacity:1;transform:scale(1.15)}70%{transform:scale(1)}90%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
@keyframes lightning{0%,100%{opacity:0}10%,30%,50%{opacity:1}20%,40%{opacity:0.3}}
@keyframes saltParticle{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--tx),var(--ty)) scale(0)}}
@keyframes henkaSwirl{0%{opacity:1;transform:rotate(0) scale(1)}100%{opacity:0;transform:rotate(540deg) scale(0)}}
@keyframes hpFlash{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)}}
@keyframes bubbleRise{0%{transform:translateY(0) scale(1);opacity:0.7}100%{transform:translateY(-40px) scale(0.3);opacity:0}}
@keyframes lowHpPulse{0%,100%{color:#c0392b}50%{color:#ff6b6b}}
`

const CARD_TYPES_INFO=[
  {type:'rikishi',emoji:'⚔️',label:{uk:'Рікіші',en:'Rikishi'},desc:{uk:'Атакує. ATK − DEF = шкода. Б\'є броню першою.',en:'Attacks. ATK − DEF = damage. Hits armor first.'}},
  {type:'heal',emoji:'💧',label:{uk:'Хіл',en:'Heal'},desc:{uk:'Вода переможця +5 HP або Сіль Дохьо +10 HP.',en:"Victor's Water +5 HP or Dohyo Salt +10 HP."}},
  {type:'armor',emoji:'🛡',label:{uk:'Броня',en:'Armor'},desc:{uk:'Бойова стійка +5 🛡 або Маваші +10 🛡. Зберігається між раундами.',en:'Battle Stance +5 🛡 or Mawashi +10 🛡. Persists between rounds.'}},
  {type:'strike',emoji:'⚡',label:{uk:'Удар',en:'Strike'},desc:{uk:'Тачіай -5 HP або Харітете -10 HP. Ігнорує броню!',en:'Tachiai -5 HP or Harite -10 HP. Ignores armor!'}},
  {type:'swap',emoji:'🔄',label:{uk:'Заміна',en:'Swap'},desc:{uk:'Замінює карту з руки на нову з колоди.',en:'Swap a hand card for a new deck card.'}},
  {type:'salt',emoji:'🧂',label:{uk:'Сіль',en:'Salt'},desc:{uk:'Суперник пропускає наступний хід.',en:'Opponent skips next turn.'}},
  {type:'henka',emoji:'🌀',label:{uk:'Хенка',en:'Henka'},desc:{uk:'Уникаєте атаки суперника (рікіші або удар).',en:'Dodge opponent attack (rikishi or strike).'}},
]

// ── Particles ────────────────────────────────────────────────
function SaltParticles(){
  const particles=Array.from({length:16},(_,i)=>({id:i,tx:`${(Math.random()-0.5)*120}px`,ty:`${-30-Math.random()*60}px`,delay:`${Math.random()*0.3}s`,size:`${4+Math.random()*6}px`}))
  return(<div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>{particles.map(p=>(<div key={p.id} style={{position:'absolute',top:'50%',left:'50%',width:p.size,height:p.size,borderRadius:'50%',background:'rgba(255,255,255,0.9)','--tx':p.tx,'--ty':p.ty,animation:`saltParticle 0.8s ease-out ${p.delay} both`}}/>))}</div>)
}
function HenkaSwirl(){return(<div style={{position:'absolute',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{[0,1,2].map(i=>(<div key={i} style={{position:'absolute',fontSize:`${2+i*0.8}rem`,animation:`henkaSwirl 0.7s ease-out ${i*0.1}s both`,opacity:0}}>🌀</div>))}</div>)}
function LightningEffect(){return(<div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}><div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:3,height:'100%',background:'linear-gradient(180deg,transparent,#f39c12,#e74c3c,transparent)',animation:'lightning 0.4s ease both',filter:'blur(2px)',boxShadow:'0 0 10px #f39c12, 0 0 20px #e74c3c'}}/></div>)}
function FloatingNumber({value,color,onDone}){useEffect(()=>{const id=setTimeout(onDone,900);return()=>clearTimeout(id)},[]);return(<div style={{position:'absolute',top:'10%',left:'50%',transform:'translateX(-50%)',fontFamily:'var(--jp)',fontSize:'1.4rem',fontWeight:900,color,textShadow:`0 0 10px ${color}`,animation:'floatUp 0.9s ease both',pointerEvents:'none',zIndex:10,whiteSpace:'nowrap'}}>{value}</div>)}
function RoundBanner({roundNum,lang}){const t=(uk,en)=>lang==='en'?en:uk;return(<div style={{position:'fixed',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2500}}><div style={{textAlign:'center',animation:'roundBanner 1.8s ease both'}}><div style={{fontFamily:'var(--jp)',fontSize:'clamp(1.5rem,6vw,3rem)',fontWeight:900,color:'#b8860b',textShadow:'0 0 30px rgba(184,134,11,0.8), 0 4px 8px rgba(0,0,0,0.8)',letterSpacing:'0.2em',textTransform:'uppercase'}}>{t('Раунд','Round')} {roundNum}</div><div style={{fontFamily:'var(--jp)',fontSize:'clamp(0.8rem,3vw,1.2rem)',color:'rgba(255,255,255,0.7)',letterSpacing:'0.3em',marginTop:4}}>— {t('БІЙ','FIGHT')} —</div></div></div>)}

function HPBar({hp,armor=0,flash=null}){
  const pct=Math.max(0,(hp/MAX_HP)*100)
  const color=pct>60?'#1a6b5c':pct>30?'#b8860b':'#c0392b'
  const isLow=pct<=30
  const flashAnim=flash==='damage'?'flashRed 0.4s ease':flash==='heal'?'flashGreen 0.4s ease':flash==='armor'?'flashBlue 0.4s ease':undefined
  return(<div style={{animation:flashAnim}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:4,gap:8}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)'}}>HP</span><span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,color,animation:isLow?'lowHpPulse 1s ease infinite':undefined}}>{hp}/{MAX_HP}</span></div>{armor>0&&<div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(31,97,141,0.15)',border:'1px solid rgba(31,97,141,0.4)',borderRadius:3,padding:'1px 7px',animation:'glowPulse 2s ease infinite'}}><span style={{fontSize:'0.7rem'}}>🛡</span><span style={{fontFamily:'var(--jp)',fontSize:'0.75rem',fontWeight:700,color:'#1f618d'}}>{armor}</span></div>}</div><div style={{height:8,background:'var(--bg2)',borderRadius:4,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:4,transition:'width 0.6s cubic-bezier(.4,0,.2,1)'}}/></div></div>)
}

// ── GameCard ─────────────────────────────────────────────────
function GameCard({card,selected,onClick,disabled,small,showBack,lang='uk',isNew=false}){
  const [hovered,setHovered]=useState(false)
  if(!card)return null
  if(showBack)return(<div style={{width:small?'clamp(70px,16vw,92px)':150,height:small?'clamp(105px,24vw,138px)':225,borderRadius:8,background:'linear-gradient(135deg,#1a1a2e,#0f3460)',border:'2px solid #b8860b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:'1.2rem',opacity:0.5}}>相</span></div>)
  const color=card.color||'#b8860b'
  const hoverColor=color==='var(--mid)'?'#888':color
  const canHover=!disabled&&!selected
  const w=small?'clamp(70px,16vw,92px)':150
  const h=small?'clamp(105px,24vw,138px)':225
  return(
    <div onClick={disabled?undefined:onClick} onMouseEnter={()=>canHover&&setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{width:w,height:h,borderRadius:8,overflow:'hidden',cursor:disabled?'default':'pointer',flexShrink:0,border:`2px solid ${selected?'#b8860b':hovered?hoverColor:'transparent'}`,boxShadow:selected?'0 0 18px rgba(184,134,11,0.8)':hovered&&!disabled?`0 6px 16px rgba(0,0,0,0.25), 0 0 8px ${hoverColor}77`:'0 2px 8px rgba(0,0,0,0.18)',transition:'all 0.15s',opacity:disabled?0.75:1,transform:selected?'translateY(-4px) scale(1.04)':hovered&&!disabled?'translateY(-3px) scale(1.02)':'none',animation:isNew?'cardFlip 0.35s ease both':undefined,background:'#1a1a1a'}}>
      <img src={`/cards/${getCardSkinId(card.id)}_${lang}.png`} alt={card.id} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={e=>{e.currentTarget.style.display='none'}}/>
    </div>
  )
}

// ── CardBook — перелік усіх карток ───────────────────────────
function CardBook({lang,onClose}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [filter,setFilter]=useState('all')
  const [selected,setSelected]=useState(null)

  const typeFilters=[
    {key:'all',   label:t('Всі','All')},
    {key:'rikishi',label:t('Рікіші','Rikishi')},
    {key:'heal',   label:t('Хіл','Heal')},
    {key:'armor',  label:t('Броня','Armor')},
    {key:'strike', label:t('Удар','Strike')},
    {key:'swap',   label:t('Заміна','Swap')},
    {key:'salt',   label:t('Сіль','Salt')},
    {key:'henka',  label:t('Хенка','Henka')},
  ]

  const rankFilters=[
    {key:'Yokozuna', label:'Yokozuna', color:'#b8860b'},
    {key:'Ozeki',    label:'Ozeki',    color:'#8b1a1a'},
    {key:'Sekiwake', label:'Sekiwake', color:'#1a4a7a'},
    {key:'Komusubi', label:'Komusubi', color:'#1f7a3a'},
    {key:'Maegashira',label:'Maegashira',color:'#6f6f6f'},
  ]

  const visibleCards = filter==='all' ? FULL_DECK : FULL_DECK.filter(c=>c.type===filter||c.rank===filter)

  // Унікальні картки (прибираємо дублікати heal/armor/strike/swap)
  const uniqueCards = visibleCards.filter((c,i,arr)=>arr.findIndex(x=>x.label===c.label&&x.type===c.type)===i||c.type==='rikishi')

  function getTypeInfo(card){
    const info=CARD_TYPES_INFO.find(t=>t.type===card.type)
    return info||null
  }

  const rankOrder={Yokozuna:0,Ozeki:1,Sekiwake:2,Komusubi:3,Maegashira:4}
  const sorted=[...uniqueCards].sort((a,b)=>{
    if(a.type==='rikishi'&&b.type==='rikishi'){
      const rd=(rankOrder[a.rank]||99)-(rankOrder[b.rank]||99)
      if(rd!==0)return rd
      return a.id.localeCompare(b.id)
    }
    if(a.type==='rikishi')return -1
    if(b.type==='rikishi')return 1
    return 0
  })

  useEffect(()=>{
    Promise.all(FULL_DECK.map(card=>
      fetch(`/cards/${card.id}_${lang}.png`,{method:'HEAD'})
        .then(r=>({id:card.id,ok:r.ok}))
        .catch(()=>({id:card.id,ok:false}))
    )).then(results=>{
      const found=results.filter(r=>r.ok).map(r=>r.id)
      const missing=results.filter(r=>!r.ok).map(r=>r.id)
      console.log(`%c✅ Скіни є (${found.length}):`, 'color:green;font-weight:bold', found.join(', '))
      console.log(`%c❌ Скіни відсутні (${missing.length}):`, 'color:red;font-weight:bold', missing.join(', '))
    })
  },[lang])

  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
      {/* Header */}
      <div style={{padding:'0.75rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>📖 {t('Колода карт','Card Book')} <span style={{color:'var(--mid)',fontWeight:400}}>({sorted.length})</span></div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',padding:0}}>✕ {t('Закрити','Close')}</button>
      </div>

      {/* Filters */}
      <div style={{padding:'0.5rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',gap:4,flexWrap:'wrap',flexShrink:0}}>
        {typeFilters.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'3px 10px',background:filter===f.key?'#b8860b':'var(--bg2)',color:filter===f.key?'#fff':'var(--mid)',border:`1px solid ${filter===f.key?'#b8860b':'var(--border)'}`,borderRadius:20,fontFamily:'var(--jp)',fontSize:'0.58rem',cursor:'pointer',fontWeight:filter===f.key?700:400,transition:'all 0.15s'}}>
            {f.label}
          </button>
        ))}
        {filter==='rikishi'&&rankFilters.map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'3px 10px',background:filter===f.key?f.color:'var(--bg2)',color:filter===f.key?'#fff':'var(--mid)',border:`1px solid ${f.color}`,borderRadius:20,fontFamily:'var(--jp)',fontSize:'0.58rem',cursor:'pointer'}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      <div style={{flex:1,overflowY:'auto',padding:'0.75rem',display:'flex',flexWrap:'wrap',gap:8,alignContent:'flex-start'}}>
        {sorted.map(card=>(
          <div key={card.id} onClick={()=>setSelected(card)} style={{cursor:'pointer',animation:'fadeIn 0.2s ease',borderRadius:10,transition:'all 0.15s'}}>
            <GameCard card={card} lang={lang} small disabled/>
          </div>
        ))}
      </div>

      {/* Modal overlay */}
      {selected&&(
        <div onClick={()=>setSelected(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',animation:'fadeIn 0.15s ease'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:`2px solid ${selected.color||'#b8860b'}`,borderRadius:12,display:'flex',gap:0,overflow:'hidden',maxHeight:'90%',animation:'pop 0.2s ease',boxShadow:`0 0 40px ${selected.color||'#b8860b'}44`}}>
            {/* Картинка — велика, БЕЗ overlay */}
            <div style={{width:420,flexShrink:0,background:'#111',minHeight:570}}>
              <img
                src={`/cards/${getCardSkinId(selected.id)}_${lang}.png`}
                alt={selected.id}
                style={{width:'100%',height:'100%',objectFit:'cover',display:'block',minHeight:570}}
                onError={e=>{e.currentTarget.style.display='none'}}
              />
            </div>

            {/* Info панель */}
            <div style={{width:330,padding:'1.75rem',overflowY:'auto',display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,color:selected.color||'#b8860b'}}>{selected.id}</div>
                  {selected.rank&&<div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2}}>{selected.rank}</div>}
                </div>
                <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
              </div>

              {/* Лор */}
              {getCardLore(selected,lang)?(
                <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',color:'var(--ink)',lineHeight:1.9,fontStyle:'italic',padding:'1rem 1.1rem',background:'var(--bg2)',borderRadius:8,borderLeft:`3px solid ${selected.color||'#b8860b'}`,flex:1}}>
                  "{getCardLore(selected,lang)}"
                </div>
              ):(
                <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.8,padding:'1rem',background:'var(--bg2)',borderRadius:8,flex:1}}>
                  {getCardDesc(selected,lang)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AudioControls({sfxOn,musicOn,currentTheme,onToggleSfx,onToggleMusic,onThemeChange,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [showThemes,setShowThemes]=useState(false)
  return(<div style={{position:'relative',display:'flex',gap:6,alignItems:'center'}}>
    <button onClick={onToggleSfx} style={{background:sfxOn?'rgba(184,134,11,0.2)':'var(--bg2)',border:`1px solid ${sfxOn?'#b8860b':'var(--border)'}`,color:sfxOn?'#b8860b':'var(--mid)',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontFamily:'var(--jp)',fontSize:'0.6rem'}}>{sfxOn?'🔊':'🔇'} {t('Звук','SFX')}</button>
    <button onClick={()=>{onToggleMusic();setShowThemes(false)}} style={{background:musicOn?'rgba(184,134,11,0.2)':'var(--bg2)',border:`1px solid ${musicOn?'#b8860b':'var(--border)'}`,color:musicOn?'#b8860b':'var(--mid)',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontFamily:'var(--jp)',fontSize:'0.6rem'}}>🎵 {t('Музика','Music')}</button>
    <button onClick={()=>setShowThemes(v=>!v)} style={{background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontFamily:'var(--jp)',fontSize:'0.6rem'}}>🎼</button>
    {showThemes&&(<div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'100%',right:0,marginTop:4,background:'var(--card)',border:'1px solid var(--border)',borderRadius:4,padding:'0.5rem',zIndex:10,minWidth:160,boxShadow:'0 4px 12px rgba(0,0,0,0.3)'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:6,letterSpacing:'0.1em'}}>{t('Тема','Theme')}</div>
      {MUSIC_THEMES.map(th=>(<div key={th.id} onClick={()=>{onThemeChange(th.id);setShowThemes(false)}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'4px 6px',borderRadius:3,cursor:'pointer',marginBottom:2,background:currentTheme===th.id?'rgba(184,134,11,0.2)':'transparent',border:`1px solid ${currentTheme===th.id?'#b8860b':'transparent'}`}}>
        <div><div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',fontWeight:700,color:currentTheme===th.id?'#b8860b':'var(--ink)'}}>{lang==='en'?th.label.en:th.label.uk}</div><div style={{fontFamily:'var(--jp)',fontSize:'0.52rem',color:'var(--mid)'}}>{lang==='en'?th.desc.en:th.desc.uk}</div></div>
        {currentTheme===th.id&&<span style={{color:'#b8860b'}}>✓</span>}
      </div>))}
    </div>)}
  </div>)
}

function CardGuide({lang}){
  const [open,setOpen]=useState(false)
  const t=(uk,en)=>lang==='en'?en:uk
  return(<div style={{marginBottom:'0.75rem'}}>
    <button onClick={()=>setOpen(o=>!o)} style={{background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.62rem',padding:'4px 10px',borderRadius:4,cursor:'pointer'}}>{open?'▲':'▼'} {t('Типи карт','Card types')}</button>
    {open&&(<div style={{marginTop:6,background:'var(--bg2)',borderRadius:4,padding:'0.75rem',display:'flex',flexDirection:'column',gap:6,animation:'slideIn 0.2s ease'}}>
      {CARD_TYPES_INFO.map(ct=>(<div key={ct.type} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
        <span style={{fontSize:'1rem',flexShrink:0,width:22}}>{ct.emoji}</span>
        <div><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',fontWeight:700,color:'var(--ink)',marginBottom:1}}>{lang==='en'?ct.label.en:ct.label.uk}</div><div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'var(--mid)',lineHeight:1.4}}>{lang==='en'?ct.desc.en:ct.desc.uk}</div></div>
      </div>))}
    </div>)}
  </div>)
}

function SwapScreen({hand,drawOptions,onSwap,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [selected,setSelected]=useState(null)
  return(<div style={{animation:'slideIn 0.25s ease'}}>
    <div style={{fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>🔄 {t('Заміна','Swap')}</div>
    <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Оберіть карту з колоди','Choose from deck')}</div>
    <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:'1.25rem'}}>{drawOptions.map((c,i)=>c&&<div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} selected={selected?.id===c.id} onClick={()=>setSelected(c)} lang={lang}/></div>)}</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:'1rem'}}>{hand.filter(c=>c.type!=='swap').map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}{selected&&<GameCard card={selected} small lang={lang} isNew/>}</div>
    <button onClick={()=>selected&&onSwap(selected)} disabled={!selected} style={{width:'100%',padding:'0.75rem',background:selected?'#27ae60':'var(--bg2)',color:selected?'#fff':'var(--mid)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.82rem',letterSpacing:'0.1em',cursor:selected?'pointer':'default',fontWeight:700}}>{selected?t('Підтвердити','Confirm'):t('Оберіть','Select')}</button>
  </div>)
}

// ── HP бар над картками ──────────────────────────────────────
function HPFlask({hp, armor=0, flash=null, label, color='#1a6b5c', align='left'}){
  const pct = Math.max(0, Math.min(100, (hp/MAX_HP)*100))
  const liquidColor = pct>60?'#1a9b6c':pct>30?'#c8a000':'#c0392b'
  const glowColor   = pct>60?'#1a9b6c':pct>30?'#f0c060':'#e74c3c'
  const isLow = pct<=30
  const flashAnim = flash?'hpFlash 0.4s ease':undefined
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4,animation:flashAnim,width:'100%'}}>
      {/* Назва + HP */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,220,150,0.9)',textTransform:'uppercase',letterSpacing:'0.06em',textShadow:'0 1px 4px rgba(0,0,0,1)'}}>{label}</span>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {armor>0&&<div style={{display:'flex',alignItems:'center',gap:2,background:'rgba(31,97,141,0.85)',border:'1px solid rgba(100,180,255,0.5)',borderRadius:3,padding:'0px 5px'}}><span style={{fontSize:'0.55rem'}}>🛡</span><span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',fontWeight:700,color:'#7ec8f0'}}>{armor}</span></div>}
          <span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:900,color:glowColor,textShadow:`0 0 8px ${glowColor}`,animation:isLow?'lowHpPulse 1s ease infinite':undefined}}>{hp}<span style={{fontSize:'0.55rem',color:'rgba(255,255,255,0.4)'}}>/{MAX_HP}</span></span>
        </div>
      </div>
      {/* Горизонтальна колба */}
      <div style={{position:'relative',height:14,borderRadius:7,background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden',boxShadow:`0 0 8px ${glowColor}33`}}>
        <div style={{position:'absolute',inset:0,width:`${pct}%`,background:`linear-gradient(90deg,${liquidColor}aa,${liquidColor})`,borderRadius:7,transition:'width 0.6s cubic-bezier(.4,0,.2,1)',animation:isLow?'lowHpPulse 1s ease infinite':undefined}}/>
        {/* Відблиск */}
        <div style={{position:'absolute',top:1,left:0,right:0,height:4,background:'linear-gradient(180deg,rgba(255,255,255,0.15),transparent)',borderRadius:7,pointerEvents:'none'}}/>
        {/* Ризки */}
        {[25,50,75].map(m=><div key={m} style={{position:'absolute',top:0,bottom:0,left:`${m}%`,width:1,background:'rgba(255,255,255,0.06)'}}/>)}
      </div>
    </div>
  )
}

function RoundResult({myCard,oppCard,roundLog,myLabel,oppLabel,onNext,roundNum,lang,myHpDelta,oppHpDelta,myArmorDelta,oppArmorDelta,myHp,oppHp,myArmor,oppArmor,myFlash,oppFlash}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [step,setStep]=useState(0)
  const [showMyFloat,setShowMyFloat]=useState(false)
  const [showOppFloat,setShowOppFloat]=useState(false)
  const [showLightning,setShowLightning]=useState(false)
  const [showSalt,setShowSalt]=useState(false)
  const [showHenka,setShowHenka]=useState(false)
  useEffect(()=>{
    const t1=setTimeout(()=>setStep(1),100)
    const t2=setTimeout(()=>{setStep(2);if(myCard?.type==='strike'||oppCard?.type==='strike')setShowLightning(true);if(myCard?.type==='salt'||oppCard?.type==='salt')setShowSalt(true);if(myCard?.type==='henka'||oppCard?.type==='henka')setShowHenka(true);setTimeout(()=>{setShowLightning(false);setShowSalt(false);setShowHenka(false)},800);if(myHpDelta!==0||myArmorDelta!==0)setShowMyFloat(true);if(oppHpDelta!==0||oppArmorDelta!==0)setShowOppFloat(true)},600)
    const t3=setTimeout(()=>setStep(3),1000)
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
  },[])
  const myFloatVal=myHpDelta>0?`+${myHpDelta} HP`:myHpDelta<0?`${myHpDelta} HP`:myArmorDelta>0?`+${myArmorDelta} 🛡`:null
  const oppFloatVal=oppHpDelta>0?`+${oppHpDelta} HP`:oppHpDelta<0?`${oppHpDelta} HP`:oppArmorDelta>0?`+${oppArmorDelta} 🛡`:null
  const myFloatColor=myHpDelta>0?'#1a6b5c':myHpDelta<0?'#e74c3c':'#1f618d'
  const oppFloatColor=oppHpDelta>0?'#1a6b5c':oppHpDelta<0?'#e74c3c':'#1f618d'
  const doShake=myHpDelta<0||oppHpDelta<0

  return(<div style={{animation:doShake&&step>=2?'shake 0.4s ease':undefined}}>

    {/* ── Арена: карти по боках + дохьо між ними ── */}
    <div style={{display:'flex',alignItems:'stretch',gap:0,marginBottom:'0.75rem',opacity:step>=1?1:0,transition:'opacity 0.3s'}}>

      {/* Ліво: HP бар + карта */}
      <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center',flexShrink:0,padding:'0 8px 0 0'}}>
        <HPFlask hp={myHp} armor={myArmor} flash={myFlash} label={myLabel}/>
        <div style={{animation:step>=1?'clash 0.5s ease 0.2s both':'none',position:'relative'}}>
          <GameCard card={myCard} disabled lang={lang}/>
          {showSalt&&myCard?.type==='salt'&&<SaltParticles/>}
          {showHenka&&myCard?.type==='henka'&&<HenkaSwirl/>}
          {showLightning&&myCard?.type==='strike'&&<LightningEffect/>}
          {showMyFloat&&myFloatVal&&<FloatingNumber value={myFloatVal} color={myFloatColor} onDone={()=>setShowMyFloat(false)}/>}
        </div>
      </div>

      {/* Центр: дохьо з обрізкою по висоті карток */}
      <div style={{flex:1,position:'relative',minWidth:0,overflow:'hidden',borderRadius:8}}>
        <img src="/images/sumo-dohyo.png" alt="dohyo" style={{
          width:'100%',height:'100%',
          objectFit:'cover',objectPosition:'center 25%',
          display:'block',
        }}/>
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'clamp(1.6rem,3vw,2.4rem)',fontWeight:900,color:'#f0c060',textShadow:'0 0 30px rgba(240,192,96,1), 0 2px 8px rgba(0,0,0,1)',letterSpacing:'0.15em',animation:step>=1?'pop 0.4s ease 0.4s both':'none'}}>VS</div>
        </div>
      </div>

      {/* Право: HP бар + карта */}
      <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center',flexShrink:0,padding:'0 0 0 8px'}}>
        <HPFlask hp={oppHp} armor={oppArmor} flash={oppFlash} label={oppLabel}/>
        <div style={{animation:step>=1?'clashR 0.5s ease 0.2s both':'none',position:'relative'}}>
          <GameCard card={oppCard} disabled lang={lang}/>
          {showSalt&&oppCard?.type==='salt'&&<SaltParticles/>}
          {showHenka&&oppCard?.type==='henka'&&<HenkaSwirl/>}
          {showLightning&&oppCard?.type==='strike'&&<LightningEffect/>}
          {showOppFloat&&oppFloatVal&&<FloatingNumber value={oppFloatVal} color={oppFloatColor} onDone={()=>setShowOppFloat(false)}/>}
        </div>
      </div>

    </div>

    {/* Лог */}
    <div style={{background:'var(--bg2)',borderRadius:4,padding:'0.6rem 1rem',marginBottom:'0.75rem',opacity:step>=2?1:0,transform:step>=2?'none':'translateY(8px)',transition:'all 0.3s'}}>
      {roundLog.length===0
        ?<div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'var(--mid)'}}>—</div>
        :roundLog.map((l,i)=><div key={i} style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:l.color,lineHeight:1.7,animation:`fadeIn 0.3s ease ${0.08*i}s both`}}>{l.text}</div>)
      }
    </div>

    <button onClick={onNext} style={{width:'100%',padding:'0.75rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.82rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,opacity:step>=3?1:0,transform:step>=3?'none':'translateY(8px)',transition:'all 0.3s'}}>
      {roundNum>=MAX_ROUNDS?t('Результат','Results'):t('Наступний раунд ›','Next round ›')}
    </button>
  </div>)
}

function BattleLayout({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,roundNum,myLabel,oppLabel,myHand,oppHand,playerSelected,onSelect,myReady,oppReady,onSubmit,roundLog,phase,onNext,lang,myCard,oppCard,drawPile,onSwapDone,mySkipped,sfx,myHpDelta,oppHpDelta,myArmorDelta,oppArmorDelta,myFlash,oppFlash,showRoundBanner}){
  const t=(uk,en)=>lang==='en'?en:uk
  const isRoundResult=phase==='roundResult'
  const [swapping,setSwapping]=useState(false)
  const [swapOptions,setSwapOptions]=useState([])
  const deduped=arr=>[...new Map(arr.filter(Boolean).map(c=>[c.id,c])).values()]
  function activateSwap(){if(sfx)sfx('swap');const pool=drawPile.filter(c=>!myHand.find(h=>h.id===c.id)).slice(0,DRAFT_POOL_SIZE);setSwapOptions(pool);setSwapping(true)}
  function doSwap(card){setSwapping(false);onSwapDone(card)}
  if(swapping)return <SwapScreen hand={myHand} drawOptions={swapOptions} onSwap={doSwap} lang={lang}/>
  return(<div style={{animation:'slideIn 0.25s ease'}}>
    {showRoundBanner&&<RoundBanner roundNum={roundNum} lang={lang}/>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',color:'var(--mid)'}}>{t('Раунд','Round')} {roundNum}/{MAX_ROUNDS}</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)'}}>{myWins}–{oppWins}</div>
    </div>
    {mySkipped&&<div style={{background:'rgba(127,140,141,0.15)',border:'1px solid #7f8c8d',borderRadius:4,padding:'0.5rem 0.75rem',marginBottom:'0.75rem',fontFamily:'var(--jp)',fontSize:'0.72rem',color:'#7f8c8d',textAlign:'center',animation:'pulse 1s ease 2'}}>🧂 {t('Ви пропускаєте цей хід!','You skip this turn!')}</div>}
    {!isRoundResult&&(
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:'1rem'}}>
      <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{myLabel}</div><HPBar hp={myHp} armor={myArmor} flash={myFlash}/></div>
      <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'#c0392b',marginBottom:6,textTransform:'uppercase',fontWeight:700}}>{oppLabel}</div><HPBar hp={oppHp} armor={oppArmor} flash={oppFlash}/></div>
    </div>
    )}
    {isRoundResult?(
      <RoundResult myCard={myCard} oppCard={oppCard} roundLog={roundLog} myLabel={myLabel} oppLabel={oppLabel} onNext={onNext} roundNum={roundNum} lang={lang} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myFlash={myFlash} oppFlash={oppFlash}/>
    ):(
      <>
        <div style={{marginBottom:'0.75rem'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8,letterSpacing:'0.08em'}}>{t('Ваша рука','Your hand')} ({deduped(myHand).length}) · {t('Колода','Deck')}: {drawPile.length}</div>
          <div style={{display:'flex',gap:'clamp(3px,1vw,8px)',flexWrap:'nowrap',overflowX:'auto',paddingBottom:4,paddingTop:8,justifyContent:'center',scrollbarWidth:'none'}}>
            {deduped(myHand).map((c,i)=>(<div key={c.id} style={{animation:`slideIn 0.2s ease ${i*0.05}s both`,position:'relative',flexShrink:0}}>
              {c.type==='swap'&&!myReady?(
                <><GameCard card={c} small selected={false} onClick={activateSwap} disabled={myReady} lang={lang}/><div style={{position:'absolute',bottom:-14,left:'50%',transform:'translateX(-50%)',fontFamily:'var(--jp)',fontSize:'0.4rem',color:'#27ae60',whiteSpace:'nowrap'}}>{t('активувати','tap')}</div></>
              ):(
                <GameCard card={c} small selected={playerSelected?.id===c.id} onClick={()=>{if(!myReady&&c.type!=='swap'){if(sfx)sfx('click');onSelect(c)}}} disabled={myReady||c.type==='swap'||mySkipped} lang={lang}/>
              )}
            </div>))}
          </div>
        </div>
        <div style={{marginBottom:'0.75rem',marginTop:'0.5rem',display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{oppLabel}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:700,color:'var(--ink)',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 10px'}}>🂠 {oppHand}</div>
        </div>
        {oppReady&&!myReady&&<div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'#1a6b5c',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>✓ {t('Суперник готовий','Opponent ready')}</div>}
        {myReady&&<div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'var(--mid)',marginBottom:'0.75rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting...')}</div>}
        <div style={{position:'sticky',bottom:0,background:'var(--card)',paddingTop:8,marginTop:4}}>
          <button onClick={()=>{if(sfx)sfx('click');onSubmit()}} disabled={(!playerSelected&&!mySkipped)||myReady} style={{width:'100%',padding:'0.8rem',background:((!playerSelected&&!mySkipped)||myReady)?'var(--bg2)':'#b8860b',color:((!playerSelected&&!mySkipped)||myReady)?'var(--mid)':'#fff',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:((!playerSelected&&!mySkipped)||myReady)?'default':'pointer',fontWeight:700}}>
            {myReady?t('Підтверджено ✓','Confirmed ✓'):mySkipped?t('⏩ Пропустити хід','⏩ Skip turn'):!playerSelected?t('Оберіть карту','Select a card'):t('⚔ Підтвердити','⚔ Confirm')}
          </button>
        </div>
      </>
    )}
  </div>)
}

function GameOverScreen({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,myLabel,oppLabel,onBack,lang,sfx}){
  const t=(uk,en)=>lang==='en'?en:uk
  const playerWon=myHp>oppHp||(myHp>0&&oppHp<=0)
  const isKachiKoshi=myWins>oppWins
  const ties=MAX_ROUNDS-myWins-oppWins
  const isKyujo=(oppHp<=0&&myHp>0)||(myHp<=0&&oppHp>0)
  useEffect(()=>{if(sfx)sfx(playerWon?'win':'lose')},[])
  let title,subtitle
  if(isKyujo&&playerWon){title=t('Кюджо суперника!','Opponent Kyujo!');subtitle=t('Ви змусили суперника визнати кюджо','You forced your opponent to withdraw — Kyujo!')}
  else if(isKyujo&&!playerWon){title=t('Кюджо!','Kyujo!');subtitle=t('Ви повертаєтесь до стайні','You withdraw to your stable to recover.')}
  else if(playerWon){title=t('Юшо!','Yusho!');subtitle=t('Ви перемогли!','You win!')}
  else{title=t('Маке-коші','Make-koshi');subtitle=t('Суперник переміг.','Opponent wins.')}
  return(<div style={{textAlign:'center',animation:'slideIn 0.3s ease'}}>
    <div style={{fontSize:'3.5rem',marginBottom:'0.5rem',animation:'pop 0.5s ease'}}>{isKyujo&&playerWon?'🏆':isKyujo&&!playerWon?'🏥':playerWon?'🏆':'💪'}</div>
    <div style={{fontFamily:'var(--jp)',fontSize:'1.4rem',fontWeight:800,color:playerWon?'#b8860b':'#c0392b',marginBottom:'0.5rem'}}>{title}</div>
    <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'var(--mid)',marginBottom:'1rem',lineHeight:1.5,padding:'0 1rem'}}>{subtitle}</div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'1rem 0'}}>
      <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(26,107,92,0.3)'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'#1a6b5c',marginBottom:4}}>{myLabel}</div><HPBar hp={myHp} armor={myArmor}/></div>
      <div style={{background:'var(--bg2)',padding:'0.75rem',borderRadius:4,border:'1px solid rgba(192,57,43,0.3)'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'#c0392b',marginBottom:4}}>{oppLabel}</div><HPBar hp={oppHp} armor={oppArmor}/></div>
    </div>
    <div style={{background:'var(--bg2)',padding:'1rem',borderRadius:4,marginBottom:'1.25rem'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'var(--mid)',marginBottom:6}}>{t('Раунди','Rounds')}: {myWins}W – {oppWins}L – {ties}D</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:800,color:isKachiKoshi?'#1a6b5c':'#c0392b'}}>{isKachiKoshi?'勝ち越し Kachi-koshi':'負け越し Make-koshi'}</div>
    </div>
    <button onClick={onBack} style={{background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,padding:'0.8rem 2.5rem',fontFamily:'var(--jp)',fontSize:'0.85rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700}}>{t('В меню','Menu')}</button>
  </div>)
}

// ── CPU гра — СПІЛЬНА КОЛОДА ─────────────────────────────────
function CpuGame({lang,onBack,sfx}){
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
  const [myHpDelta,setMyHpDelta]=useState(0)
  const [oppHpDelta,setOppHpDelta]=useState(0)
  const [myArmorDelta,setMyArmorDelta]=useState(0)
  const [oppArmorDelta,setOppArmorDelta]=useState(0)
  const [myFlash,setMyFlash]=useState(null)
  const [oppFlash,setOppFlash]=useState(null)
  const [showRoundBanner,setShowRoundBanner]=useState(false)

  useEffect(()=>{
    // СПІЛЬНА КОЛОДА: перемішуємо один раз, CPU бере перші 5, гравець драфтить з решти
    const shared=shuffle(FULL_DECK)
    const cpuCards=shared.slice(0,5)
    setCpuHand(cpuCards)
    const remaining=shuffle(shared.slice(5))
    setDrawPile(remaining)
    setDraftPool(remaining.slice(0,DRAFT_POOL_SIZE))
  },[])

  function pickDraft(card){
    if(sfx)sfx('click')
    const newHand=[...playerHand,card]
    // Прибираємо всі картки поточного пулу з drawPile
    const newDraw=drawPile.filter(c=>!draftPool.find(d=>d.id===c.id))
    if(draftRound<DRAFT_ROUNDS-1){
      setPlayerHand(newHand);setDrawPile(newDraw)
      setDraftPool(newDraw.slice(0,DRAFT_POOL_SIZE));setDraftRound(r=>r+1)
    }else{
      setPlayerHand(newHand);setDrawPile(newDraw);setPhase('battle')
    }
  }
  function handleSwapDone(nc){setPlayerHand(prev=>[...prev.filter(c=>c.type!=='swap'),nc]);setDrawPile(prev=>prev.filter(c=>c.id!==nc.id))}

  function fight(){
    const pCard=playerSkip?null:playerSelected
    if(!playerSkip&&!playerSelected)return
    const cCard=cpuSkip?null:cpuChooseCard(cpuHand,playerSkip)
    const pDisplay=playerSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:playerSelected
    const cDisplay=cpuSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:cCard
    setLastMyCard(pDisplay);setLastOppCard(cDisplay)
    if(sfx){const card=pCard||cCard;if(card?.type==='rikishi')sfx('clash');else if(card?.type==='heal')sfx('heal');else if(card?.type==='armor')sfx('armor');else if(card?.type==='strike')sfx('strike');else if(card?.type==='salt')sfx('salt');else if(card?.type==='henka')sfx('henka')}
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(pCard,cCard,playerHp,cpuHp,playerArmor,cpuArmor,playerSkip,cpuSkip)
    const pHpD=newPHp-playerHp;const oHpD=newOHp-cpuHp
    const pArD=newPArmor-playerArmor;const oArD=newOArmor-cpuArmor
    setMyHpDelta(pHpD);setOppHpDelta(oHpD);setMyArmorDelta(pArD);setOppArmorDelta(oArD)
    setMyFlash(pHpD<0?'damage':pHpD>0?'heal':pArD>0?'armor':null)
    setOppFlash(oHpD<0?'damage':oHpD>0?'heal':oArD>0?'armor':null)
    setPlayerHp(newPHp);setCpuHp(newOHp);setPlayerArmor(newPArmor);setCpuArmor(newOArmor);setRoundLog(logs)
    setPlayerSkip(pNextSkip);setCpuSkip(oNextSkip)
    if(roundWinner==='p')setPlayerWins(w=>w+1);else if(roundWinner==='o')setCpuWins(w=>w+1)
    // СПІЛЬНА КОЛОДА: використані картки видаляються, решта — спільний пул
    let usedIds=new Set([pCard?.id,cCard?.id].filter(Boolean))
    let newPH=playerSkip?playerHand:playerHand.filter(c=>c.id!==playerSelected?.id)
    let newCH=cpuSkip?cpuHand:(cCard?cpuHand.filter(c=>c.id!==cCard.id):cpuHand)
    let newDraw=drawPile.filter(c=>!usedIds.has(c.id))
    // Добір: гравець і CPU беруть по картці зі спільного draw pile
    if(newDraw.length>0){newPH=[...newPH,newDraw[0]];newDraw=newDraw.slice(1)}
    if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
    setPlayerHand(newPH);setCpuHand(newCH);setDrawPile(newDraw)
    if(newPHp<=0||newOHp<=0){setPhase('gameOver');return}
    setPhase('roundResult')
  }

  function nextRound(){
    const nr=roundNum+1;setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    setMyFlash(null);setOppFlash(null);setMyHpDelta(0);setOppHpDelta(0);setMyArmorDelta(0);setOppArmorDelta(0)
    if(nr>=MAX_ROUNDS||playerHand.length===0){setPhase('gameOver');return}
    setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900)
    setPhase('battle')
  }

  const oya1=t('Ояката 1','Oyakata 1');const cpu=t('CPU (Ояката 2)','CPU (Oyakata 2)')
  return(<div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
    <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>‹ {t('Назад','Back')}</button>
    <CardGuide lang={lang}/>
    {phase==='draft'&&(<div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
      {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'var(--jp)',fontSize:'0.68rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
      {playerHand.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length}/{DRAFT_ROUNDS})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>{draftPool.map((c,i)=><div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}</div>
    </div>)}
    {(phase==='battle'||phase==='roundResult')&&<BattleLayout myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} roundNum={roundNum+1} myLabel={oya1} oppLabel={cpu} myHand={playerHand} oppHand={cpuHand.length} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={false} oppReady={false} onSubmit={fight} roundLog={roundLog} phase={phase} onNext={nextRound} myCard={lastMyCard} oppCard={lastOppCard} drawPile={drawPile} onSwapDone={handleSwapDone} mySkipped={playerSkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner}/>}
    {phase==='gameOver'&&<GameOverScreen myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} myLabel={oya1} oppLabel={cpu} onBack={onBack} lang={lang} sfx={sfx}/>}
  </div>)
}

// ── Кампанія ─────────────────────────────────────────────────
function CampaignBattleWrapper({level,boostedCard,tempBoosts,onWin,onLose,onBack,lang,sfx}){
  const t=(uk,en)=>lang==='en'?en:uk
  const SANYAKU=['Yokozuna','Ozeki','Sekiwake','Komusubi']
  const [phase,setPhase]=useState('draft')
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)
  const [playerHand,setPlayerHand]=useState([])
  const [cpuHand,setCpuHand]=useState([])
  const [drawPile,setDrawPile]=useState([])
  const [playerHp,setPlayerHp]=useState(MAX_HP)
  const [cpuHp,setCpuHp]=useState(level.cpuHpMax)
  const [playerArmor,setPlayerArmor]=useState(tempBoosts?.iron_stance?5:0)
  const [cpuArmor,setCpuArmor]=useState(level.bossArmor||0)
  const [playerSelected,setPlayerSelected]=useState(null)
  const [lastMyCard,setLastMyCard]=useState(null)
  const [lastOppCard,setLastOppCard]=useState(null)
  const [roundLog,setRoundLog]=useState([])
  const [roundNum,setRoundNum]=useState(0)
  const [playerWins,setPlayerWins]=useState(0)
  const [cpuWins,setCpuWins]=useState(0)
  const [playerSkip,setPlayerSkip]=useState(false)
  const [cpuSkip,setCpuSkip]=useState(false)
  const [myHpDelta,setMyHpDelta]=useState(0)
  const [oppHpDelta,setOppHpDelta]=useState(0)
  const [myArmorDelta,setMyArmorDelta]=useState(0)
  const [oppArmorDelta,setOppArmorDelta]=useState(0)
  const [myFlash,setMyFlash]=useState(null)
  const [oppFlash,setOppFlash]=useState(null)
  const [showRoundBanner,setShowRoundBanner]=useState(false)
  const [envelopesEarned,setEnvelopesEarned]=useState(0)

  useEffect(()=>{
    // СПІЛЬНА КОЛОДА для кампанії
    const shared=shuffle(FULL_DECK.filter(level.cpuDeckFilter||(() => true)))
    const cpuCards=shared.slice(0,5)
    setCpuHand(cpuCards)
    const remaining=shuffle(FULL_DECK.filter(c=>!cpuCards.find(cc=>cc.id===c.id)))
    setDrawPile(remaining);setDraftPool(remaining.slice(0,DRAFT_POOL_SIZE))
  },[])

  function applyBoostToCard(card){if(!boostedCard||boostedCard.cardId!==card.id)return card;return{...card,atk:card.atk+(boostedCard.atk||0),def:card.def+(boostedCard.def||0)}}
  function pickDraft(card){
    if(sfx)sfx('click')
    const boosted=applyBoostToCard(card)
    const newHand=[...playerHand,boosted]
    const newDraw=drawPile.filter(c=>!draftPool.find(d=>d.id===c.id))
    if(draftRound<DRAFT_ROUNDS-1){setPlayerHand(newHand);setDrawPile(newDraw);setDraftPool(newDraw.slice(0,DRAFT_POOL_SIZE));setDraftRound(r=>r+1)}
    else{setPlayerHand(newHand);setDrawPile(newDraw);setPhase('battle')}
  }
  function handleSwapDone(nc){setPlayerHand(prev=>[...prev.filter(c=>c.type!=='swap'),nc]);setDrawPile(prev=>prev.filter(c=>c.id!==nc.id))}
  function checkEnvelope(pCard,cCard,roundWinner){if(roundWinner==='p'&&pCard&&cCard&&SANYAKU.includes(pCard.rank)&&SANYAKU.includes(cCard.rank)){setEnvelopesEarned(e=>e+1)}}

  function fight(){
    const pCard=playerSkip?null:playerSelected
    if(!playerSkip&&!playerSelected)return
    const pCardFinal=pCard&&tempBoosts?.battle_spirit>0?{...pCard,atk:(pCard.atk||0)+2}:pCard
    const cCard=cpuSkip?null:cpuChooseCard(cpuHand,playerSkip)
    const pDisplay=playerSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:playerSelected
    setLastMyCard(pDisplay);setLastOppCard(cpuSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:cCard)
    if(sfx){const card=pCardFinal||cCard;if(card?.type==='rikishi')sfx('clash');else if(card?.type==='heal')sfx('heal');else if(card?.type==='armor')sfx('armor');else if(card?.type==='strike')sfx('strike');else if(card?.type==='salt')sfx('salt');else if(card?.type==='henka')sfx('henka')}
    const waterShield=tempBoosts?.water_shield>0&&roundNum===0
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(pCardFinal,cCard,playerHp,cpuHp,playerArmor,cpuArmor,playerSkip,cpuSkip)
    const finalPHp=waterShield&&newPHp<playerHp?playerHp:newPHp
    checkEnvelope(pCardFinal,cCard,roundWinner)
    const pHpD=finalPHp-playerHp;const oHpD=newOHp-cpuHp;const pArD=newPArmor-playerArmor;const oArD=newOArmor-cpuArmor
    setMyHpDelta(pHpD);setOppHpDelta(oHpD);setMyArmorDelta(pArD);setOppArmorDelta(oArD)
    setMyFlash(pHpD<0?'damage':pHpD>0?'heal':pArD>0?'armor':null)
    setOppFlash(oHpD<0?'damage':oHpD>0?'heal':oArD>0?'armor':null)
    setPlayerHp(finalPHp);setCpuHp(newOHp);setPlayerArmor(newPArmor);setCpuArmor(newOArmor);setRoundLog(logs)
    setPlayerSkip(pNextSkip);setCpuSkip(oNextSkip)
    if(roundWinner==='p')setPlayerWins(w=>w+1);else if(roundWinner==='o')setCpuWins(w=>w+1)
    const usedIds=new Set([pCard?.id,cCard?.id].filter(Boolean))
    let newPH=playerSkip?playerHand:playerHand.filter(c=>c.id!==playerSelected?.id)
    let newCH=cpuSkip?cpuHand:(cCard?cpuHand.filter(c=>c.id!==cCard.id):cpuHand)
    let newDraw=drawPile.filter(c=>!usedIds.has(c.id))
    if(newDraw.length>0){newPH=[...newPH,newDraw[0]];newDraw=newDraw.slice(1)}
    if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
    setPlayerHand(newPH);setCpuHand(newCH);setDrawPile(newDraw)
    if(finalPHp<=0){onLose();return}
    if(newOHp<=0){onWin(finalPHp,MAX_HP,envelopesEarned);return}
    setPhase('roundResult')
  }

  function nextRound(){
    const nr=roundNum+1;setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    setMyFlash(null);setOppFlash(null);setMyHpDelta(0);setOppHpDelta(0);setMyArmorDelta(0);setOppArmorDelta(0)
    if(nr>=MAX_ROUNDS||playerHand.length===0){if(playerHp>cpuHp)onWin(playerHp,MAX_HP,envelopesEarned);else onLose();return}
    setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900);setPhase('battle')
  }

  const levelName=lang==='en'?level.nameEn:level.name
  return(<div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
    <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>‹ {t('Назад','Back')}</button>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.5rem'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)'}}>{level.emoji} {t('Рівень','Level')} {level.id} — {levelName}</div>
      {level.isBoss&&<div style={{fontFamily:'var(--jp)',fontSize:'0.52rem',background:'#c0392b',color:'#fff',padding:'1px 8px',borderRadius:2}}>БОС</div>}
    </div>
    <CardGuide lang={lang}/>
    {phase==='draft'&&(<div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
      {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'var(--jp)',fontSize:'0.68rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
      {playerHand.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length}/{DRAFT_ROUNDS})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>{draftPool.map((c,i)=><div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}</div>
    </div>)}
    {(phase==='battle'||phase==='roundResult')&&<BattleLayout myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} roundNum={roundNum+1} myLabel={t('Ояката','Oyakata')} oppLabel={levelName} myHand={playerHand} oppHand={cpuHand.length} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={false} oppReady={false} onSubmit={fight} roundLog={roundLog} phase={phase} onNext={nextRound} myCard={lastMyCard} oppCard={lastOppCard} drawPile={drawPile} onSwapDone={handleSwapDone} mySkipped={playerSkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner}/>}
  </div>)
}

// ── Мультиплеєр — СПІЛЬНА КОЛОДА ────────────────────────────
function MultiGame({lang,onBack,sfx}){
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
  const [prevHp,setPrevHp]=useState({my:MAX_HP,opp:MAX_HP})
  const [prevArmor,setPrevArmor]=useState({my:0,opp:0})
  const [myFlash,setMyFlash]=useState(null)
  const [oppFlash,setOppFlash]=useState(null)
  const [showRoundBanner,setShowRoundBanner]=useState(false)
  const [chatMsg,setChatMsg]=useState('')
  const [chatMessages,setChatMessages]=useState([])
  const chatEndRef=useRef(null)
  const roleRef=useRef(null);const sessionIdRef=useRef('');const processingRef=useRef(false)

  useEffect(()=>{
    if(!sessionId)return
    const dbRef=ref(db,`clash/${sessionId}`)
    const unsub=onValue(dbRef,snap=>{
      const data=snap.val();if(!data)return
      setSession(data)
      setChatMessages(data.chat?Object.values(data.chat).sort((a,b)=>a.ts-b.ts).slice(-20):[])
      if(roleRef.current==='host'&&!processingRef.current&&!data.processing&&data.status==='battle'&&data.p1?.ready===true&&data.p2?.ready===true&&data.p1?.selectedCard&&data.p2?.selectedCard){
        processingRef.current=true
        doResolveRound(data,sessionIdRef.current).then(()=>processingRef.current=false).catch(()=>processingRef.current=false)
      }
    })
    return()=>off(dbRef)
  },[sessionId])

  async function doResolveRound(data,sid){
    await update(ref(db,`clash/${sid}`),{processing:true})
    const p1Skip=data.p1?.skipNext||false;const p2Skip=data.p2?.skipNext||false
    const p1Card=p1Skip?null:getCardById(data.p1.selectedCard)
    const p2Card=p2Skip?null:getCardById(data.p2.selectedCard)
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(p1Card,p2Card,data.p1.hp,data.p2.hp,data.p1.armor||0,data.p2.armor||0,p1Skip,p2Skip)
    const newRound=(data.roundNum||0)+1
    // СПІЛЬНА КОЛОДА: видаляємо використані картки з deck
    const usedIds=new Set([data.p1.selectedCard,data.p2.selectedCard].filter(Boolean))
    const p1H=(data.p1.hand||[]).filter(id=>id!==data.p1.selectedCard)
    const p2H=(data.p2.hand||[]).filter(id=>id!==data.p2.selectedCard)
    // draw pile = спільна колода мінус руки мінус використані
    const allUsed=new Set([...p1H,...p2H,...usedIds])
    const draw=(data.deck||[]).filter(id=>!allUsed.has(id))
    let fp1=[...p1H],fp2=[...p2H]
    if(draw.length>0){fp1=[...fp1,draw[0]]}
    if(draw.length>1){fp2=[...fp2,draw[1]]}
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
    const sys1Card=p1Skip?null:getCardById(data.p1.selectedCard)
    const sys2Card=p2Skip?null:getCardById(data.p2.selectedCard)
    const p1Name=p1Skip?'⏩ Пропуск':(sys1Card?.id||'?')
    const p2Name=p2Skip?'⏩ Пропуск':(sys2Card?.id||'?')
    const sysTs=Date.now()
    await update(ref(db),{
      [`clash/${sid}/chat/${sysTs}`]:{text:`⚔️ Раунд ${newRound}: Ояката 1 → ${p1Name} | Ояката 2 → ${p2Name}`,role:'system',ts:sysTs},
      [`clash/${sid}/chat/${sysTs+1}`]:{text:roundWinner==='p'?'✅ Раунд: Ояката 1':roundWinner==='o'?'✅ Раунд: Ояката 2':'🤝 Нічия',role:'system',ts:sysTs+1},
    })
  }

  useEffect(()=>{
    if(!session||!role)return
    const mk=role==='host'?'p1':'p2';const ok=role==='host'?'p2':'p1'
    const status=session.status
    if(status==='waiting'&&role==='host'&&session.p2?.joined)update(ref(db,`clash/${sessionId}`),{status:'draft'})
    if(status==='draft'&&screen==='waiting'){setDraftPool((session[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean));setDraftRound(session[mk]?.draftRound||0);setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setScreen('draft')}
    if(status==='battle'&&screen==='draft'){setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setPlayerSelected(null);setSubmitting(false);setRoundNum(session.roundNum||0);setScreen('battle')}
    if(status==='battle'&&screen==='roundResult'){
      const newMyHp=session[mk]?.hp??MAX_HP;const newOppHp=session[ok]?.hp??MAX_HP
      const newMyAr=session[mk]?.armor??0;const newOppAr=session[ok]?.armor??0
      const mhd=newMyHp-prevHp.my;const ohd=newOppHp-prevHp.opp
      const mad=newMyAr-prevArmor.my;const oad=newOppAr-prevArmor.opp
      setMyFlash(mhd<0?'damage':mhd>0?'heal':mad>0?'armor':null)
      setOppFlash(ohd<0?'damage':ohd>0?'heal':oad>0?'armor':null)
      setPrevHp({my:newMyHp,opp:newOppHp});setPrevArmor({my:newMyAr,opp:newOppAr})
      setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean))
      setPlayerSelected(null);setSubmitting(false);setRoundNum(session.roundNum||0)
      setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900);setScreen('battle')
    }
    if(status==='roundResult'&&screen==='battle')setScreen('roundResult')
    if(status==='gameOver'&&screen!=='gameOver')setScreen('gameOver')
  },[session?.status,session?.roundNum,session?.p2?.joined,session?.battleTrigger])

  async function createSession(){
    // СПІЛЬНА КОЛОДА: одна перемішана колода для обох
    const shared=shuffle(FULL_DECK);const ids=shared.map(c=>c.id)
    // p1 і p2 беруть по 5 з початку (перші 5 — p1, наступні 5 — p2, решта — draw pile)
    const p1Pool=ids.slice(0,DRAFT_POOL_SIZE)
    const p2Pool=ids.slice(DRAFT_POOL_SIZE,DRAFT_POOL_SIZE*2)
    await set(ref(db,`clash/${generateCode()}`),null) // dummy
    const code=generateCode()
    await set(ref(db,`clash/${code}`),{status:'waiting',deck:ids,roundNum:0,roundLog:[],lastCards:null,processing:false,
      p1:{joined:true,hp:MAX_HP,armor:0,hand:[],draftPool:p1Pool,draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
      p2:{joined:false,hp:MAX_HP,armor:0,hand:[],draftPool:p2Pool,draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
    })
    setLocalDrawPile(shared.slice(DRAFT_POOL_SIZE*2))
    roleRef.current='host';sessionIdRef.current=code;setRole('host');setSessionId(code);setScreen('waiting')
  }

  async function joinSession(){
    const code=inputCode.toUpperCase().trim();if(!code)return
    const snap=await get(ref(db,`clash/${code}`));if(!snap.exists()){setError(t('Сесію не знайдено','Session not found'));return}
    const data=snap.val();if(data.p2?.joined){setError(t('Гра вже заповнена','Game is full'));return}
    await update(ref(db,`clash/${code}/p2`),{joined:true,hp:MAX_HP,armor:0,hand:[],wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false})
    const deck=data.deck.map(id=>getCardById(id)).filter(Boolean)
    setLocalDrawPile(deck.slice(DRAFT_POOL_SIZE*2))
    roleRef.current='guest';sessionIdRef.current=code;setRole('guest');setSessionId(code);setScreen('waiting')
  }

  async function pickDraft(card){
    if(sfx)sfx('click')
    const snap=await get(ref(db,`clash/${sessionId}`));const data=snap.val()
    const mk=role==='host'?'p1':'p2';const myData=data[mk]
    const currentHand=[...new Set([...(myData.hand||[]),card.id])];const newDraftRound=(myData.draftRound||0)+1;const isDone=newDraftRound>=DRAFT_ROUNDS
    const deck=data.deck
    // СПІЛЬНА КОЛОДА: наступний пул береться зі спільної колоди, обходячи вже взяті картки
    const takenIds=new Set([...(data.p1?.hand||[]),...(data.p2?.hand||[]),card.id])
    const available=deck.filter(id=>!takenIds.has(id))
    const nextPool=available.slice(0,DRAFT_POOL_SIZE)
    let updates={[`clash/${sessionId}/${mk}/hand`]:currentHand,[`clash/${sessionId}/${mk}/draftRound`]:newDraftRound,[`clash/${sessionId}/${mk}/draftDone`]:isDone}
    if(!isDone)updates[`clash/${sessionId}/${mk}/draftPool`]=nextPool
    await update(ref(db),updates)
    setPlayerHand(currentHand.map(id=>getCardById(id)).filter(Boolean));setDraftRound(newDraftRound)
    const otherKey=role==='host'?'p2':'p1'
    if(isDone&&data[otherKey]?.draftDone)await update(ref(db,`clash/${sessionId}`),{status:'battle'})
    if(!isDone)setDraftPool(nextPool.map(id=>getCardById(id)).filter(Boolean))
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
    const mk=role==='host'?'p1':'p2';const mySkip=session?.[mk]?.skipNext||false
    if(!mySkip&&!playerSelected||submitting)return
    setSubmitting(true)
    await update(ref(db,`clash/${sessionId}/${mk}`),{selectedCard:mySkip?'SKIP':(playerSelected?.id||'SKIP'),ready:true})
  }

  async function sendChat(){
    if(!chatMsg.trim()||!sessionId)return
    const msgId=Date.now()
    await update(ref(db),{[`clash/${sessionId}/chat/${msgId}`]:{text:chatMsg.trim(),role,ts:msgId}})
    setChatMsg('')
  }

  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:'smooth'})},[chatMessages])

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
  // СПІЛЬНА КОЛОДА: draw pile = всі картки мінус руки обох гравців
  const allHandIds=new Set([...(session?.p1?.hand||[]),...(session?.p2?.hand||[])])
  const deckForSwap=(session?.deck||[]).map(id=>getCardById(id)).filter(c=>c&&!allHandIds.has(c.id))
  const oya1=t('Ояката 1','Oyakata 1');const oya2=t('Ояката 2','Oyakata 2')
  const myLabel=role==='host'?oya1:oya2;const oppLabel=role==='host'?oya2:oya1
  const myHpDelta=myHp-prevHp.my;const oppHpDelta=oppHp-prevHp.opp
  const myArmorDelta=myArmor-prevArmor.my;const oppArmorDelta=oppArmor-prevArmor.opp

  return(<div style={{flex:1,overflowY:'auto',padding:'1.25rem'}}>
    <button onClick={onBack} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',marginBottom:'0.75rem',padding:0}}>‹ {t('Назад','Back')}</button>
    {(screen==='battle'||screen==='roundResult')&&<CardGuide lang={lang}/>}
    {screen==='lobby'&&(<div style={{textAlign:'center',animation:'slideIn 0.25s ease'}}>
      <div style={{fontSize:'2rem',marginBottom:'0.75rem'}}>🌐</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,marginBottom:'1.5rem'}}>{t('Мультиплеєр','Multiplayer')}</div>
      <button onClick={createSession} style={{width:'100%',padding:'0.8rem',background:'#b8860b',color:'#fff',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.8rem',letterSpacing:'0.1em',cursor:'pointer',fontWeight:700,marginBottom:'1rem'}}>{t('Створити гру (Ояката 1)','Create game (Oyakata 1)')}</button>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',marginBottom:'0.75rem'}}>{t('або','or')}</div>
      <div style={{display:'flex',gap:8,marginBottom:'0.5rem'}}>
        <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} placeholder={t('Код сесії...','Session code...')} maxLength={6} style={{flex:1,padding:'0.65rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'var(--jp)',fontSize:'0.9rem',borderRadius:4,outline:'none',letterSpacing:'0.2em',textTransform:'uppercase'}}/>
        <button onClick={joinSession} style={{padding:'0.65rem 1.25rem',background:'var(--ink)',color:'var(--bg)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.78rem',cursor:'pointer',fontWeight:700}}>{t('Ояката 2','Oyakata 2')}</button>
      </div>
      {error&&<div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'#c0392b',marginTop:4}}>{error}</div>}
    </div>)}
    {screen==='waiting'&&(<div style={{textAlign:'center',paddingTop:'2rem',animation:'slideIn 0.25s ease'}}>
      <div style={{fontSize:'2rem',marginBottom:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.8rem',color:'var(--mid)',marginBottom:'0.5rem'}}>{role==='host'?t('Ояката 1 чекає...','Oyakata 1 waiting...'):t('Ояката 2 підключається...','Oyakata 2 connecting...')}</div>
      {role==='host'&&<div style={{background:'var(--bg2)',padding:'1.5rem',borderRadius:4,display:'inline-block',animation:'pop 0.4s ease',marginTop:'1rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',marginBottom:8}}>{t('Код для Ояката 2','Code for Oyakata 2')}</div><div style={{fontFamily:'var(--jp)',fontSize:'2.8rem',fontWeight:800,color:'#b8860b',letterSpacing:'0.35em'}}>{sessionId}</div></div>}
    </div>)}
    {screen==='draft'&&(<div style={{animation:'slideIn 0.25s ease'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
      {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'var(--jp)',fontSize:'0.68rem',color:'var(--mid)',textAlign:'center',marginBottom:'1rem'}}>{t('Раунд','Round')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
      {myHandCards.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({myHandCards.length})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{[...new Map(myHandCards.filter(Boolean).map(c=>[c.id,c])).values()].map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      {!session?.[mk]?.draftDone?(
        <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>{myDraftPool.map((c,i)=>c&&<div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}</div>
      ):(<div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'var(--mid)',textAlign:'center',marginTop:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting...')}</div>)}
    </div>)}
    {(screen==='battle'||screen==='roundResult')&&<BattleLayout myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myWins={myWins} oppWins={oppWins} roundNum={totalRounds+1} myLabel={myLabel} oppLabel={oppLabel} myHand={myHandCards} oppHand={oppHandCount} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={myReady} oppReady={oppReady} onSubmit={submitCard} roundLog={session?.roundLog||[]} phase={screen} onNext={async()=>{if(role==='host')await update(ref(db,`clash/${sessionId}`),{status:'battle',battleTrigger:(session?.battleTrigger||0)+1})}} myCard={myLastCard} oppCard={oppLastCard} drawPile={deckForSwap} onSwapDone={handleSwapDone} mySkipped={mySkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner}/>}
    {(screen==='battle'||screen==='roundResult')&&(<div style={{marginTop:'1rem',border:'1px solid var(--border)',borderRadius:4,overflow:'hidden'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'var(--mid)',padding:'6px 10px',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.1em'}}>💬 {t('Чат','Chat')}</div>
      <div style={{height:120,overflowY:'auto',padding:'6px 10px',display:'flex',flexDirection:'column',gap:4}}>
        {chatMessages.length===0&&<div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'var(--light)',textAlign:'center',marginTop:16}}>{t('Напишіть суперника...','Say something...')}</div>}
        {chatMessages.map(m=>(<div key={m.ts} style={{display:'flex',gap:6,alignItems:'flex-start'}}>
          {m.role==='system'?(<span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'#b8860b',lineHeight:1.5,fontStyle:'italic',opacity:0.85,width:'100%'}}>{m.text}</span>):(
            <><span style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:m.role===role?'#1a6b5c':'#c0392b',flexShrink:0,marginTop:1}}>{m.role===role?t('Ви','You'):t('Суп.','Opp.')}</span><span style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--ink)',wordBreak:'break-word'}}>{m.text}</span></>
          )}
        </div>))}
        <div ref={chatEndRef}/>
      </div>
      <div style={{display:'flex',borderTop:'1px solid var(--border)'}}>
        <input value={chatMsg} onChange={e=>setChatMsg(e.target.value.slice(0,80))} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder={t('Повідомлення...','Message...')} style={{flex:1,padding:'6px 10px',background:'var(--bg2)',border:'none',color:'var(--ink)',fontFamily:'var(--jp)',fontSize:'0.68rem',outline:'none'}}/>
        <button onClick={sendChat} style={{padding:'6px 12px',background:'#b8860b',color:'#fff',border:'none',fontFamily:'var(--jp)',fontSize:'0.65rem',cursor:'pointer',fontWeight:700}}>→</button>
      </div>
    </div>)}
    {screen==='gameOver'&&<GameOverScreen myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myWins={myWins} oppWins={oppWins} myLabel={myLabel} oppLabel={oppLabel} onBack={onBack} lang={lang} sfx={sfx}/>}
  </div>)
}

// ── Модальне вікно "Оцінити гру" ─────────────────────────────
function ReviewModal({onClose,onSubmit,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [stars,setStars]=useState(0)
  const [hovered,setHovered]=useState(0)
  const [comment,setComment]=useState('')
  const [submitted,setSubmitted]=useState(false)

  async function handleSubmit(){
    if(stars===0)return
    await onSubmit(stars,comment)
    setSubmitted(true)
    setTimeout(onClose,1800)
  }

  if(submitted)return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
      <div style={{background:'var(--card)',border:'1px solid #b8860b',borderRadius:8,padding:'2rem',maxWidth:320,width:'90%',textAlign:'center',animation:'pop 0.3s ease'}}>
        <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🏆</div>
        <div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,color:'#b8860b'}}>{t('Дякуємо!','Thank you!')}</div>
      </div>
    </div>
  )

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'1.5rem',maxWidth:360,width:'90%',animation:'pop 0.25s ease',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
        {/* Заголовок */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,color:'var(--ink)'}}>
            🏅 {t('Оцінити гру','Rate the game')}
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
        </div>

        {/* Зірки кінбоші */}
        <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:'1rem'}}>
          {[1,2,3,4,5].map(i=>(
            <div
              key={i}
              onClick={()=>setStars(i)}
              onMouseEnter={()=>setHovered(i)}
              onMouseLeave={()=>setHovered(0)}
              style={{fontSize:'2.2rem',cursor:'pointer',transition:'transform 0.1s',transform:(hovered||stars)>=i?'scale(1.15)':'scale(1)',filter:(hovered||stars)>=i?'none':'grayscale(1) opacity(0.35)'}}
            >🏅</div>
          ))}
        </div>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',marginBottom:'1.25rem',minHeight:18}}>
          {stars===0?t('Оберіть кінбоші','Select kinboshi'):
           stars===1?t('Слабо','Weak'):
           stars===2?t('Нормально','OK'):
           stars===3?t('Добре','Good'):
           stars===4?t('Відмінно','Great'):
           t('Йокодзуна! Шедевр!','Yokozuna! Masterpiece!')}
        </div>

        {/* Коментар */}
        <textarea
          value={comment}
          onChange={e=>setComment(e.target.value.slice(0,280))}
          placeholder={t('Ваш відгук (необов\'язково)...','Your feedback (optional)...')}
          rows={3}
          style={{width:'100%',boxSizing:'border-box',padding:'0.65rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'var(--jp)',fontSize:'0.72rem',borderRadius:4,outline:'none',resize:'none',lineHeight:1.6,marginBottom:'1rem'}}
        />

        {/* Кнопки */}
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'0.7rem',background:'var(--bg2)',color:'var(--mid)',border:'1px solid var(--border)',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer'}}>
            {t('Пізніше','Later')}
          </button>
          <button onClick={handleSubmit} disabled={stars===0} style={{flex:2,padding:'0.7rem',background:stars>0?'#b8860b':'var(--bg2)',color:stars>0?'#fff':'var(--mid)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,cursor:stars>0?'pointer':'default',transition:'all 0.15s'}}>
            {stars>0?t('⚔ Надіслати','⚔ Submit'):t('Оберіть оцінку','Choose rating')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Головний компонент ────────────────────────────────────────
export default function SumoClash({onClose,lang='uk'}){
  const [mode,setMode]=useState('menu') // menu | cpu | campaign | multi | cardbook
  const t=(uk,en)=>lang==='en'?en:uk
  const audioCtxRef=useRef(null)
  const audioRef=useRef(null)
  const [sfxOn,setSfxOn]=useState(true)
  const [musicOn,setMusicOn]=useState(false)
  const [musicTheme,setMusicTheme]=useState('dohyo')
  const [confirmExit,setConfirmExit]=useState(false)
  const [showReview,setShowReview]=useState(false)

  async function submitReview(stars,comment){
    try{
      const ts=Date.now()
      await update(ref(db,`analytics/games/sumoClash/reviews/${ts}`),{
        stars,
        comment:comment.trim()||null,
        ts,
        lang,
        mode: mode==='menu'?'general':mode,
      })
      const snap=await get(ref(db,'analytics/games/sumoClash/totalReviews'))
      const current=snap.val()||0
      await update(ref(db,'analytics/games/sumoClash'),{totalReviews:current+1})
    }catch(e){console.error('Review error:',e)}
  }

  function handleClose(){
    setConfirmExit(false)
    setShowReview(true)
  }

  function ensureCtx(){if(!audioCtxRef.current)audioCtxRef.current=createAudioContext();return audioCtxRef.current}
  function sfx(type){if(sfxOn){const ctx=ensureCtx();playSound(ctx,type)}}
  function toggleSfx(){sfx('click');setSfxOn(v=>!v)}
  function toggleMusic(){
    if(musicOn){if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0;audioRef.current=null}setMusicOn(false)}
    else{const audio=new Audio(`/sounds/${musicTheme}.mp3`);audio.loop=true;audio.volume=0.35;audio.play().catch(()=>{});audioRef.current=audio;setMusicOn(true)}
  }
  function changeTheme(themeId){
    setMusicTheme(themeId)
    if(musicOn){if(audioRef.current){audioRef.current.pause();audioRef.current.currentTime=0}const audio=new Audio(`/sounds/${themeId}.mp3`);audio.loop=true;audio.volume=0.35;audio.play().catch(()=>{});audioRef.current=audio}
  }
  useEffect(()=>()=>{if(audioRef.current){audioRef.current.pause();audioRef.current=null}},[])

  return(
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap" rel="stylesheet"/>
      <style>{ANIM_STYLES}</style>

      {showReview&&<ReviewModal onClose={()=>{setShowReview(false);onClose()}} onSubmit={submitReview} lang={lang}/>}

      {confirmExit&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'1.5rem',maxWidth:320,width:'90%',textAlign:'center',animation:'pop 0.2s ease'}}>
            <div style={{fontFamily:'var(--jp)',fontSize:'1.1rem',fontWeight:700,color:'var(--ink)',marginBottom:'0.5rem'}}>{t('Вийти з гри?','Exit game?')}</div>
            <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'var(--mid)',marginBottom:'1.25rem'}}>{t('Прогрес поточної гри буде втрачено','Current game progress will be lost')}</div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setConfirmExit(false)} style={{flex:1,padding:'0.7rem',background:'var(--bg2)',color:'var(--ink)',border:'1px solid var(--border)',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.78rem',cursor:'pointer',fontWeight:700}}>{t('Залишитись','Stay')}</button>
              <button onClick={handleClose} style={{flex:1,padding:'0.7rem',background:'#c0392b',color:'#fff',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.78rem',cursor:'pointer',fontWeight:700}}>{t('Вийти','Exit')}</button>
            </div>
          </div>
        </div>
      )}
      <div onClick={()=>setConfirmExit(true)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:'0.75rem',backdropFilter:'blur(4px)'}}>
        <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,maxWidth:1100,width:'100%',maxHeight:'96vh',minHeight:'min(600px,90vh)',display:'flex',flexDirection:'column',overflow:'hidden',animation:'pop 0.3s ease'}}>

          {/* Header */}
          <div style={{borderBottom:'1px solid var(--border)',padding:'0.8rem 1.25rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span>⚔️</span>
              <span style={{fontFamily:'var(--jp)',fontSize:'0.8rem',letterSpacing:'0.15em',textTransform:'uppercase',color:'var(--mid)'}}>{t('Сумо Клеш','Sumo Clash')}</span>
              {mode!=='menu'&&<span style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--light)'}}>· {mode==='cpu'?'vs CPU':mode==='campaign'?t('Кампанія','Campaign'):mode==='multi'?t('Мультиплеєр','Multiplayer'):mode==='cardbook'?t('Картки','Cards'):''}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <AudioControls sfxOn={sfxOn} musicOn={musicOn} currentTheme={musicTheme} onToggleSfx={toggleSfx} onToggleMusic={toggleMusic} onThemeChange={changeTheme} lang={lang}/>
              <button onClick={()=>setShowReview(true)} style={{background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--mid)',borderRadius:4,padding:'3px 8px',cursor:'pointer',fontFamily:'var(--jp)',fontSize:'0.6rem'}} title={t('Оцінити гру','Rate game')}>🏅</button>
              <button onClick={()=>setConfirmExit(true)} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.3rem',cursor:'pointer',lineHeight:1}}>✕</button>
            </div>
          </div>

          {/* Menu */}
          {mode==='menu'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minHeight:400}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/sumo-temple.png)',backgroundSize:'cover',backgroundPosition:'center'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.52)'}}/>
              <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'0.9rem',width:'100%',padding:'2rem',animation:'slideIn 0.3s ease'}}>
                <div style={{fontSize:'2.6rem',animation:'pop 0.4s ease'}}>⚔️</div>
                <div style={{fontFamily:'var(--jp)',fontSize:'1.7rem',fontWeight:900,color:'#f0c060',textShadow:'0 2px 12px rgba(0,0,0,0.9)',letterSpacing:'0.05em'}}>{t('Сумо Клеш','Sumo Clash')}</div>
                <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'rgba(255,255,255,0.75)',textAlign:'center',lineHeight:1.8,marginBottom:'0.25rem',textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>{t('15 раундів · Ояката · Рікіші · Броня · Удари · Хенка','15 rounds · Oyakata · Rikishi · Armor · Strikes · Henka')}</div>

                {[
                  {img:'btn-campaign.png', action:()=>{sfx('click');setMode('campaign');trackGameLaunch('sumoClash')}},
                  {img:'btn-cpu.png',      action:()=>{sfx('click');setMode('cpu');trackGameLaunch('sumoClash');trackClashMode('cpu')}},
                  {img:'btn-multi.png',    action:()=>{sfx('click');setMode('multi');trackGameLaunch('sumoClash');trackClashMode('multi')}},
                  {img:'btn-cardbook.png', action:()=>{sfx('click');setMode('cardbook')}},
                ].map(btn=>(
                  <div
                    key={btn.img}
                    onClick={btn.action}
                    style={{width:'100%',maxWidth:360,height:60,cursor:'pointer',borderRadius:6,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.6)',transition:'transform 0.15s, box-shadow 0.15s',flexShrink:0}}
                    onMouseEnter={e=>{e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 6px 28px rgba(0,0,0,0.8)'}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.6)'}}
                  >
                    <img src={`/images/${btn.img}`} alt="" style={{width:'100%',height:'100%',objectFit:'fill',display:'block'}}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CardBook */}
          {mode==='cardbook'&&<CardBook lang={lang} onClose={()=>setMode('menu')}/>}

          {/* Modes */}
          {mode==='cpu'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-cpu.png)',backgroundSize:'cover',backgroundPosition:'center',opacity:0.18,pointerEvents:'none'}}/>
              <CpuGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx}/>
            </div>
          )}
          {mode==='campaign'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-campaign.png)',backgroundSize:'cover',backgroundPosition:'center',opacity:0.3,pointerEvents:'none'}}/>
              <SumoClashCampaign onBack={()=>setMode('menu')} lang={lang} GameBattle={(props)=><CampaignBattleWrapper {...props} sfx={sfx}/>}/>
            </div>
          )}
          {mode==='multi'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-multi.png)',backgroundSize:'cover',backgroundPosition:'center',opacity:0.3,pointerEvents:'none'}}/>
              <MultiGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx}/>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
