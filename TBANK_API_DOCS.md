# T-Bank API Документация и Настройка

## API Endpoint

**TBANK_API_URL** - это URL для метода Init (инициализации платежа):

- **Продакшн:** `https://securepay.tinkoff.ru/v2/Init`
- **Тестовая среда:** `https://rest-api-test.tinkoff.ru/v2/Init` (если требуется)

Этот URL указывается в переменной окружения `TBANK_API_URL` или используется по умолчанию.

## Где взять данные для интеграции

### 1. Terminal ID (TerminalKey)
- Войдите в личный кабинет T-Bank
- Перейдите в раздел "Интернет-эквайринг" → "Магазины"
- Выберите ваш магазин
- Перейдите в раздел "Терминалы"
- Скопируйте **Terminal ID** (TerminalKey)

### 2. Password (SecretKey)
- В том же разделе "Терминалы"
- Скопируйте **Пароль** (SecretKey/Password)
- ⚠️ Это секретный ключ, храните его безопасно!

### 3. API URL
- Обычно используется: `https://securepay.tinkoff.ru/v2/Init`
- Для тестовой среды может быть: `https://rest-api-test.tinkoff.ru/v2/Init`
- Уточните в личном кабинете или у поддержки T-Bank

## Формирование подписи (Token)

Согласно документации T-Bank, подпись формируется так:

1. **Поля для подписи:**
   - `Amount` - сумма в копейках
   - `Description` - описание заказа
   - `OrderId` - номер заказа
   - `TerminalKey` - идентификатор терминала
   - `Password` - секретный ключ

2. **Порядок:**
   - Все поля сортируются по алфавиту: `Amount`, `Description`, `OrderId`, `TerminalKey`
   - `Password` добавляется **В КОНЕЦ** строки (не в алфавитном порядке!)

3. **Формирование строки:**
   ```
   Amount + Description + OrderId + TerminalKey + Password
   ```

4. **Создание подписи:**
   - SHA-256 хэш от полученной строки
   - Результат в шестнадцатеричном формате

## Поля, которые НЕ включаются в подпись

- `Token` - сама подпись
- `SuccessURL` - URL успешной оплаты
- `FailURL` - URL неудачной оплаты
- `NotificationURL` - URL для уведомлений
- `Receipt` - данные чека (если есть)
- `DATA` - дополнительные данные (Email, Phone)

## Проверка настроек

Убедитесь, что в `.env.local` указаны:

```env
TBANK_TERMINAL_ID=ваш_terminal_id
TBANK_PASSWORD=ваш_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # для локальной разработки
```

