'use client'
import { trackGameLaunch, trackClashMode } from '../lib/gameAnalytics'
import { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { ref, set, get, onValue, update, off } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import SumoClashCampaign from './SumoClashCampaign'
import VSScreen from './VSScreen'

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const fn = () => setM(window.innerWidth < 768)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return m
}

// ── YokoinIcon — заміна для 🪙 та ¥ всюди в грі ─────────────
function YokoinIcon({size=16,style={}}){
  return(
    <img src="/images/icon-yokoin.webp" alt="¥"
      style={{height:size,width:size,objectFit:'contain',verticalAlign:'middle',display:'inline-block',filter:'drop-shadow(0 0 3px rgba(240,160,20,0.5))',...style}}
      onError={e=>{e.currentTarget.style.display='none';e.currentTarget.insertAdjacentHTML('afterend','<span style="color:#f0c060">¥</span>')}}
    />
  )
}
function YokoinAmount({amount,size=16,fontSize='inherit',fontWeight=700,color='#f0c060',style={}}){
  return(
    <span style={{display:'inline-flex',alignItems:'center',gap:3,...style}}>
      <YokoinIcon size={size}/>
      <span style={{fontFamily:'var(--jp)',fontSize,fontWeight,color,textShadow:'0 0 8px rgba(240,192,96,0.4)'}}>{amount}</span>
    </span>
  )
}


const MAX_HP = 40
const MAX_ROUNDS = 15
const PRESSURE_ROUND = 10    // після цього раунду — тиск судді
const PRESSURE_DMG = 2       // HP що знімається щораунду після PRESSURE_ROUND
const DRAFT_ROUNDS = 5       // скільки карт в руці після драфту
const DRAFT_SNAKE_TOTAL = 10 // всього пік у змійці (5 гравець + 5 CPU)
const DRAFT_POOL_SIZE = 5    // розмір спільного пулу для змійки
const MAX_HAND_SAME_TYPE = 2 // не більше 2 карт одного типу в руці

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

// ── НОВІ КАРТКИ: Хаос та Ґьоджі ─────────────────────────────
const CHAOS_CARDS = [
  { id:'Ch1', type:'chaos', label:'Хаос', labelEn:'Chaos', effect:'💥 -10 HP обом', color:'#2d1b4e', emoji:'💥' },
  { id:'Ch2', type:'chaos', label:'Хаос', labelEn:'Chaos', effect:'💥 -10 HP обом', color:'#2d1b4e', emoji:'💥' },
]
const GYOJI_CARDS = [
  { id:'Gy1', type:'gyoji', label:'Ґьоджі', labelEn:'Gyoji', effect:'↩ Повернення', color:'#7a1c1c', emoji:'⚖️' },
  { id:'Gy2', type:'gyoji', label:'Ґьоджі', labelEn:'Gyoji', effect:'↩ Повернення', color:'#7a1c1c', emoji:'⚖️' },
]

const FULL_DECK = [...RIKISHI_CARDS,...MAEGASHIRA,...HEAL_CARDS,...ARMOR_CARDS,...STRIKE_CARDS,...SWAP_CARDS,...SALT_CARDS,...HENKA_CARDS,...CHAOS_CARDS,...GYOJI_CARDS]

let _sumoClashAuthPromise = null
function getSumoClashUid() {
  if (!_sumoClashAuthPromise) {
    _sumoClashAuthPromise = new Promise(resolve => {
      const auth = getAuth()
      onAuthStateChanged(auth, async user => {
        if (user) resolve(user.uid)
        else {
          try { const c = await signInAnonymously(auth); resolve(c.user.uid) }
          catch { resolve(null) }
        }
      })
    })
  }
  return _sumoClashAuthPromise
}

function getCardWeight(card) {
  if (card.type === 'rikishi') {
    switch(card.rank) {
      case 'Yokozuna':   return 1
      case 'Ozeki':      return 3
      case 'Sekiwake':   return 6
      case 'Komusubi':   return 10
      case 'Maegashira': return 20
      default:           return 10
    }
  }
  if (card.type === 'heal')   return card.heal >= 10 ? 5 : 12
  if (card.type === 'armor')  return card.armor >= 10 ? 5 : 12
  if (card.type === 'strike') return card.damage >= 10 ? 6 : 12
  if (card.type === 'swap')   return 10
  if (card.type === 'salt')   return 7
  if (card.type === 'henka')  return 5
  if (card.type === 'chaos')  return 4
  if (card.type === 'gyoji')  return 4
  return 10
}

function weightedSample(arr, n) {
  if(arr.length <= n) return shuffle([...arr])
  const result = []
  const pool = [...arr]
  for(let i = 0; i < n && pool.length > 0; i++) {
    const totalWeight = pool.reduce((s, c) => s + getCardWeight(c), 0)
    let r = Math.random() * totalWeight
    let idx = 0
    for(let j = 0; j < pool.length; j++) {
      r -= getCardWeight(pool[j])
      if(r <= 0) { idx = j; break }
    }
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

function weightedShuffle(arr) {
  return arr
    .map(card => ({ card, sort: Math.random() ** (1 / getCardWeight(card)) }))
    .sort((a, b) => b.sort - a.sort)
    .map(x => x.card)
}

const CARD_LORE = {
  Y1e: 'Вершина сумо. Він не бореться — він судить. Кожен вихід на дохьо — як сонячне затемнення: рідкісний, величний і незворотній.',
  Y1w: 'Захід породжує своїх богів. Цей рікіші досяг йокодзуна через терпіння, а не силу. Його тіло — храм, його воля — закон.',
  O1e: 'Майстер рівноваги. Атака і захист для нього — одне. Говорять, він ніколи не робив зайвого кроку.',
  O1w: 'Залізна воля заходу. Він програвав двічі — і обидва рази навмисно, щоб вивчити суперника зсередини.',
  O2e: 'Народився в маленькому селі, де не було дохьо. Перший круг намалював паличкою на землі.',
  O2w: 'Швидкий як думка, важкий як каміння. Його тачіай розбиває противників до того, як вони встигають зрозуміти.',
  S1e: 'Він прийшов із гір, де вітер навчив його читати рух тіла. Кожен суперник — це нова буря.',
  S1w: 'Три роки поспіль виходив до фіналу. Три роки поспіль програвав. Четвертого року — не програв.',
  S2e: 'Його ліва рука — для захисту. Права — для перемоги. Між ними — мовчання.',
  S2w: 'Молодий, але вже мудрий. Вчиться у поразок більше, ніж більшість — у перемог.',
  S3e: 'Говорить мало, рухається тихо. Але коли він входить на дохьо — зал завмирає.',
  S3w: 'Його батько був рікіші. Дід — теж. Він продовжує лінію, але за власними правилами.',
  K1e: 'Піднявся з маєгашіри за один басьо. Критики казали — щастя. Він повторив наступного місяця.',
  K1w: 'Бореться з усмішкою. Кажуть, це нерви. Насправді — це спокій людини, яка вже прийняла результат.',
  K2e: 'Технічний геній. Знає сотні прийомів, але використовує лише три. Решта — щоб суперник думав.',
  K2w: 'Невисокий на зріст. Це його перевага: центр ваги нижче, а удар — несподіваніший.',
  K3e: 'Мовчазний боєць. Ніколи не дає інтерв\'ю. Його суmo говорить за нього.',
  K3w: 'Прийшов пізно — почав у 22 роки. Надолужує кожен день.',
  K4e: 'Любить довгі бої. Чекає, коли суперник зробить помилку.',
  K4w: 'Кажуть, він медитує перед кожним виходом. Дохьо для нього — не арена, а вівтар.',
  H1: 'Вода після бою — священна. Переможець п\'є першим.',
  H2: 'Вода переможця передається з рук тренера. Жест довіри.',
  H3: 'Після кожного раунду — ковток. Після кожного ковтка — новий початок.',
  H6: 'Сіль очищує дохьо від злих духів. Але ця — особлива.',
  Ar1: 'Стійка — це не поза. Це стан духу.',
  Ar2: 'Майстер навчив його одному: перш ніж атакувати — стань непорушним.',
  Ar3: 'Маваші — не просто пояс. Це зброя, щит і честь одночасно.',
  Ar4: 'Якість маваші визначає якість рікіші.',
  St1: 'Тачіай — зіткнення на старті. Одна секунда вирішує все.',
  St2: 'Техніка тачіаю передається від майстра до учня.',
  St3: 'Харіте — відкритою долонею по щоці. Один рух ламає концентрацію.',
  St4: 'Кажуть, цей прийом заборонений у деяких школах. Занадто ефективний.',
  Sw1: 'Стратегія — це мистецтво вибору.',
  Sw2: 'Ояката змінює план у розпал бою. Це мудрість.',
  Sw3: 'Між раундами — тиша. У ній народжуються рішення.',
  Sw4: 'Нова карта — новий шанс.',
  Sa1: 'Сіль в обличчя — давній трюк. Секунда сліпоти коштує раунду.',
  He1: 'Хенка — ухилення вбік у момент тачіаю. Одні кажуть — ганьба. Інші — геній.',
  Ch1: 'Коли два рікіші зустрічаються з однаковою силою — дохьо тріщить під обома. Хаос не вибирає переможця.',
  Ch2: 'Стихія не має сторони. Вона просто є.',
  Gy1: 'Суддя піднімає ганбай — і час зупиняється. Його слово повертає мить назад.',
  Gy2: 'Другий суддя виходить з тіні. Навіть боги потребують свідків.',
}

function getCardLore(card) { return CARD_LORE[card.id] || null }

const CARD_DESCRIPTIONS = {
  rikishi: (c) => `Рікіші ${c.rank}. Атакує суперника. Шкода = ATK − DEF суперника (мін 0). Б'є броню першою.`,
  heal:    (c) => `Відновлює ${c.heal} HP. Не діє на суперника.`,
  armor:   (c) => `Додає ${c.armor} одиниць броні. Броня поглинає шкоду від рікіші.`,
  strike:  (c) => `Завдає ${c.damage} прямої шкоди. Ігнорує броню суперника!`,
  swap:    ()  => `Замінює одну карту з руки на нову з колоди.`,
  salt:    ()  => `Кидаєш сіль в обличчя — суперник пропускає наступний хід.`,
  henka:   ()  => `Ухиляєшся від атаки суперника (рікіші або удар).`,
  chaos:   ()  => `Обидва борці втрачають по 10 HP. Ігнорує броню!`,
  gyoji:   ()  => `Повертає останню зіграну тобою карту назад у руку.`,
}

function getCardDesc(card) { const fn = CARD_DESCRIPTIONS[card.type]; return fn ? fn(card) : '' }

function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]};return a}
function generateCode(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function getCardById(id){return FULL_DECK.find(c=>c.id===id)}
function getLabel(card,lang){return lang==='en'?(card.labelEn||card.label||card.id):(card.label||card.id)}

const CARD_SKIN_ALIAS = {
  'H2':'H1','H3':'H1','Ar2':'Ar1','Ar4':'Ar3',
  'St2':'St1','St4':'St3','Sw2':'Sw1','Sw3':'Sw1','Sw4':'Sw1',
  'Ch2':'Ch1',
  'Gy2':'Gy1',
}
function getCardSkinId(id) { return CARD_SKIN_ALIAS[id] || id }

// Перевіряє чи можна додати карту в руку (ліміт 2 одного типу)
// Rikishi — кожен rank окремо рахується (Yokozuna, Ozeki тощо)
function canAddToHand(hand, card) {
  // Ліміт по типу картки (не по ранку рікіші — 2 рікіші будь-якого рангу дозволено)
  const count = hand.filter(c => c.type === card.type).length
  return count < MAX_HAND_SAME_TYPE
}

function cpuChooseCard(hand,oppSkipped){
  if(oppSkipped){const safe=hand.filter(c=>['heal','armor','swap'].includes(c.type));if(safe.length>0)return safe[0]}
  const strikes=hand.filter(c=>c.type==='strike');if(strikes.length>0)return strikes.sort((a,b)=>b.damage-a.damage)[0]
  const rikishi=hand.filter(c=>c.type==='rikishi');if(rikishi.length>0)return rikishi.sort((a,b)=>(b.atk+b.def)-(a.atk+a.def))[0]
  const heals=hand.filter(c=>c.type==='heal');if(heals.length>0)return heals[0]
  return hand[0]
}

function resolveRound(pCard,oCard,pHp,oHp,pArmor,oArmor,pSkipped,oSkipped,playedCards=[],roundNum=0){
  let nPHp=pHp,nOHp=oHp,nPAr=pArmor,nOAr=oArmor
  const logs=[]
  const pEff=pSkipped?null:pCard
  const oEff=oSkipped?null:oCard
  let pNextSkip=false,oNextSkip=false
  let returnCardToHand=null

  if(pSkipped)logs.push({text:'You: skipped (Salt Throw)',color:'#95a5a6'})
  if(oSkipped)logs.push({text:'Opp: skipped (Salt Throw)',color:'#95a5a6'})

  // ── Хаос: обидва -10 HP, ігнорує броню ──────────────────
  if(pEff?.type==='chaos'||oEff?.type==='chaos'){
    nPHp=Math.max(0,nPHp-10)
    nOHp=Math.max(0,nOHp-10)
    logs.push({text:'💥 Хаос! Обидва борці -10 HP (ігнорує броню)!',color:'#9b59b6'})
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false,returnCardToHand:null,gyojiChoices:null}
  }

  // ── Ґьоджі: гравець обирає яку зіграну карту активувати
  // Повертаємо gyojiChoices — список унікальних карток для вибору (обробка в UI)
  if(pEff?.type==='gyoji'){
    const choices=[...new Map(
      playedCards.map(r=>r.my)
        .filter(c=>c&&!['skip','gyoji','chaos','swap'].includes(c.type))
        .map(c=>[c.id,c])
    ).values()].slice(-6) // останні 6 унікальних
    if(choices.length>0){
      logs.push({text:`⚖️ Ґьоджі! Судді зупиняють бій — оберіть карту для повторної активації!`,color:'#e8c547'})
    } else {
      logs.push({text:'⚖️ Ґьоджі! Немає зіграних карток для вибору.',color:'#e8c547'})
    }
    if(oEff?.type==='heal'){const h=Math.min(MAX_HP,nOHp+oEff.heal)-nOHp;nOHp=Math.min(MAX_HP,nOHp+oEff.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
    if(oEff?.type==='armor'){nOAr+=oEff.armor;logs.push({text:`Opp: +${oEff.armor} armor`,color:'#1f618d'})}
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false,returnCardToHand:null,gyojiChoices:choices}
  }

  if(pEff?.type==='henka'&&(oEff?.type==='rikishi'||oEff?.type==='strike')){
    logs.push({text:'You: 🌀 Henka! Dodged opponent attack!',color:'#8e44ad'})
    if(oEff?.type==='heal'){const h=Math.min(MAX_HP,nOHp+oEff.heal)-nOHp;nOHp=Math.min(MAX_HP,nOHp+oEff.heal);logs.push({text:`Opp: +${h} HP`,color:'#c0392b'})}
    if(oEff?.type==='armor'){nOAr+=oEff.armor;logs.push({text:`Opp: +${oEff.armor} armor`,color:'#1f618d'})}
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false,returnCardToHand:null,gyojiChoices:null}
  }
  if(oEff?.type==='henka'&&(pEff?.type==='rikishi'||pEff?.type==='strike')){
    logs.push({text:'Opp: 🌀 Henka! Dodged your attack!',color:'#8e44ad'})
    if(pEff?.type==='heal'){const h=Math.min(MAX_HP,nPHp+pEff.heal)-nPHp;nPHp=Math.min(MAX_HP,nPHp+pEff.heal);logs.push({text:`You: +${h} HP`,color:'#2471a3'})}
    if(pEff?.type==='armor'){nPAr+=pEff.armor;logs.push({text:`You: +${pEff.armor} armor`,color:'#1f618d'})}
    return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner:'tie',pNextSkip:false,oNextSkip:false,returnCardToHand:null,gyojiChoices:null}
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
  // Тиск судді: після раунду PRESSURE_ROUND обидва -2 HP щораунду
  if(roundNum>=PRESSURE_ROUND){
    nPHp=Math.max(0,nPHp-PRESSURE_DMG)
    nOHp=Math.max(0,nOHp-PRESSURE_DMG)
    logs.push({text:`⏰ Судді втрачають терпіння! Обидва -${PRESSURE_DMG} HP`,color:'#e8a020'})
  }
  return{newPHp:nPHp,newOHp:nOHp,newPArmor:nPAr,newOArmor:nOAr,logs,roundWinner,pNextSkip,oNextSkip,returnCardToHand:null,gyojiChoices:null}
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
    else if(type==='chaos'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sawtooth';o.frequency.setValueAtTime(80,now);o.frequency.exponentialRampToValueAtTime(30,now+0.4);g.gain.setValueAtTime(0.5,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.5);o.start(now);o.stop(now+0.5)}
    else if(type==='gyoji'){[800,600,400].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.2,now+i*0.12);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.12+0.3);o.start(now+i*0.12);o.stop(now+i*0.12+0.3)})}
    else if(type==='win'){[523,659,784,1047].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(0,now+i*0.12);g.gain.linearRampToValueAtTime(0.3,now+i*0.12+0.05);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.12+0.4);o.start(now+i*0.12);o.stop(now+i*0.12+0.4)})}
    else if(type==='lose'){[400,350,300].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.25,now+i*0.18);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.18+0.35);o.start(now+i*0.18);o.stop(now+i*0.18+0.35)})}
    else if(type==='click'){const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=800;g.gain.setValueAtTime(0.08,now);g.gain.exponentialRampToValueAtTime(0.001,now+0.05);o.start(now);o.stop(now+0.05)}
    else if(type==='swap'){const buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate);const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.sin(i/d.length*Math.PI)*0.3;const s=ctx.createBufferSource();s.buffer=buf;const g=ctx.createGain();g.gain.value=0.2;s.connect(g);g.connect(ctx.destination);s.start(now)}
    else if(type==='achievement'){[600,800,1000,1200].forEach((freq,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.type='triangle';o.frequency.value=freq;g.gain.setValueAtTime(0,now+i*0.08);g.gain.linearRampToValueAtTime(0.25,now+i*0.08+0.04);g.gain.exponentialRampToValueAtTime(0.001,now+i*0.08+0.3);o.start(now+i*0.08);o.stop(now+i*0.08+0.3)})}
  }catch(e){}
}

const MUSIC_THEMES=[
  {id:'dohyo',    label:{uk:'Дохьо',    en:'Dohyo'},    desc:{uk:'Урочиста',   en:'Ceremonial'}},
  {id:'taiko',    label:{uk:'Тайко',    en:'Taiko'},    desc:{uk:'Барабани',   en:'Drums'}},
  {id:'yokozuna', label:{uk:'Йокодзуна',en:'Yokozuna'}, desc:{uk:'Епічна',     en:'Epic'}},
  {id:'shrine',   label:{uk:'Святиня',  en:'Shrine'},   desc:{uk:'Спокійна',   en:'Peaceful'}},
]

