import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.startsWith('7')) return `+7${digits.slice(1)}`
  if (!digits.startsWith('+' )) return `+${digits}`
  return digits
}

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ error: 'phone required' }, { status: 400 })
    const normalized = normalizePhone(phone)

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('otp_codes').insert({ phone: normalized, code, expires_at: expiresAt })

    const email = process.env.SMSAERO_EMAIL!
    const apiKey = process.env.SMSAERO_API_KEY!
    const sign = process.env.SMSAERO_SIGN || 'SMSAero'
    const auth = Buffer.from(`${email}:${apiKey}`).toString('base64')

    const payload = {
      numbers: [normalized.replace('+','')],
      text: `Код входа: ${code}`,
      sign,
    }

    const resp = await fetch('https://gate.smsaero.ru/v2/sms/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!resp.ok) {
      const body = await resp.text()
      console.error('SMSAero error', body)
      return NextResponse.json({ error: 'sms_failed', details: body }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('otp send error', e)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}


