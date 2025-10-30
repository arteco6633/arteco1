import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { phone } = await req.json()
    if (!phone) return NextResponse.json({ hasPrize: false })
    const { data, error } = await supabase
      .from('user_prizes')
      .select('id')
      .eq('phone', phone)
      .limit(1)
    if (error) throw error
    return NextResponse.json({ hasPrize: !!(data && data.length) })
  } catch (e: any) {
    console.error('game/status error', e)
    return NextResponse.json({ hasPrize: false }, { status: 200 })
  }
}


