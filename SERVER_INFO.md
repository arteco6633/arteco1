# 🖥 Информация о сервере Supabase на Beget

## 📋 Данные подключения

### 🌐 Адрес сервера
- **URL**: https://zijajicude.beget.app
- **IP**: 62.113.97.52
- **Домен**: zijajicude.beget.app

### 🔑 SSH доступ
```bash
# Подключение по SSH
ssh root@62.113.97.52

# Или используя SSH ключ
ssh -i ~/.ssh/id_rsa root@62.113.97.52
```

**Ваш SSH ключ:**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQCw/GJEECIwKpKUjAeDukovu6bLeo7qn1sW5Za+AWDZqQPsPpGpCF/UDeS78sfUbvcB30StAYky8l570AcWqhEHnMiSQaJYylIlzo9DBVry/834R3KB/Zz5EmSL2OOLF5EdemP4M06tz6R7B7NFY5K0LJfGTqGJnz9r3DPSxjuJMlNPAh9PSyYMpviCI9imLlvSq264mKVN+9cfobfywtDVjFrU8pB/7Oyv00TCmWXqtGb+44GQYUPBbYJv4elcrTRa6ximCjecYfoXhdgngLUyuGIVHRrSGZILjvOOEUjzYXvB3ref6PGo1MN1NFlJKlFenfs8OV5RHuyClSXj7sCmZhf22DPVINmoIJLDLMUGmCU8jVCs0qx6qWkZxpeqDKo7BpchnNVpRdo+YhILezRrNlf6iFeP+3aWEmv6I1IG5RWSsaqoRoFySGYsqfWtCWFw+NfJZaCo4T7jhkCAHJtY0Byr56UpsgTgr6J940ClY+HdJRwpu7r/IWp53hHBzX8= anastasiashorohova@MacBook-Air
```

**Пароль:**
```
8926416Salavat1996s@
```

### 🔐 Supabase Dashboard
- **URL**: https://zijajicude.beget.app
- **Username**: arteco
- **Password**: 8926416Salavat1996s@
- **Email**: ibgroup.salavat@gmail.com

### 🔑 API Ключи

#### ANON KEY (публичный):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNTIzMjAwLCJleHAiOjE5MTkyODk2MDB9.l9rF02tJ4OKoCSqVsKeHnBR47mYkFG5BxF_Imkz9tcs
```

#### SERVICE ROLE KEY (административный):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjE1MjMyMDAsImV4cCI6MTkxOTI4OTYwMH0.czdG5JO8AbL1FIYcFOlWEeaRcWENltD2gNSX9YLY8Pk
```

#### POSTGRES PASSWORD:
```
YKCDIGFW2ydTRikttFqG4A0UtwMCKMf8
```

#### JWT SECRET:
```
xC6gGu5/NwbtUaGaOPnsfUMJuaQky0xBkH4nlv1nBco=
```

---

## 📊 Версия Supabase
**Версия**: 1.25.04

---

## 🗄 База данных

### PostgreSQL подключение:
```bash
# С локального компьютера
psql -h 62.113.97.52 -U postgres -d postgres

# Или через SSH туннель
ssh -L 5432:localhost:5432 root@62.113.97.52
# Затем:
psql -h localhost -U postgres -d postgres
```

**Пароль БД**: `YKCDIGFW2ydTRikttFqG4A0UtwMCKMf8`

---

## 🛠 Полезные команды

### Подключение к серверу
```bash
ssh root@62.113.97.52
```

### Проверка статуса Supabase
```bash
# После подключения к серверу
docker ps | grep supabase
```

### Просмотр логов
```bash
# Логи Supabase
docker logs supabase-kong
docker logs supabase-postgres
```

### Подключение к PostgreSQL
```bash
# На сервере
docker exec -it supabase-db psql -U postgres
```

---

## 🔒 Безопасность

⚠️ **Важно**:
- НЕ публикуйте эти ключи в Git
- Используйте `.env.local` для локальной разработки
- В production используйте безопасное хранилище секретов
- RLS политики настроены для админ-панели

---

## 📝 Обновление подключения

После переключения с облачного Supabase на ваш сервер:
1. ✅ Обновлен `supabase.js`
2. ✅ Обновлен `assets/js/admin.js`
3. ✅ Обновлен `env.example.txt`
4. ⏳ Нужно создать структуру БД на новом сервере

---

## 🚀 Следующие шаги

1. **Подключиться к серверу по SSH**
2. **Применить SQL схему** (`database_schema.sql`)
3. **Создать таблицы и данные**
4. **Применить RLS политики** (`fix_rls_policies.sql`)
5. **Протестировать админ-панель**

---

**Дата обновления**: 27 октября 2025

