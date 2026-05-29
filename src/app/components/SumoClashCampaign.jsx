'use client'
import { useState, useEffect, useRef } from 'react'
import { db } from '../lib/firebase'
import { ref, get, update } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const CAMPAIGN_LEVELS = [
  {
    id: 1, name: 'Маегашіра', nameEn: 'Maegashira', emoji: '🟤',
    bossHp: 30, bossArmor: 0, reward: 100, starReward: 20,
    desc: 'Новачок дохьо. Тільки маєгашіра.',
    descEn: 'A dohyo newcomer. Maegashira only.',
    cpuDeckFilter: c => c.type==='rikishi'?c.rank==='Maegashira':c.type==='heal'&&c.heal<=5,
    playerDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi'].includes(c.rank):true,
    cpuHpMax: 30,
  },
  {
    id: 2, name: 'Комусубі', nameEn: 'Komusubi', emoji: '🔵',
    bossHp: 35, bossArmor: 0, reward: 150, starReward: 25,
    desc: 'Сходинка до сан\'яку. Маєгашіра + Комусубі.',
    descEn: 'A step toward sanyaku.',
    cpuDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi'].includes(c.rank):['heal','armor'].includes(c.type)&&(c.heal||0)<=5&&(c.armor||0)<=5,
    playerDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi','Sekiwake'].includes(c.rank):true,
    cpuHpMax: 35,
  },
  {
    id: 3, name: 'Секіваке', nameEn: 'Sekiwake', emoji: '🟣',
    bossHp: 40, bossArmor: 5, reward: 200, starReward: 30,
    desc: 'Сан\'яку. До Секіваке включно.',
    descEn: 'Sanyaku. Up to Sekiwake.',
    cpuDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi','Sekiwake'].includes(c.rank):['heal','armor','strike'].includes(c.type)&&(c.damage||0)<=5,
    playerDeckFilter: () => true,
    cpuHpMax: 40,
  },
  {
    id: 4, name: 'Озекі', nameEn: 'Ozeki', emoji: '🟢',
    bossHp: 45, bossArmor: 0, reward: 300, starReward: 40,
    desc: 'Майже вершина. До Озекі включно.',
    descEn: 'Near the top. Up to Ozeki.',
    cpuDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi','Sekiwake','Ozeki'].includes(c.rank):true,
    playerDeckFilter: () => true,
    cpuHpMax: 45,
  },
  {
    id: 5, name: 'Йокодзуна', nameEn: 'Yokozuna', emoji: '🟡',
    bossHp: 60, bossArmor: 10, reward: 500, starReward: 50,
    desc: 'БОС. Повна колода. +10 броні на старті.',
    descEn: 'BOSS. Full deck. +10 armor.',
    isBoss: true,
    cpuDeckFilter: () => true,
    playerDeckFilter: () => true,
    cpuHpMax: 60,
  },
]

const SHOP_ITEMS = [
  { id:'atk_boost',     type:'permanent', label:'+1 ATK',         labelEn:'+1 ATK',        desc:'Обрана карта +1 ATK (вся кампанія)', descEn:'Selected card +1 ATK (whole campaign)', price:150, emoji:'⚔️' },
  { id:'def_boost',     type:'permanent', label:'+1 DEF',         labelEn:'+1 DEF',        desc:'Обрана карта +1 DEF (вся кампанія)', descEn:'Selected card +1 DEF (whole campaign)', price:150, emoji:'🛡'  },
  { id:'battle_spirit', type:'temp',      label:'Бойовий дух',    labelEn:'Battle Spirit', desc:'Всі ATK +2 на 1 бій',                descEn:'All ATK +2 for 1 fight',               price:80,  emoji:'🔥' },
  { id:'iron_stance',   type:'temp',      label:'Залізна стійка', labelEn:'Iron Stance',   desc:'Починаєш бій з +5 броні',            descEn:'Start fight with +5 armor',            price:100, emoji:'🦾' },
  { id:'water_shield',  type:'temp',      label:'Водний щит',     labelEn:'Water Shield',  desc:'Перша шкода блокується',             descEn:'First damage blocked',                 price:130, emoji:'💧' },
]

// ── Підказки власника крамниці ────────────────────────────────
const SHOPKEEPER_TIPS = [
  {
    uk:  '⚔️ +1 ATK залишається назавжди. Кожен бій ця карта б\'є сильніше — найкращий вклад.',
    en:  '⚔️ +1 ATK lasts forever. That card hits harder every fight — the best investment.',
  },
  {
    uk:  '🛡 +1 DEF назавжди. Броня вирішує долю бою. Один захист може врятувати від смерті.',
    en:  '🛡 +1 DEF forever. Armor decides battles. One defense can save you from death.',
  },
  {
    uk:  '🔥 Бойовий дух — всього 80 монет, а +2 ATK на весь бій. Дешево і сердито.',
    en:  '🔥 Battle Spirit — only 80 coins, but +2 ATK for the whole fight. Cheap and deadly.',
  },
  {
    uk:  '🦾 Залізна стійка дає +5 броні на старті бою. Боси ненавидять це.',
    en:  '🦾 Iron Stance gives +5 armor at the start of a fight. Bosses hate this.',
  },
  {
    uk:  '💧 Водний щит блокує першу шкоду. Незамінний проти сильного тачіаю Йокодзуни.',
    en:  '💧 Water Shield blocks the first damage. Essential against the Yokozuna\'s tachiai.',
  },
  {
    uk:  '📜 Пораджу мудрість: три зірки — це перемога з більш ніж 66% HP. Лікуйся вчасно.',
    en:  '📜 A word of wisdom: three stars means winning with over 66% HP. Heal wisely.',
  },
  {
    uk:  '🪙 Йокодзуна починає з +10 броні. Запасись щитом і духом перед тим як іти.',
    en:  '🪙 The Yokozuna starts with +10 armor. Stock up on shields before you go.',
  },
  {
    uk:  '⚖️ Постійний буст чи тимчасовий? Для довгої кампанії — назавжди. Для одного бою — дух.',
    en:  '⚖️ Permanent boost or temporary? For the long campaign — forever. For one fight — spirit.',
  },
]

