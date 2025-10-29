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
      type: body.type ?? null,
      dimensions: body.dimensions ?? body.dimension ?? null,
      layout: body.layout ?? null,
      name: body.name ?? null,
      phone: body.phone ?? null,
      meta: body.meta ?? null,
      created_at: body.created_at ?? new Date().toISOString(),
    }
    let { error } = await supabase
      .from('quiz_responses')
      .insert([payload])
    if (error) {
      // Фоллбек на схему с единственным столбцом meta jsonb
      const retry = await supabase
        .from('quiz_responses')
        .insert([{ meta: body, created_at: new Date().toISOString() }])
      if (retry.error) {
        return NextResponse.json({ success: false, error: `${error.message} | retry: ${retry.error.message}` }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown' }, { status: 500 })
  }
}


