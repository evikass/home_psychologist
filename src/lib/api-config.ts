/**
 * Конфигурация API URL.
 *
 * В песочнице: используется относительный путь "/api/..."
 *   → Caddy проксирует на localhost:3001 (API-сервер)
 *
 * На Vercel: используется NEXT_PUBLIC_API_URL
 *   → указывающий на Railway (https://api-server.up.railway.app)
 *   → если не задан, fallback на относительный (Vercel API routes)
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * Возвращает полный URL для API-запроса.
 *
 * Примеры:
 * - buildApiUrl("/api/diagnose") → "/api/diagnose" (песочница/Vercel)
 * - buildApiUrl("/api/diagnose") → "https://api-server.up.railway.app/api/diagnose" (Railway)
 */
export function buildApiUrl(path: string): string {
  if (!API_URL) return path;
  return `${API_URL}${path}`;
}

/**
 * Хелпер для fetch к API с правильным URL.
 */
export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  return fetch(buildApiUrl(path), options);
}

/**
 * Безопасный парсинг JSON-ответа.
 *
 * Проблема: когда Vercel serverless function падает (таймаут, ошибка),
 * он возвращает HTML-страницу с текстом вроде "An error occurred..."
 * вместо JSON. Если фронтенд вызовет res.json() на таком ответе — будет ошибка
 * "Unexpected token 'A', \"An error o\"... is not valid JSON".
 *
 * Дополнительно: автоматический retry при 504/502/network error
 * (Z.ai иногда отвечает 15-20 сек, Vercel Hobby = 10 сек, модераторы
 * платформ могут поймать 504 при первой попытке — retry решает проблему).
 *
 * Эта функция:
 *   1. Делает запрос с retry (2 попытки при 504/502/network error)
 *   2. Парсит JSON, обрабатывая HTML-ответы Vercel
 *   3. Возвращает понятное русское сообщение об ошибке
 *
 * Возвращает: { ok: true, data: T } | { ok: false, error: string, status: number }
 */
export type SafeJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; rawText?: string };

const RETRY_STATUSES = new Set([502, 503, 504]);
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function analyzeResponse(
  response: Response,
  rawText: string
): { ok: true; data: unknown } | { ok: false; error: string; rawText?: string } {
  // Пустой ответ
  if (!rawText || !rawText.trim()) {
    return {
      ok: false,
      error:
        response.status === 504
          ? "Сервер не успел обработать запрос. Попробуйте ещё раз."
          : `Сервер вернул пустой ответ (статус ${response.status}).`,
    };
  }

  // Пытаемся распарсить JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Не JSON — это, скорее всего, HTML-страница ошибки Vercel
    const isHtml = rawText.trimStart().startsWith("<");
    const isVercelError =
      rawText.includes("An error occurred") ||
      rawText.includes("Function timed out") ||
      rawText.includes("EDGE_FUNCTION") ||
      rawText.includes("Deployment not found");

    if (response.status === 504 || rawText.includes("timed out")) {
      return {
        ok: false,
        error:
          "Сервер не успел обработать запрос за отведённое время. Попробуйте ещё раз.",
        rawText: rawText.slice(0, 200),
      };
    }

    if (isVercelError) {
      return {
        ok: false,
        error:
          "Сервер вернул ошибку платформы. Попробуйте ещё раз через минуту.",
        rawText: rawText.slice(0, 200),
      };
    }

    if (isHtml) {
      return {
        ok: false,
        error: `Сервер вернул HTML вместо JSON (статус ${response.status}). Попробуйте ещё раз.`,
        rawText: rawText.slice(0, 200),
      };
    }

    return {
      ok: false,
      error: `Неожиданный ответ сервера: ${rawText.slice(0, 150)}`,
      rawText: rawText.slice(0, 200),
    };
  }

  // JSON распарсен — проверяем статус
  if (!response.ok) {
    const errObj = parsed as { error?: string; message?: string };
    return {
      ok: false,
      error: errObj.error || errObj.message || `Ошибка сервера (статус ${response.status}).`,
    };
  }

  return { ok: true, data: parsed };
}

export async function safeJsonFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<SafeJsonResult<T>> {
  let lastError: SafeJsonResult<T> | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response: Response;
    try {
      // Timeout 60 сек — больше, чем Vercel 10 сек, чтобы получить 504 статус,
      // а не сетевую ошибку. Vercel сам закроет запрос на 10 сек с 504.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      response = await fetch(buildApiUrl(path), {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (networkErr) {
      // Сетевая ошибка — это retry-able
      lastError = {
        ok: false,
        error:
          attempt < MAX_RETRIES
            ? "Сетевая ошибка. Повторная попытка..."
            : "Не удалось соединиться с сервером. Проверьте интернет-соединение.",
        status: 0,
      };
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }
      return lastError;
    }

    const rawText = await response.text();
    const analyzed = analyzeResponse(response, rawText);

    if (analyzed.ok) {
      return { ok: true, data: analyzed.data as T, status: response.status };
    }

    // Если ошибка retry-able и есть ещё попытки — повторяем
    if (RETRY_STATUSES.has(response.status) && attempt < MAX_RETRIES) {
      console.warn(
        `[safeJsonFetch] ${path} attempt ${attempt + 1} failed (status ${response.status}), retrying...`
      );
      lastError = {
        ok: false,
        error: "Сервер временно недоступен. Повторная попытка...",
        status: response.status,
        rawText: analyzed.rawText,
      };
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      continue;
    }

    return {
      ok: false,
      error: analyzed.error,
      status: response.status,
      rawText: analyzed.rawText,
    };
  }

  return (
    lastError ?? {
      ok: false,
      error: "Неизвестная ошибка. Попробуйте ещё раз.",
      status: 500,
    }
  );
}
