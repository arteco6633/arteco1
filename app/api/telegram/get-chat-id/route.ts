import { NextResponse } from 'next/server'
import { getChatId } from '@/lib/telegram'

/**
 * Вспомогательный endpoint для получения chat_id группы
 * Использование: GET /api/telegram/get-chat-id
 * 
 * ВАЖНО: После получения chat_id удалите этот файл или защитите его от публичного доступа!
 */
export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '8480632066:AAG2kkhMKGRWrLJTTibUW4tfTVAChkoLgFk'
  
  if (!botToken) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не настроен' }, { status: 500 })
  }

  try {
    const chatId = await getChatId(botToken)
    
    if (!chatId) {
      return NextResponse.json({
        error: 'Не удалось получить chat_id',
        instructions: [
          '1. Добавьте бота в группу',
          '2. Отправьте любое сообщение в группу',
          '3. Обновите эту страницу',
        ],
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      chatId,
      message: 'Скопируйте chat_id выше и добавьте его в переменную окружения TELEGRAM_CHAT_ID',
      envExample: `TELEGRAM_CHAT_ID=${chatId}`,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Ошибка получения chat_id',
    }, { status: 500 })
  }
}

