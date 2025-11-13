# Настройка реального терминала T-Bank для Production

## Шаг 1: Обновите переменные окружения

В файле `.env.local` (или в переменных окружения Vercel) замените тестовые данные на реальные:

```env
# РЕАЛЬНЫЕ данные из личного кабинета T-Bank
TBANK_TERMINAL_ID=1763021044780
TBANK_PASSWORD=LtvNz3niZaEZQCHz
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_TBANK_TERMINAL_ID=1763021044780

# ВАЖНО: Укажите ваш реальный домен для production
NEXT_PUBLIC_SITE_URL=https://www.arteeeco.ru
```

## Шаг 2: Проверьте настройки в личном кабинете T-Bank

1. Войдите в [личный кабинет T-Bank](https://business.tbank.ru)
2. Перейдите в настройки терминала
3. Убедитесь, что указаны правильные URL для callback'ов:
   - **Success URL**: `https://www.arteeeco.ru/order/success?order={orderId}`
   - **Fail URL**: `https://www.arteeeco.ru/order/fail?order={orderId}`
   - **Notification URL**: `https://www.arteeeco.ru/api/payments/tbank/callback`

## Шаг 3: Обновите переменные в Vercel (если используете)

1. Перейдите в настройки проекта в Vercel
2. Откройте раздел "Environment Variables"
3. Обновите следующие переменные:
   - `TBANK_TERMINAL_ID` → `1763021044780`
   - `TBANK_PASSWORD` → `LtvNz3niZaEZQCHz`
   - `TBANK_API_URL` → `https://securepay.tinkoff.ru/v2/Init`
   - `NEXT_PUBLIC_TBANK_TERMINAL_ID` → `1763021044780`
   - `NEXT_PUBLIC_SITE_URL` → `https://www.arteeeco.ru`

4. После обновления переменных перезапустите деплоймент

## Шаг 4: Проверка работы

После обновления переменных:

1. **Локально**: Обновите `.env.local` и перезапустите сервер
2. **Production**: После деплоя на Vercel проверьте:
   - Создание платежа работает
   - Callback'и приходят и сохраняются в `payment_logs`
   - Статусы заказов обновляются корректно

## Важные замечания

- ✅ Для реального терминала используется **production URL**: `https://securepay.tinkoff.ru/v2/Init`
- ✅ Callback URL должен быть доступен из интернета (не localhost)
- ✅ Убедитесь, что домен в `NEXT_PUBLIC_SITE_URL` соответствует вашему реальному домену
- ✅ Все callback'и будут логироваться в таблицу `payment_logs` в Supabase

## Проверка логов

После создания платежа проверьте:

1. **В консоли сервера** должны быть логи:
   ```
   === T-Bank Create Payment - Incoming Request ===
   Using API URL: https://securepay.tinkoff.ru/v2/Init (PRODUCTION terminal)
   ```

2. **В таблице `payment_logs`** в Supabase должны появляться записи с:
   - `provider: 'tbank'`
   - `event: 'CONFIRMED'` (для успешных платежей)
   - `event: 'REJECTED'` или `'CANCELED'` (для неуспешных)

3. **В таблице `orders`** статусы должны обновляться:
   - `paid` - для успешных платежей
   - `cancelled` - для отмененных/отклоненных

## Поддержка

Если возникнут проблемы:
- Проверьте логи в консоли сервера
- Проверьте таблицу `payment_logs` в Supabase
- Убедитесь, что callback URL доступен из интернета
- Проверьте настройки терминала в личном кабинете T-Bank

