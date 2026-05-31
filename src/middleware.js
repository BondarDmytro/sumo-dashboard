import { NextResponse } from 'next/server'

// Middleware вимкнено — блокування перенесено в компонент SumoClash
export function middleware(request) {
  return NextResponse.next()
}