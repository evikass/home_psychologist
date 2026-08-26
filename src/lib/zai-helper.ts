/**
 * Универсальный клиент Z.ai — работает и на Node.js, и на Edge runtime.
 *
 * Стратегия:
 *   - На Node.js (Vercel Hobby): maxDuration = 60, ретраи 2× на модель, таймаут 50 сек
 *   - На Edge: maxDuration = 25, без ретраев, таймаут 22 сек
 *
 * Источник конфигурации:
 *   1. Env-переменные (Vercel, любой runtime)
 *   2. /etc/.z-ai-config (песочница, локальная разработка, только Node.js)
 *   3. ./.z-ai-config (альтернативная локальная разработка, только Node.js)
 */

import type { NextResponse } from "next/server";

export type ZaiConfig = {
  apiKey: string;
  baseUrl: string;
  token?: string;
  chatId?: string;
  userId?: string;
};

export function getZaiConfig(): ZaiConfig {
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

  // Fallback: файлы конфигурации (только на Node.js runtime)
  try {
    // Динамический import — на Edge выбросит ошибку, но мы её подавляем
    const fs = require("fs");
    const path = require("path");
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
    // На Edge runtime require("fs") не сработает — это нормально
  }

  return { apiKey: "", baseUrl: envUrl };
}

const MODELS_TO_TRY = [
  "glm-4.5-flash",
  "glm-4.6-flash",
  "glm-4-flash-250414",
  "glm-4-flash",
  "glm-4-air",
  "glm-4-plus",
  "glm-4",
];

export type ZaiResult =
  | { ok: true; content: string }
  | { ok: false; status: number; body: string };

/**
 * Простая версия: systemPrompt + userText.
 */
export async function callZaiChat(
  config: ZaiConfig,
  systemPrompt: string,
  userText: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ZaiResult> {
  return callZaiMessages(config, [
    { role: "system", content: systemPrompt },
    { role: "user", content: userText },
  ], options);
}

/**
 * Расширенная версия: принимает произвольный массив сообщений (для чата).
 *
 * Логика:
 *   - Ретраи: 2 попытки на модель (на Edge можно отключить через options.noRetries)
 *   - Таймаут: 50 сек по умолчанию (Node.js), 22 сек на Edge
 *   - Фолбэк по моделям: если 400 + "Unknown Model", пробуем следующую
 */
export async function callZaiMessages(
  config: ZaiConfig,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    timeoutMs?: number;
    noRetries?: boolean;
  }
): Promise<ZaiResult> {
  const { apiKey, baseUrl, token, chatId, userId } = config;
  const url = `${baseUrl}/chat/completions`;
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 1500;
  const timeoutMs = options?.timeoutMs ?? 50000;
  const maxAttempts = options?.noRetries ? 1 : 2;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-Z-AI-From": "Z",
  };
  if (token) headers["X-Token"] = token;
  if (chatId) headers["X-Chat-Id"] = chatId;
  if (userId) headers["X-User-Id"] = userId;

  let lastError: { ok: false; status: number; body: string } | null = null;

  try {
    for (const model of MODELS_TO_TRY) {
      console.log(`[zai] trying model: ${model}`);

      let response: Response | null = null;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const localController = new AbortController();
          const localTimeout = setTimeout(
            () => localController.abort(),
            timeoutMs
          );
          response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              thinking: { type: "disabled" },
            }),
            signal: localController.signal,
          });
          clearTimeout(localTimeout);
          break;
        } catch (fetchErr) {
          console.warn(
            `[zai] model ${model} attempt ${attempt + 1}/${maxAttempts} failed:`,
            (fetchErr as Error).name
          );
          if (attempt === maxAttempts - 1) {
            if ((fetchErr as Error).name === "AbortError") {
              lastError = {
                ok: false,
                status: 504,
                body: "Превышено время ожидания ИИ. Попробуйте ещё раз.",
              };
            } else {
              lastError = {
                ok: false,
                status: 502,
                body: (fetchErr as Error).message || "Сетевая ошибка",
              };
            }
            continue; // пробуем следующую модель
          }
          // Ждём 1.5 сек перед ретраем
          await new Promise((r) => setTimeout(r, 1500));
        }
      }

      if (!response) continue;
      const bodyText = await response.text();

      if (response.ok) {
        let data: unknown;
        try {
          data = JSON.parse(bodyText);
        } catch {
          console.error(
            "[zai] Z.ai response not JSON:",
            bodyText.slice(0, 500)
          );
          return { ok: false, status: 502, body: "Invalid JSON from Z.ai" };
        }

        const message =
          (data as {
            choices?: {
              message?: { content?: string; reasoning_content?: string };
            }[];
          })?.choices?.[0]?.message ?? {};
        const content = message.content || message.reasoning_content || "";

        if (content) {
          console.log(
            `[zai] success with model: ${model}, content length: ${content.length}`
          );
          return { ok: true, content };
        }

        console.warn(
          `[zai] model ${model} returned empty content, trying next`
        );
        lastError = {
          ok: false,
          status: 502,
          body: `Empty content (model: ${model})`,
        };
        continue;
      }

      const isModelError =
        response.status === 400 &&
        (bodyText.includes("Unknown Model") ||
          bodyText.includes("model") ||
          bodyText.includes("Model"));

      if (isModelError) {
        console.warn(
          `[zai] model ${model} not available: ${bodyText.slice(0, 200)}`
        );
        lastError = { ok: false, status: response.status, body: bodyText };
        continue;
      }

      console.error(
        `[zai] Z.ai API error: status=${response.status} body=${bodyText.slice(0, 500)}`
      );
      return { ok: false, status: response.status, body: bodyText };
    }

    return lastError ?? { ok: false, status: 502, body: "All models failed" };
  } catch (err) {
    console.error("[zai] callZaiMessages error:", err);
    if ((err as Error).name === "AbortError") {
      return {
        ok: false,
        status: 504,
        body: "Превышено время ожидания. Попробуйте ещё раз.",
      };
    }
    return {
      ok: false,
      status: 502,
      body: (err as Error).message || "Ошибка соединения",
    };
  }
}