// ── Досягнення ────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first_win',       icon:'🏅', cat:'progress', name:{uk:'Перша кров',      en:'First Blood'},    desc:{uk:'Виграти перший матч vs CPU',         en:'Win first match vs CPU'},           reward:50  },
  { id:'all_cards',       icon:'📖', cat:'progress', name:{uk:'Майстер Книги',   en:'Card Master'},    desc:{uk:'Розблокувати всі картки в CardBook', en:'Unlock all cards in CardBook'},     reward:500 },
  { id:'all_campaign',    icon:'🗺️', cat:'progress', name:{uk:'Підкорювач',      en:'Conqueror'},      desc:{uk:'Пройти всю кампанію (5/5)',          en:'Complete full campaign (5/5)'},     reward:300 },
  { id:'flawless',        icon:'🔥', cat:'battle',   name:{uk:'Бездоганно',      en:'Flawless'},       desc:{uk:'Виграти без втрат HP',               en:'Win without losing HP'},            reward:150 },
  { id:'last_stand',      icon:'💀', cat:'battle',   name:{uk:'Остання стійка',  en:'Last Stand'},     desc:{uk:'Виграти маючи 1-3 HP',               en:'Win with only 1-3 HP left'},        reward:100 },
  { id:'speedrun',        icon:'⚡', cat:'battle',   name:{uk:'Блискавичний',    en:'Speedrun'},       desc:{uk:'Виграти за 5 раундів або менше',     en:'Win in 5 rounds or less'},          reward:120 },
  { id:'healer',          icon:'🌊', cat:'battle',   name:{uk:'Вода і сіль',     en:'Healer'},         desc:{uk:'Зіграти 5 heal-карток за матч',      en:'Play 5 heal cards in one match'},   reward:70  },
  { id:'dodger',          icon:'👻', cat:'battle',   name:{uk:'Дух хенки',       en:'Henka Ghost'},    desc:{uk:'Ухилитись 3 рази за матч',           en:'Dodge 3 times in one match'},       reward:90  },
  { id:'chaos_winner',    icon:'💥', cat:'battle',   name:{uk:'Переможець хаосу',en:'Chaos Victor'},   desc:{uk:'Виграти матч зігравши Хаос',         en:'Win a match after playing Chaos'},  reward:130 },
  { id:'gyoji_trick',     icon:'⚖️', cat:'battle',   name:{uk:'Хитрість судді',  en:'Gyoji Trick'},    desc:{uk:'Повернути карту та виграти раунд',   en:'Return card and win the round'},    reward:110 },
  { id:'thousand_rounds', icon:'🔒', cat:'secret',   name:{uk:'???',             en:'???'},            desc:{uk:'Зіграти 1000 раундів загалом',       en:'Play 1000 rounds total'},           reward:400 },
  { id:'big_spender',     icon:'🔒', cat:'secret',   name:{uk:'???',             en:'???'},            desc:{uk:'Витратити 5000¥ у магазині',         en:'Spend 5000¥ in the shop'},          reward:300 },
  { id:'salt_king',       icon:'🔒', cat:'secret',   name:{uk:'???',             en:'???'},            desc:{uk:'Зіграти Сіль 10 разів',             en:'Play Salt 10 times'},               reward:200 },
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
@keyframes chaosEffect{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(2.5) rotate(180deg)}}
@keyframes hpFlash{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8)}}
@keyframes bubbleRise{0%{transform:translateY(0) scale(1);opacity:0.7}100%{transform:translateY(-40px) scale(0.3);opacity:0}}
@keyframes lowHpPulse{0%,100%{color:#c0392b}50%{color:#ff6b6b}}
@keyframes lockPulse{0%,100%{opacity:0.85}50%{opacity:1}}
@keyframes logoBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.045)}}
@keyframes sakuraFall{0%{transform:translateY(-40px);opacity:0}8%{opacity:1}85%{opacity:0.75}100%{transform:translateY(calc(100vh + 60px));opacity:0}}
@keyframes sakuraSway{0%{transform:translateX(0) rotate(0deg)}20%{transform:translateX(16px) rotate(80deg)}45%{transform:translateX(-10px) rotate(190deg)}70%{transform:translateX(20px) rotate(270deg)}100%{transform:translateX(0) rotate(360deg)}}
@keyframes rikishiGoldPulse{
  0%,100%{filter:drop-shadow(0 -2px 20px rgba(46,204,113,0.55)) drop-shadow(0 6px 16px rgba(0,0,0,0.95));transform:scale(1)}
  50%{filter:drop-shadow(0 -2px 28px rgba(255,200,50,0.85)) drop-shadow(0 6px 20px rgba(0,0,0,0.95)) brightness(1.1);transform:scale(1.03)}
}
@keyframes rikishiRedPulse{
  0%,100%{filter:drop-shadow(0 -2px 20px rgba(231,76,60,0.55)) drop-shadow(0 6px 16px rgba(0,0,0,0.95));transform:scale(1)}
  50%{filter:drop-shadow(0 -2px 28px rgba(231,76,60,0.9)) drop-shadow(0 6px 20px rgba(0,0,0,0.95)) brightness(1.1);transform:scale(1.03)}
}
@keyframes achievementUnlock{
  0%{opacity:0;transform:translateX(120px) scale(0.8)}
  15%{opacity:1;transform:translateX(0) scale(1.05)}
  25%{transform:scale(1)}
  80%{opacity:1;transform:translateX(0)}
  100%{opacity:0;transform:translateX(40px)}
}
@keyframes achievementBtnPulse{0%,100%{box-shadow:0 0 0 0 rgba(240,192,96,0.0)}50%{box-shadow:0 0 0 6px rgba(240,192,96,0.35)}}
`

const CARD_TYPES_INFO=[
  {type:'rikishi',emoji:'⚔️',label:{uk:'Рікіші',en:'Rikishi'},desc:{uk:"Атакує. ATK − DEF = шкода. Б\'є броню першою.",en:'Attacks. ATK − DEF = damage. Hits armor first.'}},
  {type:'heal',emoji:'💧',label:{uk:'Хіл',en:'Heal'},desc:{uk:'Вода переможця +5 HP або Сіль Дохьо +10 HP.',en:"Victor's Water +5 HP or Dohyo Salt +10 HP."}},
  {type:'armor',emoji:'🛡',label:{uk:'Броня',en:'Armor'},desc:{uk:'Бойова стійка +5 🛡 або Маваші +10 🛡.',en:'Battle Stance +5 🛡 or Mawashi +10 🛡.'}},
  {type:'strike',emoji:'⚡',label:{uk:'Удар',en:'Strike'},desc:{uk:'Тачіай -5 HP або Харітете -10 HP. Ігнорує броню!',en:'Tachiai -5 HP or Harite -10 HP. Ignores armor!'}},
  {type:'swap',emoji:'🔄',label:{uk:'Заміна',en:'Swap'},desc:{uk:'Замінює карту з руки на нову з колоди.',en:'Swap a hand card for a new deck card.'}},
  {type:'salt',emoji:'🧂',label:{uk:'Сіль',en:'Salt'},desc:{uk:'Суперник пропускає наступний хід.',en:'Opponent skips next turn.'}},
  {type:'henka',emoji:'🌀',label:{uk:'Хенка',en:'Henka'},desc:{uk:'Уникаєте атаки суперника (рікіші або удар).',en:'Dodge opponent attack (rikishi or strike).'}},
  {type:'chaos',emoji:'💥',label:{uk:'Хаос',en:'Chaos'},desc:{uk:'Обидва борці -10 HP. Ігнорує броню!',en:'Both fighters -10 HP. Ignores armor!'}},
  {type:'gyoji',emoji:'⚖️',label:{uk:'Ґьоджі',en:'Gyoji'},desc:{uk:'Повертає останню зіграну карту назад у руку.',en:'Returns the last played card back to hand.'}},
]

// ── Досягнення: тост та модальне вікно ───────────────────────
function AchievementToast({ achievement, lang, onDone }) {
  const t=(uk,en)=>lang==='en'?en:uk
  useEffect(()=>{ const id=setTimeout(onDone,3800); return()=>clearTimeout(id) },[])
  const isSecret = achievement.cat==='secret'
  return(
    <div style={{
      position:'fixed',top:70,right:16,zIndex:5000,
      animation:'achievementUnlock 4s ease both',
      background:'linear-gradient(135deg,#2a1f08,#1a1208)',
      border:'1px solid #b8860b',borderRadius:8,
      padding:'0.65rem 1rem',minWidth:240,maxWidth:300,
      boxShadow:'0 8px 32px rgba(0,0,0,0.9), 0 0 20px rgba(184,134,11,0.3)',
      pointerEvents:'none',
    }}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.48rem',color:'#b8860b',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:4}}>
        🏆 {t('Досягнення розблоковано!','Achievement unlocked!')}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:'1.6rem',flexShrink:0}}>{isSecret?'🔒':achievement.icon}</span>
        <div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,color:'#f0c060',lineHeight:1.2}}>
            {isSecret?'???':(lang==='en'?achievement.name.en:achievement.name.uk)}
          </div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,220,150,0.65)',marginTop:2}}>
            <YokoinAmount amount={`+${achievement.reward}`} size={14} fontSize='0.58rem'/>
          </div>
        </div>
      </div>
    </div>
  )
}

function AchievementsModal({ unlockedSet, claimedSet, lang, onClose, onClaim }) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [tab,setTab]=useState('all')
  const [claimAnim,setClaimAnim]=useState(null) // id досягнення що анімується
  const tabs=[
    {key:'all',    label:t('Всі','All')},
    {key:'progress',label:t('Прогрес','Progress')},
    {key:'battle', label:t('Бойові','Battle')},
    {key:'secret', label:t('Таємні','Secret')},
  ]
  const filtered=tab==='all'?ACHIEVEMENTS:ACHIEVEMENTS.filter(a=>a.cat===tab)
  const total=ACHIEVEMENTS.length
  const unlocked=ACHIEVEMENTS.filter(a=>unlockedSet.has(a.id)).length
  const pct=Math.round((unlocked/total)*100)
  // Скільки можна отримати зараз
  const pendingTotal=ACHIEVEMENTS.filter(a=>unlockedSet.has(a.id)&&!claimedSet.has(a.id)).reduce((s,a)=>s+a.reward,0)

  function handleClaim(ach){
    if(!unlockedSet.has(ach.id)||claimedSet.has(ach.id))return
    setClaimAnim(ach.id)
    setTimeout(()=>setClaimAnim(null),600)
    onClaim(ach)
  }

  return(
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:4500,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',padding:'1rem'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(180deg,#1e1812,#120e08)',border:'1px solid #b8860b',borderRadius:10,width:'100%',maxWidth:520,maxHeight:'85vh',display:'flex',flexDirection:'column',overflow:'hidden',animation:'pop 0.25s ease',boxShadow:'0 16px 48px rgba(0,0,0,0.95)'}}>
        {/* Header */}
        <div style={{padding:'0.875rem 1.25rem',borderBottom:'1px solid rgba(184,134,11,0.3)',display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
          <div>
            <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,color:'#f0c060'}}>🏆 {t('Нагороди','Awards')}</div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginTop:3}}>
              <span style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,220,150,0.5)'}}>{unlocked}/{total} · {pct}%</span>
              {pendingTotal>0&&(
                <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(184,134,11,0.2)',border:'1px solid rgba(184,134,11,0.5)',borderRadius:10,padding:'1px 8px',fontFamily:'var(--jp)',fontSize:'0.52rem',color:'#f0c060',animation:'achievementBtnPulse 1.5s ease infinite'}}>
                  <YokoinIcon size={11}/>
                  <span>+{pendingTotal} {t('до отримання','to claim')}</span>
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:'rgba(255,255,255,0.4)',fontSize:'1.2rem',cursor:'pointer',padding:0,lineHeight:1}}>✕</button>
        </div>
        {/* Progress bar */}
        <div style={{padding:'0.5rem 1.25rem',borderBottom:'1px solid rgba(184,134,11,0.15)',flexShrink:0}}>
          <div style={{height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#b8860b,#f0c060)',borderRadius:3,transition:'width 0.6s ease'}}/>
          </div>
        </div>
        {/* Tabs */}
        <div style={{padding:'0.5rem 1.25rem',borderBottom:'1px solid rgba(184,134,11,0.15)',display:'flex',gap:4,flexShrink:0}}>
          {tabs.map(tb=>(
            <button key={tb.key} onClick={()=>setTab(tb.key)} style={{padding:'3px 10px',background:tab===tb.key?'rgba(184,134,11,0.3)':'transparent',color:tab===tb.key?'#f0c060':'rgba(255,220,150,0.45)',border:`1px solid ${tab===tb.key?'rgba(184,134,11,0.6)':'transparent'}`,borderRadius:20,fontFamily:'var(--jp)',fontSize:'0.58rem',cursor:'pointer',fontWeight:tab===tb.key?700:400,transition:'all 0.15s'}}>
              {tb.label}
            </button>
          ))}
        </div>
        {/* List */}
        <div style={{flex:1,overflowY:'auto',padding:'0.75rem 1.25rem',display:'flex',flexDirection:'column',gap:6}}>
          {filtered.map(ach=>{
            const isUnlocked=unlockedSet.has(ach.id)
            const isClaimed=claimedSet.has(ach.id)
            const isSecret=ach.cat==='secret'
            const canClaim=isUnlocked&&!isClaimed
            const isAnimating=claimAnim===ach.id
            return(
              <div key={ach.id} style={{display:'flex',alignItems:'center',gap:12,padding:'0.6rem 0.875rem',background:isClaimed?'rgba(255,255,255,0.02)':isUnlocked?'rgba(184,134,11,0.12)':'rgba(255,255,255,0.03)',border:`1px solid ${isClaimed?'rgba(255,255,255,0.05)':isUnlocked?'rgba(184,134,11,0.4)':'rgba(255,255,255,0.06)'}`,borderRadius:6,animation:'fadeIn 0.2s ease',opacity:isUnlocked?1:0.55,transition:'all 0.2s'}}>
                {/* Іконка */}
                <span style={{fontSize:'1.4rem',flexShrink:0,filter:isClaimed?'grayscale(0.5)':'none'}}>{isUnlocked?ach.icon:'🔒'}</span>
                {/* Текст */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:700,color:isClaimed?'rgba(255,220,150,0.4)':isUnlocked?'#f0c060':'rgba(255,255,255,0.4)',marginBottom:2}}>
                    {isUnlocked?(lang==='en'?ach.name.en:ach.name.uk):'???'}
                  </div>
                  <div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,220,150,0.45)',lineHeight:1.4}}>
                    {isUnlocked||!isSecret?(lang==='en'?ach.desc.en:ach.desc.uk):'???'}
                  </div>
                </div>
                {/* Права частина: нагорода + кнопка */}
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:5,flexShrink:0}}>
                  <YokoinAmount amount={`+${ach.reward}`} size={13} fontSize='0.62rem' color={isClaimed?'rgba(255,220,150,0.3)':'#f0c060'}/>
                  {canClaim&&(
                    <button onClick={()=>handleClaim(ach)}
                      style={{padding:'3px 12px',background:isAnimating?'linear-gradient(90deg,#2ecc71,#1a9b5c)':'linear-gradient(180deg,#c49a1a,#8b6010)',border:`1px solid ${isAnimating?'#2ecc71':'#f0c060'}`,borderRadius:4,color:isAnimating?'#fff':'#fff8e0',fontFamily:'var(--jp)',fontSize:'0.55rem',fontWeight:700,cursor:'pointer',letterSpacing:'0.06em',boxShadow:'0 2px 8px rgba(0,0,0,0.4)',transition:'all 0.15s',animation:isAnimating?'pop 0.3s ease':'none',whiteSpace:'nowrap'}}>
                      {isAnimating?'✓':t('Отримати','Claim')}
                    </button>
                  )}
                  {isClaimed&&(
                    <span style={{fontFamily:'var(--jp)',fontSize:'0.52rem',color:'rgba(100,180,100,0.6)',letterSpacing:'0.05em'}}>✓ {t('Отримано','Claimed')}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Сакура, частинки ─────────────────────────────────────────
const SAKURA_PETALS = Array.from({length: 28}, (_, i) => ({
  id: i, left: `${3 + (i * 97 / 27)}%`, size: 7 + (i * 3) % 9,
  fallDur: 5 + (i * 1.13) % 7, swayDur: 2.2 + (i * 0.6) % 2.5,
  delay: -((i * 1.9) % 12), rotate: (i * 53) % 360,
  color: ['rgba(255,168,185,0.88)','rgba(255,195,210,0.8)','rgba(255,148,168,0.82)','rgba(255,210,218,0.75)'][i%4],
}))
function SakuraPetals() {
  return (
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:3}}>
      {SAKURA_PETALS.map(p => (
        <div key={p.id} style={{position:'absolute',left:p.left,top:0,animation:`sakuraFall ${p.fallDur}s linear ${p.delay}s infinite`}}>
          <div style={{width:p.size,height:Math.round(p.size*0.72),background:`radial-gradient(ellipse at 38% 32%, ${p.color}, rgba(255,120,145,0.35) 75%, transparent 100%)`,borderRadius:'62% 38% 62% 38% / 52% 62% 38% 48%',transform:`rotate(${p.rotate}deg)`,animation:`sakuraSway ${p.swayDur}s ease-in-out ${p.delay}s infinite`,filter:'drop-shadow(0 1px 2px rgba(180,60,80,0.2))'}}/>
        </div>
      ))}
    </div>
  )
}
function SaltParticles(){const particles=Array.from({length:16},(_,i)=>({id:i,tx:`${(Math.random()-0.5)*120}px`,ty:`${-30-Math.random()*60}px`,delay:`${Math.random()*0.3}s`,size:`${4+Math.random()*6}px`}));return(<div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}>{particles.map(p=>(<div key={p.id} style={{position:'absolute',top:'50%',left:'50%',width:p.size,height:p.size,borderRadius:'50%',background:'rgba(255,255,255,0.9)','--tx':p.tx,'--ty':p.ty,animation:`saltParticle 0.8s ease-out ${p.delay} both`}}/>))}</div>)}
function HenkaSwirl(){return(<div style={{position:'absolute',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{[0,1,2].map(i=>(<div key={i} style={{position:'absolute',fontSize:`${2+i*0.8}rem`,animation:`henkaSwirl 0.7s ease-out ${i*0.1}s both`,opacity:0}}>🌀</div>))}</div>)}
function ChaosEffect(){return(<div style={{position:'absolute',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>{[0,1,2,3].map(i=>(<div key={i} style={{position:'absolute',fontSize:`${1.5+i*0.6}rem`,animation:`chaosEffect 0.8s ease-out ${i*0.08}s both`,opacity:0}}>💥</div>))}</div>)}
function LightningEffect(){return(<div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden'}}><div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:3,height:'100%',background:'linear-gradient(180deg,transparent,#f39c12,#e74c3c,transparent)',animation:'lightning 0.4s ease both',filter:'blur(2px)',boxShadow:'0 0 10px #f39c12, 0 0 20px #e74c3c'}}/></div>)}
function FloatingNumber({value,color,onDone}){useEffect(()=>{const id=setTimeout(onDone,900);return()=>clearTimeout(id)},[]);return(<div style={{position:'absolute',top:'10%',left:'50%',transform:'translateX(-50%)',fontFamily:'var(--jp)',fontSize:'1.4rem',fontWeight:900,color,textShadow:`0 0 10px ${color}`,animation:'floatUp 0.9s ease both',pointerEvents:'none',zIndex:10,whiteSpace:'nowrap'}}>{value}</div>)}
function GyojiChooseScreen({choices,onChoose,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [chosen,setChosen]=useState(null)
  // Enter для підтвердження
  useEffect(()=>{
    const handler=(e)=>{if(e.key==='Enter'&&chosen)onChoose(chosen)}
    window.addEventListener('keydown',handler)
    return()=>window.removeEventListener('keydown',handler)
  },[chosen,onChoose])
  return(
    <div style={{position:'fixed',inset:0,zIndex:1600,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.85)',backdropFilter:'blur(6px)',animation:'fadeIn 0.2s ease',padding:'0.5rem'}}>
      <div style={{background:'linear-gradient(175deg,#2a0a0a,#1a0808)',border:'1px solid rgba(232,197,71,0.5)',borderRadius:10,width:'100%',maxWidth:680,maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 0 0 1px rgba(0,0,0,0.8),0 16px 48px rgba(0,0,0,0.95)',animation:'pop 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
        {/* Заголовок — фіксований */}
        <div style={{flexShrink:0,padding:'0.75rem 1rem 0.5rem',borderBottom:'1px solid rgba(232,197,71,0.15)',textAlign:'center'}}>
          <div style={{height:2,background:'linear-gradient(90deg,transparent,#e8c547,transparent)',marginBottom:'0.6rem'}}/>
          <span style={{fontSize:'1.4rem'}}>⚖️</span>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:900,color:'#e8c547',marginTop:2}}>{t('Ґьоджі — Рішення Судді',"Gyoji — Judge's Ruling")}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,220,150,0.45)',marginTop:2}}>{t('Оберіть зіграну карту для повторної активації','Choose a played card to activate again')}</div>
        </div>
        {/* Картки — скролабельні */}
        <div style={{flex:1,overflowY:'auto',padding:'0.75rem',display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',alignContent:'flex-start'}}>
          {choices.map((card,i)=>(
            <div key={card.id} onClick={()=>setChosen(chosen?.id===card.id?null:card)}
              style={{position:'relative',cursor:'pointer',flexShrink:0,
                transform:chosen?.id===card.id?'translateY(-6px) scale(1.05)':'none',
                transition:'transform 0.12s',
                filter:chosen?.id===card.id?'drop-shadow(0 6px 18px rgba(232,197,71,0.8))':'none',
                animation:`pop 0.25s ease ${i*0.06}s both`}}>
              <GameCard card={card} selected={chosen?.id===card.id} small lang={lang}/>
              {chosen?.id===card.id&&(
                <div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',background:'#e8c547',borderRadius:6,padding:'1px 8px',fontFamily:'var(--jp)',fontSize:'0.45rem',fontWeight:900,color:'#1a1000',whiteSpace:'nowrap'}}>✓</div>
              )}
            </div>
          ))}
        </div>
        {/* Кнопка — фіксована знизу */}
        <div style={{flexShrink:0,padding:'0.6rem 1rem 0.75rem',borderTop:'1px solid rgba(232,197,71,0.1)'}}>
          <button onClick={()=>chosen&&onChoose(chosen)} disabled={!chosen}
            style={{width:'100%',padding:'0.8rem',background:chosen?'linear-gradient(180deg,#8a6a00,#4a3800)':'rgba(255,255,255,0.04)',border:`1px solid ${chosen?'#e8c547':'rgba(255,255,255,0.08)'}`,borderRadius:7,color:chosen?'#fff8d0':'rgba(255,255,255,0.2)',fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:900,cursor:chosen?'pointer':'default',letterSpacing:'0.08em',transition:'all 0.12s'}}>
            {chosen?`⚖️ ${chosen.label||chosen.id} — ${t('Підтвердити (Enter)','Confirm (Enter)')}`:t('Оберіть карту','Select a card')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DrawOfferScreen({cards,hand,onChoose,onSkip,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [chosen,setChosen]=useState(null)
  const [hovered,setHovered]=useState(null)
  return(
    <div style={{position:'fixed',inset:0,zIndex:1500,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',animation:'fadeIn 0.25s ease'}}>
      <div style={{background:'linear-gradient(175deg,#1e1810,#130e08)',border:'1px solid rgba(184,134,11,0.45)',borderRadius:12,padding:'1.5rem',maxWidth:420,width:'90%',boxShadow:'0 0 0 1px rgba(0,0,0,0.8), 0 24px 60px rgba(0,0,0,0.95)',animation:'pop 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
        <div style={{height:3,background:'linear-gradient(90deg,transparent,#b8860b,transparent)',borderRadius:2,marginBottom:'1.25rem'}}/>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,220,150,0.5)',textTransform:'uppercase',letterSpacing:'0.15em',textAlign:'center',marginBottom:'0.4rem'}}>
          {t('Оберіть карту для руки','Choose a card for your hand')}
        </div>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,color:'#f0c060',textAlign:'center',marginBottom:'1.25rem',textShadow:'0 0 20px rgba(240,192,96,0.5)'}}>
          📥 {t('Нова карта','New card')}
        </div>
        <div style={{display:'flex',gap:16,justifyContent:'center',marginBottom:'1rem'}}>
          {cards.map((card,i)=>{
            const blocked=!canAddToHand(hand,card)
            const isChosen=chosen?.id===card.id
            const isHov=hovered===card.id
            return(
              <div key={card.id} onClick={()=>!blocked&&setChosen(card)}
                onMouseEnter={()=>!blocked&&setHovered(card.id)}
                onMouseLeave={()=>setHovered(null)}
                style={{position:'relative',cursor:blocked?'not-allowed':'pointer',
                  transform:isChosen?'translateY(-8px) scale(1.06)':isHov&&!blocked?'translateY(-4px) scale(1.03)':'none',
                  transition:'transform 0.15s',
                  filter:blocked?'grayscale(0.8) brightness(0.5)':isChosen?`drop-shadow(0 8px 20px rgba(184,134,11,0.7))`:isHov?`drop-shadow(0 4px 12px rgba(184,134,11,0.4))`:'none',
                  animation:`pop 0.3s ease ${i*0.1}s both`,
                }}>
                <GameCard card={card} selected={isChosen} lang={lang}/>
                {blocked&&(
                  <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,borderRadius:8}}>
                    <span style={{fontSize:'1.2rem'}}>🚫</span>
                    <span style={{fontFamily:'var(--jp)',fontSize:'0.45rem',color:'#e74c3c',background:'rgba(0,0,0,0.8)',padding:'2px 6px',borderRadius:3,textAlign:'center',lineHeight:1.4}}>{t('Ліміт типу','Type limit')}</span>
                  </div>
                )}
                {isChosen&&<div style={{position:'absolute',top:-8,left:'50%',transform:'translateX(-50%)',background:'#b8860b',borderRadius:8,padding:'2px 8px',fontFamily:'var(--jp)',fontSize:'0.5rem',fontWeight:700,color:'#1a1200',whiteSpace:'nowrap'}}>✓ {t('Обрано','Selected')}</div>}
              </div>
            )
          })}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>chosen&&onChoose(chosen)} disabled={!chosen}
            style={{flex:2,padding:'0.875rem',background:chosen?'linear-gradient(180deg,#c49a1a,#8b6010)':'rgba(255,255,255,0.05)',border:`1px solid ${chosen?'#f0c060':'rgba(255,255,255,0.08)'}`,borderRadius:8,color:chosen?'#fff8e0':'rgba(255,255,255,0.25)',fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:900,cursor:chosen?'pointer':'default',letterSpacing:'0.1em',transition:'all 0.15s',textShadow:chosen?'0 1px 4px rgba(0,0,0,0.6)':'none'}}>
            {chosen?t('Взяти карту ›','Take card ›'):t('Оберіть карту','Select a card')}
          </button>
          <button onClick={onSkip}
            style={{flex:1,padding:'0.875rem',background:'transparent',border:'1px solid rgba(255,220,150,0.12)',borderRadius:8,color:'rgba(255,220,150,0.4)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,220,150,0.35)';e.currentTarget.style.color='rgba(255,220,150,0.7)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,220,150,0.12)';e.currentTarget.style.color='rgba(255,220,150,0.4)'}}>
            {t('Пропустити','Skip')}
          </button>
        </div>
        <div style={{height:2,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.3),transparent)',borderRadius:2,marginTop:'1.25rem'}}/>
      </div>
    </div>
  )
}

function RoundBanner({roundNum,lang}){const t=(uk,en)=>lang==='en'?en:uk;return(<div style={{position:'fixed',inset:0,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2500}}><div style={{textAlign:'center',animation:'roundBanner 1.8s ease both'}}><div style={{fontFamily:'var(--jp)',fontSize:'clamp(1.5rem,6vw,3rem)',fontWeight:900,color:'#b8860b',textShadow:'0 0 30px rgba(184,134,11,0.8), 0 4px 8px rgba(0,0,0,0.8)',letterSpacing:'0.2em',textTransform:'uppercase'}}>{t('Раунд','Round')} {roundNum}</div><div style={{fontFamily:'var(--jp)',fontSize:'clamp(0.8rem,3vw,1.2rem)',color:'rgba(255,255,255,0.7)',letterSpacing:'0.3em',marginTop:4}}>— {t('БІЙ','FIGHT')} —</div></div></div>)}

function HPBar({hp,armor=0,flash=null}){
  const pct=Math.max(0,(hp/MAX_HP)*100)
  const color=pct>60?'#1a6b5c':pct>30?'#b8860b':'#c0392b'
  const isLow=pct<=30
  const flashAnim=flash==='damage'?'flashRed 0.4s ease':flash==='heal'?'flashGreen 0.4s ease':flash==='armor'?'flashBlue 0.4s ease':undefined
  return(
    <div style={{animation:flashAnim}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,gap:8}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,255,255,0.5)',fontWeight:600}}>HP</span>
          <span style={{fontFamily:'var(--jp)',fontSize:'1.15rem',fontWeight:800,color,animation:isLow?'lowHpPulse 1s ease infinite':undefined}}>{hp}<span style={{fontSize:'0.7rem',opacity:0.5}}>/{MAX_HP}</span></span>
        </div>
        {armor>0&&<div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(31,97,141,0.15)',border:'1px solid rgba(31,97,141,0.4)',borderRadius:3,padding:'2px 8px'}}><span style={{fontSize:'0.8rem'}}>🛡</span><span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:800,color:'#1f618d'}}>{armor}</span></div>}
      </div>
      <div style={{height:11,background:'var(--bg2)',borderRadius:6,overflow:'hidden',boxShadow:'inset 0 1px 3px rgba(0,0,0,0.3)'}}>
        <div style={{height:'100%',width:`${pct}%`,background:color,borderRadius:6,transition:'width 0.6s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 6px ${color}88`}}/>
      </div>
    </div>
  )
}

