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
