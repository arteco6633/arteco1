/**
 * Функция для отправки сообщений в Telegram через бота
 */

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data)
      return {
        success: false,
        error: data.description || 'Ошибка отправки в Telegram',
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Ошибка отправки в Telegram:', error)
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка',
    }
  }
}

/**
 * Форматирование заявки на обратный звонок для Telegram
 */
export function formatCallbackRequest(data: {
  name: string
  phone: string
  comment?: string | null
  createdAt?: string
}): string {
  const date = data.createdAt
    ? new Date(data.createdAt).toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

  let message = `📞 <b>Новая заявка на обратный звонок</b>\n\n`
  message += `👤 <b>Имя:</b> ${data.name}\n`
  message += `📱 <b>Телефон:</b> ${data.phone}\n`
  
  if (data.comment && data.comment.trim()) {
    message += `💬 <b>Комментарий:</b>\n${data.comment.trim()}\n`
  }
  
  message += `\n🕐 <i>${date}</i>`

  return message
}

/**
 * Получить chat_id группы (вспомогательная функция)
 * Чтобы получить chat_id, нужно:
 * 1. Добавить бота в группу
 * 2. Отправить любое сообщение в группу
 * 3. Вызвать: https://api.telegram.org/bot<TOKEN>/getUpdates
 * 4. В ответе найти chat.id (для групп это отрицательное число, например -1001234567890)
 */
export async function getChatId(botToken: string): Promise<string | null> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates`
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.ok && data.result && data.result.length > 0) {
      // Ищем последнее обновление с группой
      for (let i = data.result.length - 1; i >= 0; i--) {
        const update = data.result[i]
        if (update.message?.chat?.id) {
          const chatId = update.message.chat.id.toString()
          // Для групп chat_id отрицательный
          if (chatId.startsWith('-')) {
            return chatId
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Ошибка получения chat_id:', error)
    return null
  }
}




