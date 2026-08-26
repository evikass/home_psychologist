/**
 * API-сервер на порту 3001.
 * Обрабатывает все /api/* запросы без лимита времени (в отличие от Vercel Hobby = 10 сек).
 *
 * Запускается: bun --hot mini-services/api-server/index.ts
 *
 * Эндпоинты:
 * - POST /api/diagnose — стандартный диагноз
 * - POST /api/neuro-diagnose — нейро-диагноз
 * - POST /api/tale-diagnose — сказкотерапия
 * - POST /api/card-diagnose — метафорические карты
 * - POST /api/slide-create — слайды
 * - POST /api/chat — AI-чат
 * - POST /api/consultant-chat — AI-консультант
 * - POST /api/transcribe — голос в текст
 * - GET/POST /api/activity — трекинг активности
 * - GET /api/clients — CRM
 * - GET/POST /api/sessions — сессии клиентов
 * - GET /api/debug-env — диагностика
 */

const PORT = 3001;

// === КОНФИГ Z.AI ===
function getZaiConfig() {
  const envKey = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY || process.env.ZAI_KEY;
  const envUrl = process.env.ZAI_BASE_URL || process.env.Z_AI_BASE_URL || "https://api.z.ai/api/paas/v4";

  if (envKey) return { apiKey: envKey, baseUrl: envUrl };

  // Fallback: config file
  try {
    // @ts-ignore
    const fs = await import("fs");
    const configPaths = ["/etc/.z-ai-config", "./.z-ai-config"];
    for (const fp of configPaths) {
      try {
        if (fs.existsSync(fp)) {
          const c = JSON.parse(fs.readFileSync(fp, "utf-8"));
          if (c.baseUrl && c.apiKey) {
            return { apiKey: c.apiKey, baseUrl: c.baseUrl, token: c.token, chatId: c.chatId, userId: c.userId };
          }
        }
      } catch {}
    }
  } catch {}

  return { apiKey: "", baseUrl: envUrl };
}

const MODELS = ["glm-4.5-flash", "glm-4.6-flash", "glm-4-flash-250414", "glm-4-flash", "glm-4-air", "glm-4-plus", "glm-4"];

// === ВСПОМОГАТЕЛЬНЫЕ ===

function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const f = text.indexOf("{"), l = text.lastIndexOf("}");
  if (f === -1 || l === -1) throw new Error("No JSON");
  return JSON.parse(text.slice(f, l + 1));
}

function parseUA(ua: string): { browser: string; device: string } {
  let browser = "Браузер";
  if (/YaBrowser/.test(ua)) browser = "Яндекс";
  else if (/Edg/.test(ua)) browser = "Edge";
  else if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
  else if (/Firefox/.test(ua)) browser = "Firefox";
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = "Safari";

  let device = "desktop";
  if (/Mobile|Android|iPhone/.test(ua)) device = "mobile";
  else if (/iPad|Tablet/.test(ua)) device = "tablet";
  return { browser, device };
}

// In-memory активность
type ActivityEntry = { id: string; type: string; label: string; details: string | null; browser: string; device: string; createdAt: string };
const activityLogs: ActivityEntry[] = [];

