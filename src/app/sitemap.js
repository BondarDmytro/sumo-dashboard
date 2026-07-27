import rikishiMeta from './lib/rikishiMeta.json' /* sitemap_heya_v1 */
/* lang_routes_v1: 3 мови × 5 сторінок + корінь */
export default function sitemap() {
  const base = 'https://sumo.dohyo-legends.com'
  const now = new Date()
  const pages = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/ranks', changeFrequency: 'daily', priority: 0.9 },
    { path: '/rikishi', changeFrequency: 'daily', priority: 0.8 },
    { path: '/archive', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/sumo', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/rikishi/aonishiki', changeFrequency: 'daily', priority: 0.9 },  /* sitemap_hubs_v1 */
    { path: '/rikishi/shishi', changeFrequency: 'daily', priority: 0.8 },
    { path: '/heya', changeFrequency: 'weekly', priority: 0.7 },  /* sitemap_heya_v1 */
    { path: '/news', changeFrequency: 'daily', priority: 0.7 },  /* sitemap_news_v1 */
    ...[...new Set(rikishiMeta.filter(r => r.heya).map(r => String(r.heya).toLowerCase().replace(/[^a-z0-9]/g, '')))].map(s => ({ path: `/heya/${s}`, changeFrequency: 'weekly', priority: 0.6 })),
  ]
  const langs = ['en', 'ja', 'uk', 'fr'] /* fr_locale_v1 */
  const out = [{ url: base, lastModified: now, changeFrequency: 'daily', priority: 1 }]
  for (const l of langs) {
    for (const p of pages) {
      out.push({
        url: `${base}/${l}${p.path}`,
        lastModified: now,
        changeFrequency: p.changeFrequency,
        priority: l === 'en' ? p.priority : p.priority - 0.05,
      })
    }
  }
  return out
}
