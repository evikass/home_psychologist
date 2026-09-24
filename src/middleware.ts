import { NextRequest, NextResponse } from "next/server";

/**
 * CORS middleware для всех /api/* запросов.
 *
 * Когда фронтенд хостится на VK Hosting (vk-app.ru) или OK,
 * а API — на Vercel (vercel.app), это разные origins.
 * Браузер блокирует cross-origin запросы без CORS заголовков.
 *
 * Это middleware добавляет:
 *   Access-Control-Allow-Origin: * (разрешаем всем)
 *   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
 *   Access-Control-Allow-Headers: Content-Type
 *
 * Также обрабатывает preflight OPTIONS запросы.
 *
 * Дополнительно: блокируем /api/debug-env для VK/OK (Rule 4.1.8) —
 * даже если как-то зайдут напрямую, не покажем технические детали.
 */

const BLOCKED_PATHS_FOR_PLATFORMS = ["/api/debug-env"];

function isPlatformRequest(req: NextRequest): boolean {
  const referer = req.headers.get("referer") || "";
  const ua = req.headers.get("user-agent") || "";
  return (
    referer.includes("vk.com") ||
    referer.includes("vk.ru") ||
    referer.includes("ok.ru") ||
    referer.includes("odnoklassniki.ru") ||
    ua.includes("VKApp") ||
    ua.includes("OKSDK") ||
    ua.includes("Odkl")
  );
}

export function middleware(req: NextRequest) {
  // Handle preflight OPTIONS
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Block debug-env for platforms (VK Rule 4.1.8)
  const path = req.nextUrl.pathname;
  if (BLOCKED_PATHS_FOR_PLATFORMS.includes(path) && isPlatformRequest(req)) {
    return NextResponse.json(
      { error: "Not available" },
      {
        status: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  // Add CORS headers to all /api/* responses
  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