const BG_W = 1586
const BG_H = 992

const SHOP_SLOT_POS_PX = {
  atk_boost:     { cx: 640,  cy: 375, iconSize: 165 },
  def_boost:     { cx: 948,  cy: 375, iconSize: 165 },
  battle_spirit: { cx: 565,  cy: 585, iconSize: 135 },
  iron_stance:   { cx: 794,  cy: 590, iconSize: 135 },
  water_shield:  { cx: 1019, cy: 587, iconSize: 135 },
}

const UPGRADE_IMAGES = {
  atk_boost:      '/images/upgrades/upgrade-atk.webp',
  def_boost:      '/images/upgrades/upgrade-def.webp',
  battle_spirit:  '/images/upgrades/upgrade-spirit.webp',
  iron_stance:    '/images/upgrades/upgrade-stance.webp',
  water_shield:   '/images/upgrades/upgrade-water.webp',
}

const ENVELOPE_REWARDS = [50,75,100,125,150]

const RIKISHI_SAMPLE = [
  { id:'Y1e', rank:'Yokozuna', rankShort:'Y1e', atk:10, def:7, color:'#b8860b' },
  { id:'Y1w', rank:'Yokozuna', rankShort:'Y1w', atk:9,  def:8, color:'#b8860b' },
  { id:'O1e', rank:'Ozeki',    rankShort:'O1e', atk:8,  def:6, color:'#8b1a1a' },
  { id:'O1w', rank:'Ozeki',    rankShort:'O1w', atk:7,  def:7, color:'#8b1a1a' },
  { id:'S1e', rank:'Sekiwake', rankShort:'S1e', atk:7,  def:5, color:'#1a4a7a' },
  { id:'S1w', rank:'Sekiwake', rankShort:'S1w', atk:6,  def:6, color:'#1a4a7a' },
  { id:'K1e', rank:'Komusubi', rankShort:'K1e', atk:6,  def:4, color:'#1f7a3a' },
  { id:'K1w', rank:'Komusubi', rankShort:'K1w', atk:5,  def:5, color:'#1f7a3a' },
]

