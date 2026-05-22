'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const BiosContext = createContext({})

export function BiosProvider({ children }) {
  const [bios, setBios] = useState({})

  useEffect(() => {
    fetch('/api/bios')
      .then(r => r.json())
      .then(d => setBios(d))
      .catch(() => {})
  }, [])

  return (
    <BiosContext.Provider value={bios}>
      {children}
    </BiosContext.Provider>
  )
}

export function useBios() {
  return useContext(BiosContext)
}

export function RikishiFlag({ id, name }) {
  const bios = useBios()
  const bio = bios[id]
  if (!bio) return <span>{name}</span>
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
      <span title={bio.country.name}>{bio.country.flag}</span>
      {name}
    </span>
  )
}