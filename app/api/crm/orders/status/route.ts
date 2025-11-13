export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, getStatusUpdateEmail, getStatusText } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(req: Request) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: 'Missing id or status' }, { status: 400 })
    }

    // Получаем данные заказа перед обновлением, чтобы узнать email клиента
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('contact, total')
      .eq('id', id)
      .single()

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 })
    }

    // Обновляем статус заказа
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    // Отправляем email уведомление об изменении статуса
    const contact = orderData?.contact as any
    const customerEmail = contact?.email
    if (customerEmail) {
      try {
        const customerName = contact?.name || 'Клиент'
        const statusText = getStatusText(status)
        const emailHtml = getStatusUpdateEmail(id, customerName, status, statusText)
        await sendEmail({
          to: customerEmail,
          subject: `Обновление статуса заказа #${id} - ART=CO`,
          html: emailHtml,
        })
      } catch (emailError) {
        // Не прерываем выполнение, если email не отправился
        console.error('Failed to send status update email:', emailError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown' }, { status: 500 })
  }
}


