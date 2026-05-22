'use client'

import { useBios } from './BiosProvider'

export default function FlagName({ id, name, size = '0.95rem' }) {
  const bios = useBios()
  const bio = bios[String(id)]
  const flag = bio?.country?.flag || '🇯🇵'
  const country = bio?.country?.name || 'Японія'

  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:5}}>
      <span title={country} style={{fontSize:'1rem',lineHeight:1,flexShrink:0}}>{flag}</span>
      <span style={{fontSize:size,fontWeight:700}}>{name}</span>
    </span>
  )
}