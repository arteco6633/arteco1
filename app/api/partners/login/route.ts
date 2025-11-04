import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

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

    // Нормализуем телефон (убираем пробелы, скобки, дефисы, но сохраняем +7)
    const normalizedPhone = phone.replace(/[\s()-\+]/g, '').replace(/^8/, '7')
    // Также пробуем формат с +7
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${normalizedPhone}`

    console.log('Поиск партнера по телефону:', { phone, normalizedPhone, phoneWithPlus })

    // Получаем партнера по телефону (пробуем разные форматы)
    let { data: partner, error: partnerError } = await supabaseServer
      .from('partners')
      .select('*')
      .or(`phone.eq.${phone},phone.eq.${normalizedPhone},phone.eq.${phoneWithPlus}`)
      .eq('is_active', true)
      .maybeSingle()

    console.log('Результат поиска партнера:', { found: !!partner, error: partnerError?.message })

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
      console.error('Партнер не найден для телефона:', phone)
      return NextResponse.json(
        { error: 'Неверный телефон или пароль' },
        { status: 401 }
      )
    }

    // Проверяем, есть ли password_hash
    if (!partner.password_hash) {
      console.error('Партнер найден, но password_hash отсутствует для партнера ID:', partner.id)
      return NextResponse.json(
        { error: 'Ошибка аутентификации. Обратитесь в поддержку.' },
        { status: 500 }
      )
    }

    // Проверяем пароль
    console.log('Сравнение пароля для партнера ID:', partner.id)
    console.log('Длина password_hash:', partner.password_hash?.length)
    
    try {
      const isPasswordValid = await bcrypt.compare(password, partner.password_hash)
      console.log('Результат сравнения пароля:', isPasswordValid)
      
      if (!isPasswordValid) {
        console.error('Пароль не совпадает для партнера ID:', partner.id)
        return NextResponse.json(
          { error: 'Неверный телефон или пароль' },
          { status: 401 }
        )
      }
    } catch (bcryptError: any) {
      console.error('Ошибка при сравнении пароля:', bcryptError)
      return NextResponse.json(
        { error: 'Ошибка при проверке пароля. Попробуйте позже.' },
        { status: 500 }
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

