import { NextResponse } from 'next/server'
export async function POST() {
  const hookUrl = process.env.DEPLOY_HOOK_URL
  if (!hookUrl) return NextResponse.json({ error: 'DEPLOY_HOOK_URL not set' }, { status: 500 })
  const res = await fetch(hookUrl, { method: 'POST' })
  const data = await res.json()
  return NextResponse.json({ ok: true, jobId: data.job?.id ?? null })
}
