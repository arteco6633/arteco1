import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, password, name, email, companyName, partnerType } = body

    // Валидация
    if (!phone || !password || !partnerType) {
      return NextResponse.json(
        { error: 'Необходимо заполнить телефон, пароль и тип партнера' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      )
    }

    // Проверяем, существует ли партнер с таким телефоном
    const { data: existingPartner } = await supabase
      .from('partners')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Партнер с таким телефоном уже зарегистрирован' },
        { status: 400 }
      )
    }

    // Хешируем пароль
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Создаем партнера
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .insert({
        phone,
        password_hash: passwordHash,
        name: name || null,
        email: email || null,
        company_name: companyName || null,
        partner_type: partnerType,
        commission_rate: 10.00, // По умолчанию 10%
        is_active: true
      })
      .select()
      .single()

    if (partnerError) {
      console.error('Ошибка создания партнера:', partnerError)
      return NextResponse.json(
        { error: 'Ошибка при регистрации. Попробуйте позже.' },
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
    console.error('Ошибка регистрации партнера:', error)
    return NextResponse.json(
      { error: 'Ошибка при регистрации' },
      { status: 500 }
    )
  }
}

