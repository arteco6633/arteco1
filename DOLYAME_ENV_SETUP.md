# Настройка переменных окружения для Долями

## Данные для подключения

После получения учетных данных от менеджера Долями, добавьте следующие переменные в ваш `.env.local` файл:

```env
# Долями (Dolyame) Payment Configuration
DOLYAME_LOGIN=6a35abec-f11a-4c02-95ed-2f566d13bd23
DOLYAME_PASSWORD=8926416Salavat1996s@
DOLYAME_API_URL=https://partner.dolyame.ru/v1/orders
NEXT_PUBLIC_DOLYAME_SITE_ID=your_site_id  # Site ID для сниппета (получите от менеджера Долями)

# Пути к mTLS сертификатам
# После выпуска сертификата укажите пути к файлам:
DOLYAME_CERT_PATH=/path/to/client.crt
DOLYAME_KEY_PATH=/path/to/client.key
DOLYAME_CA_PATH=/path/to/ca.crt
```

## Шаги настройки

### 1. Добавьте переменные в `.env.local`

Создайте или откройте файл `.env.local` в корне проекта и добавьте:

```env
# Долями (Dolyame) Payment Configuration
DOLYAME_LOGIN=6a35abec-f11a-4c02-95ed-2f566d13bd23
DOLYAME_PASSWORD=8926416Salavat1996s@
DOLYAME_API_URL=https://partner.dolyame.ru/v1/orders
NEXT_PUBLIC_DOLYAME_SITE_ID=your_site_id  # Site ID для сниппета (получите от менеджера Долями)
```

### 2. Выпуск mTLS сертификата

Для работы с API Долями требуется mTLS сертификат:

1. **Перейдите в личный кабинет Т‑Бизнеса**
2. **Выпустите mTLS сертификат** согласно инструкциям:
   - [Инструкция по выпуску сертификата](https://dolyame.ru/develop/api/preparation/)
3. **Сохраните файлы сертификата:**
   - `client.crt` — клиентский сертификат
   - `client.key` — приватный ключ
   - `ca.crt` — CA сертификат (опционально)

### 3. Укажите пути к сертификатам

После сохранения сертификатов, добавьте пути в `.env.local`:

**Для локальной разработки:**
```env
# Пример для macOS/Linux (абсолютные пути)
DOLYAME_CERT_PATH=/Users/anastasiashorohova/Desktop/Салават /ARTECO/certs/client.crt
DOLYAME_KEY_PATH=/Users/anastasiashorohova/Desktop/Салават /ARTECO/certs/client.key
DOLYAME_CA_PATH=/Users/anastasiashorohova/Desktop/Салават /ARTECO/certs/ca.crt

# Или относительные пути от корня проекта
DOLYAME_CERT_PATH=./certs/client.crt
DOLYAME_KEY_PATH=./certs/client.key
DOLYAME_CA_PATH=./certs/ca.crt
```

**Важно:**
- Создайте папку `certs` в корне проекта для хранения сертификатов
- Добавьте `certs/` в `.gitignore`, чтобы не коммитить сертификаты в git
- Убедитесь, что сертификаты в формате PEM

### 4. Настройка на Vercel (для production)

Для деплоя на Vercel:

1. **Перейдите в настройки проекта** → **Environment Variables**
2. **Добавьте переменные:**
   - `DOLYAME_LOGIN` = `6a35abec-f11a-4c02-95ed-2f566d13bd23`
   - `DOLYAME_PASSWORD` = `8926416Salavat1996s@`
   - `DOLYAME_API_URL` = `https://partner.dolyame.ru/v1/orders`
   - `NEXT_PUBLIC_DOLYAME_SITE_ID` = `your_site_id` (получите от менеджера Долями)

3. **Для сертификатов на Vercel:**

   **Вариант 1: Использовать Vercel Secrets (рекомендуется)**
   - Перейдите в **Settings** → **Secrets**
   - Создайте секреты:
     - `DOLYAME_CERT` — содержимое файла `client.crt`
     - `DOLYAME_KEY` — содержимое файла `client.key`
     - `DOLYAME_CA` — содержимое файла `ca.crt` (если есть)
   
   Затем в коде можно будет читать их через `process.env.DOLYAME_CERT`

   **Вариант 2: Загрузить сертификаты при деплое**
   - Используйте Vercel Build Command для копирования сертификатов
   - Или храните сертификаты в зашифрованном виде в переменных окружения (base64)

## Проверка настройки

После добавления переменных:

1. **Перезапустите сервер разработки:**
   ```bash
   npm run dev
   ```

2. **Проверьте логи** при создании заказа с оплатой через Долями:
   - Ищите строки `=== Долями Create Order - Incoming Request ===`
   - Убедитесь, что сертификаты загружены: `mTLS certificates loaded successfully`

3. **Протестируйте создание заявки:**
   - Добавьте товар в корзину
   - Выберите "Оплата частями с Долями"
   - Нажмите "Оплатить частями с Долями"
   - Проверьте, что заявка создается и происходит редирект на страницу оплаты Долями

## Безопасность

⚠️ **ВАЖНО:**
- **НЕ коммитьте** `.env.local` в git
- **НЕ коммитьте** сертификаты в git
- Добавьте в `.gitignore`:
  ```
  .env.local
  certs/
  *.crt
  *.key
  *.pem
  ```

## Полный пример `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zijajicude.beget.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://www.arteeeco.ru

# T-Bank
TBANK_TERMINAL_ID=1763021044780
TBANK_PASSWORD=LtvNz3niZaEZQCHz
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_TBANK_TERMINAL_ID=1763021044780

# Долями
DOLYAME_LOGIN=6a35abec-f11a-4c02-95ed-2f566d13bd23
DOLYAME_PASSWORD=8926416Salavat1996s@
DOLYAME_API_URL=https://partner.dolyame.ru/v1/orders
NEXT_PUBLIC_DOLYAME_SITE_ID=your_site_id
DOLYAME_CERT_PATH=./certs/client.crt
DOLYAME_KEY_PATH=./certs/client.key
DOLYAME_CA_PATH=./certs/ca.crt
```

## Поддержка

Если возникли проблемы:
- Проверьте логи в консоли и Vercel
- Убедитесь, что все переменные окружения установлены
- Проверьте, что пути к сертификатам указаны правильно
- Обратитесь в поддержку Долями: partners@dolyame.ru

