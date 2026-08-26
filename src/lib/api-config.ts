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
 * Проблема: когда Vercel Edge Function падает (таймаут, ошибка инициализации),
 * он возвращает HTML-страницу с текстом вроде "An error occurred with your deployment..."
 * вместо JSON. Если фронтенд вызовет res.json() на таком ответе — будет ошибка
 * "Unexpected token 'A', \"An error o\"... is not valid JSON".
 *
 * Эта функция:
 *   1. Сначала пытается распарсить как JSON
 *   2. Если не получается — возвращает понятное сообщение об ошибке
 *   3. Если ответ не ок — вытаскивает error из JSON или использует текст
 *
 * Возвращает: { ok: true, data: T } | { ok: false, error: string, status: number }
 */
export type SafeJsonResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number; rawText?: string };

export async function safeJsonFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<SafeJsonResult<T>> {
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), options);
  } catch (networkErr) {
    return {
      ok: false,
      error:
        "Не удалось соединиться с сервером. Проверьте интернет-соединение и попробуйте снова.",
      status: 0,
    };
  }

  // Сначала читаем как текст — надёжнее, чем .json()
  const rawText = await response.text();

  // Пустой ответ
  if (!rawText || !rawText.trim()) {
    return {
      ok: false,
      error:
        response.status === 504
          ? "Превышено время ожидания сервера (25 сек). ИИ перегружен — попробуйте ещё раз через минуту."
          : `Сервер вернул пустой ответ (статус ${response.status}).`,
      status: response.status,
    };
  }

  // Пытаемся распарсить JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    // Не JSON — это, скорее всего, HTML-страница ошибки Vercel
    // Проверим по характерным признакам
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
          "Превышено время ожидания ИИ (25 сек — лимит Vercel Edge). Попробуйте ещё раз — возможно, ИИ перегружен. Если ошибка повторяется, обратитесь к администратору.",
        status: 504,
        rawText: rawText.slice(0, 200),
      };
    }

    if (isVercelError) {
      return {
        ok: false,
        error:
          "Сервер вернул ошибку платформы. Возможные причины: превышен лимит времени, проблема с конфигурацией. Попробуйте ещё раз через минуту.",
        status: response.status,
        rawText: rawText.slice(0, 200),
      };
    }

    if (isHtml) {
      return {
        ok: false,
        error: `Сервер вернул HTML вместо JSON (статус ${response.status}). Попробуйте ещё раз.`,
        status: response.status,
        rawText: rawText.slice(0, 200),
      };
    }

    return {
      ok: false,
      error: `Неожиданный ответ сервера: ${rawText.slice(0, 150)}`,
      status: response.status,
      rawText: rawText.slice(0, 200),
    };
  }

  // JSON распарсен — проверяем статус
  if (!response.ok) {
    const errObj = parsed as { error?: string; message?: string };
    return {
      ok: false,
      error: errObj.error || errObj.message || `Ошибка сервера (статус ${response.status}).`,
      status: response.status,
    };
  }

  return { ok: true, data: parsed as T, status: response.status };
}
