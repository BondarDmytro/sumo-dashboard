import { db } from './firebase'
import { ref, update, increment } from 'firebase/database'

function getSessionKey(game) {
  return `sumo_analytics_${game}`
}

export async function trackGameLaunch(game) {
  try {
    const sessionKey = getSessionKey(game)
    const isNewSession = !sessionStorage.getItem(sessionKey)
    if (isNewSession) sessionStorage.setItem(sessionKey, '1')
    const now = new Date().toISOString()
    const updates = {
      [`analytics/games/${game}/totalLaunches`]: increment(1),
      [`analytics/games/${game}/lastPlayed`]: now,
    }
    if (isNewSession) {
      updates[`analytics/games/${game}/uniqueSessions`] = increment(1)
    }
    await update(ref(db), updates)
  } catch (e) { console.error('trackGameLaunch error:', e) }
}

export async function trackClashMode(mode) {
  try {
    const field = mode === 'cpu' ? 'cpuLaunches' : 'multiLaunches'
    await update(ref(db), {
      [`analytics/games/sumoClash/${field}`]: increment(1),
    })
  } catch (e) { console.error('trackClashMode error:', e) }
}
