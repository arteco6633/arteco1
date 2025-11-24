import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendTelegramMessage, formatCallbackRequest } from '@/lib/telegram'
import { sendEmail, getCallbackRequestEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers, name, phone, email, city, comment } = body

    // Валидация
    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: 'Имя и телефон обязательны для заполнения' },
        { status: 400 }
      )
    }

    // Сохраняем заявку в базу данных
    const { data, error } = await supabase
      .from('kitchen_quiz_submissions')
      .insert([
        {
          quiz_id: 1, // Дефолтный квиз
          answers: answers || {},
          name: name.trim(),
          phone: phone.trim(),
          email: email?.trim() || null,
          city: city?.trim() || null,
          comment: comment?.trim() || null,
          status: 'new',
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Ошибка сохранения заявки из квиза:', error)
      // Продолжаем отправку уведомлений даже если сохранение не удалось
    }

    // Формируем текст для Telegram с ответами из квиза
    let telegramMessage = `🏠 <b>Новая заявка из квиза Kitchen Matchmaker</b>\n\n`
    telegramMessage += `👤 <b>Имя:</b> ${name.trim()}\n`
    telegramMessage += `📱 <b>Телефон:</b> ${phone.trim()}\n`
    
    if (email) telegramMessage += `📧 <b>Email:</b> ${email.trim()}\n`
    if (city) telegramMessage += `🏙 <b>Город:</b> ${city.trim()}\n`
    
    if (answers && Object.keys(answers).length > 0) {
      telegramMessage += `\n📝 <b>Ответы на вопросы квиза:</b>\n`
      // Здесь можно добавить расшифровку ответов, загрузив названия шагов
      for (const [stepId, answer] of Object.entries(answers)) {
        telegramMessage += `• ${answer}\n`
      }
    }
    
    if (comment) {
      telegramMessage += `\n💬 <b>Комментарий:</b>\n${comment.trim()}\n`
    }
    
    telegramMessage += `\n🕐 <i>${new Date().toLocaleString('ru-RU')}</i>`

    // Отправляем уведомление в Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (botToken && chatId) {
      try {
        const telegramResult = await sendTelegramMessage(botToken, chatId, telegramMessage)
        if (!telegramResult.success) {
          console.error('Ошибка отправки в Telegram:', telegramResult.error)
        }
      } catch (telegramError) {
        console.error('Ошибка при отправке в Telegram:', telegramError)
      }
    }

    // Отправляем email уведомление
    const notificationEmail = process.env.CALLBACK_NOTIFICATION_EMAIL || 'arteco.one@mail.ru'
    
    try {
      // Создаем HTML для email с ответами квиза
      let emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .info-block { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #000; }
            .info-label { font-weight: bold; color: #000; margin-bottom: 5px; }
            .info-value { color: #333; }
            .answers-block { background-color: #fff; padding: 15px; margin: 10px 0; border-left: 4px solid #000; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏠 Новая заявка из квиза Kitchen Matchmaker</h1>
            </div>
            <div class="content">
              <div class="info-block">
                <div class="info-label">👤 Имя клиента:</div>
                <div class="info-value">${name.trim()}</div>
              </div>
              <div class="info-block">
                <div class="info-label">📱 Телефон:</div>
                <div class="info-value"><a href="tel:${phone.trim()}">${phone.trim()}</a></div>
              </div>
              ${email ? `<div class="info-block">
                <div class="info-label">📧 Email:</div>
                <div class="info-value">${email.trim()}</div>
              </div>` : ''}
              ${city ? `<div class="info-block">
                <div class="info-label">🏙 Город:</div>
                <div class="info-value">${city.trim()}</div>
              </div>` : ''}
              ${answers && Object.keys(answers).length > 0 ? `
              <div class="answers-block">
                <div class="info-label">📝 Ответы на вопросы квиза:</div>
                <div class="info-value">
                  ${Object.entries(answers).map(([stepId, answer]) => `<div>• ${answer}</div>`).join('')}
                </div>
              </div>` : ''}
              ${comment ? `<div class="info-block">
                <div class="info-label">💬 Комментарий:</div>
                <div class="info-value">${comment.trim().replace(/\n/g, '<br>')}</div>
              </div>` : ''}
              <div class="info-block">
                <div class="info-label">🕐 Дата и время:</div>
                <div class="info-value">${new Date().toLocaleString('ru-RU')}</div>
              </div>
              <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
                <strong>Не забудьте связаться с клиентом в ближайшее время!</strong>
              </p>
            </div>
            <div class="footer">
              <p>С уважением,<br>Система уведомлений ART=CO</p>
              <p>Это автоматическое письмо, не отвечайте на него.</p>
            </div>
          </div>
        </body>
        </html>
      `

      const emailSent = await sendEmail({
        to: notificationEmail,
        subject: `🏠 Новая заявка из квиза Kitchen Matchmaker от ${name.trim()}`,
        html: emailHtml,
      })

      if (!emailSent) {
        console.warn('Не удалось отправить email уведомление. Проверьте настройки SMTP.')
      }
    } catch (emailError) {
      console.error('Ошибка при отправке email уведомления:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Заявка успешно отправлена!',
      data,
    })
  } catch (error: any) {
    console.error('Ошибка обработки заявки из квиза:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Ошибка при обработке заявки' },
      { status: 500 }
    )
  }
}



