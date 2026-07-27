import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const maxDuration = 10;

type ActivityEntry = {
  id: string;
  type: string;
  label: string;
  details: string | null;
  browser: string;
  device: string;
  createdAt: string;
};

// In-memory fallback (если KV не настроен)
const globalStore = globalThis as unknown as { __activityLogs?: ActivityEntry[] };
if (!globalStore.__activityLogs) globalStore.__activityLogs = [];
const memLogs: ActivityEntry[] = globalStore.__activityLogs;

// Проверяем, доступен ли KV
function isKVAvailable(): boolean {
  try {
    return !!process.env.KV_REST_API_URL || !!process.env.KV_URL;
  } catch {
    return false;
  }
}

const KV_KEY = "activity:logs";
const KV_MAX = 500;

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

// POST — записать событие
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, label, details } = body;
    if (!type || !label) {
      return NextResponse.json({ error: "type и label обязательны" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "unknown";
    const { browser, device } = parseUA(ua);

    const entry: ActivityEntry = {
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: String(type),
      label: String(label),
      details: details ? String(details) : null,
      browser,
      device,
      createdAt: new Date().toISOString(),
    };

    if (isKVAvailable()) {
      // KV: добавляем в начало списка (LPUSH)
      try {
        await kv.lpush(KV_KEY, JSON.stringify(entry));
        // Ограничиваем размер
        await kv.ltrim(KV_KEY, 0, KV_MAX - 1);
      } catch (e) {
        console.error("[activity] KV write error, fallback to memory:", e);
        memLogs.unshift(entry);
        if (memLogs.length > KV_MAX) memLogs.length = KV_MAX;
      }
    } else {
      memLogs.unshift(entry);
      if (memLogs.length > KV_MAX) memLogs.length = KV_MAX;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[activity] POST error:", err);
    return NextResponse.json({ error: "Ошибка записи" }, { status: 500 });
  }
}

// GET — статистика для админа
export async function GET() {
  try {
    let allLogs: ActivityEntry[] = [];

    if (isKVAvailable()) {
      try {
        const rawLogs = await kv.lrange(KV_KEY, 0, KV_MAX - 1);
        allLogs = rawLogs.map((r) => {
          if (typeof r === "string") return JSON.parse(r) as ActivityEntry;
          return r as ActivityEntry;
        });
      } catch (e) {
        console.error("[activity] KV read error, fallback to memory:", e);
        allLogs = [...memLogs];
      }
    } else {
      allLogs = [...memLogs];
    }

    // Группируем по сессиям (30-минутные окна одного браузера)
    const sessions: Array<{
      browser: string;
      device: string;
      startedAt: string;
      lastActiveAt: string;
      eventCount: number;
      recentEvents: ActivityEntry[];
    }> = [];

    for (const log of allLogs) {
      const lastSession = sessions[sessions.length - 1];
      const logTime = new Date(log.createdAt).getTime();

      if (
        lastSession &&
        lastSession.browser === log.browser &&
        logTime - new Date(lastSession.lastActiveAt).getTime() < 30 * 60 * 1000
      ) {
        lastSession.recentEvents.push(log);
        lastSession.eventCount++;
        lastSession.lastActiveAt = log.createdAt;
        if (new Date(log.createdAt) < new Date(lastSession.startedAt)) {
          lastSession.startedAt = log.createdAt;
        }
      } else {
        sessions.push({
          browser: log.browser,
          device: log.device,
          startedAt: log.createdAt,
          lastActiveAt: log.createdAt,
          eventCount: 1,
          recentEvents: [log],
        });
      }
    }

    const actionCounts: Record<string, number> = {};
    for (const log of allLogs) {
      if (log.type !== "visit") {
        actionCounts[log.type] = (actionCounts[log.type] || 0) + 1;
      }
    }

    const devicesSet = new Set(allLogs.map((l) => l.device));
    const browsersSet = new Set(allLogs.map((l) => l.browser));

    return NextResponse.json({
      totalLogs: allLogs.length,
      totalSessions: sessions.length,
      actionCounts,
      devices: Array.from(devicesSet),
      browsers: Array.from(browsersSet),
      storage: isKVAvailable() ? "Vercel KV (постоянно)" : "In-memory (временное)",
      sessions: sessions.slice(0, 20).map((s) => ({
        browser: s.browser,
        device: s.device,
        startedAt: s.startedAt,
        lastActiveAt: s.lastActiveAt,
        eventCount: s.eventCount,
        recentEvents: s.recentEvents.slice(0, 5).map((e) => ({
          type: e.type,
          label: e.label,
          details: e.details,
          createdAt: e.createdAt,
        })),
      })),
    });
  } catch (err) {
    console.error("[activity] GET error:", err);
    return NextResponse.json({ error: "Ошибка получения статистики" }, { status: 500 });
  }
}
