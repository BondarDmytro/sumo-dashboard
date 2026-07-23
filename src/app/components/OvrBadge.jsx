'use client'
/* ovr_badge_v1: kompaktna plashka Dohyo Rating dlia turnirnykh tablyts */
import eloData from '../lib/eloRatings.json'

const tierColor = (ovr) => ovr >= 90 ? '#c0392b' : ovr >= 75 ? '#7d3c98' : ovr >= 60 ? '#1a4a7a' : ovr >= 40 ? '#1a6b5c' : '#5a544a'

export default function OvrBadge({ id, size = 'sm' }) {
  const e = eloData.ratings[String(id)]
  if (!e || e.bouts === 0) return null
  const fs = size === 'sm' ? '0.52rem' : size === 'lg' ? '0.8rem' : '0.62rem'  /* ovr_badge_v2_lg */
  return (
    <span title={'Dohyo Rating'} style={{fontFamily:'monospace',fontSize:fs,fontWeight:800,color:'#fff',background:tierColor(e.ovr),padding: size === 'lg' ? '2px 8px' : '1px 4px',borderRadius:2,whiteSpace:'nowrap'}}>
      {e.ovr}
    </span>
  )
}
