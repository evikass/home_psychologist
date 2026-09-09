# Деплой на VK Hosting (обязательно для VK Mini Apps)

VK отклонил заявку: «приложение не загружается на мобильных устройствах.
Рекомендуем использовать хостинг статики VK».

**Причина:** Vercel может быть недоступен на территории РФ → пользователи
VK не могут попасть в сервис. VK требует хостинг, доступный в РФ.

**Решение:** Деплой статической версии фронтенда в VK Hosting (доступен в РФ,
бесплатно). API остаётся на Vercel/Railway/VPS (или переезжает на русский хостинг).

## Архитектура после деплоя

```
┌─────────────────────────────────────────────────────────────────┐
│  Пользователь VK (мобильный, РФ)                                │
└─────────────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────────────┐
│  VK Mini App (статика)                                          │
│  URL: https://vk.com/app52589205                                │
│  Источник: VK Hosting (доступен в РФ, бесплатно)                │
│  Содержит: HTML + CSS + JS (статический экспорт Next.js)        │
└─────────────────────────────────────────────────────────────────┘
            ↓ fetch с NEXT_PUBLIC_API_URL
┌─────────────────────────────────────────────────────────────────┐
│  API сервер (Vercel/Railway/VPS)                                │
│  - /api/diagnose, /api/neuro-diagnose, /api/tale-diagnose       │
│  - /api/card-diagnose, /api/slide-create                        │
│  - /api/chat, /api/consultant-chat                              │
│  - /api/progress (синхронизация), /api/activity                 │
│  Обращается к Z.ai (GLM-4.5-flash)                              │
└─────────────────────────────────────────────────────────────────┘
```

## Шаг 1. Получить access_token для VK Hosting

1. Откройте https://dev.vk.com/ru/api/access-token/getting-started
2. Создайте standalone-приложение (или используйте существующее mini app)
3. Получите токен с правами `offline, vk_mini_app`:
   ```
   https://oauth.vk.com/authorize?client_id=52589205&scope=offline,vk_mini_app&response_type=token&v=5.199
   ```
4. Скопируйте `access_token` из URL-редиректа (после `#access_token=`)

## Шаг 2. Добавить секреты в GitHub

Откройте https://github.com/evikass/home_psychologist/settings/secrets/actions
и добавьте:

| Имя | Значение |
|-----|----------|
| `MINI_APPS_ACCESS_TOKEN` | Токен из шага 1 |
| `NEXT_PUBLIC_API_URL` | URL API сервера (см. Шаг 3) |

## Шаг 3. Выбрать, где живёт API

### Вариант A: Оставить на Vercel (бесплатно, но может быть недоступен в РФ)

`NEXT_PUBLIC_API_URL=https://home-psychologist.vercel.app` (ваш домен Vercel)

**Проблема:** Если Vercel недоступен в РФ, то и API не работает.
Фронтенд загрузится (с VK Hosting), но диагноз не сработает.

### Вариант B: Railway ($5/мес) — рекомендовано, без лимита времени

1. Зарегистрируйтесь на https://railway.app
2. New Project → Deploy from GitHub → `evikass/home_psychologist`
3. Root Directory: `mini-services/api-server`
4. Variables:
   ```
   ZAI_API_KEY=ваш_ключ_z_ai
   ZAI_BASE_URL=https://api.z.ai/api/paas/v4
   ```
5. Получите URL: `https://home-psychologist-api-production-xxxx.up.railway.app`
6. Установите `NEXT_PUBLIC_API_URL=https://home-psychologist-api-production-xxxx.up.railway.app`

**Плюсы:**
- $5/мес (включено $5 кредита — для нашего объёма хватает)
- Без лимита времени (Z.ai может отвечать 15-20 сек — не проблема)
- Доступен в РФ

**Минусы:**
- $5/мес

### Вариант C: Русский VPS (Timeweb, Beget, Selectel) — дешевле

1. Закажите VPS на https://timeweb.cloud (от 200 руб/мес = ~$2-3)
2. Установите Node.js 20 + git
3. Клонируйте репозиторий
4. Запустите `mini-services/api-server` через PM2:
   ```bash
   git clone https://github.com/evikass/home_psychologist.git
   cd home_psychologist/mini-services/api-server
   npm install
   ZAI_API_KEY=ваш_ключ ZAI_BASE_URL=https://api.z.ai/api/paas/v4 pm2 start index.ts
   ```
5. Настройте Nginx как reverse proxy (порт 80 → 3001)
6. Получите домен (например, `api.ваш-домен.ru`)
7. Установите `NEXT_PUBLIC_API_URL=https://api.ваш-домен.ru`

