'use client'
/* share_button_v1: Web Share API + clipboard fallback, UTM-tagged */
import { useState } from 'react'
import { useLang } from './LangProvider'

function t3(lang, uk, en, ja, fr) {  /* fr_local_t3_v1 */
  if (lang === 'en') return en
  if (lang === 'ja') return ja
  if (lang === 'fr') return fr !== undefined ? fr : en
  return uk
}

export default function ShareButton() {
  const { lang } = useLang()
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = window.location.origin + window.location.pathname + '?utm_source=share&utm_medium=button'
    const title = document.title
    if (navigator.share) {
      try { await navigator.share({ title, url }) } catch (e) { /* skasovano - ok */ }
    } else {
      try {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {}
    }
  }

  return (
    <button onClick={share} className="share-btn">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
      {copied
        ? t3(lang, '\u0421\u043a\u043e\u043f\u0456\u0439\u043e\u0432\u0430\u043d\u043e!', 'Copied!', '\u30b3\u30d4\u30fc\u6e08\u307f!', 'Copié !')
        : t3(lang, '\u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044c', 'Share', '\u5171\u6709', 'Partager')}
    </button>
  )
}

/* fr_batch4b_v1 */
