'use client'
/* feedback_button_v1: anonimnyi zvorotnii zviazok -> RTDB feedback/ */
import { useState } from 'react'
import { db } from '../lib/firebase'
import { ref, push } from 'firebase/database'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja) {
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  return uk
}

const RATE_KEY = 'fb_last_sent'
const RATE_MS = 2 * 60 * 1000

export default function FeedbackButton() {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)
  const [msg, setMsg] = useState('')
  const [email, setEmail] = useState('')
  const [hp, setHp] = useState('')
  const [state, setState] = useState('idle') // idle | sending | done | error | ratelimit

  async function send() {
    if (!msg.trim() || hp) return
    const last = Number(localStorage.getItem(RATE_KEY) || 0)
    if (Date.now() - last < RATE_MS) { setState('ratelimit'); return }
    setState('sending')
    try {
      await push(ref(db, 'feedback'), {
        msg: msg.trim().slice(0, 2000),
        email: email.trim().slice(0, 200) || null,
        page: window.location.pathname + window.location.search,
        lang,
        ua: navigator.userAgent.slice(0, 300),
        vw: window.innerWidth,
        ts: Date.now(),
        source: 'dashboard',
      })
      localStorage.setItem(RATE_KEY, String(Date.now()))
      setState('done')
      setMsg(''); setEmail('')
      setTimeout(() => { setOpen(false); setState('idle') }, 2200)
    } catch (e) {
      setState('error')
    }
  }

  return (
    <>
      <button onClick={() => setOpen(o => !o)} aria-label="Feedback" className="fb-btn">{'\u{1F4AC}'}</button>
      {open && (
        <div className="fb-modal">
          <div className="fb-head">
            <span>{t3(lang, '\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0456\u0439 \u0437\u0432\u02bc\u044f\u0437\u043e\u043a', 'Feedback', '\u30d5\u30a3\u30fc\u30c9\u30d0\u30c3\u30af')}</span>
            <button onClick={() => setOpen(false)} className="fb-close">{'\u00d7'}</button>
          </div>
          {state === 'done' ? (
            <div className="fb-done">{t3(lang, '\u0414\u044f\u043a\u0443\u0454\u043c\u043e! \u{1F64F}', 'Thank you! \u{1F64F}', '\u3042\u308a\u304c\u3068\u3046\uff01\u{1F64F}')}</div>
          ) : (
            <>
              <textarea className="fb-text" rows={4} maxLength={2000} value={msg} onChange={e => setMsg(e.target.value)}
                placeholder={t3(lang, '\u0412\u0430\u0448\u0435 \u043f\u043e\u0432\u0456\u0434\u043e\u043c\u043b\u0435\u043d\u043d\u044f (\u0430\u043d\u043e\u043d\u0456\u043c\u043d\u043e)...', 'Your message (anonymous)...', '\u30e1\u30c3\u30bb\u30fc\u30b8\uff08\u533f\u540d\uff09...')} />
              <input className="fb-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder={t3(lang, 'Email (\u044f\u043a\u0449\u043e \u0445\u043e\u0447\u0435\u0442\u0435 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u0434\u044c)', 'Email (optional, for reply)', '\u30e1\u30fc\u30eb\uff08\u4efb\u610f\uff09')} />
              <input type="text" value={hp} onChange={e => setHp(e.target.value)} className="fb-hp" tabIndex={-1} autoComplete="off" />
              {state === 'ratelimit' && <div className="fb-note">{t3(lang, '\u0417\u0430\u0447\u0435\u043a\u0430\u0439\u0442\u0435 \u0445\u0432\u0438\u043b\u0438\u043d\u043a\u0443 \u043f\u0435\u0440\u0435\u0434 \u043d\u0430\u0441\u0442\u0443\u043f\u043d\u0438\u043c', 'Please wait a minute before sending again', '\u5c11\u3057\u5f85\u3063\u3066\u304b\u3089\u9001\u4fe1\u3057\u3066\u304f\u3060\u3055\u3044')}</div>}
              {state === 'error' && <div className="fb-note">{t3(lang, '\u041f\u043e\u043c\u0438\u043b\u043a\u0430. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0449\u0435 \u0440\u0430\u0437', 'Error. Please try again', '\u30a8\u30e9\u30fc\u3002\u3082\u3046\u4e00\u5ea6\u304a\u8a66\u3057\u304f\u3060\u3055\u3044')}</div>}
              <button onClick={send} disabled={!msg.trim() || state === 'sending'} className="fb-send">
                {state === 'sending' ? '...' : t3(lang, '\u041d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438', 'Send', '\u9001\u4fe1')}
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}
