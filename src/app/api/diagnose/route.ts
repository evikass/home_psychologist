import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  SYSTEM_PROMPT,
  VALID_EMOTION_IDS,
  VALID_PIT_IDS,
  VALID_PROCESSING_TYPES,
  VALID_BEINGNESS_IDS,
  type DiagnoseResponse,
} from "@/lib/masterkit-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Создаёт клиент Z.ai.
 * Поддерживаемые источники (по приоритету):
 *   1. Env-переменные ZAI_API_KEY / Z_AI_API_KEY / ZAI_KEY (Vercel, продакшн)
 *   2. Файл /etc/.z-ai-config (песочница, локальная разработка)
 *   3. Файл .z-ai-config в корне проекта (альтернативная локальная разработка)
 *
 * Возвращает apiKey, baseUrl и опционально token + chatId + userId
 * (для песочницы, где нужен JWT-токен).
 */
type ZaiConfig = {
  apiKey: string;
  baseUrl: string;
  token?: string;
  chatId?: string;
  userId?: string;
};

function getZaiConfig(): ZaiConfig {
  // 1. Env-переменные
  const envKey =
    process.env.ZAI_API_KEY ||
    process.env.Z_AI_API_KEY ||
    process.env.ZAI_KEY;

  const envUrl =
    process.env.ZAI_BASE_URL ||
    process.env.Z_AI_BASE_URL ||
    "https://api.z.ai/api/paas/v4";

  if (envKey) {
    return { apiKey: envKey, baseUrl: envUrl };
  }

  // 2-3. Читаем файлы конфигурации (песочница, локальная разработка)
  try {
    const configPaths = [
      "/etc/.z-ai-config",
      path.join(process.cwd(), ".z-ai-config"),
    ];

    for (const filePath of configPaths) {
      try {
        if (fs.existsSync(filePath)) {
          const configStr = fs.readFileSync(filePath, "utf-8");
          const config = JSON.parse(configStr);
          if (config.baseUrl && config.apiKey) {
            return {
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              token: config.token,
              chatId: config.chatId,
              userId: config.userId,
            };
          }
        }
      } catch {
        // продолжаем
      }
    }
  } catch {
    console.warn("[diagnose] fs/path not available, env vars only");
  }

  return { apiKey: "", baseUrl: envUrl };
}

