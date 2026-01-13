'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TelegramSetupPage() {
  const [chatId, setChatId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updates, setUpdates] = useState<any>(null)

  const botToken = '8480632066:AAG2kkhMKGRWrLJTTibUW4tfTVAChkoLgFk'

  async function fetchChatId() {
    setLoading(true)
    setError(null)
    setUpdates(null)

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`)
      const data = await response.json()

      setUpdates(data)

      if (!data.ok) {
        setError(data.description || 'Ошибка API Telegram')
        setLoading(false)
        return
      }

      if (!data.result || data.result.length === 0) {
        setError('Нет обновлений. Убедитесь, что:\n1. Бот добавлен в группу\n2. В группу отправлено сообщение\n3. Попробуйте еще раз')
        setLoading(false)
        return
      }

      // Ищем chat_id группы (отрицательное число)
      for (let i = data.result.length - 1; i >= 0; i--) {
        const update = data.result[i]
        if (update.message?.chat?.id) {
          const id = update.message.chat.id.toString()
          // Для групп chat_id отрицательный
          if (id.startsWith('-')) {
            setChatId(id)
            setLoading(false)
            return
          }
        }
      }

      setError('Не найден chat_id группы. Убедитесь, что сообщение отправлено именно в группу.')
    } catch (err: any) {
      setError(err.message || 'Ошибка при запросе к Telegram API')
    } finally {
      setLoading(false)
    }
  }

  async function testSendMessage() {
    if (!chatId) {
      alert('Сначала получите chat_id')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: '✅ Тестовое сообщение от бота ARTECO\n\nЕсли вы видите это сообщение, значит настройка выполнена правильно!',
        }),
      })

      const data = await response.json()

      if (data.ok) {
        alert('✅ Тестовое сообщение успешно отправлено в группу!')
      } else {
        alert(`❌ Ошибка: ${data.description || 'Неизвестная ошибка'}`)
      }
    } catch (err: any) {
      alert(`❌ Ошибка: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link href="/admin" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Назад в админ-панель
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Настройка Telegram бота</h1>
          <p className="text-gray-600 mt-2">Получение chat_id для группы "Заявки с сайта"</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Инструкция:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mb-6">
            <li>Откройте группу в Telegram: <a href="https://t.me/+G6KejOOLCuI5ODBi" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://t.me/+G6KejOOLCuI5ODBi</a></li>
            <li>Добавьте бота в группу (если еще не добавлен)</li>
            <li>Отправьте любое сообщение в группу (например, "тест")</li>
            <li>Нажмите кнопку "Получить chat_id" ниже</li>
          </ol>

          <button
            onClick={fetchChatId}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Загрузка...' : 'Получить chat_id'}
          </button>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 whitespace-pre-line">{error}</p>
          </div>
        )}

        {chatId && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ chat_id найден!</h3>
            <div className="bg-white rounded-lg p-4 mb-4 border border-green-300">
              <code className="text-lg font-mono text-gray-900">{chatId}</code>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-700 mb-2">Добавьте в <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> или в настройки Vercel:</p>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div>TELEGRAM_BOT_TOKEN=8480632066:AAG2kkhMKGRWrLJTTibUW4tfTVAChkoLgFk</div>
                  <div>TELEGRAM_CHAT_ID={chatId}</div>
                </div>
              </div>
              <button
                onClick={testSendMessage}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Отправка...' : 'Отправить тестовое сообщение'}
              </button>
            </div>
          </div>
        )}

        {updates && (
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3">Ответ API (для отладки):</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(updates, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}





