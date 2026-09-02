# Worklog — Домашний психолог

---
Task ID: 1
Agent: main
Task: Перевести все 7 Z.ai API-роутов на Vercel Edge Runtime для исправления 502 ошибок

Work Log:
- Создан общий хелпер `/src/lib/zai-edge.ts` с `callZaiChatEdge` и `callZaiMessagesEdge`
- Хелпер использует 22-сек таймаут (оставляем 3 сек запаса до Edge 25s лимита)
- Удалены все `fs`/`path` импорты из роутов (Edge не поддерживает)
- Удалены `maxDuration = 60` (не применимо к Edge)
- Конвертированы 7 роутов:
  - `/api/diagnose` → Edge
  - `/api/neuro-diagnose` → Edge
  - `/api/tale-diagnose` → Edge
  - `/api/card-diagnose` → Edge
  - `/api/slide-create` → Edge
  - `/api/chat` → Edge (с историей сообщений через callZaiMessagesEdge)
  - `/api/consultant-chat` → Edge (с историей сообщений)
- Роуты `/api/activity`, `/api/clients`, `/api/sessions`, `/api/transcribe` оставлены на Node.js (не обращаются к Z.ai, таймаут не критичен)
- Проверена сборка `bun run build` — успешна, все роуты видны как `ƒ` (Dynamic)

Stage Summary:
- Все 7 Z.ai-зависимых роутов переведены на Edge Runtime
- Таймаут увеличен с 10 сек до 25 сек (лимит Edge на Hobby плане)
- Создан переиспользуемый хелпер `zai-edge.ts` с ретраями и фолбэком по моделям
- Build проходит без ошибок
- Инфраструктура готова: если 25 сек не хватит, можно быстро переключиться на Railway через `NEXT_PUBLIC_API_URL` (api-server на Bun уже написан в `mini-services/api-server/index.ts`)
- Следующий шаг: задеплоить на Vercel и протестировать в VK/OK
