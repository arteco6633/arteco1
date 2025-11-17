# Диагностика проблем с Яндекс Pay SDK

## Проблема: SDK не загружается на production

### Симптомы:
- Ошибка "Failed to load Yandex Pay SDK"
- Ошибка "SDK load timeout"
- SDK не загружается даже на HTTPS домене

### Возможные причины и решения:

#### 1. Домен не добавлен в белый список в консоли Яндекс Pay

**Решение:**
1. Войдите в личный кабинет: https://console.pay.yandex.ru/settings
2. Перейдите в раздел "Настройки"
3. Найдите раздел "Разрешенные домены" или "Allowed Domains"
4. Добавьте ваш домен: `arteeeco.ru` и `www.arteeeco.ru`
5. Сохраните изменения

**Важно:** Яндекс Pay может блокировать загрузку SDK с доменов, которые не добавлены в белый список.

#### 2. CORS ошибки

**Проверка:**
- Откройте консоль браузера (F12)
- Перейдите на вкладку "Network"
- Найдите запрос к `https://pay.yandex.ru/sdk/v2/pay.js`
- Проверьте статус ответа и заголовки CORS

**Решение:**
- Убедитесь, что домен добавлен в белый список (см. пункт 1)
- Проверьте, что используется HTTPS (не HTTP)
- Проверьте настройки CORS в консоли Яндекс Pay

#### 3. Блокировка скрипта браузером или расширениями

**Проверка:**
- Отключите все расширения браузера
- Попробуйте в режиме инкогнито
- Проверьте настройки безопасности браузера

**Решение:**
- Добавьте домен в исключения блокировщиков рекламы
- Проверьте настройки антивируса/брандмауэра

#### 4. Проблемы с переменными окружения

**Проверка:**
Убедитесь, что в Vercel настроены следующие переменные:

```env
YANDEX_PAY_MERCHANT_ID=d1c40178-a7be-40c2-add3-700b699f09cb
YANDEX_PAY_API_KEY=your_api_key_here
YANDEX_PAY_ENV=production  # или 'test' для тестовой среды
NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID=d1c40178-a7be-40c2-add3-700b699f09cb
```

**Решение:**
- Проверьте значения в Vercel → Settings → Environment Variables
- Убедитесь, что переменные добавлены для production окружения
- Пересоберите проект после изменения переменных

#### 5. Проблемы на стороне сервера Яндекс Pay

**Проверка:**
- Проверьте статус сервиса: https://status.yandex.ru/
- Попробуйте загрузить SDK напрямую в браузере: `https://pay.yandex.ru/sdk/v2/pay.js`

**Решение:**
- Если SDK не загружается напрямую, проблема на стороне Яндекс Pay
- Обратитесь в поддержку: https://pay.yandex.ru/docs/ru/support/

### Диагностические шаги:

1. **Проверьте консоль браузера:**
   ```javascript
   // В консоли браузера выполните:
   console.log('YaPay available:', typeof window.YaPay !== 'undefined')
   console.log('Scripts:', document.querySelectorAll('script[src*="pay.yandex.ru"]').length)
   ```

2. **Проверьте Network tab:**
   - Откройте DevTools → Network
   - Обновите страницу
   - Найдите запрос к `pay.yandex.ru/sdk/v2/pay.js`
   - Проверьте статус (должен быть 200)
   - Проверьте заголовки ответа

3. **Проверьте DOM:**
   ```javascript
   // В консоли браузера:
   const scripts = document.querySelectorAll('script[src*="pay.yandex.ru"]')
   scripts.forEach(s => console.log('Script:', s.src, 'Loaded:', s.complete))
   ```

4. **Проверьте события:**
   ```javascript
   // В консоли браузера:
   window.addEventListener('yandex-pay-sdk-loaded', () => {
     console.log('✓ SDK loaded event fired')
   })
   window.addEventListener('yandex-pay-sdk-error', (e) => {
     console.error('✗ SDK error event:', e.detail)
   })
   ```

### Что было исправлено в коде:

1. ✅ Улучшена логика загрузки SDK с множественными проверками
2. ✅ Добавлена альтернативная динамическая загрузка SDK
3. ✅ Улучшена обработка ошибок с детальными сообщениями
4. ✅ Добавлены события для отслеживания загрузки SDK
5. ✅ Исправлен URL SDK в сообщениях об ошибках (v1 → v2)
6. ✅ Увеличен таймаут ожидания SDK (15 → 20 секунд)

### Следующие шаги:

1. Проверьте настройки домена в консоли Яндекс Pay
2. Проверьте переменные окружения в Vercel
3. Проверьте консоль браузера на наличие ошибок
4. Попробуйте загрузить SDK напрямую в браузере
5. Если проблема сохраняется, обратитесь в поддержку Яндекс Pay

### Полезные ссылки:

- Консоль Яндекс Pay: https://console.pay.yandex.ru/settings
- Документация: https://pay.yandex.ru/docs/ru/custom/integration-guide
- Поддержка: https://pay.yandex.ru/docs/ru/support/
- Статус сервиса: https://status.yandex.ru/

