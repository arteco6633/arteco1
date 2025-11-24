#!/bin/bash

# Скрипт для получения chat_id группы Telegram
# Использование: ./get_telegram_chat_id.sh

BOT_TOKEN="8480632066:AAG2kkhMKGRWrLJTTibUW4tfTVAChkoLgFk"

echo "🔍 Получение chat_id для группы..."
echo ""
echo "📝 Инструкция:"
echo "1. Убедитесь, что бот добавлен в группу: https://t.me/+G6KejOOLCuI5ODBi"
echo "2. Отправьте любое сообщение в группу"
echo "3. Нажмите Enter для продолжения..."
read

echo ""
echo "📡 Запрос к Telegram API..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | python3 -m json.tool | grep -A 5 '"chat"' | head -20

echo ""
echo ""
echo "✅ Найдите в выводе выше строку с \"id\": -100... (отрицательное число)"
echo "Это и есть ваш TELEGRAM_CHAT_ID"
echo ""
echo "Добавьте в .env.local:"
echo "TELEGRAM_BOT_TOKEN=${BOT_TOKEN}"
echo "TELEGRAM_CHAT_ID=-1001234567890"



