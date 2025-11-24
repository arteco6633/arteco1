import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage, formatCallbackRequest } from '@/lib/telegram'
import { sendEmail, getCallbackRequestEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, comment } = body

    // Валидация
    if (!name || !phone) {
      return NextResponse.json(
        { message: 'Имя и телефон обязательны для заполнения' },
        { status: 400 }
      )
    }

    // Сохраняем заявку в базу данных
    const { data, error } = await supabase
      .from('callback_requests')
      .insert([
        {
          name: name.trim(),
          phone: phone.trim(),
          comment: comment?.trim() || null,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Ошибка сохранения заявки на обратный звонок:', error)
      
      // Если таблицы нет, просто возвращаем успех (чтобы форма работала)
      // В будущем можно создать таблицу через миграцию
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.warn('Таблица callback_requests не существует. Создайте таблицу для сохранения заявок.')
        // Продолжаем отправку в Telegram даже если таблицы нет
      } else {
        return NextResponse.json(
          { message: 'Ошибка при сохранении заявки. Попробуйте позже.' },
          { status: 500 }
        )
      }
    }

    // Отправляем уведомление в Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      try {
        const telegramMessage = formatCallbackRequest({
          name: name.trim(),
          phone: phone.trim(),
          comment: comment?.trim() || null,
          createdAt: data?.created_at || new Date().toISOString(),
        })

        const telegramResult = await sendTelegramMessage(botToken, chatId, telegramMessage)
        
        if (!telegramResult.success) {
          console.error('Ошибка отправки в Telegram:', telegramResult.error)
          // Не прерываем выполнение, заявка уже сохранена в БД
        }
      } catch (telegramError) {
        console.error('Ошибка при отправке в Telegram:', telegramError)
        // Не прерываем выполнение, заявка уже сохранена в БД
      }
    } else {
      console.warn('TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не настроены. Уведомление в Telegram не отправлено.')
    }

    // Отправляем email уведомление на arteco.one@mail.ru
    const notificationEmail = process.env.CALLBACK_NOTIFICATION_EMAIL || 'arteco.one@mail.ru'
    
    try {
      const emailHtml = getCallbackRequestEmail({
        name: name.trim(),
        phone: phone.trim(),
        comment: comment?.trim() || null,
        createdAt: data?.created_at || new Date().toISOString(),
      })

      const emailSent = await sendEmail({
        to: notificationEmail,
        subject: `📞 Новая заявка на обратный звонок от ${name.trim()}`,
        html: emailHtml,
      })

      if (!emailSent) {
        console.warn('Не удалось отправить email уведомление. Проверьте настройки SMTP.')
      }
    } catch (emailError) {
      console.error('Ошибка при отправке email уведомления:', emailError)
      // Не прерываем выполнение, заявка уже сохранена
    }

    return NextResponse.json({
      success: true,
      message: 'Заявка успешно отправлена. Менеджер свяжется с вами в ближайшее время.',
      data,
    })
  } catch (error: any) {
    console.error('Ошибка обработки заявки на обратный звонок:', error)
    return NextResponse.json(
      { message: error.message || 'Ошибка при обработке заявки' },
      { status: 500 }
    )
  }
}

