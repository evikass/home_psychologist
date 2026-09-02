# API Server для Railway — БЕЗ лимита времени

Решает проблему 502/504 ошибок на Vercel Hobby (10 сек лимит).
Railway Hobby = $5/мес (с включёнными $5 кредита) — **без лимита времени**.

## Почему Railway?

| Платформа | Лимит времени | Цена |
|-----------|--------------|------|
| Vercel Hobby | **10 сек** ❌ | Бесплатно |
| Vercel Pro | 60 сек | $20/мес |
| Railway Hobby | **Без лимита** ✅ | $5/мес (вкл. $5 кредита) |
| Fly.io Free | 300 сек | Бесплатно (но сложнее) |

Z.ai GLM-4.5-flash генерирует диагноз за 5-15 сек — на Vercel Hobby не успевает, на Railway — без проблем.

## Деплой на Railway (5 минут)

### Шаг 1. Создать аккаунт Railway
1. Откройте https://railway.app
2. Нажмите **Login** → авторизуйтесь через GitHub (тот же, что и для Vercel)

### Шаг 2. Создать проект из GitHub
1. Нажмите **New Project** → **Deploy from GitHub repo**
2. Выберите репозиторий `evikass/home_psychologist`
3. **Настройте деплой:**
   - **Root Directory:** `mini-services/api-server`
   - Railway автоматически определит Bun по `package.json`

### Шаг 3. Добавить переменные окружения
В Railway → ваш проект → **Variables**:

```
ZAI_API_KEY=ваш_ключ_z_ai
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
```

Получить ключ: https://z.ai/manage/apikey

### Шаг 4. Получить URL
После деплоя Railway даст URL вида:
```
https://home-psychologist-api-production-xxxx.up.railway.app
```

Проверьте: откройте в браузере
```
https://ваш-domain.up.railway.app/api/debug-env
```
Должен вернуться JSON с состоянием env и тестом моделей.

### Шаг 5. Настроить Vercel
В Vercel → ваш проект → **Settings → Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://ваш-domain.up.railway.app
```

**Важно:** добавьте для всех сред (Production, Preview, Development).

### Шаг 6. Redeploy на Vercel
Vercel → Deployments → ⋮ → **Redeploy**

После этого фронтенд на Vercel будет отправлять все API-запросы на Railway (без 10 сек лимита).

## Проверка работы

1. Откройте VK Mini App
2. Нажмите «Диагноз», опишите ситуацию
3. Должен прийти ответ за 5-15 сек
4. Если работает — можно повторно отправлять в VK на модерацию

## Локальная разработка

В песочнице API-сервер запускается автоматически:
```bash
bun --hot mini-services/api-server/index.ts
```

Caddy проксирует `/api/*` на `localhost:3001`.

## Эндпоинты

| Метод | Путь | Назначение |
|-------|------|-----------|
| POST | /api/diagnose | Стандартный диагноз (5 режимов) |
| POST | /api/neuro-diagnose | Нейро-диагноз (8 уровней MIPS) |
| POST | /api/tale-diagnose | Сказкотерапия |
| POST | /api/card-diagnose | Метафорические карты |
| POST | /api/slide-create | Слайды-сказки |
| POST | /api/chat | AI-чат (с историей) |
| POST | /api/consultant-chat | AI-консультант (с историей) |
| POST | /api/transcribe | Голос в текст |
| GET/POST | /api/activity | Трекинг активности |
| GET/POST | /api/clients | CRM для психологов |
| GET/POST | /api/sessions | Сессии клиентов |
| GET | /api/debug-env | Диагностика env |

## Стоимость

- **Railway Hobby:** $5/мес (включено $5 кредита)
- При лёгкой нагрузке (до ~100 запросов/день) — весь кредит уходит в счёт
- При превышении — оплата по использованию (~$0.0001 за запрос)

## Альтернатива: Fly.io (бесплатно)

Если $5/мес дорого, можно развернуть на Fly.io:
- Бесплатно до 3 small VM
- Без лимита времени
- Сложнее настраивать
- Инструкция: https://fly.io/docs/languages-and-frameworks/bun/