let _authPromise = null
function getAnonymousUid() {
  if (!_authPromise) {
    _authPromise = new Promise(resolve => {
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

function calcStars(hp, maxHp) {
  const p = hp / maxHp
  return p > 0.66 ? 3 : p > 0.33 ? 2 : 1
}

const CAMP_ANIM = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=swap');
:root { --jp: 'Noto Serif JP', 'Hiragino Mincho ProN', serif; }
@keyframes campSlideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes campPop{0%{transform:scale(0.7);opacity:0}60%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
@keyframes starPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
@keyframes envelopePulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
@keyframes tipAppear{0%{opacity:0;transform:translateY(8px) scale(0.95)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes shopkeeperBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
`

function useComputedSlots(containerRef) {
  const [computed, setComputed] = useState({})
  useEffect(() => {
    function recalc() {
      const el = containerRef.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const containerAR = width / height
      const imageAR = BG_W / BG_H
      let scale, offsetX, offsetY
      if (containerAR > imageAR) {
        scale = width / BG_W; offsetX = 0
        offsetY = (height - BG_H * scale) / 2
      } else {
        scale = height / BG_H; offsetY = 0
        offsetX = (width - BG_W * scale) / 2
      }
      const result = {}
      for (const [id, slot] of Object.entries(SHOP_SLOT_POS_PX)) {
        result[id] = {
          left: Math.round(slot.cx * scale + offsetX),
          top:  Math.round(slot.cy * scale + offsetY),
          size: Math.round(slot.iconSize * scale),
        }
      }
      setComputed(result)
    }
    recalc()
    const ro = new ResizeObserver(recalc)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])
  return computed
}

function YokoinDisplay({ amount, large = false }) {
  const h = large ? 38 : 28
  const fs = large ? '1.35rem' : '1rem'
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,cursor:'default'}}>
      <img src="/images/icon-yokoin.webp" alt="yokoin"
        style={{height:h,width:'auto',filter:'drop-shadow(0 0 6px rgba(240,160,20,0.7))'}}
        onError={e=>{e.currentTarget.style.display='none'}}/>
      <span style={{fontFamily:'var(--jp)',fontSize:fs,fontWeight:900,color:'#f0c060',textShadow:'0 0 10px rgba(240,192,96,0.6), 0 1px 3px rgba(0,0,0,0.9)'}}>{amount}</span>
    </div>
  )
}

function StarsDisplay({ stars, animate }) {
  return (
    <div style={{display:'flex',gap:4}}>
      {[1,2,3].map(i => (
        <span key={i} style={{fontSize:'1.1rem',filter:i<=stars?'none':'grayscale(1) opacity(0.3)',animation:animate&&i<=stars?`starPop 0.4s ease ${i*0.15}s both`:undefined}}>⭐</span>
      ))}
    </div>
  )
}

function SlotItem({ item, pos, can, owned, lang, onBuy }) {
  const [hovered, setHovered] = useState(false)
  const t = (uk, en) => lang === 'en' ? en : uk
  const imgSrc = UPGRADE_IMAGES[item.id]
  return (
    <div onClick={can ? onBuy : undefined}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{position:'absolute',left:pos.left,top:pos.top,width:pos.size,transform:'translate(-50%, -50%)',cursor:can?'pointer':'default',zIndex:hovered?10:1,pointerEvents:'auto'}}>
      <div style={{position:'relative',width:'100%',transform:hovered&&can?'translateY(-8px) scale(1.1)':'none',transition:'transform 0.18s ease',filter:hovered&&can?'drop-shadow(0 10px 24px rgba(184,134,11,0.85)) brightness(1.1)':can?'drop-shadow(0 3px 10px rgba(0,0,0,0.8))':'grayscale(0.7) brightness(0.4)'}}>
        <img src={imgSrc} alt={lang==='en'?item.labelEn:item.label}
          style={{width:'100%',height:'auto',display:'block'}}
          onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex'}}/>
        <div style={{display:'none',width:'100%',aspectRatio:'1',background:'rgba(10,7,3,0.8)',border:'2px solid rgba(184,134,11,0.35)',borderRadius:8,alignItems:'center',justifyContent:'center',fontSize:`${pos.size*0.4}px`}}>{item.emoji}</div>
        {owned>0&&<div style={{position:'absolute',top:'4%',right:'4%',background:'rgba(46,204,113,0.95)',borderRadius:3,padding:'1px 5px',fontFamily:'var(--jp)',fontSize:`${Math.max(8,pos.size*0.09)}px`,fontWeight:700,color:'#fff',boxShadow:'0 1px 4px rgba(0,0,0,0.6)'}}>✓×{owned}</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,marginTop:`${Math.round(pos.size*0.07)}px`}}>
        <img src="/images/icon-yokoin.webp" alt="" style={{height:`${Math.max(20,pos.size*0.2)}px`,width:'auto',filter:'drop-shadow(0 1px 4px rgba(0,0,0,0.8))'}} onError={e=>e.currentTarget.style.display='none'}/>
        <span style={{fontFamily:'var(--jp)',fontSize:`${Math.max(18,pos.size*0.2)}px`,fontWeight:900,color:can?'#f0c060':'#5a4a30',textShadow:can?'0 0 8px rgba(240,192,96,0.5), 0 1px 3px rgba(0,0,0,0.9)':'0 1px 3px rgba(0,0,0,0.8)'}}>{item.price}</span>
      </div>
      {hovered&&(
        <div style={{position:'absolute',top:'calc(100% + 12px)',left:'50%',transform:'translateX(-50%)',background:'linear-gradient(160deg,#2a2218,#16110a)',border:'1px solid rgba(184,134,11,0.55)',borderRadius:6,padding:'0.45rem 0.65rem',minWidth:150,maxWidth:200,boxShadow:'0 8px 28px rgba(0,0,0,0.95)',pointerEvents:'none',zIndex:30,animation:'campPop 0.15s ease',whiteSpace:'normal'}}>
          <div style={{position:'absolute',top:-5,left:'50%',width:9,height:9,background:'#2a2218',borderTop:'1px solid rgba(184,134,11,0.55)',borderLeft:'1px solid rgba(184,134,11,0.55)',transform:'translateX(-50%) rotate(45deg)'}}/>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.68rem',fontWeight:700,color:'#f0c060',marginBottom:3}}>{item.emoji} {lang==='en'?item.labelEn:item.label}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.57rem',color:'rgba(255,255,255,0.65)',lineHeight:1.5}}>{lang==='en'?item.descEn:item.desc}</div>
          {item.type==='permanent'&&<div style={{fontFamily:'var(--jp)',fontSize:'0.5rem',color:'rgba(184,134,11,0.75)',marginTop:4,borderTop:'1px solid rgba(184,134,11,0.2)',paddingTop:3}}>{lang==='en'?'→ Select a rikishi card':'→ Оберіть карту рікіші'}</div>}
        </div>
      )}
    </div>
  )
}

// ── ShopkeeperTip — балон з підказкою ─────────────────────────
function ShopkeeperTip({ tip, lang, onClose }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [tip])

  return (
    <div onClick={onClose} style={{
      position: 'absolute',
      // Зліва від власника — він правіше від center, тому ставимо між центром і ним
      right: '22%',
      bottom: '55%',
      zIndex: 20,
      pointerEvents: 'auto',
      cursor: 'pointer',
      animation: 'tipAppear 0.3s cubic-bezier(.2,0,.2,1) both',
      maxWidth: 260,
    }}>
      {/* Тіло балона */}
      <div style={{
        background: 'linear-gradient(160deg, #2e2010, #1a1208)',
        border: '1.5px solid rgba(184,134,11,0.7)',
        borderRadius: 10,
        padding: '0.75rem 1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.9), 0 0 20px rgba(184,134,11,0.15)',
        position: 'relative',
      }}>
        {/* Декоративна лінія зверху */}
        <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.5),transparent)'}}/>

        {/* Заголовок */}
        <div style={{fontFamily:'var(--jp)',fontSize:'0.52rem',color:'#b8860b',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6,opacity:0.8}}>
          {t('Порада майстра', 'Master\'s advice')}
        </div>

        {/* Текст підказки */}
        <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,235,180,0.92)',lineHeight:1.7,fontWeight:400}}>
          {lang === 'en' ? tip.en : tip.uk}
        </div>

        {/* Підпис */}
        <div style={{fontFamily:'var(--jp)',fontSize:'0.48rem',color:'rgba(184,134,11,0.5)',marginTop:8,textAlign:'right',letterSpacing:'0.08em'}}>
          {t('натисни щоб закрити', 'tap to close')}
        </div>

        {/* Декоративна лінія знизу */}
        <div style={{position:'absolute',bottom:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,rgba(184,134,11,0.4),transparent)'}}/>
      </div>

      {/* Хвіст балона → вказує вправо на власника */}
      <div style={{
        position: 'absolute',
        right: -10,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: '10px solid rgba(184,134,11,0.7)',
      }}/>
      {/* Внутрішній хвіст */}
      <div style={{
        position: 'absolute',
        right: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        borderLeft: '9px solid #1a1208',
      }}/>
    </div>
  )
}

// ── CampaignMap ───────────────────────────────────────────────
function CampaignMap({ progress, yokoin, onSelectLevel, onOpenShop, onBack, onReset, lang }) {
  const t = (uk,en) => lang==='en'?en:uk
  const frameColors = { 1:'#6f6f6f', 2:'#1f7a3a', 3:'#1a4a7a', 4:'#8b1a1a', 5:'#b8860b' }
  const [confirmReset, setConfirmReset] = useState(false)
  const hasProgress = Object.keys(progress?.levels||{}).length > 0
  const dark = 'rgba(0,0,0,0.7)'
  const border = '1px solid rgba(255,255,255,0.12)'

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem',position:'relative',zIndex:1}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <button onClick={onBack} style={{background:dark,border,color:'rgba(255,255,255,0.8)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',padding:'5px 12px',borderRadius:4,fontWeight:600}}>
          ‹ {t('Назад','Back')}
        </button>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <YokoinDisplay amount={yokoin} large/>
          <div onClick={onOpenShop} style={{cursor:'pointer',transition:'all 0.18s'}}
            onMouseEnter={e=>e.currentTarget.style.filter='drop-shadow(0 0 16px rgba(184,134,11,0.8)) brightness(1.15)'}
            onMouseLeave={e=>e.currentTarget.style.filter='drop-shadow(0 0 8px rgba(184,134,11,0.5))'}>
            <img src="/images/btn-shop.webp" alt={t('Магазин','Shop')}
              style={{height:54,width:'auto',display:'block',filter:'drop-shadow(0 0 8px rgba(184,134,11,0.5))'}}
              onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='flex'}}/>
            <div style={{display:'none',alignItems:'center',gap:8,background:'linear-gradient(180deg,#2a2218,#1a1510)',border:'2px solid rgba(184,134,11,0.6)',color:'#f0c060',borderRadius:6,padding:'10px 20px',fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700}}>
              🏪 {t('Магазин','Shop')}
            </div>
          </div>
        </div>
        {hasProgress ? (
          <button onClick={()=>setConfirmReset(true)} style={{background:'rgba(180,30,20,0.18)',border:'1.5px solid rgba(220,50,40,0.6)',color:'#ff7060',borderRadius:5,padding:'6px 14px',fontFamily:'var(--jp)',fontSize:'0.68rem',cursor:'pointer',fontWeight:700,textShadow:'0 1px 4px rgba(0,0,0,0.8)',boxShadow:'0 0 8px rgba(200,40,30,0.2)',transition:'all 0.15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(200,40,30,0.32)';e.currentTarget.style.borderColor='rgba(255,80,60,0.8)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(180,30,20,0.18)';e.currentTarget.style.borderColor='rgba(220,50,40,0.6)'}}>
            ↺ {t('Почати з початку','Reset')}
          </button>
        ) : <div style={{width:120}}/>}
      </div>

      {confirmReset&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)'}}>
          <div style={{background:'#1a1710',border:'1px solid rgba(184,134,11,0.4)',borderRadius:8,padding:'1.5rem',maxWidth:320,width:'90%',textAlign:'center',animation:'campPop 0.2s ease'}}>
            <div style={{fontSize:'2rem',marginBottom:'0.5rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--jp)',fontSize:'1rem',fontWeight:700,color:'#f0c060',marginBottom:'0.5rem'}}>{t('Скинути прогрес?','Reset progress?')}</div>
            <div style={{fontFamily:'var(--jp)',fontSize:'0.65rem',color:'rgba(255,255,255,0.5)',lineHeight:1.6,marginBottom:'1.25rem'}}>
              {t('Весь прогрес кампанії та Йокоіни будуть видалені.','All campaign progress and Yokoin will be deleted.')}
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setConfirmReset(false)} style={{flex:1,padding:'0.7rem',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.7)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.75rem',cursor:'pointer',fontWeight:700}}>
                {t('Продовжити','Continue')}
              </button>
              <button onClick={()=>{setConfirmReset(false);onReset()}} style={{flex:1,padding:'0.7rem',background:'#c0392b',color:'#fff',border:'none',borderRadius:4,fontFamily:'var(--jp)',fontSize:'0.75rem',cursor:'pointer',fontWeight:700}}>
                {t('Скинути','Reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap',padding:'0.5rem 0'}}>
        {CAMPAIGN_LEVELS.map((level,idx) => {
          const lp = progress?.levels?.[level.id] || {}
          const isUnlocked = level.id===1 || progress?.levels?.[level.id-1]?.completed
          const isCompleted = lp.completed
          const stars = lp.stars || 0
          const frameColor = frameColors[level.id] || '#6f6f6f'
          return (
            <div key={level.id} onClick={isUnlocked?()=>onSelectLevel(level):undefined}
              style={{width:180,flexShrink:0,cursor:isUnlocked?'pointer':'default',opacity:isUnlocked?1:0.35,animation:`campSlideIn 0.3s ease ${idx*0.08}s both`,transition:'transform 0.18s, filter 0.18s'}}
              onMouseEnter={e=>{if(isUnlocked){e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.filter=`drop-shadow(0 12px 24px ${frameColor}99)`}}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.filter='none'}}>
              <div style={{borderRadius:12,overflow:'hidden',border:`3px solid ${isCompleted?'#f0c060':isUnlocked?frameColor:'#333'}`,boxShadow:isCompleted?`0 0 28px rgba(240,192,96,0.5)`:`0 4px 12px rgba(0,0,0,0.6)`,background:'#0d0d0d'}}>
                <div style={{height:230,position:'relative',overflow:'hidden'}}>
                  <img src={`/images/level-${level.id}.webp`} alt={level.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',position:'absolute',inset:0}} onError={e=>{e.currentTarget.style.display='none'}}/>
                  <div style={{width:'100%',height:'100%',background:`linear-gradient(160deg,${frameColor}44 0%,#111 100%)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:'4rem'}}>{level.emoji}</span>
                  </div>
                  {!isUnlocked&&<div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}><span style={{fontSize:'2.5rem'}}>🔒</span></div>}
                  {isCompleted&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,pointerEvents:'none'}}><div style={{background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'6px 12px',backdropFilter:'blur(4px)',border:'1px solid rgba(240,192,96,0.3)'}}><StarsDisplay stars={stars}/></div></div>}
                  {isUnlocked&&!isCompleted&&<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,pointerEvents:'none'}}><div style={{background:`${frameColor}cc`,borderRadius:20,padding:'6px 16px',border:`1px solid ${frameColor}`,backdropFilter:'blur(4px)'}}><span style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:700,color:'#fff'}}>▶ {t('Грати','Play')}</span></div></div>}
                </div>
                <div style={{background:level.isBoss?'linear-gradient(135deg,#2a0505,#130000)':`linear-gradient(135deg,${frameColor}22,#0d0d0d)`,padding:'8px 10px',borderTop:`1px solid ${frameColor}33`,display:'flex',justifyContent:'center',alignItems:'center'}}>
                  <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,210,80,0.8)'}}>🪙{level.reward} + ⭐{level.starReward}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Магазин ───────────────────────────────────────────────────