function GameCard({card,selected,onClick,disabled,small,tiny,showBack,lang='uk',isNew=false}){
  const [hovered,setHovered]=useState(false)
  if(!card)return null
  if(showBack)return(<div style={{width:small?'clamp(70px,16vw,92px)':tiny?52:170,height:small?'clamp(105px,24vw,138px)':tiny?78:255,borderRadius:8,background:'linear-gradient(135deg,#1a1a2e,#0f3460)',border:'2px solid #b8860b',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{fontSize:'1.2rem',opacity:0.5}}>相</span></div>)
  const color=card.color||'#b8860b'
  const hoverColor=color==='var(--mid)'?'#888':color
  const canHover=!disabled&&!selected
  const w=tiny?52:small?'clamp(70px,16vw,92px)':170
  const h=tiny?78:small?'clamp(105px,24vw,138px)':255
  // Визначаємо буст — карта вже має підвищені атрибути якщо applyBoostToCard застосував
  const hasBoost=card.type==='rikishi'&&card._atkBoost||card._defBoost
  return(
    <div style={{position:'relative',width:w,flexShrink:0,display:'inline-block'}}>
      <div onClick={disabled?undefined:onClick} onMouseEnter={()=>canHover&&setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{width:w,height:h,borderRadius:8,overflow:'hidden',cursor:disabled?'default':'pointer',border:`2px solid ${selected?'#b8860b':hovered?hoverColor:'transparent'}`,boxShadow:selected?'0 0 18px rgba(184,134,11,0.8)':hovered&&!disabled?`0 6px 16px rgba(0,0,0,0.25), 0 0 8px ${hoverColor}77`:'0 2px 8px rgba(0,0,0,0.18)',transition:'all 0.15s',opacity:disabled?0.75:1,transform:selected?'translateY(-4px) scale(1.04)':hovered&&!disabled?'translateY(-3px) scale(1.02)':'translateZ(0)',animation:isNew?'cardFlip 0.35s ease both':undefined,background:'#1a1a1a',willChange:'transform'}}>
        <img src={`/cards/${getCardSkinId(card.id)}_${lang}.webp`} alt={card.id} style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'high-quality',display:'block',transform:'translateZ(0)',willChange:'transform'}} onError={e=>{e.currentTarget.style.display='none'}}/>
      </div>
      {/* Boost badge — показується якщо карта має _atkBoost або _defBoost */}
      {(card._atkBoost||card._defBoost)&&!tiny&&(
        <div style={{position:'absolute',top:-7,right:-7,background:'linear-gradient(135deg,#b8860b,#f0c060)',border:'1px solid rgba(255,220,80,0.7)',borderRadius:8,padding:'2px 6px',fontFamily:'var(--jp)',fontSize:small?'0.45rem':'0.55rem',fontWeight:900,color:'#1a1200',boxShadow:'0 2px 8px rgba(0,0,0,0.8)',whiteSpace:'nowrap',zIndex:5,pointerEvents:'none',lineHeight:1.3}}>
          {card._atkBoost?`⚔+${card._atkBoost}`:''}
          {card._atkBoost&&card._defBoost?' ':''}
          {card._defBoost?`🛡+${card._defBoost}`:''}
        </div>
      )}
    </div>
  )
}

function CardBook({ lang, onClose, discoveredCards = new Set() }) {
  const t=(uk,en)=>lang==='en'?en:uk
  const [filter,setFilter]=useState('all')
  const [selected,setSelected]=useState(null)
  const typeFilters=[
    {key:'all',    label:t('Всі','All')},
    {key:'rikishi',label:t('Рікіші','Rikishi')},
    {key:'heal',   label:t('Хіл','Heal')},
    {key:'armor',  label:t('Броня','Armor')},
    {key:'strike', label:t('Удар','Strike')},
    {key:'swap',   label:t('Заміна','Swap')},
    {key:'salt',   label:t('Сіль','Salt')},
    {key:'henka',  label:t('Хенка','Henka')},
    {key:'chaos',  label:t('Хаос','Chaos')},
    {key:'gyoji',  label:t('Ґьоджі','Gyoji')},
  ]
  const rankFilters=[
    {key:'Yokozuna', label:'Yokozuna', color:'#b8860b'},
    {key:'Ozeki',    label:'Ozeki',    color:'#8b1a1a'},
    {key:'Sekiwake', label:'Sekiwake', color:'#1a4a7a'},
    {key:'Komusubi', label:'Komusubi', color:'#1f7a3a'},
    {key:'Maegashira',label:'Maegashira',color:'#6f6f6f'},
  ]
  const visibleCards = filter==='all' ? FULL_DECK : FULL_DECK.filter(c=>c.type===filter||c.rank===filter)
  const uniqueCards  = visibleCards.filter((c,i,arr)=>arr.findIndex(x=>x.label===c.label&&x.type===c.type)===i||c.type==='rikishi')
  const rankOrder={Yokozuna:0,Ozeki:1,Sekiwake:2,Komusubi:3,Maegashira:4}
  const sorted=[...uniqueCards].sort((a,b)=>{
    if(a.type==='rikishi'&&b.type==='rikishi'){const rd=(rankOrder[a.rank]||99)-(rankOrder[b.rank]||99);if(rd!==0)return rd;return a.id.localeCompare(b.id)}
    if(a.type==='rikishi')return -1;if(b.type==='rikishi')return 1;return 0
  })
  const totalDiscovered = FULL_DECK.filter(c => discoveredCards.has(c.id)).length
  return(
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative'}}>
      <div style={{padding:'0.75rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,color:'var(--ink)',display:'flex',alignItems:'center',gap:10}}>
          📖 {t('Колода карт','Card Book')}
          <span style={{color:'var(--mid)',fontWeight:400}}>({sorted.length})</span>
          <span style={{color:'#f0c060',fontWeight:700,fontSize:'0.65rem',background:'rgba(184,134,11,0.12)',border:'1px solid rgba(184,134,11,0.3)',borderRadius:4,padding:'1px 8px'}}>🔓 {totalDiscovered}/{FULL_DECK.length}</span>
        </div>
        <button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',padding:0}}>✕ {t('Закрити','Close')}</button>
      </div>
      <div style={{padding:'0.5rem 1rem',borderBottom:'1px solid var(--border)',display:'flex',gap:4,flexWrap:'wrap',flexShrink:0}}>
        {typeFilters.map(f=>(<button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'3px 10px',background:filter===f.key?'#b8860b':'var(--bg2)',color:filter===f.key?'#fff':'var(--mid)',border:`1px solid ${filter===f.key?'#b8860b':'var(--border)'}`,borderRadius:20,fontFamily:'var(--jp)',fontSize:'0.58rem',cursor:'pointer',fontWeight:filter===f.key?700:400,transition:'all 0.15s'}}>{f.label}</button>))}
        {filter==='rikishi'&&rankFilters.map(f=>(<button key={f.key} onClick={()=>setFilter(f.key)} style={{padding:'3px 10px',background:filter===f.key?f.color:'var(--bg2)',color:filter===f.key?'#fff':'var(--mid)',border:`1px solid ${f.color}`,borderRadius:20,fontFamily:'var(--jp)',fontSize:'0.58rem',cursor:'pointer'}}>{f.label}</button>))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'0.75rem',display:'flex',flexWrap:'wrap',gap:8,alignContent:'flex-start'}}>
        {sorted.map(card => {
          const isLocked = !discoveredCards.has(card.id)
          return (
            <div key={card.id} onClick={() => !isLocked && setSelected(card)} style={{cursor:isLocked?'default':'pointer',animation:'fadeIn 0.2s ease',borderRadius:10,position:'relative',transition:'transform 0.15s'}} onMouseEnter={e=>{if(!isLocked)e.currentTarget.style.transform='scale(1.04)'}} onMouseLeave={e=>{e.currentTarget.style.transform='none'}}>
              <GameCard card={card} lang={lang} small disabled/>
              {isLocked&&(<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.78)',borderRadius:8,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,backdropFilter:'blur(2px)',animation:'lockPulse 3s ease infinite'}}><span style={{fontSize:'1.3rem'}}>🔒</span><span style={{fontFamily:'var(--jp)',fontSize:'0.38rem',color:'rgba(255,255,255,0.35)',textAlign:'center',lineHeight:1.4,whiteSpace:'pre'}}>{t('Зіграй\nщоб відкрити','Play to\nunlock')}</span></div>)}
            </div>
          )
        })}
      </div>
      {selected && discoveredCards.has(selected.id) && (
        <div onClick={()=>setSelected(null)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',animation:'fadeIn 0.15s ease'}}>
          <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:`2px solid ${selected.color||'#b8860b'}`,borderRadius:12,display:'flex',gap:0,overflow:'hidden',maxHeight:'90%',animation:'pop 0.2s ease',boxShadow:`0 0 40px ${selected.color||'#b8860b'}44`}}>
            <div style={{width:480,flexShrink:0,background:'#111',minHeight:640}}><img src={`/cards/${getCardSkinId(selected.id)}_${lang}.webp`} alt={selected.id} style={{width:'100%',height:'100%',objectFit:'cover',imageRendering:'high-quality',display:'block',minHeight:640}} onError={e=>{e.currentTarget.style.display='none'}}/></div>
            <div style={{width:330,padding:'1.75rem',overflowY:'auto',display:'flex',flexDirection:'column',gap:'1rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div><div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,color:selected.color||'#b8860b'}}>{selected.id}</div>{selected.rank&&<div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'var(--mid)',textTransform:'uppercase',letterSpacing:'0.08em',marginTop:2}}>{selected.rank}</div>}</div>
                <button onClick={()=>setSelected(null)} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1,padding:0}}>✕</button>
              </div>
              {getCardLore(selected)?(
                <div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',color:'var(--ink)',lineHeight:1.9,fontStyle:'italic',padding:'1rem 1.1rem',background:'var(--bg2)',borderRadius:8,borderLeft:`3px solid ${selected.color||'#b8860b'}`,flex:1}}>"{getCardLore(selected)}"</div>
              ):(
                <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'var(--mid)',lineHeight:1.8,padding:'1rem',background:'var(--bg2)',borderRadius:8,flex:1}}>{getCardDesc(selected)}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const BTN = {
  gold: {background:'linear-gradient(180deg,#d4a520 0%,#8b6010 100%)',border:'1px solid #f0c060',color:'#fff8e0',boxShadow:'0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,80,0.4)',fontWeight:700,textShadow:'0 1px 2px rgba(0,0,0,0.8)'},
  dark: {background:'linear-gradient(180deg,#2a2520 0%,#1a1510 100%)',border:'1px solid #4a3e30',color:'#a09070',boxShadow:'0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',fontWeight:600,textShadow:'0 1px 2px rgba(0,0,0,0.8)'},
  red:  {background:'linear-gradient(180deg,#8b1a1a 0%,#5a0e0e 100%)',border:'1px solid #c0392b',color:'#ffe0e0',boxShadow:'0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,100,100,0.3)',fontWeight:700,textShadow:'0 1px 2px rgba(0,0,0,0.8)'},
}
const BTN_BASE = {borderRadius:5,cursor:'pointer',fontFamily:'var(--jp)',fontSize:'0.7rem',padding:'5px 12px',letterSpacing:'0.05em',transition:'filter 0.1s, transform 0.1s',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:5}
function GameBtn({variant='dark',children,onClick,title,style={},disabled=false}){
  const [pressed,setPressed]=useState(false)
  const v=BTN[variant]||BTN.dark
  return(<button onClick={disabled?undefined:onClick} title={title} onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)} style={{...BTN_BASE,...v,...style,filter:pressed?'brightness(0.8)':disabled?'brightness(0.5)':'brightness(1)',transform:pressed?'translateY(1px)':'translateY(0)',cursor:disabled?'default':'pointer'}}>{children}</button>)
}

function AudioControls({sfxOn,musicOn,currentTheme,onToggleSfx,onToggleMusic,onThemeChange,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [showThemes,setShowThemes]=useState(false)
  return(<div style={{position:'relative',display:'flex',gap:5,alignItems:'center'}}>
    <GameBtn variant={sfxOn?'gold':'dark'} onClick={onToggleSfx}>{sfxOn?'🔊':'🔇'} {t('Звук','SFX')}</GameBtn>
    <GameBtn variant={musicOn?'gold':'dark'} onClick={()=>{onToggleMusic();setShowThemes(false)}}>🎵 {t('Музика','Music')}</GameBtn>
    <GameBtn variant='dark' onClick={()=>setShowThemes(v=>!v)}>🎼</GameBtn>
    {showThemes&&(<div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'calc(100% + 6px)',right:0,background:'linear-gradient(180deg,#2a2420 0%,#1a1510 100%)',border:'1px solid #4a3e30',borderRadius:6,padding:'0.6rem',zIndex:100,minWidth:170,boxShadow:'0 8px 24px rgba(0,0,0,0.8)'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'#a09070',textTransform:'uppercase',marginBottom:6,letterSpacing:'0.12em'}}>{t('Тема','Theme')}</div>
      {MUSIC_THEMES.map(th=>(<div key={th.id} onClick={()=>{onThemeChange(th.id);setShowThemes(false)}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,padding:'5px 8px',borderRadius:4,cursor:'pointer',marginBottom:2,background:currentTheme===th.id?'rgba(184,134,11,0.25)':'transparent',border:`1px solid ${currentTheme===th.id?'#b8860b':'transparent'}`}}>
        <div><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',fontWeight:700,color:currentTheme===th.id?'#f0c060':'#d0c0a0'}}>{lang==='en'?th.label.en:th.label.uk}</div><div style={{fontFamily:'var(--jp)',fontSize:'0.52rem',color:'#7a6a50'}}>{lang==='en'?th.desc.en:th.desc.uk}</div></div>
        {currentTheme===th.id&&<span style={{color:'#f0c060',fontSize:'0.8rem'}}>✓</span>}
      </div>))}
    </div>)}
  </div>)
}

function CardGuideInline({lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [open,setOpen]=useState(false)
  return(
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{...BTN_BASE,...BTN.dark,fontSize:'0.62rem',padding:'4px 10px',gap:4}}>
        {open?'▲':'▼'} {t('Типи карт','Card types')}
      </button>
      {open&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',top:'calc(100% + 6px)',left:0,background:'linear-gradient(180deg,#2a2420,#1c1812)',border:'1px solid #3a3020',borderRadius:6,padding:'0.6rem 0.75rem',zIndex:200,minWidth:320,maxWidth:480,boxShadow:'0 8px 32px rgba(0,0,0,0.9)',animation:'slideIn 0.15s ease',display:'flex',flexDirection:'column',gap:5}}>
          {CARD_TYPES_INFO.map(ct=>(<div key={ct.type} style={{display:'flex',gap:8,alignItems:'flex-start'}}>
            <span style={{fontSize:'0.85rem',flexShrink:0,width:18}}>{ct.emoji}</span>
            <div><span style={{fontFamily:'var(--jp)',fontSize:'0.62rem',fontWeight:700,color:'#e0d0a0',marginRight:6}}>{lang==='en'?ct.label.en:ct.label.uk}</span><span style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,220,150,0.55)'}}>{lang==='en'?ct.desc.en:ct.desc.uk}</span></div>
          </div>))}
        </div>
      )}
    </div>
  )
}

