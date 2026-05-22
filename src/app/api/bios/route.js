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
  const isJapan = shusshin.includes('-ken') || shusshin.includes('-to') ||
                  shusshin.includes('-do') || shusshin.includes('-fu') ||
                  shusshin.includes('Tokyo') || shusshin.includes('Osaka')
  if (isJapan) return { flag: '🇯🇵', name: 'Японія' }
  const country = Object.keys(COUNTRY_FLAGS).find(c => shusshin.startsWith(c))
  return country ? COUNTRY_FLAGS[country] : { flag: '🌍', name: shusshin.split(',')[0] }
}

export async function GET() {
  try {
    const res = await fetch(
      `${SUMO_API}/rikishis?limit=200&intai=false`,
      { next: { revalidate: 86400 } }
    )
    const data = await res.json()
    const records = data.records || []

    const bios = {}
    records.forEach(r => {
      bios[r.id] = {
        country: getCountry(r.shusshin),
        height: r.height || null,
        weight: r.weight || null,
      }
    })

    return Response.json(bios)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}