function Shop({ yokoin, boostedCards, tempBoosts, onBuy, onBack, lang }) {
  const t = (uk, en) => lang === 'en' ? en : uk
  const [selectingItem, setSelectingItem] = useState(null)
  const [msg, setMsg] = useState(null)
  const [tipIndex, setTipIndex] = useState(0)
  const [tipVisible, setTipVisible] = useState(false)
  const [shopkeeperHovered, setShopkeeperHovered] = useState(false)

  const areaRef = useRef(null)
  const computedSlots = useComputedSlots(areaRef)

  function showMsg(text, color = '#1a6b5c') {
    setMsg({ text, color })
    setTimeout(() => setMsg(null), 2500)
  }

  function handleBuy(item) {
    if (yokoin < item.price) { showMsg(t('Недостатньо Йокоінів!', 'Not enough Yokoin!'), '#c0392b'); return }
    if (item.type === 'permanent') setSelectingItem(item)
    else { onBuy(item, null); showMsg(`${item.emoji} ${lang === 'en' ? item.labelEn : item.label} ${t('придбано!', 'purchased!')}`) }
  }

  function handleShopkeeperClick() {
    if (tipVisible) {
      // Наступна підказка при повторному кліку
      setTipIndex(i => (i + 1) % SHOPKEEPER_TIPS.length)
    } else {
      setTipVisible(true)
    }
  }

  if (selectingItem) return (
    <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.8)', zIndex:0 }} />
      <div style={{ position:'relative', zIndex:1, height:'100%', overflowY:'auto', padding:'1.25rem', animation:'campSlideIn 0.25s ease' }}>
        <button onClick={() => setSelectingItem(null)} style={{ background:'rgba(0,0,0,0.6)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', fontFamily:'var(--jp)', fontSize:'0.72rem', cursor:'pointer', marginBottom:'1rem', padding:'4px 10px', borderRadius:4 }}>
          ‹ {t('Назад', 'Back')}
        </button>
        <div style={{ fontFamily:'var(--jp)', fontSize:'0.85rem', fontWeight:700, marginBottom:'0.5rem', color:'#f0c060' }}>
          {selectingItem.emoji} {t('Оберіть карту для бусту', 'Select card to boost')}
        </div>
        <div style={{ fontFamily:'var(--jp)', fontSize:'0.62rem', color:'rgba(255,255,255,0.4)', marginBottom:'1.25rem' }}>
          {lang === 'en' ? selectingItem.descEn : selectingItem.desc}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {RIKISHI_SAMPLE.map(card => {
            const boost = boostedCards?.find(b => b.cardId === card.id)
            return (
              <div key={card.id}
                onClick={() => { onBuy(selectingItem, card); showMsg(`${card.rankShort} ${t('отримав буст!', 'boosted!')}`); setSelectingItem(null) }}
                style={{ background:boost?'rgba(184,134,11,0.15)':'rgba(0,0,0,0.5)', border:`1px solid ${boost?'rgba(184,134,11,0.5)':'rgba(255,255,255,0.1)'}`, borderRadius:4, padding:'0.75rem 1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:card.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <span style={{ fontFamily:'var(--jp)', fontSize:'0.75rem', fontWeight:700, color:card.color }}>{card.rankShort}</span>
                  <span style={{ fontFamily:'var(--jp)', fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', marginLeft:8 }}>{card.rank}</span>
                </div>
                <div style={{ display:'flex', gap:12, fontFamily:'var(--jp)', fontSize:'0.72rem' }}>
                  <span style={{ color:'#e74c3c' }}>⚔ {card.atk}{boost?.atk?<span style={{color:'#f0c060'}}>+{boost.atk}</span>:null}</span>
                  <span style={{ color:'#3498db' }}>🛡 {card.def}{boost?.def?<span style={{color:'#f0c060'}}>+{boost.def}</span>:null}</span>
                </div>
                {boost && <span style={{ color:'#f0c060', fontSize:'0.7rem' }}>✓</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
      <div ref={areaRef} style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none' }}>

        {/* Слоти товарів */}
        {SHOP_ITEMS.map(item => {
          const pos = computedSlots[item.id]
          if (!pos) return null
          return (
            <SlotItem key={item.id} item={item} pos={pos}
              can={yokoin >= item.price} owned={tempBoosts?.[item.id] || 0}
              lang={lang} onBuy={() => handleBuy(item)}/>
          )
        })}

        {/* Балон підказки — з'являється зліва від власника */}
        {tipVisible && (
          <ShopkeeperTip
            tip={SHOPKEEPER_TIPS[tipIndex]}
            lang={lang}
            onClose={() => setTipVisible(false)}
          />
        )}

        {/* Власник крамниці — клікабельний */}
        <div
          onClick={handleShopkeeperClick}
          onMouseEnter={() => setShopkeeperHovered(true)}
          onMouseLeave={() => setShopkeeperHovered(false)}
          style={{
            position: 'absolute',
            bottom: '-26%',
            right: '-10%',
            height: '115%',
            width: 'auto',
            zIndex: tipVisible ? 5 : 2,
            pointerEvents: 'auto',
            cursor: 'pointer',
            // Підказка-іконка над головою якщо ще не клікали
            display: 'flex',
            alignItems: 'flex-start',
          }}
        >
          <img
            src="/images/shopkeeper.webp"
            alt=""
            style={{
              height: '100%',
              width: 'auto',
              display: 'block',
              filter: [
                shopkeeperHovered ? 'brightness(0.95)' : 'brightness(0.8)',
                'saturate(0.8)',
                'sepia(0.18)',
                'drop-shadow(-10px 0 20px rgba(100,50,0,0.5))',
                'drop-shadow(0 12px 32px rgba(0,0,0,0.95))',
              ].join(' '),
              opacity: 1,
              WebkitMaskImage: 'linear-gradient(to bottom, black 45%, rgba(0,0,0,0.6) 100%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black 45%, rgba(0,0,0,0.6) 100%, transparent 100%)',
              transition: 'filter 0.25s ease',
              animation: shopkeeperHovered ? 'shopkeeperBob 1.5s ease infinite' : undefined,
            }}
            onError={e => e.currentTarget.parentElement.style.display = 'none'}
          />
        </div>
      </div>

      {/* Хедер */}
      <div style={{flexShrink:0,position:'relative',zIndex:3,display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.5rem 1rem',background:'linear-gradient(180deg,rgba(6,4,2,0.96) 0%,rgba(6,4,2,0.55) 100%)',borderBottom:'1px solid rgba(184,134,11,0.2)',backdropFilter:'blur(6px)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={onBack} style={{background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.14)',color:'rgba(255,255,255,0.85)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',padding:'5px 12px',borderRadius:4,fontWeight:600}}>
            ‹ {t('Назад','Back')}
          </button>
          <img src="/images/btn-shop.webp" alt={t('Магазин','Shop')} style={{height:34,width:'auto',filter:'drop-shadow(0 0 8px rgba(184,134,11,0.55))'}}
            onError={e=>{e.currentTarget.style.display='none';e.currentTarget.nextSibling.style.display='block'}}/>
          <div style={{display:'none',fontFamily:'var(--jp)',fontSize:'0.95rem',fontWeight:800,color:'#f0c060'}}>🏪 {t('Магазин','Shop')}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          {msg&&<div style={{background:`${msg.color}22`,border:`1px solid ${msg.color}`,borderRadius:4,padding:'4px 12px',fontFamily:'var(--jp)',fontSize:'0.68rem',color:msg.color,animation:'campPop 0.3s ease'}}>{msg.text}</div>}
          <YokoinDisplay amount={yokoin}/>
        </div>
      </div>

      <div style={{flex:1}}/>

      {boostedCards?.length > 0 && (
        <div style={{flexShrink:0,position:'relative',zIndex:3,display:'flex',gap:12,alignItems:'center',flexWrap:'wrap',padding:'0.35rem 1rem',background:'linear-gradient(180deg,rgba(6,4,2,0.55) 0%,rgba(6,4,2,0.92) 100%)',borderTop:'1px solid rgba(184,134,11,0.18)',backdropFilter:'blur(4px)'}}>
          <span style={{fontFamily:'var(--jp)',fontSize:'0.52rem',color:'#b8860b',textTransform:'uppercase',letterSpacing:'0.1em',flexShrink:0}}>{t('Активні бусти','Active boosts')}</span>
          {boostedCards.map(b => (
            <div key={b.cardId} style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'rgba(255,255,255,0.75)',background:'rgba(184,134,11,0.12)',border:'1px solid rgba(184,134,11,0.28)',borderRadius:3,padding:'2px 8px'}}>
              {b.cardId}{b.atk?` +${b.atk}⚔`:''}{b.def?` +${b.def}🛡`:''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CampaignResult({ won, stars, yokoinEarned, envelopes, level, onContinue, onRetry, lang }) {
  const t = (uk,en) => lang==='en'?en:uk
  const [step, setStep] = useState(0)
  const [openedEnvelope, setOpenedEnvelope] = useState(null)
  useEffect(()=>{
    const t1=setTimeout(()=>setStep(1),200)
    const t2=setTimeout(()=>setStep(2),700)
    const t3=setTimeout(()=>setStep(3),1200)
    return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}
  },[])
  const winColor = won ? '#f0c060' : '#e74c3c'
  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.5rem',textAlign:'center',animation:'campSlideIn 0.3s ease',position:'relative',zIndex:1}}>
      <div style={{fontSize:'3.5rem',animation:'campPop 0.5s ease',marginBottom:'0.75rem'}}>{won?(level.isBoss?'🏆':'✅'):'💪'}</div>
      <div style={{fontFamily:'var(--jp)',fontSize:'1.6rem',fontWeight:900,color:winColor,marginBottom:'0.4rem',textShadow:`0 0 20px ${winColor}66`}}>
        {won?t('Перемога!','Victory!'):t('Маке-коші','Make-koshi')}
      </div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,255,255,0.45)',marginBottom:'1.5rem'}}>
        {won?t('Рівень пройдено','Level cleared'):t('Суперник переміг','Opponent wins')}
      </div>
      {won&&(<>
        <div style={{opacity:step>=1?1:0,transition:'opacity 0.4s',marginBottom:'1.25rem'}}><StarsDisplay stars={stars} animate={step>=1}/></div>
        <div style={{opacity:step>=2?1:0,transform:step>=2?'none':'translateY(10px)',transition:'all 0.4s',background:'rgba(184,134,11,0.12)',border:'1px solid rgba(184,134,11,0.35)',borderRadius:6,padding:'1rem',marginBottom:'1rem'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,255,255,0.4)',marginBottom:6}}>{t('Нагорода','Reward')}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'1.8rem',fontWeight:900,color:'#f0c060',textShadow:'0 0 12px rgba(240,192,96,0.5)'}}>+{yokoinEarned} 🪙</div>
        </div>
        {envelopes>0&&(
          <div style={{opacity:step>=3?1:0,transition:'opacity 0.4s',marginBottom:'1rem'}}>
            <div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'rgba(255,255,255,0.4)',marginBottom:8}}>📨 {t('Конверти','Envelopes')}: {envelopes}</div>
            {!openedEnvelope?(
              <button onClick={()=>setOpenedEnvelope(ENVELOPE_REWARDS[Math.floor(Math.random()*ENVELOPE_REWARDS.length)])} style={{background:'rgba(26,74,122,0.3)',color:'#7ec8f0',border:'1px solid #1a4a7a',borderRadius:4,padding:'8px 20px',fontFamily:'var(--jp)',fontSize:'0.75rem',cursor:'pointer',fontWeight:700,animation:'envelopePulse 1s ease infinite'}}>
                📨 {t('Відкрити','Open')}
              </button>
            ):(
              <div style={{background:'rgba(26,74,122,0.2)',border:'1px solid #1a4a7a',borderRadius:4,padding:'0.75rem',animation:'campPop 0.4s ease'}}>
                <div style={{fontFamily:'var(--jp)',fontSize:'1.3rem',fontWeight:800,color:'#2ecc71'}}>+{openedEnvelope} 🪙</div>
              </div>
            )}
          </div>
        )}
      </>)}
      <div style={{display:'flex',gap:10,marginTop:'1.5rem'}}>
        {!won&&<button onClick={onRetry} style={{flex:1,padding:'0.8rem',background:'rgba(184,134,11,0.2)',color:'#f0c060',border:'1px solid rgba(184,134,11,0.4)',borderRadius:6,fontFamily:'var(--jp)',fontSize:'0.82rem',cursor:'pointer',fontWeight:700}}>🔄 {t('Знову','Retry')}</button>}
        <button onClick={()=>onContinue(openedEnvelope||0)} style={{flex:1,padding:'0.8rem',background:won?'rgba(184,134,11,0.2)':'rgba(255,255,255,0.08)',color:won?'#f0c060':'rgba(255,255,255,0.7)',border:`1px solid ${won?'rgba(184,134,11,0.4)':'rgba(255,255,255,0.15)'}`,borderRadius:6,fontFamily:'var(--jp)',fontSize:'0.82rem',cursor:'pointer',fontWeight:700}}>
          {won?t('Далі ›','Continue ›'):t('В меню','Menu')}
        </button>
      </div>
    </div>
  )
}

export default function SumoClashCampaign({ onBack, lang, GameBattle }) {
  const t = (uk,en) => lang==='en'?en:uk
  const [screen, setScreen] = useState('map')
  const [uid, setUid] = useState(null)
  const [yokoin, setYokoin] = useState(0)
  const [progress, setProgress] = useState({levels:{}})
  const [boostedCards, setBoostedCards] = useState([])
  const [tempBoosts, setTempBoosts] = useState({})
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [battleResult, setBattleResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    getAnonymousUid().then(async id=>{
      setUid(id)
      if (id) {
        const data = await loadUserData(id)
        if (data) {
          setYokoin(data.yokoin||0)
          setProgress(data.progress||{levels:{}})
          if (data.boostedCards) setBoostedCards(Array.isArray(data.boostedCards)?data.boostedCards:[data.boostedCards])
          else if (data.boostedCard) setBoostedCards([data.boostedCard])
          setTempBoosts(data.tempBoosts||{})
        }
      }
      setLoading(false)
    })
  },[])

  async function handleBuy(item, selectedCard) {
    if (yokoin < item.price) return
    const newYokoin = yokoin - item.price
    setYokoin(newYokoin)
    let updates = {yokoin: newYokoin}
    if (item.type==='permanent' && selectedCard) {
      const existing = boostedCards.find(b=>b.cardId===selectedCard.id) || {cardId:selectedCard.id,atk:0,def:0}
      const boost = {...existing, atk:item.id==='atk_boost'?(existing.atk||0)+1:(existing.atk||0), def:item.id==='def_boost'?(existing.def||0)+1:(existing.def||0)}
      const newBoosts = [...boostedCards.filter(b=>b.cardId!==selectedCard.id), boost]
      setBoostedCards(newBoosts); updates.boostedCards = newBoosts
    } else if (item.type==='temp') {
      const newBoosts = {...tempBoosts,[item.id]:(tempBoosts[item.id]||0)+1}
      setTempBoosts(newBoosts); updates.tempBoosts = newBoosts
    }
    if (uid) await saveUserData(uid, updates)
  }

  async function handleBattleWin(playerHp, playerMaxHp, envelopesEarned) {
    const stars = calcStars(playerHp, playerMaxHp)
    const yokoinEarned = selectedLevel.reward + stars * selectedLevel.starReward
    const newProgress = {...progress,levels:{...progress.levels,[selectedLevel.id]:{completed:true,stars:Math.max(stars,progress.levels?.[selectedLevel.id]?.stars||0)}}}
    setProgress(newProgress)
    const newYokoin = yokoin + yokoinEarned
    setYokoin(newYokoin)
    setBattleResult({won:true,stars,yokoinEarned,envelopes:envelopesEarned})
    setScreen('result')
    if (uid) await saveUserData(uid, {yokoin:newYokoin,progress:newProgress})
  }

  async function handleBattleLose() {
    setBattleResult({won:false,stars:0,yokoinEarned:0,envelopes:0})
    setScreen('result')
  }

  async function handleResultContinue(bonusYokoin) {
    if (bonusYokoin > 0) {
      const newYokoin = yokoin + bonusYokoin
      setYokoin(newYokoin)
      if (uid) await saveUserData(uid, {yokoin:newYokoin})
    }
    setTempBoosts({})
    if (uid) await saveUserData(uid, {tempBoosts:{}})
    setScreen('map')
  }

  async function handleReset() {
    setYokoin(0); setProgress({levels:{}}); setBoostedCards([]); setTempBoosts({})
    if (uid) await saveUserData(uid, {yokoin:0, progress:{levels:{}}, boostedCards:[], tempBoosts:{}})
  }

  if (loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.75rem',color:'rgba(255,255,255,0.4)'}}>⏳ {t('Завантаження...','Loading...')}</div>
    </div>
  )

  return (
    <>
      <style>{CAMP_ANIM}</style>
      {screen==='map' && (
        <CampaignMap progress={progress} yokoin={yokoin}
          onSelectLevel={l=>{setSelectedLevel(l);setScreen('battle')}}
          onOpenShop={()=>setScreen('shop')}
          onBack={onBack} onReset={handleReset} lang={lang}/>
      )}
      {screen==='shop' && (
        <div style={{flex:1,display:'flex',flexDirection:'column',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',inset:0,backgroundImage:'url(/images/bg-shop.webp)',backgroundSize:'cover',backgroundPosition:'center',pointerEvents:'none'}}/>
          <Shop yokoin={yokoin} boostedCards={boostedCards} tempBoosts={tempBoosts}
            onBuy={handleBuy} onBack={()=>setScreen('map')} lang={lang}/>
        </div>
      )}
      {screen==='battle' && selectedLevel && (
        <GameBattle level={selectedLevel} boostedCards={boostedCards} tempBoosts={tempBoosts}
          onWin={handleBattleWin} onLose={handleBattleLose} onBack={()=>setScreen('map')} lang={lang}/>
      )}
      {screen==='result' && battleResult && (
        <CampaignResult won={battleResult.won} stars={battleResult.stars}
          yokoinEarned={battleResult.yokoinEarned} envelopes={battleResult.envelopes}
          level={selectedLevel} onContinue={handleResultContinue}
          onRetry={()=>setScreen('battle')} lang={lang}/>
      )}
    </>
  )
}

export { CAMPAIGN_LEVELS, ENVELOPE_REWARDS }
