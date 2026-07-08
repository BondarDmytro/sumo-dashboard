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
      <a href="https://discord.gg/5GnbthARv" target="_blank" rel="noopener" aria-label="Discord" className="fb-btn fb-discord">{/* discord_btn_v1 */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#b8860b"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
      </a>
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
