# Настройка Telegram Mini App для ARTECO

## Что было сделано

✅ Создана интеграция с Telegram Web App API
✅ Добавлен TelegramProvider для управления состоянием
✅ Добавлены CSS переменные для темы Telegram
✅ Адаптирован viewport для безопасных зон (safe-area)

## Файлы

- `lib/telegram.ts` - Утилиты для работы с Telegram Web App API
- `components/TelegramProvider.tsx` - React провайдер для Telegram
- Обновлен `app/layout.tsx` - добавлен скрипт Telegram
- Обновлен `app/globals.css` - добавлены CSS переменные для темы

## Как настроить бота в Telegram

### 1. Создать бота через @BotFather

1. Найти @BotFather в Telegram
2. Отправить команду `/newbot`
3. Следовать инструкциям и получить токен бота

### 2. Настроить Web App

1. Отправить @BotFather команду `/newapp`
2. Выбрать созданного бота
3. Указать:
   - **Title**: ARTECO
   - **Short name**: arteco (будет использоваться в URL)
   - **Description**: Интернет-магазин мебели ARTECO
   - **Photo**: Загрузить логотип (512x512px рекомендуется)
   - **Web App URL**: `https://www.arteeeco.ru`
   - **GIF** (опционально): Анимированная превью
   - **Video** (опционально): Видео-превью

### 3. Альтернативный способ через команды

```
/setmenubutton - установить кнопку меню
/setdescription - описание бота
/setuserpic - аватар бота
/setcommands - команды бота
```

### 4. Использование в коде

```typescript
import { useTelegram } from '@/components/TelegramProvider'

function MyComponent() {
  const { isTelegram, webApp, user } = useTelegram()
  
  if (isTelegram) {
    // Код для Telegram
    console.log('User:', user)
    
    // Использование MainButton
    webApp?.MainButton.setText('Добавить в корзину')
    webApp?.MainButton.show()
    webApp?.MainButton.onClick(() => {
      // Обработка клика
    })
  }
  
  return <div>...</div>
}
```

## Основные возможности

### 1. Информация о пользователе
```typescript
const { user } = useTelegram()
// user.first_name, user.last_name, user.username, user.id
```

### 2. Главная кнопка (MainButton)
```typescript
webApp?.MainButton.setText('Купить')
webApp?.MainButton.show()
webApp?.MainButton.onClick(() => {
  // Обработка
})
```

### 3. Кнопка назад (BackButton)
```typescript
webApp?.BackButton.show()
webApp?.BackButton.onClick(() => {
  router.back()
})
```

### 4. Тактильная обратная связь
```typescript
webApp?.HapticFeedback.impactOccurred('medium')
webApp?.HapticFeedback.notificationOccurred('success')
```

### 5. Попапы и алерты
```typescript
webApp?.showAlert('Товар добавлен в корзину!')
webApp?.showConfirm('Вы уверены?', (confirmed) => {
  if (confirmed) {
    // Подтверждено
  }
})
```

### 6. Тема приложения
Тема автоматически применяется через CSS переменные:
- `--tg-theme-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-button-color`
- и т.д.

## Проверка работы

1. Откройте бота в Telegram
2. Нажмите на кнопку "Open" или кнопку меню
3. Должно открыться приложение в Telegram WebView

## Дополнительные возможности

### Cloud Storage (сохранение данных)
```typescript
webApp?.CloudStorage.setItem('cart', JSON.stringify(cart))
webApp?.CloudStorage.getItem('cart', (err, value) => {
  if (!err && value) {
    const cart = JSON.parse(value)
  }
})
```

### Открытие ссылок
```typescript
webApp?.openLink('https://example.com', { try_instant_view: true })
webApp?.openTelegramLink('https://t.me/channel')
```

### Закрытие приложения
```typescript
webApp?.close()
```

## Безопасность

⚠️ **Важно**: Всегда проверяйте данные пользователя через `initData` на сервере перед использованием. Данные могут быть поддельными, если не проверить подпись.

Для проверки подписи используйте библиотеку или реализуйте проверку по документации Telegram.

## Документация

- Официальная документация: https://core.telegram.org/bots/webapps
- Bot API: https://core.telegram.org/bots/api


