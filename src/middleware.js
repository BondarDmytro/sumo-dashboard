import { NextResponse } from 'next/server'

export function middleware(request) {
  // process.env.VERCEL автоматично = '1' на Vercel, undefined на localhost
  if (process.env.VERCEL === '1') {
    const url = request.nextUrl.clone()
    // Пропускаємо саму сторінку maintenance щоб не було loop
    if (url.pathname.startsWith('/maintenance')) {
      return NextResponse.next()
    }
    url.pathname = '/maintenance'
    return NextResponse.rewrite(url)
  }
  return NextResponse.next()
}

export const config = {
  // Блокуємо всі маршрути крім статичних файлів
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons).*)'],
}