// === ВЫЗОВ Z.AI ===
async function callZai(systemPrompt: string, userText: string, maxTokens = 1500, temperature = 0.7) {
  const config = getZaiConfig();
  if (!config.apiKey) throw new Error("Ключ Z.ai не настроен");

  const url = `${config.baseUrl}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.apiKey}`,
    "X-Z-AI-From": "Z",
  };
  if (config.token) headers["X-Token"] = config.token;
  if (config.chatId) headers["X-Chat-Id"] = config.chatId;
  if (config.userId) headers["X-User-Id"] = config.userId;

  for (const model of MODELS) {
    console.log(`[api] trying model: ${model}`);
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 55000);
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userText },
            ],
            temperature,
            max_tokens: maxTokens,
            thinking: { type: "disabled" },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const bodyText = await response.text();
        if (response.ok) {
          let data: unknown;
          try { data = JSON.parse(bodyText); } catch { continue; }
          const msg = (data as any)?.choices?.[0]?.message ?? {};
          const content = msg.content || msg.reasoning_content || "";
          if (content) {
            console.log(`[api] success: ${model}, len: ${content.length}`);
            return content;
          }
          continue;
        }

        const isModelError = response.status === 400 && (bodyText.includes("Unknown Model") || bodyText.toLowerCase().includes("model"));
        if (isModelError) break; // следующая модель
        if (response.status === 401) throw new Error("Ключ Z.ai невалиден");
        throw new Error(`Z.ai API: ${response.status}`);
      } catch (e) {
        if ((e as Error).name === "AbortError" && attempt === 0) {
          console.warn(`[api] ${model} timeout, retry...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        if (attempt === 1) throw e;
      }
    }
  }
  throw new Error("Все модели недоступны");
}

// === СЕРВЕР ===
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json; charset=utf-8",
    };

    try {
      // === POST /api/diagnose ===
      if (path === "/api/diagnose" && method === "POST") {
        const body = await req.json();
        const text = body?.text?.trim() || "";
        if (text.length < 20) return new Response(JSON.stringify({ error: "Опишите подробнее." }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — наставник по самотерапии. Верни JSON-диагноз.
Уровни 1-7: Выживание, Потребности, Значимость, Любовь, Самовыражение, Духовность, Единство.
Эмоции (id): fear, anger, resentment, guilt, shame, pity, pride.
Ямы (id): victim, rescuer, persecutor, dependence, loneliness, insecurity, hopeless.
Бытийности (id): strong, pleasure, controller, intermediate, regulator, loving, creating, willing, witness.
Проработки (type): принятие, прощение, отпускание, благодарность, любовь к себе, доверие, сила, расширение, возвращение ответственности, заземление, перекодирование, ресурсное состояние, якорение.
Правила: 1-2 эмоции, 0-1 яма (или null), 1 бытийность, 2-3 проработки. Тёплый тон. Цитируй слова.
JSON: {"level":{"id":1-7,"name":"","summary":""},"emotions":[{"id":"","name":"","intensity":"","evidence":""}],"pit":{"id":"","name":"","signs_matched":[],"explanation":""}|null,"beingness":{"id":"","name":"","evidence":"","explanation":""},"diagnosis_summary":"","processings":[{"type":"","title":"","why_now":"","steps":[],"expected":"","duration":""}],"next_step":""}
Только JSON на русском.`;

        const content = await callZai(SYSTEM_PROMPT, text, 1500, 0.6);
        try {
          const parsed = extractJson(content);
          return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch {
          return new Response(JSON.stringify({ error: "Не удалось разобрать.", raw_preview: content.slice(0, 400) }), { status: 502, headers: corsHeaders });
        }
      }

      // === POST /api/neuro-diagnose ===
      if (path === "/api/neuro-diagnose" && method === "POST") {
        const body = await req.json();
        const text = body?.text?.trim() || "";
        if (text.length < 20) return new Response(JSON.stringify({ error: "Опишите подробнее." }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — эксперт по нейротрансформингу. Проанализируй ситуацию и верни JSON.
MIPS уровни 1-8: 1:Родовые, 2:Кармические, 3:Пренатальные, 4:Родовые травмы, 5:Импринты, 6:Убеждения, 7:Стратегии, 8:Поведение.
Ритмы: beta, alpha, theta, delta. Цикл: 1:Диагностика, 2:Доступ, 3:Поиск, 4:Перекодирование, 5:Интеграция.
Техники: anchoring, swish, reframing, regression, recoding, resource-state.
JSON: {"program":{"name":"","description":"","source":""},"mips_level":{"id":1-8,"name":"","explanation":""},"recommended_state":{"id":"","name":"","reason":""},"cycle":[{"stage_id":"","stage_name":"","what_to_do":""}],"techniques":[{"id":"","name":"","why_now":"","steps":[],"expected_result":""}],"integration_plan":{"duration_days":21,"daily_practice":"","checkpoints":[]},"summary":""}
Только JSON на русском.`;

        const content = await callZai(SYSTEM_PROMPT, text, 1500, 0.7);
        try {
          const parsed = extractJson(content);
          return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch {
          return new Response(JSON.stringify({ error: "Не удалось разобрать." }), { status: 502, headers: corsHeaders });
        }
      }

      // === POST /api/tale-diagnose ===
      if (path === "/api/tale-diagnose" && method === "POST") {
        const body = await req.json();
        const text = body?.text?.trim() || "";
        if (text.length < 20) return new Response(JSON.stringify({ error: "Опишите подробнее." }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — сказкотерапевт. Подбери или напиши терапевтическую сказку/притчу под ситуацию. Верни JSON.
JSON: {"selected_tale":{"id":"оригинальная","type":"сказка|притча","title":"","source":"оригинальная"},"tale_text":"","diagnosis":{"theme":"","connection":"","insight":""},"moral":"","reflection_questions":["","",""],"practice":{"title":"","steps":[],"duration":""},"summary":""}
Текст сказки 200-400 слов. Тёплый тон. Только JSON на русском.`;

        const content = await callZai(SYSTEM_PROMPT, text, 1500, 0.8);
        try {
          const parsed = extractJson(content);
          return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch {
          return new Response(JSON.stringify({ error: "Не удалось разобрать." }), { status: 502, headers: corsHeaders });
        }
      }

      // === POST /api/card-diagnose ===
      if (path === "/api/card-diagnose" && method === "POST") {
        const body = await req.json();
        const text = body?.text?.trim() || "";
        if (text.length < 20) return new Response(JSON.stringify({ error: "Опишите подробнее." }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — метафорический картотерапевт. Подбери карту и дай разбор. Верни JSON.
Карты: lighthouse-storm:Маяк в буре, bridge-fog:Мост в тумане, tree-roots:Дерево с корнями, key-door:Ключ и дверь, broken-pot-flowers:Разбитый кувшин, wolf-moon:Волк на луну, nest-eggs:Пустое гнездо, mirror-shadow:Зеркало и тень, river-dam:Река и плотина, compass-crossroads:Компас, caterpillar-cocoon:Кокон, two-hands-light:Две руки и свет.
JSON: {"selected_card":{"id":"","title":"","image_description":"","symbolism":""},"analysis":{"why_this_card":"","what_you_see":"","what_it_means":""},"reflection_questions":["","",""],"practice":{"title":"","steps":[],"duration":""},"summary":""}
Только JSON на русском.`;

        const content = await callZai(SYSTEM_PROMPT, text, 1200, 0.75);
        try {
          const parsed = extractJson(content);
          return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch {
          return new Response(JSON.stringify({ error: "Не удалось разобрать." }), { status: 502, headers: corsHeaders });
        }
      }

      // === POST /api/slide-create ===
      if (path === "/api/slide-create" && method === "POST") {
        const body = await req.json();
        const text = body?.text?.trim() || "";
        if (text.length < 20) return new Response(JSON.stringify({ error: "Опишите подробнее." }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — сказочник. Создай терапевтическую историю в 5-7 сценах-слайдах. Верни JSON.
Настроения: спокойствие, тревога, надежда, радость, грусть, свет, трансформация.
Время: рассвет, день, закат, ночь.
JSON: {"title":"","type":"сказка|притча|стих","slides":[{"text":"","scene":"","mood":"","timeOfDay":""}],"moral":""}
Последняя сцена — светлая. Только JSON на русском.`;

        const content = await callZai(SYSTEM_PROMPT, text, 1500, 0.85);
        try {
          const parsed = extractJson(content);
          return new Response(JSON.stringify(parsed), { headers: corsHeaders });
        } catch {
          return new Response(JSON.stringify({ error: "Не удалось разобрать." }), { status: 502, headers: corsHeaders });
        }
      }

      // === POST /api/chat ===
      if (path === "/api/chat" && method === "POST") {
        const body = await req.json();
        const messages = body?.messages || [];
        if (!messages.length) return new Response(JSON.stringify({ error: "Нет сообщений" }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — тёплый наставник по самотерапии. Говори коротко (2-4 предложения). Задавай вопросы к телу. Не давай советы сразу. Тёплый тон.`;

        const apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "") })),
        ];

        const content = await callZai(SYSTEM_PROMPT, messages[messages.length - 1]?.content || "", 600, 0.7);
        return new Response(JSON.stringify({ content }), { headers: corsHeaders });
      }

      // === POST /api/consultant-chat ===
      if (path === "/api/consultant-chat" && method === "POST") {
        const body = await req.json();
        const messages = body?.messages || [];
        if (!messages.length) return new Response(JSON.stringify({ error: "Нет сообщений" }), { status: 400, headers: corsHeaders });

        const SYSTEM_PROMPT = `Ты — персональный наставник по самотерапии. Ведёшь полноценную сессию. Говори 2-5 предложений. Задавай вопросы к телу и чувствам. Тёплый, мудрый.`;

        const content = await callZai(SYSTEM_PROMPT, messages[messages.length - 1]?.content || "", 600, 0.75);
        return new Response(JSON.stringify({ content }), { headers: corsHeaders });
      }

      // === GET/POST /api/activity ===
      if (path === "/api/activity") {
        if (method === "POST") {
          const body = await req.json();
          const ua = req.headers.get("user-agent") || "unknown";
          const { browser, device } = parseUA(ua);
          const entry: ActivityEntry = {
            id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: String(body?.type || "unknown"),
            label: String(body?.label || ""),
            details: body?.details ? String(body.details) : null,
            browser, device,
            createdAt: new Date().toISOString(),
          };
          activityLogs.unshift(entry);
          if (activityLogs.length > 500) activityLogs.length = 500;
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        }

        if (method === "GET") {
          // Группировка по сессиям
          const sessions: any[] = [];
          for (const log of activityLogs) {
            const last = sessions[sessions.length - 1];
            const logTime = new Date(log.createdAt).getTime();
            if (last && last.browser === log.browser && logTime - new Date(last.lastActiveAt).getTime() < 30 * 60 * 1000) {
              last.recentEvents.push(log);
              last.eventCount++;
              last.lastActiveAt = log.createdAt;
            } else {
              sessions.push({ browser: log.browser, device: log.device, startedAt: log.createdAt, lastActiveAt: log.createdAt, eventCount: 1, recentEvents: [log] });
            }
          }
          const actionCounts: Record<string, number> = {};
          for (const log of activityLogs) if (log.type !== "visit") actionCounts[log.type] = (actionCounts[log.type] || 0) + 1;
          const devicesSet = new Set(activityLogs.map(l => l.device));
          const browsersSet = new Set(activityLogs.map(l => l.browser));

          return new Response(JSON.stringify({
            totalLogs: activityLogs.length,
            totalSessions: sessions.length,
            actionCounts,
            devices: Array.from(devicesSet),
            browsers: Array.from(browsersSet),
            sessions: sessions.slice(0, 20).map(s => ({
              browser: s.browser, device: s.device,
              startedAt: s.startedAt, lastActiveAt: s.lastActiveAt,
              eventCount: s.eventCount,
              recentEvents: s.recentEvents.slice(0, 5).map((e: ActivityEntry) => ({ type: e.type, label: e.label, details: e.details, createdAt: e.createdAt })),
            })),
          }), { headers: corsHeaders });
        }
      }

      // === 404 ===
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error(`[api] ${path} error:`, err);
      const msg = (err as Error)?.message || "Ошибка";
      if (msg.includes("AbortError") || msg.includes("abort")) {
        return new Response(JSON.stringify({ error: "Превышено время ожидания. Попробуйте ещё раз." }), { status: 504, headers: corsHeaders });
      }
      return new Response(JSON.stringify({ error: msg }), { status: 502, headers: corsHeaders });
    }
  },
});

console.log(`🚀 API server running on http://localhost:${PORT}`);
