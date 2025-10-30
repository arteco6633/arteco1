import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as any
    const phone: string | null = body?.phone || null
    const prize = String(body?.prize || '').trim() || 'Приз'
    const meta = { ua: (req.headers.get('user-agent') || null), source: 'orange_banner_game' }

    const { error } = await supabase.from('game_plays').insert({ phone, prize, meta })
    if (error) throw error

    if (phone) {
      const { error: upErr } = await supabase.from('user_prizes').insert({ phone, prize, source: 'game' })
      if (upErr) throw upErr
    }

    return NextResponse.json({ success: true, prize })
  } catch (e: any) {
    console.error('game/play error', e)
    return NextResponse.json({ success: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}


