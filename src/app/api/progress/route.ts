import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";

/**
 * Синхронизация прогресса между платформами (VK web, Android, OK).
 *
 * VK Rule 2.3.8: прогресс должен синхронизироваться между версиями приложения.
 * Раньше прогресс хранился только в localStorage — не синхронизировался.
 *
 * Теперь: при запуске в VK/OK фронтенд отправляет vk_user_id (или ok_user_id),
 * и мы загружаем/сохраняем прогресс на сервере (Vercel KV или in-memory fallback).
 *
 * Эндпоинты:
 *   GET  /api/progress?platform=vk&userId=123  → загрузить прогресс
 *   POST /api/progress                          → сохранить прогресс
 *
 * Прогресс = история диагнозов + выполненные проработки.
 * Хранится 90 дней, потом удаляется (TTL).
 */

type HistoryEntry = {
  id: string;
  timestamp: number;
  text: string;
  result: unknown; // DiagnoseResponse (не валидируем на сервере)
  doneProcessings?: string[];
};

// In-memory fallback (если KV не настроен)
type ProgressStore = Record<string, { entries: HistoryEntry[]; updatedAt: number }>;
const globalStore = globalThis as unknown as { __progressStore?: ProgressStore };
if (!globalStore.__progressStore) globalStore.__progressStore = {};
const memStore: ProgressStore = globalStore.__progressStore;

function isKVAvailable(): boolean {
  try {
    return !!process.env.KV_REST_API_URL || !!process.env.KV_URL;
  } catch {
    return false;
  }
}

const MAX_ENTRIES = 50;
const TTL_SECONDS = 90 * 24 * 60 * 60; // 90 дней

function getProgressKey(platform: string, userId: string): string {
  return `progress:${platform}:${userId}`;
}

/** Валидация platform + userId — защита от спама/несанкционированного доступа */
function validateParams(platform: string, userId: string): string | null {
  if (!platform || !userId) return "platform и userId обязательны";
  if (!["vk", "ok", "web"].includes(platform)) return "Невалидная платформа";
  if (userId.length > 100) return "userId слишком длинный";
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) return "userId содержит недопустимые символы";
  return null;
}

// === GET /api/progress ===
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") || "";
    const userId = url.searchParams.get("userId") || "";

    const error = validateParams(platform, userId);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const key = getProgressKey(platform, userId);

    let entries: HistoryEntry[] = [];

    if (isKVAvailable()) {
      try {
        const raw = await kv.get<string>(key);
        if (raw) {
          const parsed = JSON.parse(raw) as HistoryEntry[];
          if (Array.isArray(parsed)) entries = parsed;
        }
      } catch (e) {
        console.error("[progress] KV GET error, fallback to memory:", e);
        const mem = memStore[key];
        if (mem) entries = mem.entries;
      }
    } else {
      const mem = memStore[key];
      if (mem) entries = mem.entries;
    }

    return NextResponse.json({
      ok: true,
      platform,
      userId,
      entries: entries.slice(0, MAX_ENTRIES),
      count: entries.length,
      storage: isKVAvailable() ? "kv" : "memory",
    });
  } catch (err) {
    console.error("[progress] GET error:", err);
    return NextResponse.json(
      { error: "Ошибка загрузки прогресса" },
      { status: 500 }
    );
  }
}

// === POST /api/progress ===
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const platform = String(body?.platform || "");
    const userId = String(body?.userId || "");
    const entries = Array.isArray(body?.entries) ? body.entries : [];

    const error = validateParams(platform, userId);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    // Ограничиваем количество записей
    const safeEntries = entries.slice(0, MAX_ENTRIES);

    // Ограничиваем размер каждой записи (защита от больших payloads)
    const cleanedEntries = safeEntries.map((e: unknown) => {
      if (typeof e !== "object" || e === null) return null;
      const entry = e as HistoryEntry;
      return {
        id: String(entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        timestamp: Number(entry.timestamp) || Date.now(),
        text: String(entry.text || "").slice(0, 500),
        result: entry.result, // не валидируем — это DiagnoseResponse, может быть большим
        doneProcessings: Array.isArray(entry.doneProcessings)
          ? entry.doneProcessings.slice(0, 20).map(String)
          : [],
      };
    }).filter(Boolean) as HistoryEntry[];

    const key = getProgressKey(platform, userId);
    const payload = JSON.stringify(cleanedEntries);

    if (isKVAvailable()) {
      try {
        // Сохраняем с TTL 90 дней
        await kv.set(key, payload, { ex: TTL_SECONDS });
      } catch (e) {
        console.error("[progress] KV SET error, fallback to memory:", e);
        memStore[key] = { entries: cleanedEntries, updatedAt: Date.now() };
      }
    } else {
      memStore[key] = { entries: cleanedEntries, updatedAt: Date.now() };
    }

    return NextResponse.json({
      ok: true,
      platform,
      userId,
      count: cleanedEntries.length,
      storage: isKVAvailable() ? "kv" : "memory",
    });
  } catch (err) {
    console.error("[progress] POST error:", err);
    return NextResponse.json(
      { error: "Ошибка сохранения прогресса" },
      { status: 500 }
    );
  }
}
