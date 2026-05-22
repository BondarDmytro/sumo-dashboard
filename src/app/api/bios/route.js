const SUMO_API = 'https://sumo-api.com/api'

const COUNTRY_FLAGS = {
  'Mongolia': { flag: '🇲🇳', name: 'Монголія' },
  'Ukraine': { flag: '🇺🇦', name: 'Україна' },
  'Georgia': { flag: '🇬🇪', name: 'Грузія' },
  'Bulgaria': { flag: '🇧🇬', name: 'Болгарія' },
  'Russia': { flag: '🇷🇺', name: 'Росія' },
  'China': { flag: '🇨🇳', name: 'Китай' },
  'Brazil': { flag: '🇧🇷', name: 'Бразилія' },
  'Kazakhstan': { flag: '🇰🇿', name: 'Казахстан' },
  'Kyrgyzstan': { flag: '🇰🇬', name: 'Киргизстан' },
  'Czech Republic': { flag: '🇨🇿', name: 'Чехія' },
  'Tonga': { flag: '🇹🇴', name: 'Тонга' },
  'Uzbekistan': { flag: '🇺🇿', name: 'Узбекистан' },
  'Philippines': { flag: '🇵🇭', name: 'Філіппіни' },
  'Egypt': { flag: '🇪🇬', name: 'Єгипет' },
}

function getCountry(shusshin) {
  if (!shusshin) return { flag: '🇯🇵', name: 'Японія' }

  // Roga — народився в Монголії але виступає за Росію
  if (shusshin.includes('- Russia')) return { flag: '🏳️', name: 'Росія (нейтральний)' }

  const isJapan = shusshin.includes('-ken') || shusshin.includes('-to') ||
                  shusshin.includes('-do') || shusshin.includes('-fu') ||
                  shusshin.includes('Tokyo') || shusshin.includes('Osaka') ||
                  shusshin.includes('Hokkaido') || shusshin.includes('Okinawa') ||
                  shusshin.includes('Aichi') || shusshin.includes('Fukuoka') ||
                  shusshin.includes('Hyogo') || shusshin.includes('Miyagi') ||
                  shusshin.includes('Niigata') || shusshin.includes('Nagano') ||
                  shusshin.includes('Kumamoto') || shusshin.includes('Kagoshima') ||
                  shusshin.includes('Hiroshima') || shusshin.includes('Kyoto')
  if (isJapan) return { flag: '🇯🇵', name: 'Японія' }
  const country = Object.keys(COUNTRY_FLAGS).find(c => shusshin.startsWith(c))
  return country ? COUNTRY_FLAGS[country] : { flag: '🌍', name: shusshin.split(',')[0] }
}

export async function GET() {
  try {
    const banzukeRes = await fetch(
      `${SUMO_API}/basho/202605/banzuke/Makuuchi`,
      { next: { revalidate: 86400 } }
    )
    const banzuke = await banzukeRes.json()
    const rikishiIds = [
      ...(banzuke.east || []),
      ...(banzuke.west || [])
    ].map(r => r.rikishiID)

    const infoList = await Promise.all(
      rikishiIds.map(id =>
        fetch(`${SUMO_API}/rikishi/${id}`, { next: { revalidate: 86400 } })
          .then(r => r.json())
      )
    )

    const bios = {}
    infoList.forEach(r => {
      if (r.id) {
        bios[r.id] = {
          country: getCountry(r.shusshin),
          height: r.height || null,
          weight: r.weight || null,
        }
      }
    })

    return Response.json(bios)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}