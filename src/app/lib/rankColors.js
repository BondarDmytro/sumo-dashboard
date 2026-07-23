/* rank_colors_v2: nasycheni kontrastni kolory */
export function rankColor(rank) {
  const r = String(rank || '')
  if (/^(Juryo|Makushita|Sandanme|Jonidan|Jonokuchi|Ms|Sd|Jd|Jk|J\d)/.test(r)) return '#8a8578'  /* rank_colors_v3_lowerdiv: povni nazvy nyzhchykh - do sanyaku-patterniv */
  if (r.includes('Yokozuna') || /^Y/.test(r)) return '#9a6d00'
  if (r.includes('Ozeki') || /^O/.test(r)) return '#b02a1e'
  if (r.includes('Sekiwake') || /^S(?!d)/.test(r)) return '#14508f'
  if (r.includes('Komusubi') || /^K/.test(r)) return '#0e7a4f'
  if (r.includes('Maegashira') || /^M(?!s)/.test(r)) return '#5a544a'
  return '#8a8578'
}
