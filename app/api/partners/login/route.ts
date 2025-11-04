import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // Получаем партнера по телефону
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('phone', phone)
      .eq('is_active', true)
      .single()

    if (partnerError || !partner) {
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
      { error: 'Ошибка при входе' },
      { status: 500 }
    )
  }
}

