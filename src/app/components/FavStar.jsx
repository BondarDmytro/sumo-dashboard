'use client'
/* favorites_v1: zirochka-toggle */
import { useFavorites } from './useFavorites'

export default function FavStar({ id, size = 18 }) {
  const { isFav, toggle } = useFavorites()
  const fav = isFav(id)
  return (
    <button
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggle(id) }}
      title={fav ? 'Прибрати з улюблених' : 'Додати в улюблені'}
      style={{background:'transparent',border:'none',cursor:'pointer',padding:2,lineHeight:1,
        fontSize:size,color:fav ? '#b8860b' : '#8a8a8a',transition:'color .15s, transform .15s'}}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >{fav ? '\u2605' : '\u2606'}</button>
  )
}
