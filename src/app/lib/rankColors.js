/* rank_colors_lib_v1: kanon kolioriv rangiv — Y zoloto, O chervonyi, S synii, K zelenyi, M siryi */
export function rankColor(rank) {
  const r = String(rank || '')
  if (r.includes('Yokozuna')) return '#b8860b'
  if (r.includes('Ozeki')) return '#c0392b'
  if (r.includes('Sekiwake')) return '#1a4a7a'
  if (r.includes('Komusubi')) return '#1a6b5c'
  return '#8a8578'
}