/** Безопасный парсинг JSON-ответа LLM — модель иногда оборачивает в ```json */
export function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("В ответе LLM нет валидного JSON-объекта");
  }
  return JSON.parse(text.slice(first, last + 1));
}

/**
 * Стандартная обработка ошибок Z.ai для возврата клиенту.
 */
export function handleZaiError(
  result: ZaiResult,
  res: typeof NextResponse
) {
  if (result.status === 401) {
    return res.json(
      {
        error:
          "Ключ Z.ai невалиден или истёк (401). Создайте новый на https://z.ai/manage/apikey и обновите ZAI_API_KEY.",
        zai_status: result.status,
        zai_body: result.body.slice(0, 300),
      },
      { status: 502 }
    );
  }
  if (result.status === 403) {
    return res.json(
      {
        error: "Доступ к Z.ai API запрещён (403). Проверьте права ключа.",
        zai_status: result.status,
        zai_body: result.body.slice(0, 300),
      },
      { status: 502 }
    );
  }
  if (result.status === 429) {
    return res.json(
      {
        error:
          "Превышен лимит запросов к Z.ai (429). Подождите минуту или пополните баланс на https://z.ai.",
        zai_status: result.status,
        zai_body: result.body.slice(0, 300),
      },
      { status: 502 }
    );
  }
  if (result.status === 504) {
    return res.json(
      {
        error:
          result.body ||
          "Превышено время ожидания. Попробуйте ещё раз — возможно, ИИ перегружен.",
        zai_status: result.status,
      },
      { status: 504 }
    );
  }
  return res.json(
    {
      error: `Ошибка ${result.status}. Попробуйте ещё раз.`,
      zai_status: result.status,
      zai_body: result.body.slice(0, 500),
    },
    { status: 502 }
  );
}
