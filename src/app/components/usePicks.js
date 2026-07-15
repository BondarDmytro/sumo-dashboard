'use client'
/* pickem_v1: shchodenni prohnozy boiv - khuk */
import { useState, useEffect, useCallback } from 'react'
import { ref, onValue, set } from 'firebase/database'
import { db } from '../lib/firebase'

function myUid() {
  let u = localStorage.getItem('dohyo_pickem_uid')
  if (!u) {
    u = (crypto.randomUUID ? crypto.randomUUID() : 'u' + Date.now() + Math.random().toString(36).slice(2, 8))
    localStorage.setItem('dohyo_pickem_uid', u)
  }
  return u
}

/* Dedlain fiksatsii: 14:00 JST dnia boiv = 05:00 UTC */
export function pickDeadlineUtcMs(bashoStartUtcMs, day) {
  return bashoStartUtcMs + (day - 1) * 86400000 + 5 * 3600000
}

export function usePicks(bashoId, day) {
  const [uid, setUid] = useState(null)
  const [myPicks, setMyPicks] = useState(null)     // {matchNo: rikishiId} | null = loading
  const [allPicks, setAllPicks] = useState(null)   // {uid: {matchNo: rikishiId}}

  useEffect(() => { setUid(myUid()) }, [])

  useEffect(() => {
    if (!bashoId || !day) return
    const r = ref(db, 'picks/' + bashoId + '/' + day)
    const off = onValue(r, snap => {
      const v = snap.val() || {}
      setAllPicks(v)
      setMyPicks(uid ? (v[uid] || {}) : {})
    }, () => { setAllPicks({}); setMyPicks({}) })
    return () => off()
  }, [bashoId, day, uid])

  const submit = useCallback(async (picks) => {
    // picks: {matchNo: rikishiId}; zapys lyshe v porozhni klityny (rules: !data.exists())
    if (!uid) return { ok: false, err: 'no uid' }
    const entries = Object.entries(picks)
    if (!entries.length) return { ok: false, err: 'empty' }
    try {
      await Promise.all(entries.map(([matchNo, rid]) =>
        set(ref(db, 'picks/' + bashoId + '/' + day + '/' + uid + '/' + matchNo), Number(rid))
      ))
      return { ok: true }
    } catch (e) {
      return { ok: false, err: String(e) }
    }
  }, [uid, bashoId, day])

  return { uid, myPicks, allPicks, submit }
}
