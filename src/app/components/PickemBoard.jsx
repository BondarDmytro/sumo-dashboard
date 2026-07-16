'use client'
/* pickem_board_v1: liderbord prohnoziv za basho - modalka */
import { useState, useEffect } from 'react'
import { ref, onValue, set } from 'firebase/database' /* pickem_nicks_v1 */
import { db } from '../lib/firebase'
import { t3 } from '../i18n'
import { useLang } from './LangProvider'

export default function PickemBoard({ bashoId, currentDay, myUid, open, onClose, inline = false }) { /* pickem_board_tab_v1 */
  const { lang } = useLang()
  const [allDays, setAllDays] = useState(null)   // {day: {uid: {matchNo: rid}}}
  const [winners, setWinners] = useState(null)   // {day: {matchNo: winnerId}}

  useEffect(() => {
    if ((!open && !inline) || !bashoId) return
    const r = ref(db, 'picks/' + bashoId)
    const off = onValue(r, snap => setAllDays(snap.val() || {}), () => setAllDays({}))
    return () => off()
  }, [open, bashoId])

  useEffect(() => {
    if ((!open && !inline) || winners) return
    const days = Array.from({ length: Math.min(currentDay, 15) }, (_, i) => i + 1)
    Promise.all(days.map(d =>
      fetch('/api/torikumi?day=' + d + '&division=Makuuchi')
        .then(r => r.json())
        .then(ms => [d, Object.fromEntries((ms || []).filter(m => m.winnerId).map(m => [m.matchNo, Number(m.winnerId)]))])
        .catch(() => [d, {}])
    )).then(entries => setWinners(Object.fromEntries(entries)))
  }, [open, currentDay, winners])

  /* pickem_nicks_v1: niky hravtsiv */
  const [nicks, setNicks] = useState({})
  const [nickDraft, setNickDraft] = useState('')
  const [nickSaved, setNickSaved] = useState(false)
  useEffect(() => {
    if (!open && !inline) return
    const r = ref(db, 'nicks')
    const off = onValue(r, snap => setNicks(snap.val() || {}), () => {})
    return () => off()
  }, [open, inline])
  useEffect(() => { try { setNickDraft(localStorage.getItem('dohyo_pickem_nick') || '') } catch {} }, [])
  const saveNick = () => {
    const n = nickDraft.trim().slice(0, 20)
    if (!n || !myUid) return
    set(ref(db, 'nicks/' + myUid), n)
      .then(() => { try { localStorage.setItem('dohyo_pickem_nick', n) } catch {}; setNickSaved(true); setTimeout(() => setNickSaved(false), 2000) })
      .catch(() => {})
  }

  if (!open && !inline) return null

  let rows = []
  let crowd = { hits: 0, total: 0 }
  if (allDays && winners) {
    const byUid = {}
    Object.entries(allDays).forEach(([day, users]) => {
      const w = winners[day] || {}
      const consensus = {}
      Object.values(users || {}).forEach(picks => {
        Object.entries(picks || {}).forEach(([mn, rid]) => {
          consensus[mn] = consensus[mn] || {}
          consensus[mn][rid] = (consensus[mn][rid] || 0) + 1
        })
      })
      Object.entries(consensus).forEach(([mn, votes]) => {
        if (!w[mn]) return
        const top = Object.entries(votes).sort((a, b) => b[1] - a[1])[0]
        if (top) { crowd.total++; if (Number(top[0]) === w[mn]) crowd.hits++ }
      })
      Object.entries(users || {}).forEach(([uid, picks]) => {
        byUid[uid] = byUid[uid] || { hits: 0, total: 0 }
        Object.entries(picks || {}).forEach(([mn, rid]) => {
          if (!w[mn]) return
          byUid[uid].total++
          if (Number(rid) === w[mn]) byUid[uid].hits++
        })
      })
    })
    rows = Object.entries(byUid)
      .map(([uid, s]) => ({ uid, ...s, me: uid === myUid }))
      .sort((a, b) => b.hits - a.hits || a.total - b.total)
  }
  const myIdx = rows.findIndex(r => r.me)
  const shown = rows.slice(0, 10)
  const guest = (uid) => t3(lang, '\u0413\u0456\u0441\u0442\u044c', 'Guest', '\u30b2\u30b9\u30c8') + '-' + String(uid).replace(/-/g, '').slice(-4).toUpperCase()  /* pickem_guest_i18n_v1 */
  const pct = (h, t) => t > 0 ? Math.round(h / t * 100) + '%' : '\u2014'  /* pickem_pct_v1 */

  const card = (
      <div onClick={e => e.stopPropagation()} style={{background:'var(--card)',border:'1px solid rgba(184,134,11,0.4)',borderRadius:6,width: inline ? '100%' : 'min(440px, 100%)',maxWidth: inline ? 520 : undefined,maxHeight: inline ? undefined : '80vh',display:'flex',flexDirection:'column',boxShadow: inline ? 'none' : '0 16px 48px rgba(0,0,0,0.4)'}}>
        <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
          <div style={{flex:1,fontFamily:'monospace',fontSize:'0.78rem',letterSpacing:'0.14em',textTransform:'uppercase',color:'var(--ink)',fontWeight:700}}>
            🎯 {t3(lang, 'Прогноз-челендж', 'Pick challenge', '予想チャレンジ')}
          </div>
          {!inline && <button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:18,color:'var(--mid)',padding:4}}>{'\u2715'}</button>}
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center',padding:'10px 16px 0',fontFamily:'monospace'}}>{/* pickem_nicks_v1 */}
          <input value={nickDraft} onChange={e => setNickDraft(e.target.value)} maxLength={20}
            placeholder={t3(lang, 'Твоє ім\u2019я в лідерборді', 'Your leaderboard name', 'ランキング表示名')}
            style={{flex:1,padding:'6px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:2,color:'var(--ink)',fontFamily:'monospace',fontSize:'0.72rem',outline:'none'}} />
          <button onClick={saveNick} disabled={!myUid || !nickDraft.trim()}
            style={{padding:'6px 12px',fontFamily:'monospace',fontSize:'0.68rem',letterSpacing:'0.05em',cursor:'pointer',borderRadius:2,border:'1px solid rgba(184,134,11,0.5)',background: nickSaved ? '#1a6b5c' : '#8a6a00',color:'#fff'}}>
            {nickSaved ? '\u2713' : t3(lang, 'Зберегти', 'Save', '保存')}
          </button>
        </div>
        <div style={{overflowY:'auto',padding:'10px 16px 16px',fontFamily:'monospace',fontSize:'0.72rem'}}>
          {(!allDays || !winners) && <div style={{padding:20,textAlign:'center',color:'var(--mid)'}}>{t3(lang, 'Завантаження...', 'Loading...', '読み込み中...')}</div>}
          {allDays && winners && !rows.length && <div style={{padding:20,textAlign:'center',color:'var(--mid)'}}>{t3(lang, 'Ще нема зафіксованих прогнозів', 'No picks locked yet', 'まだ予想がありません')}</div>}
          {rows.length > 0 && (
            <>
              {shown.map((r, i) => (
                <div key={r.uid} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',borderBottom:'1px solid var(--border)',background: r.me ? 'rgba(184,134,11,0.12)' : 'transparent',borderRadius:2}}>
                  <span style={{width:24,color: i === 0 ? '#b8860b' : 'var(--mid)',fontWeight: i === 0 ? 800 : 400}}>{i + 1}.</span>
                  <span style={{flex:1,fontWeight: r.me ? 800 : 500,color:'var(--ink)'}}>{r.me ? '\u2605 ' + (nicks[myUid] || t3(lang, 'ти', 'you', 'あなた')) : (nicks[r.uid] || guest(r.uid))}</span>
                  <span style={{color:'#b8860b',fontWeight:700}}>{r.hits}/{r.total}</span>
                  <span style={{width:44,textAlign:'right',color:'var(--mid)',fontSize:'0.66rem'}}>{pct(r.hits, r.total)}</span>
                </div>
              ))}
              {myIdx >= 10 && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',marginTop:6,background:'rgba(184,134,11,0.12)',borderRadius:2}}>
                  <span style={{width:24,color:'var(--mid)'}}>{myIdx + 1}.</span>
                  <span style={{flex:1,fontWeight:800,color:'var(--ink)'}}>{'\u2605 '}{nicks[myUid] || t3(lang, 'ти', 'you', 'あなた')}</span>
                  <span style={{color:'#b8860b',fontWeight:700}}>{rows[myIdx].hits}/{rows[myIdx].total}</span>
                  <span style={{width:44,textAlign:'right',color:'var(--mid)',fontSize:'0.66rem'}}>{pct(rows[myIdx].hits, rows[myIdx].total)}</span>
                </div>
              )}
              {crowd.total > 0 && (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px',marginTop:6,borderTop:'1px dashed var(--border)',color:'var(--mid)',fontStyle:'italic'}}>
                  <span style={{width:24}}>{'\ud83e\udd1d'}</span>
                  <span style={{flex:1}}>{t3(lang, 'Народ (консенсус)', 'The crowd (consensus)', 'みんなの予想')}</span>
                  <span style={{fontWeight:700}}>{crowd.hits}/{crowd.total}</span>
                  <span style={{width:44,textAlign:'right',fontSize:'0.66rem'}}>{pct(crowd.hits, crowd.total)}</span>
                </div>
              )}
              <div style={{marginTop:10,color:'var(--mid)',fontSize:'0.62rem',textAlign:'center'}}>
                {t3(lang, 'Гравців', 'Players', '参加者')}: {rows.length} · {t3(lang, 'день', 'day', '日目')} {currentDay}/15
              </div>
            </>
          )}
        </div>
      </div>
  )
  if (inline) return card
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:200,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      {card}
    </div>
  )
}
