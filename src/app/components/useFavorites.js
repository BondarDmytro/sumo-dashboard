'use client'
/* favorites_v1: ulubleni rikishi v localStorage, kros-komponentna reaktyvnist cherez 'favchange' */
import { useState, useEffect, useCallback } from 'react'

const KEY = 'dohyo_fav_rikishi'
const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]').map(Number) } catch { return [] }
}

export function useFavorites() {
  const [favs, setFavs] = useState([])
  useEffect(() => {
    setFavs(read())
    const h = () => setFavs(read())
    window.addEventListener('favchange', h)
    window.addEventListener('storage', h)  // synk mizh vkladkamy
    return () => { window.removeEventListener('favchange', h); window.removeEventListener('storage', h) }
  }, [])
  const toggle = useCallback((id) => {
    const n = Number(id)
    const cur = read()
    const next = cur.includes(n) ? cur.filter(x => x !== n) : [...cur, n]
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
    window.dispatchEvent(new Event('favchange'))
  }, [])
  const isFav = useCallback((id) => favs.includes(Number(id)), [favs])
  return { favs, toggle, isFav }
}
