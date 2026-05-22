const BASHO_ID = '202505'
const SUMO_API = 'https://sumo-api.com/api'

async function fetchBanzuke() {
  const res = await fetch(`${SUMO_API}/basho/${BASHO_ID}/banzuke/Makuuchi`, {
    next: { revalidate: 300 }
  })
  return res.json()
}

async function fetchDay(day) {
  const res = await fetch(`${SUMO_API}/basho/${BASHO_ID}/torikumi/Makuuchi/${day}`, {
    next: { revalidate: 300 }
  })
  return res.json()
}

function calcYushoChance(rikishi, currentDay) {
  const wins = rikishi.wins
  const losses = rikishi.losses
  const remaining = 15 - currentDay

  if (losses >= 5) return 0

  const maxWins = wins + remaining
  const rankValue = rikishi.rankValue || 500

  // Базовий шанс на основі рекорду
  let base = 0
  if (losses === 0) base = 85
  else if (losses === 1) base = 55
  else if (losses === 2) base = 25
  else if (losses === 3) base = 8
  else if (losses === 4) base = 2

  // Коефіцієнт ранку (вища позиція = більший шанс)
  const rankBonus = rankValue <= 103 ? 1.3 :
                    rankValue <= 107 ? 1.15 :
                    rankValue <= 115 ? 1.05 : 1.0

  // Штраф якщо максимум перемог недостатній
  if (maxWins < 12) base *= 0.3
  if (maxWins < 13) base *= 0.6

  return Math.round(base * rankBonus * 10) / 10
}

function getRankLabel(rank) {
  if (rank.includes('Yokozuna')) return rank.replace('Yokozuna ', 'Y').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Ozeki')) return rank.replace('Ozeki ', 'O').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Sekiwake')) return rank.replace('Sekiwake ', 'S').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Komusubi')) return rank.replace('Komusubi ', 'K').replace(' East', 'e').replace(' West', 'w')
  if (rank.includes('Maegashira')) {
    const num = rank.match(/\d+/)?.[0] || ''
    const side = rank.includes('East') ? 'e' : 'w'
    return `M${num}${side}`
  }
  return rank
}

function getStatus(rikishi) {
  if (rikishi.absent) return 'kyujo'
  if (rikishi.losses <= 2) return 'lead'
  if (rikishi.losses <= 3) return 'chase'
  return 'out'
}

export async function GET() {
  try {
    const banzuke = await fetchBanzuke()

    // Об'єднуємо East і West
    const allRikishi = [...(banzuke.east || []), ...(banzuke.west || [])]

    // Визначаємо поточний день з даних
    const sampleRecord = allRikishi[0]?.record || []
    const currentDay = sampleRecord.filter(r => r.result !== 'absent' && r.result !== 'fusen').length

    // Рахуємо перемоги/поразки
    const processed = allRikishi.map(r => {
      const record = r.record || []
      const wins = record.filter(m => m.result === 'win').length
      const losses = record.filter(m => m.result === 'loss').length
      const absent = record.filter(m => m.result === 'absent' || m.result === 'fusen-loss').length > 3

      return {
        id: r.rikishiID,
        name: r.shikonaEn,
        nameJp: r.shikonaJp,
        rank: getRankLabel(r.rank),
        rankFull: r.rank,
        rankValue: r.rankValue,
        wins,
        losses,
        absent,
        status: getStatus({ wins, losses, absent }),
        yushoChance: 0,
        record: record.map((m, i) => ({
          day: i + 1,
          result: m.result,
          opponent: m.opponentShikonaEn,
          opponentId: m.opponentID,
          kimarite: m.kimarite,
        }))
      }
    })

    // Сортуємо по ранку
    processed.sort((a, b) => (a.rankValue || 999) - (b.rankValue || 999))

    // Рахуємо шанси юшо
    const withChances = processed.map(r => ({
      ...r,
      yushoChance: calcYushoChance(r, currentDay)
    }))

    // Нормалізуємо до 100%
    const total = withChances.reduce((sum, r) => sum + r.yushoChance, 0)
    const normalized = withChances.map(r => ({
      ...r,
      yushoChance: total > 0 ? Math.round(r.yushoChance / total * 1000) / 10 : 0
    }))

    // Сортуємо по шансах юшо
    normalized.sort((a, b) => b.yushoChance - a.yushoChance)

    // Лідер за перемогами
    const maxWins = Math.max(...normalized.map(r => r.wins))

    return Response.json({
      bashoId: BASHO_ID,
      currentDay,
      rikishi: normalized,
      leaders: normalized.filter(r => r.wins === maxWins && !r.absent),
      maxWins,
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
