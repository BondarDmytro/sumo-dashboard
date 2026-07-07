'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, defaultLang } from '../i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(defaultLang)

  useEffect(() => {
    /* lang_path_v1: pathname-префікс /en|/ja|/uk має НАЙВИЩИЙ пріоритет */
    try {
      const seg = window.location.pathname.split('/')[1]
      if (['uk','en','ja'].includes(seg)) {
        setLang(seg)
        localStorage.setItem('lang', seg)
        return
      }
    } catch (e) {}
    /* lang_query_v1: ?lang= з лендінга має пріоритет над збереженою; невідома мова -> en */
    try {
      const q = new URLSearchParams(window.location.search).get('lang')
      if (q) {
        const l = ['uk','en','ja'].includes(q) ? q : 'en'
        setLang(l)
        localStorage.setItem('lang', l)
        return
      }
    } catch (e) {}
    const saved = localStorage.getItem('lang')
    if (saved && translations[saved]) setLang(saved)
  }, [])

  const setLanguage = (l) => {
    setLang(l)
    try { localStorage.setItem('lang', l) } catch (e) {}
    /* lang_path_v1: на мовному шляху — навігація між префіксами */
    try {
      const parts = window.location.pathname.split('/')
      if (['uk','en','ja'].includes(parts[1])) {
        parts[1] = l
        window.location.pathname = parts.join('/')
      }
    } catch (e) {}
  }

  const t = translations[lang] || translations[defaultLang]

  return (
    <LangContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) return { lang: defaultLang, t: translations[defaultLang], setLanguage: () => {} }
  return ctx
}