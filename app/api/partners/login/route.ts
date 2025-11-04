import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password } = body

    // Валидация
    if (!phone || !password) {
      return NextResponse.json(
        { error: 'Необходимо заполнить телефон и пароль' },
        { status: 400 }
      )
    }

    // Получаем партнера по телефону
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .maybeSingle()

    // Если ошибка не связана с отсутствием записи (PGRST116), значит что-то пошло не так
    if (partnerError && partnerError.code !== 'PGRST116') {
      console.error('Ошибка получения партнера:', partnerError)
      // Если таблица не существует, возвращаем более понятное сообщение
      if (partnerError.code === '42P01' || partnerError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Таблица партнеров не создана. Выполните SQL скрипт setup_partners.sql в Supabase.' },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { error: 'Ошибка при входе. Попробуйте позже.' },
        { status: 500 }
      )
    }

    if (!partner) {
      return NextResponse.json(
        { error: 'Неверный телефон или пароль' },
        { status: 401 }
      )
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, partner.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный телефон или пароль' },
        { status: 401 }
      )
    }

    // Возвращаем данные партнера (без пароля)
    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        phone: partner.phone,
        name: partner.name,
        email: partner.email,
        company_name: partner.company_name,
        partner_type: partner.partner_type
      }
    })
  } catch (error: any) {
    console.error('Ошибка входа партнера:', error)
    return NextResponse.json(
      { error: `Ошибка при входе: ${error?.message || 'Неизвестная ошибка'}` },
      { status: 500 }
    )
  }
}

