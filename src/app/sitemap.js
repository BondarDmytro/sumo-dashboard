export default function sitemap() {
  const base = 'https://sumo.dohyo-legends.com'
  const now = new Date()
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/ranks`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/rikishi`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/archive`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/sumo`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]
}