function CardGuide({lang}){
  const [open,setOpen]=useState(false)
  const t=(uk,en)=>lang==='en'?en:uk
  return(<div style={{marginBottom:'0.75rem'}}>
    <GameBtn variant='dark' onClick={()=>setOpen(o=>!o)} style={{fontSize:'0.65rem'}}>{open?'▲':'▼'} {t('Типи карт','Card types')}</GameBtn>
    {open&&(<div style={{marginTop:6,background:'linear-gradient(180deg,#2a2420 0%,#1c1812 100%)',border:'1px solid #3a3020',borderRadius:6,padding:'0.75rem',display:'flex',flexDirection:'column',gap:6,animation:'slideIn 0.2s ease',boxShadow:'0 4px 16px rgba(0,0,0,0.7)'}}>
      {CARD_TYPES_INFO.map(ct=>(<div key={ct.type} style={{display:'flex',gap:10,alignItems:'flex-start'}}><span style={{fontSize:'1rem',flexShrink:0,width:22}}>{ct.emoji}</span><div><div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',fontWeight:700,color:'#e0d0a0',marginBottom:1}}>{lang==='en'?ct.label.en:ct.label.uk}</div><div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'rgba(255,220,150,0.65)',textShadow:'0 1px 3px rgba(0,0,0,0.8)',lineHeight:1.4}}>{lang==='en'?ct.desc.en:ct.desc.uk}</div></div></div>))}
    </div>)}
  </div>)
}

function SwapScreen({hand,drawOptions,onSwap,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [selected,setSelected]=useState(null)
  return(<div style={{animation:'slideIn 0.25s ease'}}>
    <div style={{fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>🔄 {t('Заміна','Swap')}</div>
    <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:600,color:'rgba(255,220,150,0.9)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textAlign:'center',marginBottom:'1rem'}}>{t('Оберіть карту з колоди','Choose from deck')}</div>
    <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap',marginBottom:'1.25rem'}}>{drawOptions.map((c,i)=>c&&<div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} selected={selected?.id===c.id} onClick={()=>setSelected(c)} lang={lang}/></div>)}</div>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'center',marginBottom:'1rem'}}>{hand.filter(c=>c.type!=='swap').map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}{selected&&<GameCard card={selected} small lang={lang} isNew/>}</div>
    <button onClick={()=>selected&&onSwap(selected)} disabled={!selected} style={{width:'100%',padding:'0.75rem',background:selected?'#27ae60':'var(--bg2)',color:selected?'#fff':'var(--mid)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.82rem',letterSpacing:'0.1em',cursor:selected?'pointer':'default',fontWeight:700}}>{selected?t('Підтвердити','Confirm'):t('Оберіть','Select')}</button>
  </div>)
}

function HPFlask({hp,armor=0,flash=null,label,color='#1a6b5c',align='left'}){
  const pct=Math.max(0,Math.min(100,(hp/MAX_HP)*100))
  const liquidColor=pct>60?'#1a9b6c':pct>30?'#c8a000':'#c0392b'
  const glowColor=pct>60?'#1a9b6c':pct>30?'#f0c060':'#e74c3c'
  const isLow=pct<=30
  const flashAnim=flash?'hpFlash 0.4s ease':undefined
  return(
    <div style={{display:'flex',flexDirection:'column',gap:4,animation:flashAnim,width:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,220,150,0.9)',textTransform:'uppercase',letterSpacing:'0.06em',textShadow:'0 1px 4px rgba(0,0,0,1)'}}>{label}</span>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {armor>0&&<div style={{display:'flex',alignItems:'center',gap:2,background:'rgba(31,97,141,0.85)',border:'1px solid rgba(100,180,255,0.5)',borderRadius:3,padding:'0px 5px'}}><span style={{fontSize:'0.55rem'}}>🛡</span><span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',fontWeight:700,color:'#7ec8f0'}}>{armor}</span></div>}
          <span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:900,color:glowColor,textShadow:`0 0 8px ${glowColor}`,animation:isLow?'lowHpPulse 1s ease infinite':undefined}}>{hp}<span style={{fontSize:'0.55rem',color:'rgba(255,255,255,0.4)'}}>/{MAX_HP}</span></span>
        </div>
      </div>
      <div style={{position:'relative',height:14,borderRadius:7,background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.1)',overflow:'hidden',boxShadow:`0 0 8px ${glowColor}33`}}>
        <div style={{position:'absolute',inset:0,width:`${pct}%`,background:`linear-gradient(90deg,${liquidColor}aa,${liquidColor})`,borderRadius:7,transition:'width 0.6s cubic-bezier(.4,0,.2,1)',animation:isLow?'lowHpPulse 1s ease infinite':undefined}}/>
        <div style={{position:'absolute',top:1,left:0,right:0,height:4,background:'linear-gradient(180deg,rgba(255,255,255,0.15),transparent)',borderRadius:7,pointerEvents:'none'}}/>
        {[25,50,75].map(m=><div key={m} style={{position:'absolute',top:0,bottom:0,left:`${m}%`,width:1,background:'rgba(255,255,255,0.06)'}}/>)}
      </div>
    </div>
  )
}

// ── RikishiPortraitFigure — з анімацією пульсації ────────────
function RikishiPortraitFigure({ side, height = 115 }) {
  const [failed, setFailed] = useState(false)
  const isLeft   = side === 'left'
  const src      = isLeft ? '/images/vs/rikishi-player.webp' : '/images/vs/rikishi-opponent.webp'
  const svgColor = isLeft ? '#3edc81' : '#e07060'

  return (
    <div style={{
      position:  'absolute',
      bottom:    -10,
      [isLeft ? 'left' : 'right']: -8,
      width:     Math.round(height * 0.72),
      height:    height,
      zIndex:    6,
      pointerEvents: 'none',
      // Анімація пульсації на зовнішньому div
      animation: isLeft ? 'rikishiGoldPulse 3.5s ease-in-out infinite' : 'rikishiRedPulse 3.5s ease-in-out infinite',
      transformOrigin: 'center bottom',
    }}>
      {!failed ? (
        <img
          src={src}
          alt=""
          style={{
            width: '100%', height: '100%',
            objectFit: 'contain', imageRendering: 'high-quality',
            objectPosition: 'bottom center',
            display: 'block',
            filter: 'saturate(1.15) brightness(0.9) contrast(1.05)',
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <svg viewBox="0 0 110 140" width="72" height="92" style={{display:'block'}}>
          <ellipse cx="62" cy="10" rx="7" ry="5" fill={svgColor}/>
          <circle cx="58" cy="26" r="18" fill={svgColor}/>
          <ellipse cx="50" cy="76" rx="30" ry="34" fill={svgColor} transform="rotate(-12 50 76)"/>
          <ellipse cx="82" cy="62" rx="9" ry="20" fill={svgColor} transform="rotate(-50 82 62)"/>
          <circle cx="92" cy="48" r="9" fill={svgColor}/>
          <ellipse cx="18" cy="70" rx="8" ry="16" fill={svgColor} transform="rotate(25 18 70)"/>
          <ellipse cx="68" cy="118" rx="14" ry="20" fill={svgColor} transform="rotate(-12 68 118)"/>
          <ellipse cx="74" cy="137" rx="13" ry="8" fill={svgColor}/>
          <ellipse cx="30" cy="116" rx="13" ry="18" fill={svgColor} transform="rotate(18 30 116)"/>
          <ellipse cx="22" cy="133" rx="12" ry="7" fill={svgColor}/>
        </svg>
      )}
    </div>
  )
}

function PlayerBadge({ label, side = 'left' }) {
  const isLeft = side === 'left'
  return (
    <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',fontWeight:700,color:isLeft?'#2ecc71':'#e74c3c',letterSpacing:'0.06em',textTransform:'uppercase',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textAlign:isLeft?'left':'right',marginBottom:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
      {label}
    </div>
  )
}

function PremiumHPBar({ hp, armor = 0, flash = null, side = 'left' }) {
  const pct   = Math.max(0, Math.min(100, (hp / MAX_HP) * 100))
  const isLow = pct <= 30
  const isMid = pct > 30 && pct <= 60
  const isRight = side === 'right'
  // Ліва сторона — гравець (зелено/жовто/червоний), права — суперник (синьо/жовто/червоний)
  // Однакові кольори для обох сторін — зелений/жовтий/червоний
  const fillBase = isLow?'#e74c3c':isMid?'#c8900a':'#1abc9c'
  const fillL = isLow?'linear-gradient(90deg,#5a0000,#a01818,#e74c3c)':isMid?'linear-gradient(90deg,#4a2e00,#8a5a00,#c8900a)':'linear-gradient(90deg,#053020,#0d5038,#1abc9c)'
  const fillR = isLow?'linear-gradient(270deg,#5a0000,#a01818,#e74c3c)':isMid?'linear-gradient(270deg,#4a2e00,#8a5a00,#c8900a)':'linear-gradient(270deg,#053020,#0d5038,#1abc9c)'
  const fill  = isRight ? fillR : fillL
  const glow  = isLow ? '#e74c3c' : isMid ? '#f0c060' : '#1abc9c'
  const flashA = flash==='damage'?'flashRed 0.4s ease':flash==='heal'?'flashGreen 0.4s ease':flash==='armor'?'flashBlue 0.4s ease':undefined
  const armorBadge = armor > 0 && (
    <div style={{display:'flex',alignItems:'center',gap:3,background:'linear-gradient(180deg,#122038,#091428)',border:'1px solid rgba(100,180,255,0.4)',borderRadius:4,padding:'2px 7px',boxShadow:'0 0 8px rgba(80,150,255,0.2)'}}>
      <img src="/images/upgrades/upgrade-def.webp" alt="def" style={{height:18,width:'auto',imageRendering:'high-quality',filter:'drop-shadow(0 0 4px rgba(100,180,255,0.6))'}} onError={e=>{e.currentTarget.style.display='none'}}/>
      <span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:900,color:'#7ec8f0',textShadow:'0 0 8px rgba(100,180,255,0.6)'}}>{armor}</span>
    </div>
  )
  const hpNumber = (
    <div style={{display:'flex',alignItems:'baseline',gap:3}}>
      <span style={{fontFamily:'var(--jp)',fontSize:'1.45rem',fontWeight:900,color:glow,textShadow:`0 0 14px ${glow}99`,animation:isLow?'lowHpPulse 1s ease infinite':undefined,lineHeight:1}}>{hp}</span>
      <span style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,255,255,0.28)'}}>/{MAX_HP}</span>
    </div>
  )
  return (
    <div style={{animation:flashA,width:'100%'}}>
      <div style={{display:'flex',justifyContent:isRight?'flex-end':'flex-start',alignItems:'baseline',gap:6,marginBottom:5}}>
        {isRight&&armorBadge}
        {hpNumber}
        {!isRight&&armorBadge}
      </div>
      <div style={{position:'relative',height:13,background:'linear-gradient(180deg,#0c0906,#181210)',borderRadius:7,border:'1px solid rgba(255,255,255,0.06)',overflow:'hidden',boxShadow:'inset 0 2px 5px rgba(0,0,0,0.85)'}}>
        {/* Права сторона — бар іде справа наліво */}
        <div style={{position:'absolute',top:1,bottom:1,[isRight?'right':'left']:1,width:`calc(${pct}% - 2px)`,background:fill,borderRadius:5,transition:'width 0.5s cubic-bezier(.4,0,.2,1)',boxShadow:`0 0 10px ${glow}44`}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:'45%',background:'linear-gradient(180deg,rgba(255,255,255,0.16),transparent)',borderRadius:'5px 5px 0 0'}}/>
        </div>
        {[25,50,75].map(m=>(<div key={m} style={{position:'absolute',top:0,bottom:0,left:`${m}%`,width:1,background:'rgba(0,0,0,0.4)',zIndex:2}}/>))}
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
  const [showChaos,setShowChaos]=useState(false)
  useEffect(()=>{
    const t1=setTimeout(()=>setStep(1),100)
    const t2=setTimeout(()=>{
      setStep(2)
      if(myCard?.type==='strike'||oppCard?.type==='strike')setShowLightning(true)
      if(myCard?.type==='salt'||oppCard?.type==='salt')setShowSalt(true)
      if(myCard?.type==='henka'||oppCard?.type==='henka')setShowHenka(true)
      if(myCard?.type==='chaos'||oppCard?.type==='chaos')setShowChaos(true)
      setTimeout(()=>{setShowLightning(false);setShowSalt(false);setShowHenka(false);setShowChaos(false)},800)
      if(myHpDelta!==0||myArmorDelta!==0)setShowMyFloat(true)
      if(oppHpDelta!==0||oppArmorDelta!==0)setShowOppFloat(true)
    },600)
    const t3=setTimeout(()=>setStep(3),1000)
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
  },[])
  const myFloatVal=myHpDelta>0?`+${myHpDelta} HP`:myHpDelta<0?`${myHpDelta} HP`:myArmorDelta>0?`+${myArmorDelta} 🛡`:null
  const oppFloatVal=oppHpDelta>0?`+${oppHpDelta} HP`:oppHpDelta<0?`${oppHpDelta} HP`:oppArmorDelta>0?`+${oppArmorDelta} 🛡`:null
  const myFloatColor=myHpDelta>0?'#1a6b5c':myHpDelta<0?'#e74c3c':'#1f618d'
  const oppFloatColor=oppHpDelta>0?'#1a6b5c':oppHpDelta<0?'#e74c3c':'#1f618d'
  const doShake=myHpDelta<0||oppHpDelta<0
  // Колір рядка лога для кращої читабельності
  function logColor(text, rawColor) {
    if(rawColor==='#e74c3c'||rawColor==='#c0392b') return '#ff7070' // шкода суперника → яскравіший червоний
    if(rawColor==='#1a6b5c'||rawColor==='#2471a3') return '#50e0c0' // хіл → бірюзовий
    if(rawColor==='#e67e22') return '#ffaa44'  // удар → помаранчевий
    if(rawColor==='#8e44ad') return '#cc88ff'  // хенка → фіолет
    if(rawColor==='#7f8c8d'||rawColor==='#bdc3c7') return '#aabbcc' // сіль → сіро-блакитний
    if(rawColor==='#9b59b6') return '#ee88ff'  // хаос → яскраво-фіолет
    if(rawColor==='#e8c547') return '#ffe066'  // ґьоджі → жовтий
    if(rawColor==='#1f618d'||rawColor==='#2980b9') return '#88ccff' // броня → блакитний
    if(rawColor==='#95a5a6') return '#8899aa'  // пропуск
    return rawColor || 'rgba(255,235,190,0.85)'
  }
  // Іконка для рядка лога
  function logIcon(text) {
    if(text.includes('dmg')||text.includes('HP')&&text.includes('-')) return '⚔'
    if(text.includes('+')&&text.includes('HP')) return '💧'
    if(text.includes('armor')||text.includes('🛡')) return '🛡'
    if(text.includes('Henka')||text.includes('🌀')) return '🌀'
    if(text.includes('Salt')||text.includes('🧂')) return '🧂'
    if(text.includes('⚡')) return '⚡'
    if(text.includes('💥')) return '💥'
    if(text.includes('⚖️')) return '⚖️'
    if(text.includes('skipped')||text.includes('пропуск')) return '⏩'
    return '▸'
  }
  return(<div style={{animation:doShake&&step>=2?'shake 0.4s ease':undefined}}>
    {/* Картки VS */}
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:'0.75rem',opacity:step>=1?1:0,transition:'opacity 0.3s',position:'relative',minHeight:160}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',fontWeight:700,color:'#50e0c0',letterSpacing:'0.06em',textTransform:'uppercase',textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>{myLabel}</div>
        <div style={{animation:step>=1?'clash 0.5s ease 0.2s both':'none',position:'relative'}}>
          <GameCard card={myCard} disabled lang={lang}/>
          {showSalt&&myCard?.type==='salt'&&<SaltParticles/>}
          {showHenka&&myCard?.type==='henka'&&<HenkaSwirl/>}
          {showLightning&&myCard?.type==='strike'&&<LightningEffect/>}
          {showChaos&&myCard?.type==='chaos'&&<ChaosEffect/>}
          {showMyFloat&&myFloatVal&&<FloatingNumber value={myFloatVal} color={myFloatColor} onDone={()=>setShowMyFloat(false)}/>}
        </div>
      </div>
      <div style={{fontFamily:'var(--jp)',fontSize:'2rem',fontWeight:900,color:'#f0c060',textShadow:'0 0 20px rgba(240,192,96,0.9), 0 2px 6px rgba(0,0,0,1)',letterSpacing:'0.1em',padding:'0 16px',animation:step>=1?'pop 0.4s ease 0.4s both':'none',flexShrink:0}}>VS</div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',fontWeight:700,color:'#ff9980',letterSpacing:'0.06em',textTransform:'uppercase',textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>{oppLabel}</div>
        <div style={{animation:step>=1?'clashR 0.5s ease 0.2s both':'none',position:'relative'}}>
          <GameCard card={oppCard} disabled lang={lang}/>
          {showSalt&&oppCard?.type==='salt'&&<SaltParticles/>}
          {showHenka&&oppCard?.type==='henka'&&<HenkaSwirl/>}
          {showLightning&&oppCard?.type==='strike'&&<LightningEffect/>}
          {showChaos&&oppCard?.type==='chaos'&&<ChaosEffect/>}
          {showOppFloat&&oppFloatVal&&<FloatingNumber value={oppFloatVal} color={oppFloatColor} onDone={()=>setShowOppFloat(false)}/>}
        </div>
      </div>
    </div>

    {/* Лог бою — AAA читабельність */}
    <div style={{background:'linear-gradient(180deg,rgba(5,3,1,0.92),rgba(15,10,5,0.95))',border:'1px solid rgba(255,200,100,0.12)',borderRadius:8,marginBottom:'0.75rem',overflow:'hidden',opacity:step>=2?1:0,transform:step>=2?'none':'translateY(8px)',transition:'all 0.35s',boxShadow:'0 4px 20px rgba(0,0,0,0.7)'}}>
      {roundLog.length===0
        ? <div style={{padding:'0.6rem 1rem',fontFamily:'var(--jp)',fontSize:'0.68rem',color:'rgba(255,220,150,0.3)',textAlign:'center'}}>—</div>
        : roundLog.map((l,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'0.42rem 0.875rem',borderBottom:i<roundLog.length-1?'1px solid rgba(255,255,255,0.04)':'none',animation:`fadeIn 0.3s ease ${0.07*i}s both`,background:i%2===0?'rgba(255,255,255,0.015)':'transparent'}}>
            <span style={{fontSize:'0.75rem',flexShrink:0,width:16,textAlign:'center',lineHeight:1}}>{logIcon(l.text)}</span>
            <span style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:600,color:logColor(l.text,l.color),lineHeight:1.5,letterSpacing:'0.02em',textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>{l.text}</span>
          </div>
        ))
      }
    </div>

    {/* Кнопка наступного раунду */}
    <button onClick={onNext} style={{width:'100%',padding:'0.875rem',background:'linear-gradient(180deg,#2a2218,#1a1510)',border:'1px solid rgba(255,220,100,0.25)',borderRadius:8,fontFamily:'var(--jp)',fontSize:'0.88rem',letterSpacing:'0.12em',cursor:'pointer',fontWeight:700,color:'rgba(255,220,150,0.9)',textShadow:'0 1px 4px rgba(0,0,0,0.8)',boxShadow:'0 2px 12px rgba(0,0,0,0.6)',opacity:step>=3?1:0,transform:step>=3?'none':'translateY(8px)',transition:'all 0.3s',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}
      onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(180deg,#3a3228,#2a2218)';e.currentTarget.style.borderColor='rgba(255,220,100,0.45)'}}
      onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(180deg,#2a2218,#1a1510)';e.currentTarget.style.borderColor='rgba(255,220,100,0.25)'}}>
      {roundNum>=MAX_ROUNDS?t('⚖ Результат','⚖ Results'):t('Наступний раунд ›','Next round ›')}
    </button>
  </div>)
}

function BattleLayout({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,roundNum,myLabel,oppLabel,myHand,oppHand,playerSelected,onSelect,myReady,oppReady,onSubmit,roundLog,phase,onNext,lang,myCard,oppCard,drawPile,onSwapDone,mySkipped,sfx,myHpDelta,oppHpDelta,myArmorDelta,oppArmorDelta,myFlash,oppFlash,showRoundBanner,playedCards=[]}){
  const t=(uk,en)=>lang==='en'?en:uk
  const isMobile=useIsMobile()
  const isRoundResult=phase==='roundResult'
  const [swapping,setSwapping]=useState(false)
  const [swapOptions,setSwapOptions]=useState([])
  const deduped=arr=>[...new Map(arr.filter(Boolean).map(c=>[c.id,c])).values()]
  function activateSwap(){if(sfx)sfx('swap');const available=drawPile.filter(c=>!myHand.find(h=>h.id===c.id));const pool=weightedSample(available,DRAFT_POOL_SIZE);setSwapOptions(pool);setSwapping(true)}
  function doSwap(card){setSwapping(false);onSwapDone(card)}
  if(swapping)return <SwapScreen hand={myHand} drawOptions={swapOptions} onSwap={doSwap} lang={lang}/>
  const myPlayed  = playedCards.map(r=>r.my).filter(Boolean).slice(-6)
  const oppPlayed = playedCards.map(r=>r.opp).filter(Boolean).slice(-6)
  const portraitH   = isMobile ? 80  : 145
  const hpPadL      = isMobile ? '0.5rem 0.5rem 0.5rem 62px' : '0.55rem 0.75rem 0.55rem 96px'
  const hpPadR      = isMobile ? '0.5rem 62px 0.5rem 0.5rem' : '0.55rem 96px 0.55rem 0.75rem'
  const scoreSize   = isMobile ? '1.2rem' : '1.55rem'
  const scoreSep    = isMobile ? '1rem'   : '1.4rem'
  const scoreW      = isMobile ? 52       : 68
  const btnW        = isMobile ? '100%'   : '60%'
  const btnPad      = isMobile ? '1rem'   : '0.8rem 1rem'
  const btnFs       = isMobile ? '0.95rem': '0.85rem'
  return(<><div style={{display:'flex',flexDirection:'column',flex:1,overflowY:'auto',overflowX:'hidden',animation:'slideIn 0.25s ease',padding:isMobile?'0.75rem':'1.25rem',paddingBottom:4}}>
    {showRoundBanner&&<RoundBanner roundNum={roundNum} lang={lang}/>}
    <div style={{textAlign:'center',marginBottom:'0.3rem'}}>
      <span style={{fontFamily:'var(--jp)',fontSize:'0.62rem',fontWeight:600,color:roundNum>PRESSURE_ROUND?'#e8a020':'rgba(255,255,255,0.8)',letterSpacing:'0.1em',background:roundNum>PRESSURE_ROUND?'rgba(232,160,32,0.15)':'rgba(0,0,0,0.6)',border:`1px solid ${roundNum>PRESSURE_ROUND?'rgba(232,160,32,0.5)':'rgba(255,255,255,0.1)'}`,borderRadius:10,padding:'2px 12px',animation:roundNum>PRESSURE_ROUND?'lowHpPulse 1.5s ease infinite':undefined}}>
        {roundNum>PRESSURE_ROUND?'⏰ ':''}{t('Раунд','Round')} {roundNum}/{MAX_ROUNDS}
      </span>
    </div>
    {mySkipped&&<div style={{background:'rgba(127,140,141,0.25)',border:'1px solid #7f8c8d',borderRadius:4,padding:'0.4rem 0.75rem',marginBottom:'0.4rem',fontFamily:'var(--jp)',fontSize:'0.72rem',color:'#bdc3c7',textAlign:'center',animation:'pulse 1s ease 2'}}>🧂 {t('Ви пропускаєте цей хід!','You skip this turn!')}</div>}
    <div style={{display:'grid',gridTemplateColumns:`1fr ${scoreW}px 1fr`,gap:isMobile?5:8,marginBottom:'0.5rem',alignItems:'stretch'}}>
      <div style={{position:'relative',overflow:'visible',background:'rgba(0,0,0,0.65)',padding:hpPadL,borderRadius:6,border:'1px solid rgba(26,107,92,0.4)',minHeight:isMobile?50:62}}>
        <RikishiPortraitFigure side="left" height={portraitH}/>
        <PlayerBadge label={myLabel} side="left"/>
        <PremiumHPBar hp={myHp} armor={myArmor} flash={myFlash}/>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.55)',borderRadius:6,border:'1px solid rgba(184,134,11,0.22)',padding:'2px'}}>
        <div style={{fontFamily:'var(--jp)',fontSize:scoreSize,fontWeight:900,color:'#f0c060',lineHeight:1,textShadow:'0 0 16px rgba(240,192,96,0.5), 0 2px 6px rgba(0,0,0,0.9)',letterSpacing:'-0.02em'}}>
          {myWins}<span style={{fontSize:scoreSep,color:'#c8a020',margin:'0 1px',lineHeight:1}}>–</span>{oppWins}
        </div>
      </div>
      <div style={{position:'relative',overflow:'visible',background:'rgba(0,0,0,0.65)',padding:hpPadR,borderRadius:6,border:'1px solid rgba(192,57,43,0.4)',minHeight:isMobile?50:62}}>
        <RikishiPortraitFigure side="right" height={portraitH}/>
        <div style={{width:'100%'}}>
          <PlayerBadge label={oppLabel} side="right"/>
          <PremiumHPBar hp={oppHp} armor={oppArmor} flash={oppFlash} side="right"/>
        </div>
      </div>
    </div>
    {!isMobile&&(myPlayed.length>0||oppPlayed.length>0)&&!isRoundResult&&(
      <div style={{display:'grid',gridTemplateColumns:'1fr 68px 1fr',gap:8,marginBottom:'0.6rem'}}>
        <div style={{overflow:'hidden',minWidth:0,display:'flex',gap:3,justifyContent:'flex-start',alignItems:'center'}}>{myPlayed.map((c,i,arr)=>(<div key={i} style={{flexShrink:0,opacity:Math.max(0.72,0.72+(i/arr.length)*0.28)}}><GameCard card={c} tiny disabled lang={lang}/></div>))}</div>
        <div/>
        <div style={{overflow:'hidden',minWidth:0,display:'flex',gap:3,justifyContent:'flex-end',alignItems:'center'}}>{[...oppPlayed].reverse().map((c,i,arr)=>(<div key={i} style={{flexShrink:0,opacity:Math.max(0.72,0.72+((arr.length-1-i)/arr.length)*0.28)}}><GameCard card={c} tiny disabled lang={lang}/></div>))}</div>
      </div>
    )}
    {isRoundResult?(
      <RoundResult myCard={myCard} oppCard={oppCard} roundLog={roundLog} myLabel={myLabel} oppLabel={oppLabel} onNext={onNext} roundNum={roundNum} lang={lang} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myFlash={myFlash} oppFlash={oppFlash}/>
    ):(
      <>
        <div style={{marginBottom:'0.4rem'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',fontWeight:600,color:'rgba(255,220,150,0.9)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textTransform:'uppercase',marginBottom:isMobile?4:6,letterSpacing:'0.08em'}}>{t('Ваша рука','Your hand')} ({deduped(myHand).length}) · {t('Колода','Deck')}: {drawPile.length}</div>
          <div style={{display:'flex',gap:isMobile?'clamp(6px,2vw,10px)':'clamp(4px,1.5vw,12px)',flexWrap:'nowrap',overflowX:'auto',overflowY:'visible',paddingBottom:isMobile?8:4,paddingTop:isMobile?16:18,justifyContent:'center',scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
            {deduped(myHand).map((c,i)=>(<div key={c.id} style={{animation:`slideIn 0.2s ease ${i*0.05}s both`,position:'relative',flexShrink:0}}>
              {c.type==='swap'&&!myReady?(
                <><GameCard card={c} selected={false} onClick={activateSwap} disabled={myReady} lang={lang}/><div style={{position:'absolute',bottom:-14,left:'50%',transform:'translateX(-50%)',fontFamily:'var(--jp)',fontSize:'0.4rem',color:'#27ae60',whiteSpace:'nowrap'}}>{t('активувати','tap')}</div></>
              ):(
                <GameCard card={c} selected={playerSelected?.id===c.id} onClick={()=>{if(!myReady&&c.type!=='swap'){if(sfx)sfx('click');onSelect(c)}}} disabled={myReady||c.type==='swap'||mySkipped} lang={lang}/>
              )}
            </div>))}
          </div>
        </div>
        <div style={{marginBottom:'0.4rem',display:'flex',alignItems:'center',gap:8}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:600,color:'rgba(255,220,150,0.85)',textShadow:'0 1px 5px rgba(0,0,0,0.95)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{oppLabel}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',fontWeight:700,color:'#e0d0a0',background:'linear-gradient(180deg,#2a2218,#1a1510)',border:'1px solid #4a3e28',borderRadius:4,padding:'2px 10px',boxShadow:'0 1px 4px rgba(0,0,0,0.6)'}}>🂠 {oppHand}</div>
        </div>
        {oppReady&&!myReady&&<div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',fontWeight:600,color:'#2ecc71',textShadow:'0 1px 4px rgba(0,0,0,0.9)',marginBottom:'0.4rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>✓ {t('Суперник готовий','Opponent ready')}</div>}
        {myReady&&<div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:600,color:'rgba(255,220,150,0.75)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',marginBottom:'0.4rem',textAlign:'center',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting...')}</div>}
      </>
    )}
  </div>
  {/* Кнопка підтвердити — ПОЗА скролом, завжди видима */}
  {!isRoundResult&&!swapping&&(
    <div style={{flexShrink:0,padding:isMobile?'6px 0.75rem 6px':'6px 1.25rem 6px',background:'linear-gradient(to bottom,rgba(0,0,0,0),rgba(0,0,0,0.7))',borderTop:'1px solid rgba(255,220,100,0.08)'}}>
      {((!playerSelected&&!mySkipped)||myReady)?(
        <GameBtn variant='dark' disabled style={{display:'block',margin:'0 auto',width:btnW,minWidth:isMobile?'unset':200,justifyContent:'center',padding:btnPad,fontSize:btnFs,letterSpacing:'0.1em'}}>
          {myReady?t('Підтверджено ✓','Confirmed ✓'):t('Оберіть карту','Select a card')}
        </GameBtn>
      ):(
        <GameBtn variant='gold' onClick={()=>{if(sfx)sfx('click');onSubmit()}} style={{display:'block',margin:'0 auto',width:btnW,minWidth:isMobile?'unset':200,justifyContent:'center',padding:btnPad,fontSize:btnFs,letterSpacing:'0.1em',boxShadow:'0 4px 20px rgba(184,134,11,0.6), inset 0 1px 0 rgba(255,220,80,0.4)'}}>
          {mySkipped?t('⏩ Пропустити хід','⏩ Skip turn'):t('⚔ Підтвердити','⚔ Confirm')}
        </GameBtn>
      )}
    </div>
  )}
  </>)
}

function GameOverScreen({myHp,oppHp,myArmor,oppArmor,myWins,oppWins,myLabel,oppLabel,onBack,lang,sfx}){
  const t=(uk,en)=>lang==='en'?en:uk
  const playerWon=myHp>oppHp||(myHp>0&&oppHp<=0)
  const isKachiKoshi=myWins>oppWins
  const ties=MAX_ROUNDS-myWins-oppWins
  const isKyujo=(oppHp<=0&&myHp>0)||(myHp<=0&&oppHp>0)
  useEffect(()=>{if(sfx)sfx(playerWon?'win':'lose')},[])
  let title,subtitle
  if(isKyujo&&playerWon){title=t('Кюджо суперника!','Opponent Kyujo!');subtitle=t('Ви змусили суперника визнати кюджо','You forced your opponent to withdraw!')}
  else if(isKyujo&&!playerWon){title=t('Кюджо!','Kyujo!');subtitle=t('Ви повертаєтесь до стайні','You withdraw to your stable.')}
  else if(playerWon){title=t('Юшо!','Yusho!');subtitle=t('Ви перемогли!','You win!')}
  else{title=t('Маке-коші','Make-koshi');subtitle=t('Суперник переміг.','Opponent wins.')}
  const winColor=playerWon?'#f0c060':'#e74c3c'
  return(
    <div style={{textAlign:'center',animation:'slideIn 0.3s ease',padding:'1rem 0'}}>
      <div style={{fontSize:'4rem',marginBottom:'0.75rem',animation:'pop 0.5s ease'}}>{isKyujo&&playerWon?'🏆':isKyujo&&!playerWon?'🏥':playerWon?'🏆':'💪'}</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'1.6rem',fontWeight:900,color:winColor,marginBottom:'0.4rem',textShadow:`0 0 20px ${winColor}88`}}>{title}</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'rgba(255,255,255,0.55)',marginBottom:'1.5rem',lineHeight:1.5}}>{subtitle}</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,margin:'0 0 1rem 0'}}>
        <div style={{background:'rgba(0,0,0,0.6)',padding:'0.75rem',borderRadius:6,border:'1px solid rgba(46,204,113,0.3)'}}><PlayerBadge label={myLabel} side="left"/><PremiumHPBar hp={myHp} armor={myArmor}/></div>
        <div style={{background:'rgba(0,0,0,0.6)',padding:'0.75rem',borderRadius:6,border:'1px solid rgba(231,76,60,0.3)'}}><PlayerBadge label={oppLabel} side="right"/><PremiumHPBar hp={oppHp} armor={oppArmor}/></div>
      </div>
      <div style={{background:'rgba(0,0,0,0.5)',padding:'0.875rem 1rem',borderRadius:6,marginBottom:'1.5rem',border:`1px solid ${isKachiKoshi?'rgba(240,192,96,0.3)':'rgba(231,76,60,0.3)'}`}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'rgba(255,255,255,0.45)',marginBottom:6}}>{t('Раунди','Rounds')}: {myWins}W – {oppWins}L – {ties}D</div>
        <div style={{fontFamily:'var(--jp)',fontSize:'1.1rem',fontWeight:900,color:isKachiKoshi?'#f0c060':'#e74c3c',textShadow:`0 0 16px ${isKachiKoshi?'#f0c060':'#e74c3c'}66`}}>
          {isKachiKoshi?'勝ち越し Kachi-koshi':'負け越し Make-koshi'}
        </div>
      </div>
      <button onClick={onBack} style={{background:'rgba(184,134,11,0.15)',color:'#f0c060',border:'1px solid rgba(184,134,11,0.5)',borderRadius:6,padding:'0.8rem 3rem',fontFamily:'var(--jp)',fontSize:'0.85rem',letterSpacing:'0.12em',cursor:'pointer',fontWeight:700,boxShadow:'0 4px 16px rgba(184,134,11,0.2)',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='rgba(184,134,11,0.3)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(184,134,11,0.15)'}}>
        {t('В меню','Menu')}
      </button>
    </div>
  )
}

