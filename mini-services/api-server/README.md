# API Server для Railway

Этот сервер обрабатывает все API-запросы без лимита времени (в отличие от Vercel Hobby = 10 сек).

## Деплой на Railway

### 1. Создать проект на Railway

1. Откройте https://railway.app
2. Нажмите **New Project** → **Deploy from GitHub repo**
3. Выберите репозиторий `home_psychologist`
4. В настройках:
   - **Root Directory:** `mini-services/api-server`
   - **Build Command:** `bun install`
   - **Start Command:** `bun run index.ts`
   - **Port:** `3001` (Railway определит автоматически)

### 2. Добавить переменные окружения

В Railway → Variables:

```
ZAI_API_KEY=ваш_ключ_z_ai
ZAI_BASE_URL=https://api.z.ai/api/paas/v4
```

### 3. Получить URL

После деплоя Railway даст URL вида:
```
https://api-server-production-xxxx.up.railway.app
```

### 4. Настроить Vercel

В Vercel → ваш проект → Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://api-server-production-xxxx.up.railway.app
```

После этого фронтенд будет отправлять API-запросы на Railway (без лимита 10 сек).

## Локальная разработка

В песочнице API-сервер запускается автоматически:
```bash
bun --hot mini-services/api-server/index.ts
```

Caddy проксирует `/api/*` на `localhost:3001`.

## Эндпоинты

- POST /api/diagnose — стандартный диагноз
- POST /api/neuro-diagnose — нейро-диагноз
- POST /api/tale-diagnose — сказкотерапия
- POST /api/card-diagnose — метафорические карты
- POST /api/slide-create — слайды
- POST /api/chat — AI-чат
- POST /api/consultant-chat — AI-консультант
- GET/POST /api/activity — трекинг активности
