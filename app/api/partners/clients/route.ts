import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { partnerId, name, phone, email, notes } = body

    // Валидация
    if (!partnerId || !name || !phone) {
      return NextResponse.json(
        { error: 'Необходимо заполнить partnerId, имя и телефон' },
        { status: 400 }
      )
    }

    // Создаем клиента
    console.log('Попытка вставки в таблицу partner_clients:', {
      partnerId,
      name,
      phone,
      email,
      notes
    })
    
    // Проверяем существование таблицы перед вставкой
    const { data: tableCheck, error: tableCheckError } = await supabaseServer
      .from('partner_clients')
      .select('id')
      .limit(0)
    
    if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message?.includes('does not exist'))) {
      console.error('Таблица partner_clients не существует!')
      return NextResponse.json(
        { error: 'Таблица partner_clients не создана. Выполните SQL скрипт setup_partners.sql в Supabase SQL Editor.' },
        { status: 500 }
      )
    }
    
    const { data: client, error: clientError } = await supabaseServer
      .from('partner_clients')
      .insert({
        partner_id: partnerId,
        name,
        phone,
        email: email || null,
        notes: notes || null
      })
      .select()
      .single()

    if (clientError) {
      console.error('Ошибка создания клиента:', clientError)
      console.error('Детали ошибки:', {
        code: clientError.code,
        message: clientError.message,
        details: clientError.details,
        hint: clientError.hint
      })
      // Если таблица не существует, возвращаем более понятное сообщение
      if (clientError.code === '42P01' || clientError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Таблица клиентов партнеров не создана. Выполните SQL скрипт setup_partners.sql в Supabase.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: `Ошибка при добавлении клиента: ${clientError.message || 'Попробуйте позже.'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      client
    })
  } catch (error: any) {
    console.error('Ошибка добавления клиента:', error)
    return NextResponse.json(
      { error: `Ошибка при добавлении клиента: ${error?.message || 'Неизвестная ошибка'}` },
      { status: 500 }
    )
  }
}

