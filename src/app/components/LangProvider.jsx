'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations, defaultLang } from '../i18n'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(defaultLang)

  useEffect(() => {
    const saved = localStorage.getItem('lang')
    if (saved && translations[saved]) setLang(saved)
  }, [])

  const setLanguage = (l) => {
    setLang(l)
    localStorage.setItem('lang', l)
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