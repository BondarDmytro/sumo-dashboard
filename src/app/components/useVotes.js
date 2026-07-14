'use client'
/* votes_v1: narodne holosuvannia "khto vizme yusho". RTDB: votes/{bashoId}/{rikishiId} - votesMinus/... */
import { useState, useEffect, useCallback } from 'react'
import { ref, onValue, runTransaction } from 'firebase/database'
import { db } from '../lib/firebase'
import { currentBashoId } from '../lib/bashoCalendar'

const LS_KEY = () => `dohyo_vote_${currentBashoId()}`

export function useVotes() {
  const [votes, setVotes] = useState({})     // {rikishiId: net}
  const [total, setTotal] = useState(0)
  const [myVote, setMyVote] = useState(null) // rikishiId | null

  useEffect(() => {
    try { setMyVote(localStorage.getItem(LS_KEY()) ? Number(localStorage.getItem(LS_KEY())) : null) } catch {}
    const bashoId = currentBashoId()
    let plus = {}, minus = {}
    const recompute = () => {
      const net = {}
      let t = 0
      for (const [id, v] of Object.entries(plus)) {
        const n = (v || 0) - (minus[id] || 0)
        if (n > 0) { net[id] = n; t += n }
      }
      setVotes(net); setTotal(t)
    }
    const u1 = onValue(ref(db, `votes/${bashoId}`), s => { plus = s.val() || {}; recompute() })
    const u2 = onValue(ref(db, `votesMinus/${bashoId}`), s => { minus = s.val() || {}; recompute() })
    return () => { u1(); u2() }
  }, [])

  const vote = useCallback(async (rikishiId) => {
    const id = Number(rikishiId)
    const bashoId = currentBashoId()
    const prev = (() => { try { return localStorage.getItem(LS_KEY()) ? Number(localStorage.getItem(LS_KEY())) : null } catch { return null } })()
    if (prev === id) return  // vzhe za noho
    try {
      if (prev != null) await runTransaction(ref(db, `votesMinus/${bashoId}/${prev}`), v => (v || 0) + 1)
      await runTransaction(ref(db, `votes/${bashoId}/${id}`), v => (v || 0) + 1)
      try { localStorage.setItem(LS_KEY(), String(id)) } catch {}
      setMyVote(id)
    } catch (e) { console.error('[vote]', e) }
  }, [])

  return { votes, total, myVote, vote }
}