## Полезные ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/intro)
- [Метод Init](https://developer.tbank.ru/eacq/intro/api/init)
- [Формирование подписи](https://developer.tbank.ru/eacq/intro/developer/setup_js/setup_iframe)


## API Endpoint

**TBANK_API_URL** - это URL для метода Init (инициализации платежа):

- **Продакшн:** `https://securepay.tinkoff.ru/v2/Init`
- **Тестовая среда:** `https://rest-api-test.tinkoff.ru/v2/Init` (если требуется)

Этот URL указывается в переменной окружения `TBANK_API_URL` или используется по умолчанию.

## Где взять данные для интеграции

### 1. Terminal ID (TerminalKey)
- Войдите в личный кабинет T-Bank
- Перейдите в раздел "Интернет-эквайринг" → "Магазины"
- Выберите ваш магазин
- Перейдите в раздел "Терминалы"
- Скопируйте **Terminal ID** (TerminalKey)

### 2. Password (SecretKey)
- В том же разделе "Терминалы"
- Скопируйте **Пароль** (SecretKey/Password)
- ⚠️ Это секретный ключ, храните его безопасно!

### 3. API URL
- Обычно используется: `https://securepay.tinkoff.ru/v2/Init`
- Для тестовой среды может быть: `https://rest-api-test.tinkoff.ru/v2/Init`
- Уточните в личном кабинете или у поддержки T-Bank

## Формирование подписи (Token)

Согласно документации T-Bank, подпись формируется так:

1. **Поля для подписи:**
   - `Amount` - сумма в копейках
   - `Description` - описание заказа
   - `OrderId` - номер заказа
   - `TerminalKey` - идентификатор терминала
   - `Password` - секретный ключ

2. **Порядок:**
   - Все поля сортируются по алфавиту: `Amount`, `Description`, `OrderId`, `TerminalKey`
   - `Password` добавляется **В КОНЕЦ** строки (не в алфавитном порядке!)

3. **Формирование строки:**
   ```
   Amount + Description + OrderId + TerminalKey + Password
   ```

4. **Создание подписи:**
   - SHA-256 хэш от полученной строки
   - Результат в шестнадцатеричном формате

## Поля, которые НЕ включаются в подпись

- `Token` - сама подпись
- `SuccessURL` - URL успешной оплаты
- `FailURL` - URL неудачной оплаты
- `NotificationURL` - URL для уведомлений
- `Receipt` - данные чека (если есть)
- `DATA` - дополнительные данные (Email, Phone)

## Проверка настроек

Убедитесь, что в `.env.local` указаны:

```env
TBANK_TERMINAL_ID=ваш_terminal_id
TBANK_PASSWORD=ваш_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # для локальной разработки
```

## Полезные ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/intro)
- [Метод Init](https://developer.tbank.ru/eacq/intro/api/init)
- [Формирование подписи](https://developer.tbank.ru/eacq/intro/developer/setup_js/setup_iframe)


## API Endpoint

**TBANK_API_URL** - это URL для метода Init (инициализации платежа):

- **Продакшн:** `https://securepay.tinkoff.ru/v2/Init`
- **Тестовая среда:** `https://rest-api-test.tinkoff.ru/v2/Init` (если требуется)

Этот URL указывается в переменной окружения `TBANK_API_URL` или используется по умолчанию.

## Где взять данные для интеграции

### 1. Terminal ID (TerminalKey)
- Войдите в личный кабинет T-Bank
- Перейдите в раздел "Интернет-эквайринг" → "Магазины"
- Выберите ваш магазин
- Перейдите в раздел "Терминалы"
- Скопируйте **Terminal ID** (TerminalKey)

### 2. Password (SecretKey)
- В том же разделе "Терминалы"
- Скопируйте **Пароль** (SecretKey/Password)
- ⚠️ Это секретный ключ, храните его безопасно!

### 3. API URL
- Обычно используется: `https://securepay.tinkoff.ru/v2/Init`
- Для тестовой среды может быть: `https://rest-api-test.tinkoff.ru/v2/Init`
- Уточните в личном кабинете или у поддержки T-Bank

## Формирование подписи (Token)

Согласно документации T-Bank, подпись формируется так:

1. **Поля для подписи:**
   - `Amount` - сумма в копейках
   - `Description` - описание заказа
   - `OrderId` - номер заказа
   - `TerminalKey` - идентификатор терминала
   - `Password` - секретный ключ

2. **Порядок:**
   - Все поля сортируются по алфавиту: `Amount`, `Description`, `OrderId`, `TerminalKey`
   - `Password` добавляется **В КОНЕЦ** строки (не в алфавитном порядке!)

3. **Формирование строки:**
   ```
   Amount + Description + OrderId + TerminalKey + Password
   ```

4. **Создание подписи:**
   - SHA-256 хэш от полученной строки
   - Результат в шестнадцатеричном формате

## Поля, которые НЕ включаются в подпись

- `Token` - сама подпись
- `SuccessURL` - URL успешной оплаты
- `FailURL` - URL неудачной оплаты
- `NotificationURL` - URL для уведомлений
- `Receipt` - данные чека (если есть)
- `DATA` - дополнительные данные (Email, Phone)

## Проверка настроек

Убедитесь, что в `.env.local` указаны:

```env
TBANK_TERMINAL_ID=ваш_terminal_id
TBANK_PASSWORD=ваш_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # для локальной разработки
```

## Полезные ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/intro)
- [Метод Init](https://developer.tbank.ru/eacq/intro/api/init)
- [Формирование подписи](https://developer.tbank.ru/eacq/intro/developer/setup_js/setup_iframe)


## API Endpoint

**TBANK_API_URL** - это URL для метода Init (инициализации платежа):

- **Продакшн:** `https://securepay.tinkoff.ru/v2/Init`
- **Тестовая среда:** `https://rest-api-test.tinkoff.ru/v2/Init` (если требуется)

Этот URL указывается в переменной окружения `TBANK_API_URL` или используется по умолчанию.

## Где взять данные для интеграции

### 1. Terminal ID (TerminalKey)
- Войдите в личный кабинет T-Bank
- Перейдите в раздел "Интернет-эквайринг" → "Магазины"
- Выберите ваш магазин
- Перейдите в раздел "Терминалы"
- Скопируйте **Terminal ID** (TerminalKey)

### 2. Password (SecretKey)
- В том же разделе "Терминалы"
- Скопируйте **Пароль** (SecretKey/Password)
- ⚠️ Это секретный ключ, храните его безопасно!

### 3. API URL
- Обычно используется: `https://securepay.tinkoff.ru/v2/Init`
- Для тестовой среды может быть: `https://rest-api-test.tinkoff.ru/v2/Init`
- Уточните в личном кабинете или у поддержки T-Bank

## Формирование подписи (Token)

Согласно документации T-Bank, подпись формируется так:

1. **Поля для подписи:**
   - `Amount` - сумма в копейках
   - `Description` - описание заказа
   - `OrderId` - номер заказа
   - `TerminalKey` - идентификатор терминала
   - `Password` - секретный ключ

2. **Порядок:**
   - Все поля сортируются по алфавиту: `Amount`, `Description`, `OrderId`, `TerminalKey`
   - `Password` добавляется **В КОНЕЦ** строки (не в алфавитном порядке!)

3. **Формирование строки:**
   ```
   Amount + Description + OrderId + TerminalKey + Password
   ```

4. **Создание подписи:**
   - SHA-256 хэш от полученной строки
   - Результат в шестнадцатеричном формате

## Поля, которые НЕ включаются в подпись

- `Token` - сама подпись
- `SuccessURL` - URL успешной оплаты
- `FailURL` - URL неудачной оплаты
- `NotificationURL` - URL для уведомлений
- `Receipt` - данные чека (если есть)
- `DATA` - дополнительные данные (Email, Phone)

## Проверка настроек

Убедитесь, что в `.env.local` указаны:

```env
TBANK_TERMINAL_ID=ваш_terminal_id
TBANK_PASSWORD=ваш_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # для локальной разработки
```

## Полезные ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/intro)
- [Метод Init](https://developer.tbank.ru/eacq/intro/api/init)
- [Формирование подписи](https://developer.tbank.ru/eacq/intro/developer/setup_js/setup_iframe)


## API Endpoint

**TBANK_API_URL** - это URL для метода Init (инициализации платежа):

- **Продакшн:** `https://securepay.tinkoff.ru/v2/Init`
- **Тестовая среда:** `https://rest-api-test.tinkoff.ru/v2/Init` (если требуется)

Этот URL указывается в переменной окружения `TBANK_API_URL` или используется по умолчанию.

## Где взять данные для интеграции

### 1. Terminal ID (TerminalKey)
- Войдите в личный кабинет T-Bank
- Перейдите в раздел "Интернет-эквайринг" → "Магазины"
- Выберите ваш магазин
- Перейдите в раздел "Терминалы"
- Скопируйте **Terminal ID** (TerminalKey)

### 2. Password (SecretKey)
- В том же разделе "Терминалы"
- Скопируйте **Пароль** (SecretKey/Password)
- ⚠️ Это секретный ключ, храните его безопасно!

### 3. API URL
- Обычно используется: `https://securepay.tinkoff.ru/v2/Init`
- Для тестовой среды может быть: `https://rest-api-test.tinkoff.ru/v2/Init`
- Уточните в личном кабинете или у поддержки T-Bank

## Формирование подписи (Token)

Согласно документации T-Bank, подпись формируется так:

1. **Поля для подписи:**
   - `Amount` - сумма в копейках
   - `Description` - описание заказа
   - `OrderId` - номер заказа
   - `TerminalKey` - идентификатор терминала
   - `Password` - секретный ключ

2. **Порядок:**
   - Все поля сортируются по алфавиту: `Amount`, `Description`, `OrderId`, `TerminalKey`
   - `Password` добавляется **В КОНЕЦ** строки (не в алфавитном порядке!)

3. **Формирование строки:**
   ```
   Amount + Description + OrderId + TerminalKey + Password
   ```

4. **Создание подписи:**
   - SHA-256 хэш от полученной строки
   - Результат в шестнадцатеричном формате

## Поля, которые НЕ включаются в подпись

- `Token` - сама подпись
- `SuccessURL` - URL успешной оплаты
- `FailURL` - URL неудачной оплаты
- `NotificationURL` - URL для уведомлений
- `Receipt` - данные чека (если есть)
- `DATA` - дополнительные данные (Email, Phone)

## Проверка настроек

Убедитесь, что в `.env.local` указаны:

```env
TBANK_TERMINAL_ID=ваш_terminal_id
TBANK_PASSWORD=ваш_secret_key
TBANK_API_URL=https://securepay.tinkoff.ru/v2/Init
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # для локальной разработки
```

## Полезные ссылки

- [Документация T-Bank API](https://developer.tbank.ru/eacq/intro)
- [Метод Init](https://developer.tbank.ru/eacq/intro/api/init)
- [Формирование подписи](https://developer.tbank.ru/eacq/intro/developer/setup_js/setup_iframe)

