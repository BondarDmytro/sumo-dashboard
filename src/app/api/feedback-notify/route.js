/* feedback_email_v1: myttievyi lyst pro novyi feedback cherez Resend */
export async function POST(request) {
  try {
    const b = await request.json()
    const msg = String(b.msg || '').slice(0, 2000)
    if (!msg.trim()) return Response.json({ ok: false }, { status: 400 })
    const email = String(b.email || '').slice(0, 200)
    const page = String(b.page || '').slice(0, 300)
    const lang = String(b.lang || '').slice(0, 5)
    const key = process.env.RESEND_API_KEY
    if (!key) return Response.json({ ok: false, reason: 'no key' }, { status: 500 })
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Dohyo Feedback <feedback@dohyo-legends.com>',  /* resend_domain_v1 */
        to: ['bondardmytromail@gmail.com'],  /* resend acct addr; forward -> panterra */
        reply_to: email || undefined,
        subject: `[sumo] feedback${email ? ' vid ' + email : ''}`,
        text: `${msg}\n\n---\npage: ${page}\nlang: ${lang}\nemail: ${email || '(ne vkazano)'}`,
      }),
    })
    return Response.json({ ok: res.ok })
  } catch (e) {
    return Response.json({ ok: false }, { status: 500 })
  }
}
