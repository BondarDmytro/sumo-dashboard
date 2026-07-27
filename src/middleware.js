// geoblock_v1: блок RU/BY на Vercel Edge, вузький matcher (тільки сторінки)
import { NextResponse } from 'next/server'

const BLOCKED = new Set(['RU', 'BY'])

const HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="robots" content="noindex"/>
<title>Access forbidden</title>
<style>body{background:#0a0805;color:#e9e2d2;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;text-align:center;padding:24px;margin:0}
h1{font-size:clamp(26px,6vw,52px);font-weight:800;color:#ff3b3b;margin:0 0 14px}
p{font-size:clamp(15px,3vw,20px);font-weight:700;letter-spacing:.18em;color:#cdbf9f;margin:0}</style></head>
<body><div><div style="font-size:54px;margin-bottom:18px">🇺🇦</div>
<h1>RUSSIA IS A TERRORIST STATE</h1><p>ACCESS FORBIDDEN</p>
<div style="margin-top:22px;font-size:13px;color:#7a6f59">Slava Ukraini 🇺🇦</div></div></body></html>`

export function middleware(request) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    (request.geo && request.geo.country) ||
    ''
  if (BLOCKED.has(country.toUpperCase())) {
    return new NextResponse(HTML, {
      status: 403,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/ranks', '/rikishi', '/archive', '/sumo',
    '/:lang(en|ja|uk|fr)/:path*' /* fr_locale_v1 */,
  ],
}