// ── CpuGame ───────────────────────────────────────────────────
function CpuGame({ lang, onBack, sfx, onCardPlayed, onAchievementProgress }) {
  const t=(uk,en)=>lang==='en'?en:uk
  const isMobile=useIsMobile()
  const [phase,setPhase]=useState('draft')
  const [vsActive,setVsActive]=useState(false)
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)   // скільки разів вибирав гравець
  const [draftCpuRound,setDraftCpuRound]=useState(0) // скільки разів вибирав CPU
  const [draftIsCpuTurn,setDraftIsCpuTurn]=useState(false) // зараз хід CPU?
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
  const [playedCards,setPlayedCards]=useState([])
  const [drawOffer,setDrawOffer]=useState(null)
  const [pendingDrawOffer,setPendingDrawOffer]=useState(null)
  const [gyojiChoices,setGyojiChoices]=useState(null)

  // refs для відстеження умов досягнень
  const healCountRef=useRef(0)
  const henkaCountRef=useRef(0)
  const chaosPlayedRef=useRef(false)
  const noDmgRef=useRef(true)
  const gyojiWinNextRef=useRef(false)

  useEffect(()=>{
    // Змійка-драфт: спільний пул, гравець і CPU вибирають по черзі
    const shared=weightedShuffle(FULL_DECK)
    const pool=shared.slice(0,DRAFT_POOL_SIZE)
    const remaining=shared.slice(DRAFT_POOL_SIZE)
    setDrawPile(remaining)
    setDraftPool(pool)
    setDraftIsCpuTurn(false) // гравець починає
  },[])

  // ── Змійка-драфт: проста логіка гравець→CPU→гравець→CPU... ──
  function refreshPool(pool, draw, hand) {
    // Поповнити пул, гарантуючи хоча б 1 картку яку можна взяти
    // Спочатку видаляємо всі старі карти що залишились — пул завжди свіжий
    let draw2 = [...draw, ...pool] // повернути старий пул в колоду
    draw2 = weightedShuffle(draw2) // перемішати
    let pool2 = []
    // Набрати DRAFT_POOL_SIZE карток, гарантуючи різноманіття
    const available = draw2.filter(c => canAddToHand(hand, c))
    const blocked = draw2.filter(c => !canAddToHand(hand, c))
    // Мінімум 1 доступна карта
    const take = weightedSample(available, Math.min(DRAFT_POOL_SIZE - 1, available.length))
    const fill = weightedSample(blocked, Math.max(0, DRAFT_POOL_SIZE - take.length))
    pool2 = shuffle([...take, ...fill])
    draw2 = draw2.filter(c => !pool2.find(p => p.id === c.id))
    return { pool2, draw2 }
  }

  function cpuSnakePick(pHand, cHand, pool, draw, pRound, cRound) {
    // CPU вибирає найсильнішу доступну карту
    const { pool2: refreshed, draw2: refreshedDraw } = refreshPool(pool, draw, cHand)
    const available = refreshed.filter(c => canAddToHand(cHand, c))
    const chosen = available.length > 0 ? cpuChooseCard(available, false) : null
    const newCHand = chosen ? [...cHand, chosen] : cHand
    const newPool = chosen ? refreshed.filter(c => c.id !== chosen.id) : refreshed
    const newCRound = cRound + 1
    // Поповнити пул для гравця
    const { pool2, draw2 } = refreshPool(newPool, refreshedDraw, pHand)
    setCpuHand(newCHand); setDraftCpuRound(newCRound); setDraftPool(pool2); setDrawPile(draw2)
    if (pRound >= DRAFT_ROUNDS && newCRound >= DRAFT_ROUNDS) {
      setPlayerHand(pHand); setVsActive(true)
    } else {
      setDraftIsCpuTurn(false)
    }
  }

  function pickDraft(card) {
    if (sfx) sfx('click')
    if (!canAddToHand(playerHand, card)) return
    const newPHand = [...playerHand, card]
    const newPool = draftPool.filter(c => c.id !== card.id)
    const newPRound = draftRound + 1
    setPlayerHand(newPHand); setDraftRound(newPRound)
    if (newPRound >= DRAFT_ROUNDS && draftCpuRound >= DRAFT_ROUNDS) {
      setVsActive(true); return
    }
    // CPU ходить після гравця — передаємо пул що оновиться в cpuSnakePick
    setDraftIsCpuTurn(true)
    setTimeout(() => cpuSnakePick(newPHand, cpuHand, newPool, drawPile, newPRound, draftCpuRound), 600)
  }

  function handleSwapDone(nc){setPlayerHand(prev=>{const idx=prev.findIndex(c=>c.type==='swap');const h=idx>=0?[...prev.slice(0,idx),...prev.slice(idx+1)]:[...prev];return[...h,nc]});setDrawPile(prev=>prev.filter(c=>c.id!==nc.id))}

  function fight(){
    const pCard=playerSkip?null:playerSelected
    if(!playerSkip&&!playerSelected)return
    if(pCard) onCardPlayed?.(pCard.id)

    // Трекінг для досягнень
    if(pCard?.type==='heal') healCountRef.current+=1
    if(pCard?.type==='henka') henkaCountRef.current+=1
    if(pCard?.type==='chaos') chaosPlayedRef.current=true

    const cCard=cpuSkip?null:cpuChooseCard(cpuHand,playerSkip)
    const pDisplay=playerSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:playerSelected
    const cDisplay=cpuSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:cCard
    setLastMyCard(pDisplay);setLastOppCard(cDisplay)
    const newPlayedEntry={my:pDisplay,opp:cDisplay}
    setPlayedCards(prev=>[...prev,newPlayedEntry])

    if(sfx){const card=pCard||cCard;if(card?.type==='rikishi')sfx('clash');else if(card?.type==='heal')sfx('heal');else if(card?.type==='armor')sfx('armor');else if(card?.type==='strike')sfx('strike');else if(card?.type==='salt')sfx('salt');else if(card?.type==='henka')sfx('henka');else if(card?.type==='chaos')sfx('chaos');else if(card?.type==='gyoji')sfx('gyoji')}

    const currentPlayed=[...playedCards,newPlayedEntry]
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip,returnCardToHand,gyojiChoices:gyojiResult}=resolveRound(pCard,cCard,playerHp,cpuHp,playerArmor,cpuArmor,playerSkip,cpuSkip,playedCards,roundNum)

    const pHpD=newPHp-playerHp;const oHpD=newOHp-cpuHp;const pArD=newPArmor-playerArmor;const oArD=newOArmor-cpuArmor
    setMyHpDelta(pHpD);setOppHpDelta(oHpD);setMyArmorDelta(pArD);setOppArmorDelta(oArD)
    setMyFlash(pHpD<0?'damage':pHpD>0?'heal':pArD>0?'armor':null)
    setOppFlash(oHpD<0?'damage':oHpD>0?'heal':oArD>0?'armor':null)

    if(pHpD<0) noDmgRef.current=false

    // Gyoji досягнення — якщо повернула карту і виграла раунд
    if(gyojiResult&&gyojiResult.length>0){
      const usedIds2=[pCard?.id,cCard?.id].filter(Boolean)
      setGyojiChoices({choices:gyojiResult,pendingState:{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip,newPH:playerSkip?playerHand:playerHand.filter(c=>c.id!==playerSelected?.id),newCH:cpuSkip?cpuHand:(cCard?cpuHand.filter(c=>c.id!==cCard.id):cpuHand),usedIds:usedIds2}})
      return
    }
    if(returnCardToHand&&roundWinner==='p') onAchievementProgress?.({type:'gyoji_win'})

    setPlayerHp(newPHp);setCpuHp(newOHp);setPlayerArmor(newPArmor);setCpuArmor(newOArmor);setRoundLog(logs)
    setPlayerSkip(pNextSkip);setCpuSkip(oNextSkip)
    if(roundWinner==='p')setPlayerWins(w=>w+1);else if(roundWinner==='o')setCpuWins(w=>w+1)

    let usedIds=new Set([pCard?.id,cCard?.id].filter(Boolean))
    let newPH=playerSkip?playerHand:playerHand.filter(c=>c.id!==playerSelected?.id)
    if(returnCardToHand) newPH=[...newPH,returnCardToHand]
    let newCH=cpuSkip?cpuHand:(cCard?cpuHand.filter(c=>c.id!==cCard.id):cpuHand)
    let newDraw=drawPile.filter(c=>!usedIds.has(c.id))
    // CPU бере карту автоматично
    if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
    setCpuHand(newCH)
    // Гравець вибирає з 2 карт після перегляду результату раунду
    const offerable=weightedSample(newDraw.filter(c=>canAddToHand(newPH,c)),2)
    if(offerable.length>0&&newPHp>0&&newOHp>0){
      setPlayerHand(newPH)
      setDrawPile(newDraw.filter(c=>!offerable.find(o=>o.id===c.id)))
      setPendingDrawOffer({cards:offerable,hand:newPH,draw:newDraw})
    } else {
      setPlayerHand(newPH);setDrawPile(newDraw)
    }

    if(newPHp<=0||newOHp<=0){
      const won=newOHp<=0&&newPHp>0
      if(won){
        onAchievementProgress?.({type:'match_end',won:true,noDmg:noDmgRef.current,hp:newPHp,rounds:roundNum+1,chaosPlayed:chaosPlayedRef.current,healCount:healCountRef.current,henkaCount:henkaCountRef.current})
      }
      setPhase('gameOver');return
    }
    setPhase('roundResult')
  }

  function nextRound(){
    const nr=roundNum+1;setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    setMyFlash(null);setOppFlash(null);setMyHpDelta(0);setOppHpDelta(0);setMyArmorDelta(0);setOppArmorDelta(0)
    if(nr>=MAX_ROUNDS||playerHand.length===0){
      const won=playerHp>cpuHp
      if(won) onAchievementProgress?.({type:'match_end',won:true,noDmg:noDmgRef.current,hp:playerHp,rounds:nr,chaosPlayed:chaosPlayedRef.current,healCount:healCountRef.current,henkaCount:henkaCountRef.current})
      setPhase('gameOver');return
    }
    // Показати вибір картки якщо є pending
    if(pendingDrawOffer){
      setDrawOffer(pendingDrawOffer)
      setPendingDrawOffer(null)
      setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900)
      setPhase('battle')
      return
    }
    setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900)
    setPhase('battle')
  }

  const oya1=t('Ояката 1','Oyakata 1');const cpu=t('Ояката 2 (CPU)','Oyakata 2 (CPU)')
  function handleDrawChoose(card){
    const newHand=[...drawOffer.hand,card]
    setPlayerHand(newHand)
    setDrawOffer(null)
  }
  function handleDrawSkip(){
    // Пропустив — повертаємо карти в drawPile
    setDrawPile(prev=>[...prev,...(drawOffer?.cards||[])])
    setDrawOffer(null)
  }
  return(<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',zIndex:1,background:'transparent'}}>
    {gyojiChoices&&<GyojiChooseScreen choices={gyojiChoices.choices} lang={lang} onChoose={(card)=>{
      // Застосовуємо ефект обраної картки вже після основного раунду
      const ps=gyojiChoices.pendingState
      let extraLogs=[{text:`⚖️ Ґьоджі активує: "${card.label||card.id}"!`,color:'#e8c547'}]
      let hp=ps.newPHp,ohp=ps.newOHp,par=ps.newPArmor,oar=ps.newOArmor
      if(card.type==='heal'){hp=Math.min(MAX_HP,hp+card.heal);extraLogs.push({text:`+${card.heal} HP від ${card.label}`,color:'#50e0c0'})}
      else if(card.type==='armor'){par+=card.armor;extraLogs.push({text:`+${card.armor} 🛡 від ${card.label}`,color:'#88ccff'})}
      else if(card.type==='strike'){ohp=Math.max(0,ohp-card.damage);extraLogs.push({text:`⚡ ${card.damage} пряма шкода від ${card.label}`,color:'#ffaa44'})}
      else if(card.type==='rikishi'){const dmg=Math.max(0,card.atk-(oar>0?Math.min(oar,card.atk):0));ohp=Math.max(0,ohp-dmg);oar=Math.max(0,oar-card.atk);extraLogs.push({text:`⚔ ${dmg} шкода від ${card.label}`,color:'#ffaa44'})}
      setPlayerHp(hp);setCpuHp(ohp);setPlayerArmor(par);setCpuArmor(oar)
      setRoundLog([...ps.logs,...extraLogs])
      if(ps.roundWinner==='p') onAchievementProgress?.({type:'gyoji_win'})
      setPlayerSkip(ps.pNextSkip);setCpuSkip(ps.oNextSkip)
      if(ps.roundWinner==='p')setPlayerWins(w=>w+1);else if(ps.roundWinner==='o')setCpuWins(w=>w+1)
      let newPH=ps.newPH;let newCH=ps.newCH
      const usedSet=new Set(ps.usedIds||[])
      let newDraw=drawPile.filter(c=>!usedSet.has(c.id))
      if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
      setCpuHand(newCH)
      const offerable=weightedSample(newDraw.filter(c=>canAddToHand(newPH,c)),2)
      if(offerable.length>0&&hp>0&&ohp>0){
        setPlayerHand(newPH);setDrawPile(newDraw.filter(c=>!offerable.find(o=>o.id===c.id)))
        setPendingDrawOffer({cards:offerable,hand:newPH,draw:newDraw})
      } else {setPlayerHand(newPH);setDrawPile(newDraw)}
      setGyojiChoices(null)
      if(hp<=0||ohp<=0){setPhase('gameOver');return}
      setPhase('roundResult')
    }}/>}
    {drawOffer&&<DrawOfferScreen cards={drawOffer.cards} hand={drawOffer.hand} onChoose={handleDrawChoose} onSkip={handleDrawSkip} lang={lang}/>}
    {vsActive&&<VSScreen playerLabel={oya1} opponentLabel={cpu} lang={lang} onDone={()=>{setVsActive(false);setPhase('battle')}}/>}
    <GameBtn variant='dark' onClick={onBack} style={{marginBottom:'0.75rem'}}>‹ {t('Назад','Back')}</GameBtn>
    <CardGuide lang={lang}/>
    {phase==='draft'&&(<div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',animation:'slideIn 0.25s ease',padding:isMobile?'0.75rem':'1.25rem',overflowY:'auto'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.5rem'}}>{t('Змійка-драфт','Snake Draft')}</div>
      {/* Прогрес змійки */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:'1rem',flexWrap:'wrap'}}>
        {Array.from({length:DRAFT_ROUNDS}).map((_,i)=>(<div key={i} style={{width:24,height:24,borderRadius:'50%',background:i<draftRound?'#1abc9c':i===draftRound&&!draftIsCpuTurn?'#f0c060':'rgba(255,255,255,0.1)',border:`2px solid ${i<draftRound?'#1abc9c':i===draftRound&&!draftIsCpuTurn?'#f0c060':'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--jp)',fontSize:'0.45rem',color:i<draftRound?'#fff':i===draftRound&&!draftIsCpuTurn?'#1a1200':'rgba(255,255,255,0.3)',fontWeight:700,transition:'all 0.3s'}}>{i<draftRound?'✓':i+1}</div>))}
        <div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,220,150,0.6)',marginLeft:4}}>{draftRound}/{DRAFT_ROUNDS}</div>
      </div>
      {draftIsCpuTurn&&<div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,220,150,0.7)',textAlign:'center',marginBottom:'0.75rem',animation:'pulse 1s ease infinite'}}>🤔 {t('CPU обирає...','CPU is choosing...')}</div>}
      {!draftIsCpuTurn&&<div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:700,color:'#f0c060',textAlign:'center',marginBottom:'0.75rem',textShadow:'0 0 12px rgba(240,192,96,0.5)'}}>👆 {t('Ваш вибір','Your pick')}</div>}
      {playerHand.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',fontWeight:600,color:'rgba(255,220,150,0.85)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        {draftPool.map((c,i)=>{
          const blocked=!canAddToHand(playerHand,c)
          return(<div key={c.id} style={{position:'relative',animation:`pop 0.3s ease ${i*0.08}s both`,opacity:draftIsCpuTurn?0.4:1,transition:'opacity 0.3s'}}>
            <GameCard card={c} onClick={()=>!draftIsCpuTurn&&pickDraft(c)} disabled={draftIsCpuTurn||blocked} lang={lang}/>
            {blocked&&!draftIsCpuTurn&&<div style={{position:'absolute',inset:0,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(2px)'}}><div style={{textAlign:'center'}}><div style={{fontSize:'1rem'}}>🚫</div><div style={{fontFamily:'var(--jp)',fontSize:'0.4rem',color:'#e74c3c',marginTop:2}}>{t('Ліміт','Limit')}</div></div></div>}
          </div>)
        })}
      </div>
    </div>)}
    {(phase==='battle'||phase==='roundResult')&&<BattleLayout myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} roundNum={roundNum+1} myLabel={oya1} oppLabel={cpu} myHand={playerHand} oppHand={cpuHand.length} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={false} oppReady={false} onSubmit={fight} roundLog={roundLog} phase={phase} onNext={nextRound} myCard={lastMyCard} oppCard={lastOppCard} drawPile={drawPile} onSwapDone={handleSwapDone} mySkipped={playerSkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner} playedCards={playedCards}/>}
    {phase==='gameOver'&&<GameOverScreen myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} myLabel={oya1} oppLabel={cpu} onBack={onBack} lang={lang} sfx={sfx}/>}
  </div>)
}

// ── CampaignBattleWrapper ─────────────────────────────────────
function CampaignBattleWrapper({ level, boostedCards, boostedCard, tempBoosts, onWin, onLose, onBack, onLevelInfo, lang, sfx, onCardPlayed }) {// boostedCards = масив, boostedCard = застарілий однина
  const t=(uk,en)=>lang==='en'?en:uk
  const isMobile=useIsMobile()
  const SANYAKU=['Yokozuna','Ozeki','Sekiwake','Komusubi']
  const [phase,setPhase]=useState('draft')
  const [vsActive,setVsActive]=useState(false)
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)   // скільки разів вибирав гравець
  const [draftCpuRound,setDraftCpuRound]=useState(0) // скільки разів вибирав CPU
  const [draftIsCpuTurn,setDraftIsCpuTurn]=useState(false) // зараз хід CPU?
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
  const [playedCards,setPlayedCards]=useState([])
  const [drawOffer,setDrawOffer]=useState(null)
  const [pendingDrawOffer,setPendingDrawOffer]=useState(null)
  const [gyojiChoices,setGyojiChoices]=useState(null)

  useEffect(()=>{
    // Змійка-драфт для кампанії — спільний пул
    const allCards=weightedShuffle(FULL_DECK.filter(level.cpuDeckFilter||(()=>true)))
    const pool=allCards.slice(0,DRAFT_POOL_SIZE)
    const remaining=FULL_DECK.filter(c=>!pool.find(p=>p.id===c.id))
    setDrawPile(remaining);setDraftPool(pool)
  },[])

  function applyBoostToCard(card){
    // boostedCards — масив [{cardId, atk, def}], сумісний з одиночним boostedCard теж
    const cards=Array.isArray(boostedCards)?boostedCards:(boostedCard?[boostedCard]:[])
    const b=cards.find(x=>x.cardId===card.id)
    if(!b)return card
    return{...card,atk:card.atk+(b.atk||0),def:card.def+(b.def||0),_atkBoost:b.atk||0,_defBoost:b.def||0}
  }
  function refreshDraftPool(pool, draw, hand) {
    // Пул повністю оновлюється кожного разу — старі карти повертаються в колоду
    let draw2=weightedShuffle([...draw,...pool])
    const available=draw2.filter(c=>canAddToHand(hand,c))
    const blocked=draw2.filter(c=>!canAddToHand(hand,c))
    const take=weightedSample(available,Math.min(DRAFT_POOL_SIZE-1,available.length))
    const fill=weightedSample(blocked,Math.max(0,DRAFT_POOL_SIZE-take.length))
    const pool2=shuffle([...take,...fill])
    const draw3=draw2.filter(c=>!pool2.find(p=>p.id===c.id))
    return{pool2,draw2:draw3}
  }
  function pickDraft(card){
    if(sfx)sfx('click')
    if(!canAddToHand(playerHand,card))return
    const boosted=applyBoostToCard(card)
    const newHand=[...playerHand,boosted]
    const newPool=draftPool.filter(c=>c.id!==card.id)
    const newPRound=draftRound+1
    const{pool2,draw2}=refreshDraftPool(newPool,drawPile,newHand)
    setPlayerHand(newHand);setDraftPool(pool2);setDrawPile(draw2);setDraftRound(newPRound)
    if(newPRound>=DRAFT_ROUNDS){setDrawPile(draw2);setVsActive(true)}
  }
  function handleSwapDone(nc){setPlayerHand(prev=>{const idx=prev.findIndex(c=>c.type==='swap');const h=idx>=0?[...prev.slice(0,idx),...prev.slice(idx+1)]:[...prev];return[...h,nc]});setDrawPile(prev=>prev.filter(c=>c.id!==nc.id))}
  function checkEnvelope(pCard,cCard,roundWinner){if(roundWinner==='p'&&pCard&&cCard&&SANYAKU.includes(pCard.rank)&&SANYAKU.includes(cCard.rank)){setEnvelopesEarned(e=>e+1)}}

  function fight(){
    const pCard=playerSkip?null:playerSelected
    if(!playerSkip&&!playerSelected)return
    if(pCard) onCardPlayed?.(pCard.id)
    const pCardFinal=pCard&&tempBoosts?.battle_spirit>0?{...pCard,atk:(pCard.atk||0)+2}:pCard
    const cCard=cpuSkip?null:cpuChooseCard(cpuHand,playerSkip)
    const pDisplay=playerSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:playerSelected
    setLastMyCard(pDisplay);setLastOppCard(cpuSkip?{type:'skip',label:'Пропуск',labelEn:'Skip',emoji:'⏩',color:'#95a5a6'}:cCard)
    if(sfx){const card=pCardFinal||cCard;if(card?.type==='rikishi')sfx('clash');else if(card?.type==='heal')sfx('heal');else if(card?.type==='armor')sfx('armor');else if(card?.type==='strike')sfx('strike');else if(card?.type==='salt')sfx('salt');else if(card?.type==='henka')sfx('henka');else if(card?.type==='chaos')sfx('chaos');else if(card?.type==='gyoji')sfx('gyoji')}
    const waterShield=tempBoosts?.water_shield>0&&roundNum===0
    const newPlayedEntry={my:pDisplay,opp:cpuSkip?{type:'skip'}:cCard}
    const currentPlayed=[...playedCards,newPlayedEntry]
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip,returnCardToHand,gyojiChoices:gyojiChoices_result}=resolveRound(pCardFinal,cCard,playerHp,cpuHp,playerArmor,cpuArmor,playerSkip,cpuSkip,playedCards,roundNum)
    const finalPHp=waterShield&&newPHp<playerHp?playerHp:newPHp
    setPlayedCards(currentPlayed)
    checkEnvelope(pCardFinal,cCard,roundWinner)
    if(gyojiChoices_result&&gyojiChoices_result.length>0){
      setGyojiChoices({choices:gyojiChoices_result,pendingState:{finalPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}})
      return
    }
    const pHpD=finalPHp-playerHp;const oHpD=newOHp-cpuHp;const pArD=newPArmor-playerArmor;const oArD=newOArmor-cpuArmor
    setMyHpDelta(pHpD);setOppHpDelta(oHpD);setMyArmorDelta(pArD);setOppArmorDelta(oArD)
    setMyFlash(pHpD<0?'damage':pHpD>0?'heal':pArD>0?'armor':null)
    setOppFlash(oHpD<0?'damage':oHpD>0?'heal':oArD>0?'armor':null)
    setPlayerHp(finalPHp);setCpuHp(newOHp);setPlayerArmor(newPArmor);setCpuArmor(newOArmor);setRoundLog(logs)
    setPlayerSkip(pNextSkip);setCpuSkip(oNextSkip)
    if(roundWinner==='p')setPlayerWins(w=>w+1);else if(roundWinner==='o')setCpuWins(w=>w+1)
    const usedIds=new Set([pCard?.id,cCard?.id].filter(Boolean))
    let newPH=playerSkip?playerHand:playerHand.filter(c=>c.id!==playerSelected?.id)
    if(returnCardToHand) newPH=[...newPH,returnCardToHand]
    let newCH=cpuSkip?cpuHand:(cCard?cpuHand.filter(c=>c.id!==cCard.id):cpuHand)
    let newDraw=drawPile.filter(c=>!usedIds.has(c.id))
    const cpuFilter=level.cpuDeckFilter||(()=>true)
    const cpuDraw=newDraw.filter(cpuFilter)
    if(cpuDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,cpuDraw.length));newCH=[...newCH,cpuDraw[idx]];newDraw=newDraw.filter(c=>c.id!==cpuDraw[idx].id)}
    setCpuHand(newCH)
    const offerable=weightedSample(newDraw.filter(c=>canAddToHand(newPH,c)),2)
    if(offerable.length>0&&finalPHp>0&&newOHp>0){
      setPlayerHand(newPH);setDrawPile(newDraw.filter(c=>!offerable.find(o=>o.id===c.id)))
      setPendingDrawOffer({cards:offerable,hand:newPH,draw:newDraw})
    } else {
      setPlayerHand(newPH);setDrawPile(newDraw)
    }
    if(finalPHp<=0){onLose();return}
    if(newOHp<=0){onWin(finalPHp,MAX_HP,envelopesEarned);return}
    setPhase('roundResult')
  }

  function nextRound(){
    const nr=roundNum+1;setRoundNum(nr);setPlayerSelected(null);setRoundLog([])
    setMyFlash(null);setOppFlash(null);setMyHpDelta(0);setOppHpDelta(0);setMyArmorDelta(0);setOppArmorDelta(0)
    if(nr>=MAX_ROUNDS||playerHand.length===0){if(playerHp>cpuHp)onWin(playerHp,MAX_HP,envelopesEarned);else onLose();return}
    if(pendingDrawOffer){
      setDrawOffer(pendingDrawOffer)
      setPendingDrawOffer(null)
      setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900)
      setPhase('battle');return
    }
    setShowRoundBanner(true);setTimeout(()=>setShowRoundBanner(false),1900);setPhase('battle')
  }

  const levelName=lang==='en'?level.nameEn:level.name
  useEffect(()=>{onLevelInfo?.({emoji:level.emoji,name:levelName,isBoss:level.isBoss}); return()=>onLevelInfo?.(null)},[levelName])
  function handleDrawChoose(card){setPlayerHand([...drawOffer.hand,card]);setDrawOffer(null)}
  function handleDrawSkip(){setDrawPile(prev=>[...prev,...(drawOffer?.cards||[])]);setDrawOffer(null)}
  return(<div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',position:'relative',zIndex:1,background:'transparent'}}>
    {gyojiChoices&&<GyojiChooseScreen choices={gyojiChoices.choices} lang={lang} onChoose={(card)=>{
      const ps=gyojiChoices.pendingState
      let extraLogs=[{text:`⚖️ Ґьоджі активує: "${card.label||card.id}"!`,color:'#e8c547'}]
      let hp=ps.finalPHp,ohp=ps.newOHp,par=ps.newPArmor,oar=ps.newOArmor
      if(card.type==='heal'){hp=Math.min(MAX_HP,hp+card.heal);extraLogs.push({text:`+${card.heal} HP`,color:'#50e0c0'})}
      else if(card.type==='armor'){par+=card.armor;extraLogs.push({text:`+${card.armor} 🛡`,color:'#88ccff'})}
      else if(card.type==='strike'){ohp=Math.max(0,ohp-card.damage);extraLogs.push({text:`⚡ ${card.damage} шкода`,color:'#ffaa44'})}
      else if(card.type==='rikishi'){const dmg=Math.max(0,card.atk-(oar>0?Math.min(oar,card.atk):0));ohp=Math.max(0,ohp-dmg);oar=Math.max(0,oar-card.atk);extraLogs.push({text:`⚔ ${dmg} шкода`,color:'#ffaa44'})}
      setPlayerHp(hp);setCpuHp(ohp);setPlayerArmor(par);setCpuArmor(oar)
      setMyHpDelta(hp-playerHp);setOppHpDelta(ohp-cpuHp)
      setMyFlash(hp<playerHp?'damage':hp>playerHp?'heal':null)
      setOppFlash(ohp<cpuHp?'damage':'none')
      setRoundLog([...ps.logs,...extraLogs])
      if(ps.roundWinner==='p'){onAchievementProgress?.({type:'gyoji_win'});setPlayerWins(w=>w+1)}
      else if(ps.roundWinner==='o') setCpuWins(w=>w+1)
      setPlayerSkip(ps.pNextSkip);setCpuSkip(ps.oNextSkip)
      // Оновити руки з поточного стану
      const newPH=playerHand.filter(c=>c.id!==playerSelected?.id)
      let newCH=[...cpuHand]
      let newDraw=[...drawPile]
      if(newDraw.length>0){const idx=Math.floor(Math.random()*Math.min(3,newDraw.length));newCH=[...newCH,newDraw[idx]];newDraw=newDraw.filter((_,i)=>i!==idx)}
      setCpuHand(newCH)
      const offerable=weightedSample(newDraw.filter(c=>canAddToHand(newPH,c)),2)
      if(offerable.length>0&&hp>0&&ohp>0){
        setPlayerHand(newPH);setDrawPile(newDraw.filter(c=>!offerable.find(o=>o.id===c.id)))
        setPendingDrawOffer({cards:offerable,hand:newPH,draw:newDraw})
      } else {setPlayerHand(newPH);setDrawPile(newDraw)}
      setGyojiChoices(null)
      if(hp<=0){onLose();return}
      if(ohp<=0){onWin(hp,MAX_HP,envelopesEarned);return}
      setPhase('roundResult')
    }}/>}
    {drawOffer&&<DrawOfferScreen cards={drawOffer.cards} hand={drawOffer.hand} onChoose={handleDrawChoose} onSkip={handleDrawSkip} lang={lang}/>}
    {vsActive&&<VSScreen playerLabel={t('Ояката','Oyaката')} opponentLabel={levelName} lang={lang} onDone={()=>{setVsActive(false);setPhase('battle')}}/>}
    <GameBtn variant='dark' onClick={onBack} style={{marginBottom:'0.5rem'}}>‹ {t('Назад','Back')}</GameBtn>
    {phase==='draft'&&(<div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',animation:'slideIn 0.25s ease',padding:isMobile?'0.75rem':'1.25rem',overflowY:'auto'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.5rem'}}>{t('Змійка-драфт','Snake Draft')}</div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:'1rem',flexWrap:'wrap'}}>
        {Array.from({length:DRAFT_ROUNDS}).map((_,i)=>(<div key={i} style={{width:24,height:24,borderRadius:'50%',background:i<draftRound?'#1abc9c':i===draftRound?'#f0c060':'rgba(255,255,255,0.1)',border:`2px solid ${i<draftRound?'#1abc9c':i===draftRound?'#f0c060':'rgba(255,255,255,0.2)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--jp)',fontSize:'0.45rem',color:i<=draftRound?'#1a1200':'rgba(255,255,255,0.3)',fontWeight:700}}>{i<draftRound?'✓':i+1}</div>))}
        <div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,220,150,0.6)',marginLeft:4}}>{draftRound}/{DRAFT_ROUNDS}</div>
      </div>
      {playerHand.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',fontWeight:600,color:'rgba(255,220,150,0.85)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({playerHand.length})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{playerHand.map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
        {draftPool.map((c,i)=>{
          const blocked=!canAddToHand(playerHand,c)
          return(<div key={c.id} style={{position:'relative',animation:`pop 0.3s ease ${i*0.08}s both`}}>
            <GameCard card={c} onClick={()=>pickDraft(c)} disabled={blocked} lang={lang}/>
            {blocked&&<div style={{position:'absolute',inset:0,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.6)',backdropFilter:'blur(2px)'}}><div style={{textAlign:'center'}}><div style={{fontSize:'1rem'}}>🚫</div><div style={{fontFamily:'var(--jp)',fontSize:'0.4rem',color:'#e74c3c',marginTop:2}}>{t('Ліміт','Limit')}</div></div></div>}
          </div>)
        })}
      </div>
    </div>)}
    {(phase==='battle'||phase==='roundResult')&&<BattleLayout myHp={playerHp} oppHp={cpuHp} myArmor={playerArmor} oppArmor={cpuArmor} myWins={playerWins} oppWins={cpuWins} roundNum={roundNum+1} myLabel={t('Ояката','Oyakata')} oppLabel={levelName} myHand={playerHand} oppHand={cpuHand.length} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={false} oppReady={false} onSubmit={fight} roundLog={roundLog} phase={phase} onNext={nextRound} myCard={lastMyCard} oppCard={lastOppCard} drawPile={drawPile} onSwapDone={handleSwapDone} mySkipped={playerSkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner} playedCards={playedCards}/>}
  </div>)
}

