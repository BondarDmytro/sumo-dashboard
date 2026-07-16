/* heya_lib_v1: spilni khelpery heya-storinok */
export const heyaSlug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '')

const RANK_ORDER = { Yokozuna: 1, Ozeki: 2, Sekiwake: 3, Komusubi: 4, Maegashira: 5, Juryo: 6, Makushita: 7, Sandanme: 8, Jonidan: 9, Jonokuchi: 10 }
export function rankVal(rank) {
  if (!rank) return 99999
  const m = String(rank).match(/^(\w+)\s*(\d+)?/)
  const base = RANK_ORDER[m?.[1]] || 50
  return base * 1000 + (Number(m?.[2]) || 0) * 10 + (String(rank).includes('West') ? 1 : 0)
}