**Плюсы:**
- Дешевле на длительной дистанции (~$2-3/мес)
- Полностью под вашим контролем
- Доступен в РФ гарантированно

**Минусы:**
- Нужно настраивать VPS вручную
- Нужно следить за обновлениями ОС

### Вариант D: Yandex Cloud (есть грант 3000 руб новым пользователям)

1. Зарегистрируйтесь на https://console.cloud.yandex.ru
2. Активируйте грант 3000 руб (~$30, хватит на 3-4 месяца)
3. Создайте VM (Compute Cloud) с Ubuntu 22.04
4. Настройте как в Варианте C

**Плюсы:**
- Бесплатно на первые 3-4 месяца (грант)
- Доступен в РФ
- Поддерживает Node.js/Bun нативно

## Шаг 4. Деплой в VK Hosting (автоматический)

После добавления секретов в GitHub (Шаг 2), каждый `push` в `main` будет
автоматически деплоить статику в VK Hosting через GitHub Actions.

Workflow: `.github/workflows/vk-hosting.yml`

**Ручной деплой** (для проверки):

```bash
# Установите CLI
npm install -g @vkontakte/vk-miniapps-deploy

# Авторизуйтесь (один раз) — попросит access_token
vk-miniapps-deploy

# Или через env:
MINI_APPS_ACCESS_TOKEN=ВАШ_ТОКЕН MINI_APPS_ENVIRONMENT=production bun run deploy:vk
```

**Конфиг** уже создан: `vk-hosting-config.json`:
```json
{
  "static_path": "out",
  "app_id": "52589205",
  "endpoints": {
    "mobile": "index.html",
    "mvk": "index.html",
    "web": "index.html"
  }
}
```

## Шаг 5. Обновить URL в настройках VK Mini App

После первого деплоя:

1. Откройте https://dev.vk.com → ваше приложение
2. Вкладка «Деплой» → найдите свежий деплой
3. Скопируйте URL из VK Hosting (вида `https://id.vk-app.ru/...`)
4. Установите его как основной URL для всех платформ (mobile, mvk, web)
5. Сохраните

## Шаг 6. Отправить на модерацию

В описании укажите:
```
Исправлено: хостинг статики во VK Hosting (доступен в РФ)
- Фронтенд: VK Hosting (доступен в РФ, бесплатно)
- API: отдельный сервер (Railway/VPS/Vercel)
- Все функции работают: ИИ-диагностика, синхронизация, онбординг
- Приложение загружается на мобильных устройствах в РФ
```

## Проверка доступности

После деплоя откройте с мобильного в РФ:
1. https://vk.com/app52589205 — должно загрузиться
2. Нажмите «Диагноз» — должно сработать
3. Если не работает ИИ — проверьте `NEXT_PUBLIC_API_URL` и доступность API

## Альтернатива: полностью статический сайт (без ИИ)

Если нет бюджета на API сервер, можно задеплоить **демо-версию** в VK Hosting:
- Все API-запросы заменяются на предзаготовленные ответы
- Это та же версия, что на GitHub Pages
- Минус: не будет живого ИИ-диагноза

```bash
# Демо-сборка (без обращения к API)
STATIC_EXPORT=true NEXT_PUBLIC_STATIC_DEMO=true bun run next build

# Задеплоить в VK Hosting
MINI_APPS_ACCESS_TOKEN=ВАШ_ТОКЕН MINI_APPS_ENVIRONMENT=production \
  bun run deploy:vk
```

VK модератор пропустит, но функционал будет урезанный.

## Частые проблемы

**«User authorization failed: invalid session»**
→ Сбросьте кэш токена:
```bash
rm ~/.config/configstore/@vkontakte/vk-miniapps-deploy.json
```

**«Фронтенд грузится, но диагноз не работает»**
→ API недоступен в РФ. Переключите `NEXT_PUBLIC_API_URL` на Railway или русский VPS.

**«CORS ошибка»**
→ API сервер должен отдавать заголовок `Access-Control-Allow-Origin: *`.
В нашем `mini-services/api-server/index.ts` это уже настроено.
На Vercel — тоже работает (Next.js API роуты поддерживают CORS).

**«vk-miniapps-deploy: command not found»**
→ `npm install -g @vkontakte/vk-miniapps-deploy`

## Источники

- VK Mini Apps Hosting: https://dev.vk.com/ru/mini-apps/development/hosting/overview
- VK Mini Apps Deploy CLI: https://github.com/VKCOM/vk-miniapps-deploy
- Получение токена: https://dev.vk.com/ru/api/access-token/getting-started