// ── MultiGame ─────────────────────────────────────────────────
function MultiGame({ lang, onBack, sfx, onCardPlayed }) {
  const t=(uk,en)=>lang==='en'?en:uk
  const isMobile=useIsMobile()
  const [screen,setScreen]=useState('lobby')
  const [role,setRole]=useState(null)
  const [sessionId,setSessionId]=useState('')
  const [inputCode,setInputCode]=useState('')
  const [error,setError]=useState('')
  const [session,setSession]=useState(null)
  const [playerHand,setPlayerHand]=useState([])
  const [draftPool,setDraftPool]=useState([])
  const [draftRound,setDraftRound]=useState(0)   // скільки разів вибирав гравець
  const [draftCpuRound,setDraftCpuRound]=useState(0) // скільки разів вибирав CPU
  const [draftIsCpuTurn,setDraftIsCpuTurn]=useState(false) // зараз хід CPU?
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
    const{newPHp,newOHp,newPArmor,newOArmor,logs,roundWinner,pNextSkip,oNextSkip}=resolveRound(p1Card,p2Card,data.p1.hp,data.p2.hp,data.p1.armor||0,data.p2.armor||0,p1Skip,p2Skip,[])
    const newRound=(data.roundNum||0)+1
    const usedIds=new Set([data.p1.selectedCard,data.p2.selectedCard].filter(Boolean))
    const p1H=(data.p1.hand||[]).filter(id=>id!==data.p1.selectedCard)
    const p2H=(data.p2.hand||[]).filter(id=>id!==data.p2.selectedCard)
    const allUsed=new Set([...p1H,...p2H,...usedIds])
    const draw=(data.deck||[]).filter(id=>!allUsed.has(id))
    let fp1=[...p1H],fp2=[...p2H]
    const drawCards=draw.map(id=>getCardById(id)).filter(Boolean)
    if(drawCards.length>0){const d1=weightedSample(drawCards,1);fp1=[...fp1,d1[0].id];const rem=drawCards.filter(c=>c.id!==d1[0].id);if(rem.length>0){const d2=weightedSample(rem,1);fp2=[...fp2,d2[0].id]}}
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
    const sysTs=Date.now()
    await update(ref(db),{
      [`clash/${sid}/chat/${sysTs}`]:{text:`⚔️ Раунд ${newRound}: Ояката 1 → ${p1Skip?'⏩ Пропуск':(p1Card?.id||'?')} | Ояката 2 → ${p2Skip?'⏩ Пропуск':(p2Card?.id||'?')}`,role:'system',ts:sysTs},
      [`clash/${sid}/chat/${sysTs+1}`]:{text:roundWinner==='p'?'✅ Раунд: Ояката 1':roundWinner==='o'?'✅ Раунд: Ояката 2':'🤝 Нічия',role:'system',ts:sysTs+1},
    })
  }

  useEffect(()=>{
    if(!session||!role)return
    const mk=role==='host'?'p1':'p2';const ok=role==='host'?'p2':'p1'
    const status=session.status
    if(status==='waiting'&&role==='host'&&session.p2?.joined)update(ref(db,`clash/${sessionId}`),{status:'draft'})
    if(status==='draft'&&screen==='waiting'){setDraftPool((session[mk]?.draftPool||[]).map(id=>getCardById(id)).filter(Boolean));setDraftRound(session[mk]?.draftRound||0);setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setScreen('draft')}
    if(status==='battle'&&screen==='draft'){setPlayerHand((session[mk]?.hand||[]).map(id=>getCardById(id)).filter(Boolean));setPlayerSelected(null);setSubmitting(false);setRoundNum(session.roundNum||0);setScreen('vs')}
    if(status==='battle'&&screen==='roundResult'){
      const newMyHp=session[mk]?.hp??MAX_HP;const newOppHp=session[ok]?.hp??MAX_HP
      const newMyAr=session[mk]?.armor??0;const newOppAr=session[ok]?.armor??0
      const mhd=newMyHp-prevHp.my;const ohd=newOppHp-prevHp.opp;const mad=newMyAr-prevArmor.my;const oad=newOppAr-prevArmor.opp
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
    const shared=weightedShuffle(FULL_DECK);const ids=shared.map(c=>c.id)
    const p1PoolCards=weightedSample(shared,DRAFT_POOL_SIZE);const remaining1=shared.filter(c=>!p1PoolCards.find(x=>x.id===c.id))
    const p2PoolCards=weightedSample(remaining1,DRAFT_POOL_SIZE)
    const p1Pool=p1PoolCards.map(c=>c.id);const p2Pool=p2PoolCards.map(c=>c.id)
    const code=generateCode()
    await set(ref(db,`clash/${code}`),{status:'waiting',deck:ids,roundNum:0,roundLog:[],lastCards:null,processing:false,
      p1:{joined:true,hp:MAX_HP,armor:0,hand:[],draftPool:p1Pool,draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
      p2:{joined:false,hp:MAX_HP,armor:0,hand:[],draftPool:p2Pool,draftRound:0,wins:0,ready:false,draftDone:false,selectedCard:null,skipNext:false},
    })
    setLocalDrawPile(shared.filter(c=>!p1Pool.includes(c.id)&&!p2Pool.includes(c.id)))
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
    const currentHand=[...new Set([...(myData.hand||[]),card.id])]
    const newDraftRound=(myData.draftRound||0)+1;const isDone=newDraftRound>=DRAFT_ROUNDS
    const currentPool=myData.draftPool||[]
    const takenIds=new Set([...(data.p1?.hand||[]),...(data.p2?.hand||[]),...currentPool])
    const available=data.deck.filter(id=>!takenIds.has(id)).map(id=>getCardById(id)).filter(Boolean)
    const nextPoolCards=weightedSample(available,DRAFT_POOL_SIZE);const nextPool=nextPoolCards.map(c=>c.id)
    let updates={[`clash/${sessionId}/${mk}/hand`]:currentHand,[`clash/${sessionId}/${mk}/draftRound`]:newDraftRound,[`clash/${sessionId}/${mk}/draftDone`]:isDone}
    if(!isDone)updates[`clash/${sessionId}/${mk}/draftPool`]=nextPool
    await update(ref(db),updates)
    setPlayerHand(currentHand.map(id=>getCardById(id)).filter(Boolean));setDraftRound(newDraftRound)
    const otherKey=role==='host'?'p2':'p1'
    if(isDone&&data[otherKey]?.draftDone)await update(ref(db,`clash/${sessionId}`),{status:'battle'})
    if(!isDone)setDraftPool(nextPoolCards)
  }

  async function handleSwapDone(newCard){
    const mk=role==='host'?'p1':'p2'
    const snap=await get(ref(db,`clash/${sessionId}/${mk}/hand`))
    const allIds=snap.val()||[]
    const swapIdx=allIds.findIndex(id=>getCardById(id)?.type==='swap')
    const handIds=swapIdx>=0?[...allIds.slice(0,swapIdx),...allIds.slice(swapIdx+1)]:[...allIds]
    const newHand=[...handIds,newCard.id]
    await update(ref(db,`clash/${sessionId}/${mk}`),{hand:newHand})
    setPlayerHand(newHand.map(id=>getCardById(id)).filter(Boolean))
    setLocalDrawPile(prev=>prev.filter(c=>c.id!==newCard.id))
  }

  async function submitCard(){
    const mk=role==='host'?'p1':'p2';const mySkip=session?.[mk]?.skipNext||false
    if(!mySkip&&!playerSelected||submitting)return
    if(playerSelected) onCardPlayed?.(playerSelected.id)
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
  const allHandIds=new Set([...(session?.p1?.hand||[]),...(session?.p2?.hand||[])])
  const deckForSwap=(session?.deck||[]).map(id=>getCardById(id)).filter(c=>c&&!allHandIds.has(c.id))
  const oya1=t('Ояката 1','Oyakata 1');const oya2=t('Ояката 2','Oyakata 2')
  const myLabel=role==='host'?oya1:oya2;const oppLabel=role==='host'?oya2:oya1
  const myHpDelta=myHp-prevHp.my;const oppHpDelta=oppHp-prevHp.opp
  const myArmorDelta=myArmor-prevArmor.my;const oppArmorDelta=oppArmor-prevArmor.opp

  return(<div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto',padding:isMobile?'0.75rem':'1.25rem',position:'relative',zIndex:1,background:'transparent'}}>
    <GameBtn variant='dark' onClick={onBack} style={{marginBottom:'0.75rem'}}>‹ {t('Назад','Back')}</GameBtn>
    {(screen==='battle'||screen==='roundResult')&&<CardGuide lang={lang}/>}
    {screen==='vs'&&<VSScreen playerLabel={myLabel} opponentLabel={oppLabel} lang={lang} onDone={()=>setScreen('battle')}/>}
    {screen==='lobby'&&(<div style={{textAlign:'center',animation:'slideIn 0.25s ease',padding:'2rem 1rem'}}>
      <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>🌐</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'1.1rem',fontWeight:800,marginBottom:'1.5rem',color:'#f0c060',textShadow:'0 0 12px rgba(240,192,96,0.5)'}}>{t('Мультиплеєр','Multiplayer')}</div>
      <GameBtn variant='gold' onClick={createSession} style={{width:'100%',maxWidth:480,justifyContent:'center',padding:'0.9rem',fontSize:'0.9rem',letterSpacing:'0.1em',marginBottom:'1rem',boxShadow:'0 4px 20px rgba(184,134,11,0.5)'}}>{t('Створити гру (Ояката 1)','Create game (Oyakata 1)')}</GameBtn>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,220,150,0.6)',marginBottom:'0.75rem'}}>{t('або','or')}</div>
      <div style={{display:'flex',gap:8,marginBottom:'0.5rem',maxWidth:480,margin:'0 auto 0.5rem'}}>
        <input value={inputCode} onChange={e=>setInputCode(e.target.value.toUpperCase())} placeholder={t('КОД СЕСІЇ...','SESSION CODE...')} maxLength={6} style={{flex:1,padding:'0.75rem 1rem',background:'linear-gradient(180deg,#2a2218,#1a1510)',border:'2px solid #4a3e28',color:'#f0c060',fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,borderRadius:5,outline:'none',letterSpacing:'0.3em',textTransform:'uppercase',boxShadow:'inset 0 2px 6px rgba(0,0,0,0.6)'}}/>
        <GameBtn variant='dark' onClick={joinSession} style={{padding:'0.75rem 1.25rem',fontSize:'0.85rem',fontWeight:700}}>{t('Ояката 2','Oyakata 2')}</GameBtn>
      </div>
      {error&&<div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'#e74c3c',marginTop:8}}>{error}</div>}
    </div>)}
    {screen==='waiting'&&(<div style={{textAlign:'center',paddingTop:'3rem',animation:'slideIn 0.25s ease'}}>
      <div style={{fontSize:'3rem',marginBottom:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'1.3rem',fontWeight:900,color:'#f0c060',marginBottom:'0.5rem',textShadow:'0 0 16px rgba(240,192,96,0.6)'}}>{role==='host'?t('Ояката 1 чекає...','Oyakata 1 waiting...'):t('Ояката 2 підключається...','Oyakata 2 connecting...')}</div>
      {role==='host'&&<div style={{background:'linear-gradient(180deg,#2a2218,#1a1510)',border:'1px solid #4a3e28',borderRadius:8,padding:'1.5rem 2.5rem',display:'inline-block',animation:'pop 0.4s ease',marginTop:'1rem',boxShadow:'0 8px 32px rgba(0,0,0,0.8)'}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'rgba(255,220,150,0.7)',textShadow:'0 1px 3px rgba(0,0,0,0.8)',marginBottom:10,textTransform:'uppercase',letterSpacing:'0.12em'}}>{t('Код для Ояката 2','Code for Oyakata 2')}</div>
        <div style={{fontFamily:'var(--jp)',fontSize:'3rem',fontWeight:900,color:'#f0c060',letterSpacing:'0.4em',textShadow:'0 0 20px rgba(240,192,96,0.5)'}}>{sessionId}</div>
      </div>}
    </div>)}
    {screen==='draft'&&(<div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',animation:'slideIn 0.25s ease'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:700,textAlign:'center',marginBottom:'0.25rem'}}>{t('Оберіть команду','Draft your team')}</div>
      {draftRound<DRAFT_ROUNDS&&<div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,color:'rgba(255,220,150,0.95)',textShadow:'0 1px 6px rgba(0,0,0,0.95)',textAlign:'center',marginBottom:'1rem'}}>{t('Рікіші','Rikishi')} {draftRound+1}/{DRAFT_ROUNDS}</div>}
      {myHandCards.length>0&&<div style={{marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',fontWeight:600,color:'rgba(255,220,150,0.85)',textShadow:'0 1px 4px rgba(0,0,0,0.9)',textTransform:'uppercase',marginBottom:8}}>{t('Рука','Hand')} ({myHandCards.length})</div><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{[...new Map(myHandCards.filter(Boolean).map(c=>[c.id,c])).values()].map(c=><GameCard key={c.id} card={c} small disabled lang={lang}/>)}</div></div>}
      {!session?.[mk]?.draftDone?(<div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>{myDraftPool.map((c,i)=>c&&<div key={c.id} style={{animation:`pop 0.3s ease ${i*0.08}s both`}}><GameCard card={c} onClick={()=>pickDraft(c)} lang={lang}/></div>)}</div>):(<div style={{fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:600,color:'rgba(255,220,150,0.85)',textShadow:'0 1px 5px rgba(0,0,0,0.95)',textAlign:'center',marginTop:'1rem',animation:'pulse 1.5s ease infinite'}}>⏳ {t('Очікуємо суперника...','Waiting...')}</div>)}
    </div>)}
    {(screen==='battle'||screen==='roundResult')&&<BattleLayout myHp={myHp} oppHp={oppHp} myArmor={myArmor} oppArmor={oppArmor} myWins={myWins} oppWins={oppWins} roundNum={totalRounds+1} myLabel={myLabel} oppLabel={oppLabel} myHand={myHandCards} oppHand={oppHandCount} playerSelected={playerSelected} onSelect={setPlayerSelected} myReady={myReady} oppReady={oppReady} onSubmit={submitCard} roundLog={session?.roundLog||[]} phase={screen} onNext={async()=>{if(role==='host')await update(ref(db,`clash/${sessionId}`),{status:'battle',battleTrigger:(session?.battleTrigger||0)+1})}} myCard={myLastCard} oppCard={oppLastCard} drawPile={deckForSwap} onSwapDone={handleSwapDone} mySkipped={mySkip} lang={lang} sfx={sfx} myHpDelta={myHpDelta} oppHpDelta={oppHpDelta} myArmorDelta={myArmorDelta} oppArmorDelta={oppArmorDelta} myFlash={myFlash} oppFlash={oppFlash} showRoundBanner={showRoundBanner}/>}
    {(screen==='battle'||screen==='roundResult')&&(<div style={{marginTop:'1rem',border:'1px solid var(--border)',borderRadius:4,overflow:'hidden'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,220,150,0.75)',textShadow:'0 1px 3px rgba(0,0,0,0.8)',padding:'6px 10px',borderBottom:'1px solid var(--border)',textTransform:'uppercase',letterSpacing:'0.1em'}}>💬 {t('Чат','Chat')}</div>
      <div style={{height:120,overflowY:'auto',padding:'6px 10px',display:'flex',flexDirection:'column',gap:4}}>
        {chatMessages.length===0&&<div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'var(--light)',textAlign:'center',marginTop:16}}>{t('Напишіть суперника...','Say something...')}</div>}
        {chatMessages.map(m=>(<div key={m.ts} style={{display:'flex',gap:6,alignItems:'flex-start'}}>
          {m.role==='system'?(<span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'#b8860b',lineHeight:1.5,fontStyle:'italic',opacity:0.85,width:'100%'}}>{m.text}</span>):(<><span style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:m.role===role?'#1a6b5c':'#c0392b',flexShrink:0,marginTop:1}}>{m.role===role?t('Ви','You'):t('Суп.','Opp.')}</span><span style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--ink)',wordBreak:'break-word'}}>{m.text}</span></>)}
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

function ReviewModal({onClose,onSubmit,lang}){
  const t=(uk,en)=>lang==='en'?en:uk
  const [stars,setStars]=useState(0)
  const [hovered,setHovered]=useState(0)
  const [comment,setComment]=useState('')
  const [submitted,setSubmitted]=useState(false)
  async function handleSubmit(){if(stars===0)return;await onSubmit(stars,comment);setSubmitted(true);setTimeout(onClose,1800)}
  if(submitted)return(<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}><div style={{background:'var(--card)',border:'1px solid #b8860b',borderRadius:8,padding:'2rem',maxWidth:320,width:'90%',textAlign:'center',animation:'pop 0.3s ease'}}><div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>🏆</div><div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,color:'#b8860b'}}>{t('Дякуємо!','Thank you!')}</div></div></div>)
  return(<div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:4000,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
    <div onClick={e=>e.stopPropagation()} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'1.5rem',maxWidth:360,width:'90%',animation:'pop 0.25s ease',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem'}}><div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,color:'var(--ink)'}}>🏅 {t('Оцінити гру','Rate the game')}</div><button onClick={onClose} style={{background:'transparent',border:'none',color:'var(--mid)',fontSize:'1.2rem',cursor:'pointer',lineHeight:1,padding:0}}>✕</button></div>
      <div style={{display:'flex',justifyContent:'center',gap:8,marginBottom:'1rem'}}>{[1,2,3,4,5].map(i=>(<div key={i} onClick={()=>setStars(i)} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(0)} style={{fontSize:'2.2rem',cursor:'pointer',transition:'transform 0.1s',transform:(hovered||stars)>=i?'scale(1.15)':'scale(1)',filter:(hovered||stars)>=i?'none':'grayscale(1) opacity(0.35)'}}>🏅</div>))}</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'var(--mid)',textAlign:'center',marginBottom:'1.25rem',minHeight:18}}>{stars===0?t('Оберіть кінбоші','Select kinboshi'):stars===1?t('Слабо','Weak'):stars===2?t('Нормально','OK'):stars===3?t('Добре','Good'):stars===4?t('Відмінно','Great'):t('Йокодзуна! Шедевр!','Yokozuna! Masterpiece!')}</div>
      <textarea value={comment} onChange={e=>setComment(e.target.value.slice(0,280))} placeholder={t('Ваш відгук (необов\'язково)...','Your feedback (optional)...')} rows={3} style={{width:'100%',boxSizing:'border-box',padding:'0.65rem 0.75rem',background:'var(--bg2)',border:'1px solid var(--border)',color:'var(--ink)',fontFamily:'var(--jp)',fontSize:'0.72rem',borderRadius:4,outline:'none',resize:'none',lineHeight:1.6,marginBottom:'1rem'}}/>
      <div style={{display:'flex',gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:'0.7rem',background:'var(--bg2)',color:'var(--mid)',border:'1px solid var(--border)',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer'}}>{t('Пізніше','Later')}</button>
        <button onClick={handleSubmit} disabled={stars===0} style={{flex:2,padding:'0.7rem',background:stars>0?'#b8860b':'var(--bg2)',color:stars>0?'#fff':'var(--mid)',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.78rem',fontWeight:700,cursor:stars>0?'pointer':'default',transition:'all 0.15s'}}>{stars>0?t('⚔ Надіслати','⚔ Submit'):t('Оберіть оцінку','Choose rating')}</button>
      </div>
    </div>
  </div>)
}

// ── SumoClash (головний компонент) ────────────────────────────
export default function SumoClash({ onClose, lang='uk' }) {
  const [mode, setMode] = useState('menu')
  const t=(uk,en)=>lang==='en'?en:uk
  const isMobile=useIsMobile()
  const audioCtxRef=useRef(null)
  const audioRef=useRef(null)
  const [sfxOn,setSfxOn]=useState(true)
  const [musicOn,setMusicOn]=useState(false)
  const [musicTheme,setMusicTheme]=useState('dohyo')
  const [confirmExit,setConfirmExit]=useState(false)
  const [showReview,setShowReview]=useState(false)
  const [gameTheme,setGameTheme]=useState('dark')
  const [isFullscreen,setIsFullscreen]=useState(false)
  const gameContainerRef=useRef(null)
  const [campaignLevelInfo,setCampaignLevelInfo]=useState(null) // {emoji, name, isBoss} для хедера

  // ── Система досягнень ────────────────────────────────────────
  const [showAchievements,setShowAchievements]=useState(false)
  const [unlockedAchievements,setUnlockedAchievements]=useState(new Set())
  const [claimedAchievements,setClaimedAchievements]=useState(new Set())
  const [achievementToast,setAchievementToast]=useState(null)
  const [hasNewAchievement,setHasNewAchievement]=useState(false)
  const achievementUidRef=useRef(null)

  useEffect(()=>{
    getSumoClashUid().then(async uid=>{
      achievementUidRef.current=uid
      if(uid){
        try{
          const snap=await get(ref(db,`campaignUsers/${uid}/achievements`))
          const val=snap.val()
          if(val){
            const ids=Object.keys(val).filter(k=>val[k]?.unlocked)
            setUnlockedAchievements(new Set(ids))
            const claimedIds=Object.keys(val).filter(k=>val[k]?.claimed)
            setClaimedAchievements(new Set(claimedIds))
            const hasUnseen=Object.values(val).some(v=>v?.unlocked&&!v?.seen&&!v?.claimed)
            if(hasUnseen)setHasNewAchievement(true)
          }
        }catch(e){console.warn('Could not load achievements',e)}
      }
    })
  },[])

  async function unlockAchievement(id){
    if(unlockedAchievements.has(id))return
    const ach=ACHIEVEMENTS.find(a=>a.id===id)
    if(!ach)return
    const next=new Set(unlockedAchievements)
    next.add(id)
    setUnlockedAchievements(next)
    setAchievementToast(ach)
    setHasNewAchievement(true)// нова необставлена нагорода
    if(sfxOn){const ctx=ensureCtx();playSound(ctx,'achievement')}
    const uid=achievementUidRef.current
    if(uid){
      try{await update(ref(db,`campaignUsers/${uid}/achievements/${id}`),{unlocked:true,unlockedAt:Date.now(),seen:false})}
      catch(e){console.warn('Could not save achievement',e)}
    }
  }

  function handleOpenAchievements(){
    setShowAchievements(true)
    setHasNewAchievement(false)
    const uid=achievementUidRef.current
    if(uid){
      unlockedAchievements.forEach(id=>{
        update(ref(db,`campaignUsers/${uid}/achievements/${id}`),{seen:true}).catch(()=>{})
      })
    }
  }

  async function handleClaimAchievement(ach){
    if(claimedAchievements.has(ach.id))return
    const next=new Set(claimedAchievements)
    next.add(ach.id)
    setClaimedAchievements(next)
    // Нарахувати йокоіни в Firebase кампанії
    const uid=achievementUidRef.current
    if(uid){
      try{
        const snap=await get(ref(db,`campaignUsers/${uid}/yokoin`))
        const current=snap.val()||0
        await update(ref(db,`campaignUsers/${uid}`),{
          yokoin:current+ach.reward,
          [`achievements/${ach.id}/claimed`]:true,
          [`achievements/${ach.id}/claimedAt`]:Date.now(),
        })
      }catch(e){console.warn('Could not claim achievement reward',e)}
    }
  }

  function handleAchievementProgress(event){
    if(event.type==='match_end'&&event.won){
      unlockAchievement('first_win')
      if(event.noDmg) unlockAchievement('flawless')
      if(event.hp<=3) unlockAchievement('last_stand')
      if(event.rounds<=5) unlockAchievement('speedrun')
      if(event.chaosPlayed) unlockAchievement('chaos_winner')
      if(event.healCount>=5) unlockAchievement('healer')
      if(event.henkaCount>=3) unlockAchievement('dodger')
    }
    if(event.type==='gyoji_win') unlockAchievement('gyoji_trick')
    if(event.type==='campaign_complete') unlockAchievement('all_campaign')
  }

  useEffect(()=>{
    const handler=()=>setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange',handler)
    return()=>document.removeEventListener('fullscreenchange',handler)
  },[])
  function toggleFullscreen(){
    if(!document.fullscreenElement)gameContainerRef.current?.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  // ── Відкриття карток ─────────────────────────────────────────
  const [discoveredCards, setDiscoveredCards] = useState(new Set())
  const [discoveryUid, setDiscoveryUid] = useState(null)
  useEffect(() => {
    getSumoClashUid().then(async uid => {
      setDiscoveryUid(uid)
      if (uid) {
        try {
          const snap = await get(ref(db, `campaignUsers/${uid}/discoveredCards`))
          const val = snap.val()
          if (val && Array.isArray(val)) setDiscoveredCards(new Set(val))
        } catch(e) { console.warn('Could not load discovered cards', e) }
      }
    })
  }, [])

  async function handleCardDiscovered(cardId) {
    if (!cardId || discoveredCards.has(cardId)) return
    const next = new Set(discoveredCards)
    next.add(cardId)
    setDiscoveredCards(next)
    // Перевірка досягнення "всі картки"
    if(next.size>=FULL_DECK.length) unlockAchievement('all_cards')
    if (discoveryUid) {
      try { await update(ref(db, `campaignUsers/${discoveryUid}`), { discoveredCards: [...next] }) }
      catch(e) { console.warn('Could not save discovered card', e) }
    }
  }

  // ── Стабільний GameBattle для кампанії ───────────────────────
  // Анонімна функція в JSX = новий компонент на кожен рендер → SumoClashCampaign
  // скидає стан бою. Рішення: useRef зберігає один і той самий компонент,
  // а sfxRef/onCardPlayedRef дозволяють оновлювати значення без нового компонента.
  const sfxRef = useRef(sfx)
  sfxRef.current = sfx
  const onCardPlayedRef = useRef(handleCardDiscovered)
  onCardPlayedRef.current = handleCardDiscovered
  const GameBattleStable = useRef(
    (props) => <CampaignBattleWrapper {...props} sfx={sfxRef.current} onCardPlayed={onCardPlayedRef.current} onLevelInfo={setCampaignLevelInfo}/>
  ).current

  const DARK_VARS = {'--card':'#1a1814','--bg':'#13110e','--bg2':'rgba(255,255,255,0.06)','--ink':'rgba(255,255,255,0.9)','--mid':'rgba(255,255,255,0.45)','--light':'rgba(255,255,255,0.25)','--border':'rgba(255,255,255,0.1)','--jp':"'Noto Serif JP', serif"}
  const LIGHT_VARS = {'--card':'#f5f0e8','--bg':'#ede8de','--bg2':'rgba(0,0,0,0.06)','--ink':'rgba(30,20,5,0.9)','--mid':'rgba(30,20,5,0.45)','--light':'rgba(30,20,5,0.25)','--border':'rgba(30,20,5,0.12)','--jp':"'Noto Serif JP', serif"}
  const themeVars = gameTheme==='dark' ? DARK_VARS : LIGHT_VARS

  async function submitReview(stars,comment){
    try{const ts=Date.now();await update(ref(db,`analytics/games/sumoClash/reviews/${ts}`),{stars,comment:comment.trim()||null,ts,lang,mode:mode==='menu'?'general':mode});const snap=await get(ref(db,'analytics/games/sumoClash/totalReviews'));await update(ref(db,'analytics/games/sumoClash'),{totalReviews:(snap.val()||0)+1})}catch(e){console.error('Review error:',e)}
  }

  function handleClose(){setConfirmExit(false);setShowReview(true)}
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

      {/* Тост досягнення */}
      {achievementToast&&<AchievementToast achievement={achievementToast} lang={lang} onDone={()=>setAchievementToast(null)}/>}

      {/* Модальне вікно досягнень */}
      {showAchievements&&<AchievementsModal unlockedSet={unlockedAchievements} claimedSet={claimedAchievements} lang={lang} onClose={()=>setShowAchievements(false)} onClaim={handleClaimAchievement}/>}

      {showReview&&<ReviewModal onClose={()=>{setShowReview(false);onClose()}} onSubmit={submitReview} lang={lang}/>}

      {confirmExit&&(
        <div onClick={e=>e.stopPropagation()} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{...themeVars,background:'linear-gradient(180deg,#2a2218 0%,#1a1510 100%)',border:'1px solid #4a3e28',borderRadius:8,padding:'1.5rem',maxWidth:320,width:'90%',textAlign:'center',animation:'pop 0.2s ease',boxShadow:'0 16px 48px rgba(0,0,0,0.9)'}}>
            <div style={{fontFamily:'var(--jp)',fontSize:'1.1rem',fontWeight:700,color:'#f0c060',marginBottom:'0.5rem'}}>{t('Вийти з гри?','Exit game?')}</div>
            <div style={{fontFamily:'var(--jp)',fontSize:'0.7rem',color:'#8a7a60',marginBottom:'1.25rem'}}>{t('Прогрес поточної гри буде втрачено','Current game progress will be lost')}</div>
            <div style={{display:'flex',gap:10}}>
              <GameBtn variant='dark' onClick={()=>setConfirmExit(false)} style={{flex:1,justifyContent:'center',padding:'0.7rem'}}>{t('Залишитись','Stay')}</GameBtn>
              <GameBtn variant='red' onClick={handleClose} style={{flex:1,justifyContent:'center',padding:'0.7rem'}}>{t('Вийти','Exit')}</GameBtn>
            </div>
          </div>
        </div>
      )}

      <div onClick={()=>setConfirmExit(true)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center',padding:isFullscreen?0:isMobile?0:'0.75rem',backdropFilter:'blur(4px)'}}>
        <div ref={gameContainerRef} onClick={e=>e.stopPropagation()} style={{...themeVars,background:'var(--card)',border:isFullscreen||isMobile?'none':'1px solid var(--border)',borderRadius:isFullscreen||isMobile?0:6,maxWidth:isFullscreen?'100vw':1100,width:'100%',maxHeight:isFullscreen?'100vh':isMobile?'100dvh':'96vh',height:isFullscreen||isMobile?'100dvh':'auto',minHeight:'min(600px,90vh)',display:'flex',flexDirection:'column',overflow:'hidden',animation:'pop 0.3s ease'}}>

          {/* Header */}
          <div style={{background:'linear-gradient(180deg,#2a2218 0%,#1a1510 100%)',borderBottom:'1px solid #3a2e20',padding:isMobile?'0.45rem 0.75rem':'0.6rem 1rem',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,0.6)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <img src="/images/dohyo-legends-logo.webp" alt="DOHYO LEGENDS" style={{height:isMobile?26:36,width:'auto',filter:'drop-shadow(0 0 8px rgba(240,160,20,0.6))'}} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex'}}/>
              <span style={{display:'none',alignItems:'center',gap:6}}><span style={{fontSize:'1.1rem'}}>⚔️</span><span style={{fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:900,letterSpacing:'0.18em',textTransform:'uppercase',color:'#f0c060'}}>DOHYO LEGENDS</span></span>
              {mode!=='menu'&&!isMobile&&<span style={{fontFamily:'var(--jp)',fontSize:'0.68rem',color:'rgba(255,220,150,0.65)',fontWeight:400}}>· {mode==='cpu'?'vs CPU':mode==='campaign'?(campaignLevelInfo?`${t('Кампанія','Campaign')} · ${campaignLevelInfo.emoji} ${campaignLevelInfo.name}`:t('Кампанія','Campaign')):mode==='multi'?t('Мультиплеєр','Multiplayer'):mode==='cardbook'?t('Картки','Cards'):mode==='rules'?t('Правила','Rules'):''}</span>}
              {(mode==='campaign'||mode==='cpu')&&!isMobile&&<CardGuideInline lang={lang}/>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:isMobile?3:5}}>
              {isMobile ? (
                <>
                  <GameBtn variant={sfxOn?'gold':'dark'} onClick={toggleSfx} style={{fontSize:'0.75rem',padding:'4px 8px'}}>{sfxOn?'🔊':'🔇'}</GameBtn>
                  <GameBtn variant={musicOn?'gold':'dark'} onClick={toggleMusic} style={{fontSize:'0.75rem',padding:'4px 8px'}}>🎵</GameBtn>
                  {/* Кнопка досягнень — мобільна */}
                  <button onClick={handleOpenAchievements} style={{position:'relative',background:hasNewAchievement?'rgba(184,134,11,0.25)':'transparent',border:`1px solid ${hasNewAchievement?'rgba(184,134,11,0.6)':'rgba(255,255,255,0.15)'}`,color:'#f0c060',width:30,height:30,borderRadius:5,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'0.85rem',animation:hasNewAchievement?'achievementBtnPulse 1.5s ease infinite':undefined}}>
                    🏆
                    {hasNewAchievement&&<div style={{position:'absolute',top:-3,right:-3,width:7,height:7,borderRadius:'50%',background:'#e74c3c',boxShadow:'0 0 4px #e74c3c'}}/>}
                  </button>
                  <GameBtn variant='red' onClick={()=>setConfirmExit(true)} style={{fontSize:'0.95rem',padding:'4px 9px',fontWeight:900}}>✕</GameBtn>
                </>
              ) : (
                <>
                  <AudioControls sfxOn={sfxOn} musicOn={musicOn} currentTheme={musicTheme} onToggleSfx={toggleSfx} onToggleMusic={toggleMusic} onThemeChange={changeTheme} lang={lang}/>
                  {/* Кнопка досягнень — десктоп */}
                  <button onClick={handleOpenAchievements} style={{position:'relative',...BTN_BASE,...(hasNewAchievement?BTN.gold:BTN.dark),fontSize:'0.7rem',padding:'5px 12px',animation:hasNewAchievement?'achievementBtnPulse 1.5s ease infinite':undefined}}>
                    🏆 {t('Нагороди','Awards')}
                    {hasNewAchievement&&<div style={{position:'absolute',top:-3,right:-3,width:7,height:7,borderRadius:'50%',background:'#e74c3c',boxShadow:'0 0 4px #e74c3c'}}/>}
                  </button>
                  <GameBtn variant='dark' onClick={toggleFullscreen} title={isFullscreen?t('Вийти з повного екрану','Exit fullscreen'):t('Повний екран','Fullscreen')} style={{fontSize:'0.8rem',padding:'5px 9px'}}>{isFullscreen?'🗗':'🗖'}</GameBtn>
                  <GameBtn variant='dark' onClick={()=>setGameTheme(v=>v==='dark'?'light':'dark')} style={{fontSize:'0.8rem',padding:'5px 9px'}}>{gameTheme==='dark'?'☀️':'🌙'}</GameBtn>
                  <GameBtn variant='dark' onClick={()=>setShowReview(true)} style={{fontSize:'0.8rem',padding:'5px 9px'}}>🏅</GameBtn>
                  <GameBtn variant='red' onClick={()=>setConfirmExit(true)} style={{fontSize:'1rem',padding:'5px 10px',fontWeight:900}}>✕</GameBtn>
                </>
              )}
            </div>
          </div>

          {/* Menu */}
          {mode==='menu'&&(
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',minHeight:400}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/sumo-temple.webp)',backgroundSize:'cover',backgroundPosition:'center'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)'}}/>
              <SakuraPetals/>
              <div style={{position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:isMobile?'0.65rem':isFullscreen?'1.1rem':'0.9rem',width:'100%',padding:isMobile?'1.5rem 1rem':isFullscreen?'2.5rem 2rem':'2rem',animation:'slideIn 0.3s ease'}}>
                <img src="/images/dohyo-legends-logo.webp" alt="DOHYO LEGENDS" style={{maxWidth:isFullscreen?780:580,width:isMobile?'92%':'88%',height:'auto',animation:'pop 0.5s ease, logoBreathe 3.5s ease-in-out 0.6s infinite',filter:'drop-shadow(0 0 28px rgba(240,160,20,0.8)) drop-shadow(0 6px 20px rgba(0,0,0,0.95))',marginBottom:'0.25rem'}} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='block'}}/>
                <div style={{display:'none',fontFamily:'var(--jp)',fontSize:'2rem',fontWeight:900,color:'#f0c060',textShadow:'0 0 30px rgba(240,192,96,0.7)',letterSpacing:'0.2em',textTransform:'uppercase'}}>DOHYO LEGENDS</div>
                {[
                  {img:'btn-campaign.webp', action:()=>{sfx('click');setMode('campaign');trackGameLaunch('sumoClash')}},
                  {img:'btn-cpu.webp',      action:()=>{sfx('click');setMode('cpu');trackGameLaunch('sumoClash');trackClashMode('cpu')}},
                  {img:'btn-multi.webp',    action:()=>{sfx('click');setMode('multi');trackGameLaunch('sumoClash');trackClashMode('multi')}},
                  {img:'btn-cardbook.webp', action:()=>{sfx('click');setMode('cardbook')}},
                ].map(btn=>(
                  <div key={btn.img} onClick={btn.action} style={{width:'100%',maxWidth:isMobile?'100%':isFullscreen?520:360,height:isMobile?56:isFullscreen?78:60,cursor:'pointer',borderRadius:6,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.6)',transition:'transform 0.15s, box-shadow 0.15s',flexShrink:0}}
                    onMouseEnter={e=>{if(!isMobile){e.currentTarget.style.transform='scale(1.04)';e.currentTarget.style.boxShadow='0 6px 28px rgba(0,0,0,0.8)'}}}
                    onMouseLeave={e=>{e.currentTarget.style.transform='scale(1)';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.6)'}}>
                    <img src={`/images/${btn.img}`} alt="" style={{width:'100%',height:'100%',objectFit:'fill',imageRendering:'high-quality',display:'block'}}/>
                  </div>
                ))}
              </div>
              {/* Кнопка Правила */}
              <div style={{position:'absolute',bottom:18,left:'50%',transform:'translateX(-50%)',zIndex:10}}>
                <button onClick={()=>{sfx('click');setMode('rules')}}
                  style={{fontFamily:'var(--jp)',fontSize:'0.62rem',fontWeight:600,color:'rgba(255,220,150,0.55)',letterSpacing:'0.12em',background:'rgba(0,0,0,0.4)',border:'1px solid rgba(255,220,150,0.15)',borderRadius:20,padding:'4px 18px',cursor:'pointer',backdropFilter:'blur(4px)',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.color='rgba(255,220,150,0.9)';e.currentTarget.style.borderColor='rgba(255,220,150,0.4)'}}
                  onMouseLeave={e=>{e.currentTarget.style.color='rgba(255,220,150,0.55)';e.currentTarget.style.borderColor='rgba(255,220,150,0.15)'}}>
                  📜 {t('Правила','Rules')}
                </button>
              </div>
              <div style={{position:'absolute',bottom:10,right:14,zIndex:10,pointerEvents:'none',userSelect:'none',textAlign:'right'}}>
                <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,220,150,0.55)',letterSpacing:'0.1em',textShadow:'0 1px 4px rgba(0,0,0,0.9)'}}>© 2026 TerraVetera. All rights reserved.</div>
              </div>
            </div>
          )}

          {mode==='rules' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',overflowY:'auto',padding:isMobile?'1rem':'1.5rem 2rem',position:'relative',zIndex:1}}>
              <div style={{maxWidth:720,margin:'0 auto',width:'100%'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1.5rem'}}>
                  <GameBtn variant='dark' onClick={()=>setMode('menu')}>‹ {t('Назад','Back')}</GameBtn>
                  <div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:900,color:'#f0c060',textShadow:'0 0 16px rgba(240,192,96,0.4)'}}>📜 {t('Правила Dohyo Legends','Dohyo Legends Rules')}</div>
                </div>
                {[
                  {icon:'⚔️', title:{uk:'Про гру',en:'About the Game'}, body:{uk:'Dohyo Legends — стратегічна карткова гра в стилі сумо. Два Ояката (тренери) ведуть своїх рікіші до перемоги. Мета — знизити HP суперника до 0, або мати більше HP після 15 раундів.',en:"Dohyo Legends is a strategic sumo-themed card game. Two Oyakata (trainers) lead their rikishi to victory. The goal is to reduce the opponent's HP to 0, or have more HP after 15 rounds."}},
                  {icon:'🃏', title:{uk:'Драфт (Змійка)',en:'Draft (Snake)'}, body:{uk:'Перед боєм обидва гравці по черзі обирають картки зі спільного пулу — "змійкою" (Ояката 1 → CPU → CPU → Ояката 1...). Ліміт: не більше 2 карт одного типу в руці. Заблоковані карти показують 🚫.',en:'Before battle, players take turns choosing cards from a shared pool in "snake" order (Player 1 → CPU → CPU → Player 1...). Limit: max 2 cards of the same type in hand. Blocked cards show 🚫.'}},
                  {icon:'🥊', title:{uk:'Механіка бою',en:'Battle Mechanics'}, body:{uk:'Кожен раунд — обидва гравці одночасно обирають одну карту. Після вибору — ефекти застосовуються. Після раунду гравець обирає нову карту з 2 варіантів (не рандом).',en:'Each round — both players simultaneously choose one card. After selection — effects are applied. After the round, the player chooses a new card from 2 options (not random).'}},
                  {icon:'🂠', title:{uk:'Типи карток',en:'Card Types'}, body:{uk:"⚔️ Рікіші — атакує. Шкода = ATK − DEF суперника. Б'є броню першою.\n💧 Хіл — відновлює HP (+5 або +10).\n🛡 Броня — додає захист (+5 або +10 🛡).\n⚡ Удар — пряма шкода, ігнорує броню (-5 або -10 HP).\n🔄 Заміна — замінює карту з руки на нову з колоди.\n🧂 Сіль — суперник пропускає наступний хід.\n🌀 Хенка — ухилення від рікіші або удару суперника.\n💥 Хаос — обидва втрачають 10 HP, ігнорує броню.\n⚖️ Ґьоджі — оберіть будь-яку раніше зіграну карту для повторної активації.",en:"⚔️ Rikishi — attacks. Damage = ATK − opponent DEF. Hits armor first.\n💧 Heal — restores HP (+5 or +10).\n🛡 Armor — adds defense (+5 or +10 🛡).\n⚡ Strike — direct damage, ignores armor (-5 or -10 HP).\n🔄 Swap — replace a hand card with a new deck card.\n🧂 Salt — opponent skips next turn.\n🌀 Henka — dodge opponent rikishi or strike.\n💥 Chaos — both lose 10 HP, ignores armor.\n⚖️ Gyoji — choose any previously played card to activate again."}},
                  {icon:'🏯', title:{uk:'Кампанія',en:'Campaign'}, body:{uk:'5 рівнів складності: від Маегашіра до Йокодзуна (БОС). За перемогу отримуєте Йокоіни 🪙 і зірки ⭐ (залежать від залишку HP). Зірки = 3 якщо HP > 66%, 2 якщо 33-66%, 1 якщо < 33%.',en:'5 difficulty levels: from Maegashira to Yokozuna (BOSS). Win to earn Yokoin 🪙 and stars ⭐ (based on remaining HP). Stars: 3 if HP > 66%, 2 if 33-66%, 1 if < 33%.'}},
                  {icon:'🏪', title:{uk:'Магазин',en:'Shop'}, body:{uk:'Між рівнями — магазин покращень. Постійні: +1 ATK або +1 DEF для обраної картки (на всю кампанію). Тимчасові: Бойовий дух (+2 ATK на 1 бій), Залізна стійка (+5 броні на старті), Водний щит (блокує першу шкоду).',en:'Between levels — upgrade shop. Permanent: +1 ATK or +1 DEF for a chosen card (entire campaign). Temporary: Battle Spirit (+2 ATK for 1 fight), Iron Stance (+5 armor at start), Water Shield (blocks first damage).'}},
                  {icon:'⏰', title:{uk:'Тиск судді',en:"Judge's Pressure"}, body:{uk:'Якщо бій затягується після 10-го раунду — судді втрачають терпіння. Кожен раунд обидва гравці отримують -2 HP автоматично. Це форсує агресивний фінал.',en:'If the fight drags past round 10 — the judges lose patience. Each round both players automatically lose -2 HP. This forces an aggressive finish.'}},
                  {icon:'🏆', title:{uk:'Нагороди',en:'Achievements'}, body:{uk:'13 досягнень — від "Перша кров" (виграти перший матч) до таємних нагород. Кожне досягнення дає Йокоіни. Отримати нагороду можна в меню 🏆 Нагороди.',en:'13 achievements — from "First Blood" (win first match) to secret rewards. Each achievement gives Yokoin. Claim rewards in the 🏆 Awards menu.'}},
                ].map((section,i)=>(
                  <div key={i} style={{marginBottom:'1rem',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(255,220,150,0.1)',borderRadius:8,overflow:'hidden',animation:`slideIn 0.3s ease ${i*0.06}s both`}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,padding:'0.75rem 1rem',background:'rgba(184,134,11,0.1)',borderBottom:'1px solid rgba(255,220,150,0.08)'}}>
                      <span style={{fontSize:'1.1rem'}}>{section.icon}</span>
                      <span style={{fontFamily:'var(--jp)',fontSize:'0.8rem',fontWeight:700,color:'#f0c060'}}>{lang==='en'?section.title.en:section.title.uk}</span>
                    </div>
                    <div style={{padding:'0.75rem 1rem'}}>
                      {(lang==='en'?section.body.en:section.body.uk).split('\n').map((line,j)=>(
                        <div key={j} style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,220,150,0.75)',lineHeight:1.9,marginBottom:line.startsWith('⚔️')||line.startsWith('💧')||line.startsWith('🛡')||line.startsWith('⚡')||line.startsWith('🔄')||line.startsWith('🧂')||line.startsWith('🌀')||line.startsWith('💥')||line.startsWith('⚖️')?2:0}}>{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode==='cardbook' && <CardBook lang={lang} onClose={()=>setMode('menu')} discoveredCards={discoveredCards}/>}

          {mode==='cpu' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-cpu.webp)',backgroundSize:'cover',backgroundPosition:'center',pointerEvents:'none'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',pointerEvents:'none'}}/>
              <div style={{flex:1,display:'flex',flexDirection:'column',maxWidth:isFullscreen?1300:'100%',width:'100%',margin:'0 auto',position:'relative'}}>
                <CpuGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx} onCardPlayed={handleCardDiscovered} onAchievementProgress={handleAchievementProgress}/>
              </div>
            </div>
          )}

          {mode==='campaign' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-campaign.webp)',backgroundSize:'cover',backgroundPosition:'center',pointerEvents:'none'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',pointerEvents:'none'}}/>
              <div style={{flex:1,display:'flex',flexDirection:'column',maxWidth:isFullscreen?1400:'100%',width:'100%',margin:'0 auto',position:'relative'}}>
                <SumoClashCampaign
                  onBack={()=>{setMode('menu');setCampaignLevelInfo(null)}}
                  lang={lang}
                  discoveredCards={discoveredCards}
                  onCampaignComplete={()=>handleAchievementProgress({type:'campaign_complete'})}
                  GameBattle={GameBattleStable}
                />
              </div>
            </div>
          )}

          {mode==='multi' && (
            <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-multi.webp)',backgroundSize:'cover',backgroundPosition:'center',pointerEvents:'none'}}/>
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',pointerEvents:'none'}}/>
              <div style={{flex:1,display:'flex',flexDirection:'column',maxWidth:isFullscreen?1300:'100%',width:'100%',margin:'0 auto',position:'relative'}}>
                <MultiGame lang={lang} onBack={()=>setMode('menu')} sfx={sfx} onCardPlayed={handleCardDiscovered}/>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}