/** Прямой вызов Z.ai API с таймаутом и подробным логированием */
async function callZaiChat(
  config: ZaiConfig,
  systemPrompt: string,
  userText: string
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const { apiKey, baseUrl, token, chatId, userId } = config;
  const url = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000); // 45 сек таймаут

  // Список моделей по приоритету — пробуем по очереди, пока не сработает.
  // Порядок подобран по результатам тестов на бесплатном тарифе Z.ai (2026):
  //   glm-4.5-flash — единственная доступная на бесплатном тарифе.
  // Остальные оставлены как fallback на случай платных тарифов.
  // Для песочницы (internal-api.z.ai) первая модель может не работать —
  // тогда код попробует следующие.
  const MODELS_TO_TRY = [
    "glm-4.5-flash",       // ⭐ работает на бесплатном тарифе
    "glm-4.6-flash",       // новая 4.6 flash
    "glm-4-flash-250414",  // flash с суффиксом даты
    "glm-4-flash",         // старый алиас
    "glm-4-air",           // более умная, но дешёвая
    "glm-4-plus",          // плюс версия (платная)
    "glm-4",               // базовая
    // Песочница может использовать другие имена:
    "glm-4-flashx",
    "GLM-4-Flash",
  ];

  // Заголовки — общие для всех запросов
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Z-AI-From": "Z",  // SDK песочницы передаёт этот заголовок
  };
  // Песочница использует JWT-токен + идентификаторы
  if (token) headers["X-Token"] = token;
  if (chatId) headers["X-Chat-Id"] = chatId;
  if (userId) headers["X-User-Id"] = userId;

  let lastError: { ok: false; status: number; body: string } | null = null;

  try {
    for (const model of MODELS_TO_TRY) {
      console.log(`[diagnose] trying model: ${model}`);
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userText },
          ],
          temperature: 0.6,
          max_tokens: 2000,
          thinking: { type: "disabled" },
        }),
        signal: controller.signal,
      });

      const bodyText = await response.text();

      if (response.ok) {
        let data: unknown;
        try {
          data = JSON.parse(bodyText);
        } catch {
          console.error("[diagnose] Z.ai response not JSON:", bodyText.slice(0, 500));
          return { ok: false, status: 502, body: "Invalid JSON from Z.ai" };
        }

        // Z.ai GLM-4.5-flash может вернуть основной ответ в content,
        // а рассуждения — в reasoning_content. Если content пустой,
        // но есть reasoning_content — берём его (там тоже может быть JSON).
        const message =
          (data as { choices?: { message?: { content?: string; reasoning_content?: string } }[] })
            ?.choices?.[0]?.message ?? {};
        const content = message.content || message.reasoning_content || "";

        if (content) {
          console.log(
            `[diagnose] success with model: ${model}, content length: ${content.length}, ` +
              `source: ${message.content ? "content" : "reasoning_content"}`
          );
          return { ok: true, content };
        }

        // Пустой content — пробуем следующую модель
        console.warn(`[diagnose] model ${model} returned empty content, trying next`);
        lastError = { ok: false, status: 502, body: `Empty content (model: ${model})` };
        continue;
      }

      // Если ошибка не связана с моделью — выходим сразу
      const isModelError =
        response.status === 400 &&
        (bodyText.includes("Unknown Model") ||
          bodyText.includes("model") ||
          bodyText.includes("Model"));

      if (isModelError) {
        console.warn(`[diagnose] model ${model} not available: ${bodyText.slice(0, 200)}`);
        lastError = { ok: false, status: response.status, body: bodyText };
        continue;
      }

      // Любая другая ошибка — возвращаем её сразу
      console.error(
        `[diagnose] Z.ai API error: status=${response.status} body=${bodyText.slice(0, 500)}`
      );
      return { ok: false, status: response.status, body: bodyText };
    }

    // Все модели не сработали
    return (
      lastError ?? { ok: false, status: 502, body: "All models failed" }
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Безопасный парсинг JSON-ответа LLM — модель иногда оборачивает в ```json */
function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("В ответе LLM нет валидного JSON-объекта");
  }
  return JSON.parse(text.slice(first, last + 1));
}

function validateDiagnosis(d: unknown): DiagnoseResponse {
  if (!d || typeof d !== "object") throw new Error("Ответ не объект");
  const obj = d as Record<string, unknown>;

  const level = obj.level as Record<string, unknown>;
  if (!level || typeof level.id !== "number" || level.id < 1 || level.id > 7) {
    throw new Error("Невалидный level");
  }

  const emotions = Array.isArray(obj.emotions) ? obj.emotions : [];
  for (const e of emotions) {
    const eo = e as Record<string, unknown>;
    if (!VALID_EMOTION_IDS.includes(eo.id as string)) {
      throw new Error("Невалидная эмоция: " + String(eo.id));
    }
  }

  let pit: DiagnoseResponse["pit"] = null;
  if (obj.pit && typeof obj.pit === "object") {
    const po = obj.pit as Record<string, unknown>;
    if (!VALID_PIT_IDS.includes(po.id as string)) {
      throw new Error("Невалидная яма: " + String(po.id));
    }
    pit = {
      id: po.id as string,
      name: String(po.name ?? ""),
      signs_matched: Array.isArray(po.signs_matched)
        ? (po.signs_matched as string[]).map(String)
        : [],
      explanation: String(po.explanation ?? ""),
    };
  }

  // Бытийность (геометрия сознания) — опциональное поле.
  // Если LLM не вернул — null, UI это обработает.
  let beingness: DiagnoseResponse["beingness"] | null = null;
  const bo = obj.beingness as Record<string, unknown> | undefined;
  if (bo && typeof bo === "object" && bo.id) {
    if (!VALID_BEINGNESS_IDS.includes(bo.id as string)) {
      throw new Error("Невалидная бытийность: " + String(bo.id));
    }
    beingness = {
      id: bo.id as string,
      name: String(bo.name ?? ""),
      evidence: String(bo.evidence ?? ""),
      explanation: String(bo.explanation ?? ""),
    };
  }

  const processings = Array.isArray(obj.processings) ? obj.processings : [];
  const cleanProcessings = processings.map((p, i) => {
    const po = p as Record<string, unknown>;
    const type = po.type as string;
    if (!VALID_PROCESSING_TYPES.includes(type as never)) {
      throw new Error(`Проработка #${i + 1}: невалидный тип «${type}»`);
    }
    return {
      type: type as DiagnoseResponse["processings"][number]["type"],
      title: String(po.title ?? ""),
      why_now: String(po.why_now ?? ""),
      steps: Array.isArray(po.steps) ? (po.steps as string[]).map(String) : [],
      expected: String(po.expected ?? ""),
      duration: String(po.duration ?? ""),
    };
  });

  return {
    level: {
      id: level.id as number,
      name: String(level.name ?? ""),
      summary: String(level.summary ?? ""),
    },
    emotions: emotions.map((e) => {
      const eo = e as Record<string, unknown>;
      return {
        id: eo.id as string,
        name: String(eo.name ?? ""),
        intensity:
          (eo.intensity as DiagnoseResponse["emotions"][number]["intensity"]) ?? "средняя",
        evidence: String(eo.evidence ?? ""),
      };
    }),
    pit,
    beingness,
    diagnosis_summary: String(obj.diagnosis_summary ?? ""),
    processings: cleanProcessings,
    next_step: String(obj.next_step ?? ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Опишите ситуацию подробнее — хотя бы 2–3 предложения." },
        { status: 400 }
      );
    }
    if (text.length > 8000) {
      return NextResponse.json(
        { error: "Текст слишком длинный — до 8000 символов." },
        { status: 400 }
      );
    }

    const config = getZaiConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        {
          error:
            "На Vercel не задана переменная окружения ZAI_API_KEY. Откройте Vercel → ваш проект → Settings → Environment Variables → добавьте ZAI_API_KEY с вашим ключом от https://z.ai → затем Deployments → Redeploy.",
          env_detected: {
            ZAI_API_KEY: process.env.ZAI_API_KEY ? "✓ set" : "✗ missing",
            Z_AI_API_KEY: process.env.Z_AI_API_KEY ? "✓ set" : "✗ missing",
            ZAI_KEY: process.env.ZAI_KEY ? "✓ set" : "✗ missing",
          },
        },
        { status: 500 }
      );
    }

    console.log(
      `[diagnose] start: text_length=${text.length}, key_length=${config.apiKey.length}, url=${config.baseUrl}, has_token=${!!config.token}`
    );

    const result = await callZaiChat(config, SYSTEM_PROMPT, text);

    if (!result.ok) {
      // Чёткое сообщение об ошибке авторизации
      if (result.status === 401) {
        return NextResponse.json(
          {
            error:
              "Ключ Z.ai невалиден или истёк (401 Unauthorized). Создайте новый на https://z.ai/manage/apikey и обновите переменную ZAI_API_KEY в Vercel.",
            zai_status: result.status,
            zai_body: result.body.slice(0, 300),
          },
          { status: 502 }
        );
      }
      if (result.status === 403) {
        return NextResponse.json(
          {
            error:
              "Доступ к Z.ai API запрещён (403). Проверьте, что у ключа есть права на chat completions и аккаунт активен.",
            zai_status: result.status,
            zai_body: result.body.slice(0, 300),
          },
          { status: 502 }
        );
      }
      if (result.status === 429) {
        return NextResponse.json(
          {
            error:
              "Превышен лимит запросов к Z.ai (429). Подождите минуту или пополните баланс на https://z.ai.",
            zai_status: result.status,
            zai_body: result.body.slice(0, 300),
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        {
          error: `Z.ai API вернул ошибку ${result.status}. Проверьте Vercel Logs.`,
          zai_status: result.status,
          zai_body: result.body.slice(0, 500),
        },
        { status: 502 }
      );
    }

    console.log(`[diagnose] got content, length=${result.content.length}`);

    return processRawResponse(result.content);
  } catch (err) {
    console.error("[diagnose] fatal:", err);
    const msg = (err as Error)?.message ?? "Unknown error";
    return NextResponse.json(
      { error: "Сервис недоступен. " + msg },
      { status: 500 }
    );
  }
}

/** Общая логика парсинга raw-ответа LLM в DiagnoseResponse */
function processRawResponse(raw: string) {
  let parsed: DiagnoseResponse;
  try {
    parsed = validateDiagnosis(extractJson(raw));
  } catch (e) {
    console.error(
      "[diagnose] parse error:",
      (e as Error).message,
      "\nraw:",
      raw.slice(0, 500)
    );
    return NextResponse.json(
      {
        error:
          "Не удалось разобрать диагноз ИИ. Попробуйте переформулировать или повторить.",
        raw_preview: raw.slice(0, 400),
      },
      { status: 502 }
    );
  }

  console.log("[diagnose] success");
  return NextResponse.json(parsed);
}
