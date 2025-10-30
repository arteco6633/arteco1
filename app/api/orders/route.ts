export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!url || !serviceKey) {
      return NextResponse.json({ success: false, error: 'Missing Supabase env' }, { status: 500 })
    }
    const supabase = createClient(url, serviceKey)

    const payload = {
      user_id: body.user_id ?? null,
      contact: body.contact ?? {},
      items: body.items ?? [],
      total: body.total ?? 0,
      delivery: body.delivery ?? {},
      payment: body.payment ?? {},
      status: 'new',
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('orders').insert([payload]).select('id').single()
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown' }, { status: 500 })
  }
}


