'use client'
import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { ref, get, update } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const CAMPAIGN_LEVELS = [
  {
    id: 1, name: 'Маегашіра', nameEn: 'Maegashira', emoji: '🟤',
    bossHp: 30, bossArmor: 0, reward: 100, starReward: 20,
    desc: 'Новачок дохьо. Тільки маєгашіра.',
    descEn: 'A dohyo newcomer. Maegashira only.',
    // CPU: тільки Маєгашіра + хіл
    cpuDeckFilter: c => c.type==='rikishi'?c.rank==='Maegashira':c.type==='heal'&&c.heal<=5,
    playerDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi'].includes(c.rank):true,
    cpuHpMax: 30,
  },
  {
    id: 2, name: 'Комусубі', nameEn: 'Komusubi', emoji: '🔵',
    bossHp: 35, bossArmor: 0, reward: 150, starReward: 25,
    desc: 'Сходинка до сан\'яку. Маєгашіра + Комусубі.',
    descEn: 'A step toward sanyaku.',
    // CPU: Маєгашіра + Комусубі (без Саньяку і вище)
    cpuDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi'].includes(c.rank):['heal','armor'].includes(c.type)&&(c.heal||0)<=5&&(c.armor||0)<=5,
    playerDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi','Sekiwake'].includes(c.rank):true,
    cpuHpMax: 35,
  },
  {
    id: 3, name: 'Секіваке', nameEn: 'Sekiwake', emoji: '🟣',
    bossHp: 40, bossArmor: 5, reward: 200, starReward: 30,
    desc: 'Сан\'яку. До Секіваке включно.',
    descEn: 'Sanyaku. Up to Sekiwake.',
    // CPU: до Секіваке (без Озекі і Йокодзуна)
    cpuDeckFilter: c => c.type==='rikishi'?['Maegashira','Komusubi','Sekiwake'].includes(c.rank):['heal','armor','strike'].includes(c.type)&&(c.damage||0)<=5,
    playerDeckFilter: () => true,
    cpuHpMax: 40,
  },
  {
    id: 4, name: 'Озекі', nameEn: 'Ozeki', emoji: '🟢',
    bossHp: 45, bossArmor: 0, reward: 300, starReward: 40,
    desc: 'Майже вершина. До Озекі включно.',
    descEn: 'Near the top. Up to Ozeki.',
    // CPU: до Озекі (без Йокодзуна)
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
  { id:'atk_boost', type:'permanent', label:'+1 ATK', labelEn:'+1 ATK', desc:'Обрана карта +1 ATK (вся кампанія)', descEn:'Selected card +1 ATK (whole campaign)', price:150, emoji:'⚔️' },
  { id:'def_boost', type:'permanent', label:'+1 DEF', labelEn:'+1 DEF', desc:'Обрана карта +1 DEF (вся кампанія)', descEn:'Selected card +1 DEF (whole campaign)', price:150, emoji:'🛡' },
  { id:'battle_spirit', type:'temp', label:'Бойовий дух', labelEn:'Battle Spirit', desc:'Всі ATK +2 на 1 бій', descEn:'All ATK +2 for 1 fight', price:80, emoji:'🔥' },
  { id:'iron_stance', type:'temp', label:'Залізна стійка', labelEn:'Iron Stance', desc:'Починаєш бій з +5 броні', descEn:'Start fight with +5 armor', price:100, emoji:'🦾' },
  { id:'water_shield', type:'temp', label:'Водний щит', labelEn:'Water Shield', desc:'Перша шкода блокується', descEn:'First damage blocked', price:130, emoji:'💧' },
]

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
@keyframes cardHover{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
`

function YokoinDisplay({ amount }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(184,134,11,0.15)',border:'1px solid rgba(184,134,11,0.4)',borderRadius:4,padding:'4px 10px'}}>
      <span style={{fontSize:'0.9rem'}}>🪙</span>
      <span style={{fontFamily:'var(--jp)',fontSize:'0.9rem',fontWeight:800,color:'#b8860b'}}>{amount}</span>
      <span style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'#b8860b'}}>¥</span>
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

// ── Горизонтальні картки рівнів ──────────────────────────────
function CampaignMap({ progress, yokoin, onSelectLevel, onOpenShop, onBack, onReset, lang }) {
  const t = (uk,en) => lang==='en'?en:uk
  const frameColors = { 1:'#6f6f6f', 2:'#1f7a3a', 3:'#1a4a7a', 4:'#8b1a1a', 5:'#b8860b' }
  const [confirmReset, setConfirmReset] = useState(false)
  const hasProgress = Object.keys(progress?.levels||{}).length > 0
  const dark = 'rgba(0,0,0,0.7)'
  const border = '1px solid rgba(255,255,255,0.12)'

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem',position:'relative',zIndex:1}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <button onClick={onBack} style={{background:dark,border,color:'rgba(255,255,255,0.8)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',padding:'5px 12px',borderRadius:4,fontWeight:600}}>
          ‹ {t('Назад','Back')}
        </button>
        {hasProgress&&(
          <button onClick={()=>setConfirmReset(true)} style={{background:'rgba(192,57,43,0.2)',border:'1px solid rgba(192,57,43,0.5)',color:'#e74c3c',borderRadius:4,padding:'5px 12px',fontFamily:'var(--jp)',fontSize:'0.62rem',cursor:'pointer',fontWeight:600}}>
            ↺ {t('Почати з початку','Reset')}
          </button>
        )}
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

      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontFamily:'var(--jp)',fontSize:'1.2rem',fontWeight:800,color:'#f0c060',textShadow:'0 0 16px rgba(240,192,96,0.5)'}}>⚔️ {t('Кампанія','Campaign')}</div>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'rgba(255,255,255,0.45)',marginTop:2}}>{t('Дорога до дохьо','Road to the Dohyo')}</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <YokoinDisplay amount={yokoin}/>
          <button onClick={onOpenShop} style={{background:'rgba(184,134,11,0.2)',border:'1px solid rgba(184,134,11,0.5)',color:'#f0c060',borderRadius:4,padding:'6px 14px',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',fontWeight:700}}>
            🏪 {t('Магазин','Shop')}
          </button>
        </div>
      </div>

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
                  <img src={`/images/level-${level.id}.png`} alt={level.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block',position:'absolute',inset:0}} onError={e=>{e.currentTarget.style.display='none'}}/>
                  <div style={{width:'100%',height:'100%',background:`linear-gradient(160deg,${frameColor}44 0%,#111 100%)`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:'4rem'}}>{level.emoji}</span>
                  </div>
                  {!isUnlocked&&(
                    <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:3}}>
                      <span style={{fontSize:'2.5rem'}}>🔒</span>
                    </div>
                  )}
                  {isCompleted&&(
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,pointerEvents:'none'}}>
                      <div style={{background:'rgba(0,0,0,0.6)',borderRadius:20,padding:'6px 12px',backdropFilter:'blur(4px)',border:'1px solid rgba(240,192,96,0.3)'}}>
                        <StarsDisplay stars={stars}/>
                      </div>
                    </div>
                  )}
                  {isUnlocked&&!isCompleted&&(
                    <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,pointerEvents:'none'}}>
                      <div style={{background:`${frameColor}cc`,borderRadius:20,padding:'6px 16px',border:`1px solid ${frameColor}`,backdropFilter:'blur(4px)'}}>
                        <span style={{fontFamily:'var(--jp)',fontSize:'0.72rem',fontWeight:700,color:'#fff'}}>▶ {t('Грати','Play')}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{background:level.isBoss?'linear-gradient(135deg,#2a0505,#130000)':`linear-gradient(135deg,${frameColor}22,#0d0d0d)`,padding:'8px 10px',borderTop:`1px solid ${frameColor}33`,display:'flex',justifyContent:'center',alignItems:'center'}}>
                  <div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'rgba(255,210,80,0.8)'}}>🪙{level.reward}¥ + ⭐{level.starReward}¥</div>
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
function Shop({ yokoin, boostedCards, tempBoosts, onBuy, onBack, lang }) {
  const t = (uk,en) => lang==='en'?en:uk
  const [selectingItem, setSelectingItem] = useState(null)
  const [msg, setMsg] = useState(null)

  function showMsg(text, color='#1a6b5c') {
    setMsg({text,color})
    setTimeout(()=>setMsg(null),2000)
  }

  function handleBuy(item) {
    if (yokoin < item.price) { showMsg(t('Недостатньо Йокоінів!','Not enough Yokoin!'), '#c0392b'); return }
    if (item.type==='permanent') setSelectingItem(item)
    else { onBuy(item,null); showMsg(`${item.emoji} ${lang==='en'?item.labelEn:item.label} ${t('придбано!','purchased!')}`) }
  }

  if (selectingItem) return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem',animation:'campSlideIn 0.25s ease',position:'relative',zIndex:1}}>
      <button onClick={()=>setSelectingItem(null)} style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',marginBottom:'1rem',padding:'4px 10px',borderRadius:4}}>
        ‹ {t('Назад','Back')}
      </button>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.85rem',fontWeight:700,marginBottom:'0.5rem',color:'#f0c060'}}>
        {selectingItem.emoji} {t('Оберіть карту для бусту','Select card to boost')}
      </div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.62rem',color:'rgba(255,255,255,0.4)',marginBottom:'1.25rem'}}>
        {lang==='en'?selectingItem.descEn:selectingItem.desc}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:6}}>
        {RIKISHI_SAMPLE.map(card => {
          const boost = boostedCards?.find(b=>b.cardId===card.id)
          return (
            <div key={card.id} onClick={()=>{onBuy(selectingItem,card);showMsg(`${card.rankShort} ${t('отримав буст!','boosted!')}`);setSelectingItem(null)}} style={{background:boost?'rgba(184,134,11,0.15)':'rgba(0,0,0,0.5)',border:`1px solid ${boost?'rgba(184,134,11,0.5)':'rgba(255,255,255,0.1)'}`,borderRadius:4,padding:'0.75rem 1rem',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:card.color,flexShrink:0}}/>
              <div style={{flex:1}}>
                <span style={{fontFamily:'var(--jp)',fontSize:'0.75rem',fontWeight:700,color:card.color}}>{card.rankShort}</span>
                <span style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,255,255,0.4)',marginLeft:8}}>{card.rank}</span>
              </div>
              <div style={{display:'flex',gap:12,fontFamily:'var(--jp)',fontSize:'0.72rem'}}>
                <span style={{color:'#e74c3c'}}>⚔ {card.atk}{boost?.atk?<span style={{color:'#f0c060'}}>+{boost.atk}</span>:null}</span>
                <span style={{color:'#3498db'}}>🛡 {card.def}{boost?.def?<span style={{color:'#f0c060'}}>+{boost.def}</span>:null}</span>
              </div>
              {boost&&<span style={{color:'#f0c060',fontSize:'0.7rem'}}>✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={{flex:1,overflowY:'auto',padding:'1.25rem',animation:'campSlideIn 0.25s ease',position:'relative',zIndex:1}}>
      <button onClick={onBack} style={{background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.12)',color:'rgba(255,255,255,0.7)',fontFamily:'var(--jp)',fontSize:'0.72rem',cursor:'pointer',marginBottom:'1rem',padding:'4px 10px',borderRadius:4}}>
        ‹ {t('Назад','Back')}
      </button>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div style={{fontFamily:'var(--jp)',fontSize:'1.1rem',fontWeight:800,color:'#f0c060'}}>🏪 {t('Магазин','Shop')}</div>
        <YokoinDisplay amount={yokoin}/>
      </div>
      {msg&&<div style={{background:`${msg.color}22`,border:`1px solid ${msg.color}`,borderRadius:4,padding:'0.5rem 1rem',marginBottom:'1rem',fontFamily:'var(--jp)',fontSize:'0.72rem',color:msg.color,textAlign:'center',animation:'campPop 0.3s ease'}}>{msg.text}</div>}
      <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.75rem'}}>{t('Постійні бусти','Permanent boosts')}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:'1.5rem'}}>
        {SHOP_ITEMS.filter(i=>i.type==='permanent').map(item=>(
          <ShopItem key={item.id} item={item} yokoin={yokoin} onBuy={()=>handleBuy(item)} lang={lang}/>
        ))}
      </div>
      <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:'0.75rem'}}>{t('Тимчасові бусти (на 1 бій)','Temporary boosts (1 fight)')}</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {SHOP_ITEMS.filter(i=>i.type==='temp').map(item=>(
          <ShopItem key={item.id} item={item} yokoin={yokoin} onBuy={()=>handleBuy(item)} lang={lang} owned={tempBoosts?.[item.id]||0}/>
        ))}
      </div>
      {boostedCards?.length>0&&(
        <div style={{marginTop:'1.5rem',background:'rgba(184,134,11,0.1)',border:'1px solid rgba(184,134,11,0.3)',borderRadius:4,padding:'0.75rem 1rem'}}>
          <div style={{fontFamily:'var(--jp)',fontSize:'0.6rem',color:'#f0c060',textTransform:'uppercase',marginBottom:6}}>{t('Активні бусти','Active boosts')}</div>
          {boostedCards.map(b=>(
            <div key={b.cardId} style={{fontFamily:'var(--jp)',fontSize:'0.72rem',color:'rgba(255,255,255,0.7)',marginBottom:2}}>
              {b.cardId} — {b.atk?`+${b.atk} ATK`:''} {b.def?`+${b.def} DEF`:''}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ShopItem({ item, yokoin, onBuy, lang, owned }) {
  const t = (uk,en) => lang==='en'?en:uk
  const can = yokoin >= item.price
  return (
    <div style={{background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'0.75rem 1rem',display:'flex',alignItems:'center',gap:12}}>
      <span style={{fontSize:'1.3rem',flexShrink:0}}>{item.emoji}</span>
      <div style={{flex:1}}>
        <div style={{fontWeight:700,fontSize:'0.82rem',marginBottom:2,color:'rgba(255,255,255,0.85)'}}>{lang==='en'?item.labelEn:item.label}</div>
        <div style={{fontFamily:'var(--jp)',fontSize:'0.58rem',color:'rgba(255,255,255,0.4)'}}>{lang==='en'?item.descEn:item.desc}</div>
        {owned>0&&<div style={{fontFamily:'var(--jp)',fontSize:'0.55rem',color:'#2ecc71',marginTop:2}}>✓ {t('Є:','Owned:')} {owned}</div>}
      </div>
      <button onClick={onBuy} disabled={!can} style={{background:can?'rgba(184,134,11,0.25)':'rgba(255,255,255,0.05)',color:can?'#f0c060':'rgba(255,255,255,0.25)',border:`1px solid ${can?'rgba(184,134,11,0.5)':'rgba(255,255,255,0.08)'}`,borderRadius:4,padding:'5px 12px',fontFamily:'var(--jp)',fontSize:'0.68rem',cursor:can?'pointer':'default',fontWeight:700,flexShrink:0,whiteSpace:'nowrap'}}>
        🪙 {item.price}¥
      </button>
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
    setYokoin(0)
    setProgress({levels:{}})
    setBoostedCards([])
    setTempBoosts({})
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
      {screen==='map'&&<CampaignMap progress={progress} yokoin={yokoin} onSelectLevel={l=>{setSelectedLevel(l);setScreen('battle')}} onOpenShop={()=>setScreen('shop')} onBack={onBack} onReset={handleReset} lang={lang}/>}
      {screen==='shop'&&<Shop yokoin={yokoin} boostedCards={boostedCards} tempBoosts={tempBoosts} onBuy={handleBuy} onBack={()=>setScreen('map')} lang={lang}/>}
      {screen==='battle'&&selectedLevel&&<GameBattle level={selectedLevel} boostedCards={boostedCards} tempBoosts={tempBoosts} onWin={handleBattleWin} onLose={handleBattleLose} onBack={()=>setScreen('map')} lang={lang}/>}
      {screen==='result'&&battleResult&&<CampaignResult won={battleResult.won} stars={battleResult.stars} yokoinEarned={battleResult.yokoinEarned} envelopes={battleResult.envelopes} level={selectedLevel} onContinue={handleResultContinue} onRetry={()=>setScreen('battle')} lang={lang}/>}
    </>
  )
}

export { CAMPAIGN_LEVELS, ENVELOPE_REWARDS }
