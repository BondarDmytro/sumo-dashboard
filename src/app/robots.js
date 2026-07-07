export default function robots() {
  const base = 'https://sumo.dohyo-legends.com'
  return {
    rules: [
      { userAgent: '*', allow: ['/'], disallow: ['/api/'] },
      { userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Google-Extended'], disallow: ['/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
