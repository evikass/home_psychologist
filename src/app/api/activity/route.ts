import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

// In-memory хранилище (персистирует в рамках одного serverless instance)
type ActivityEntry = {
  id: string;
  type: string;
  label: string;
  details: string | null;
  browser: string;
  device: string;
  userAgent: string;
  createdAt: string;
};

// Глобальное хранилище — переживает холодные старты в пределах инстанса
const globalStore = globalThis as unknown as { __activityLogs?: ActivityEntry[] };
if (!globalStore.__activityLogs) {
  globalStore.__activityLogs = [];
}
const logs: ActivityEntry[] = globalStore.__activityLogs;

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
      userAgent: ua,
      createdAt: new Date().toISOString(),
    };

    logs.unshift(entry);

    // Ограничиваем размер
    if (logs.length > 500) {
      logs.length = 500;
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
    // Группируем по сессиям (30-минутные окна одного браузера)
    const sessions: Array<{
      browser: string;
      device: string;
      startedAt: string;
      lastActiveAt: string;
      eventCount: number;
      recentEvents: ActivityEntry[];
    }> = [];

    for (const log of logs) {
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

    // Подсчёт по типам
    const actionCounts: Record<string, number> = {};
    for (const log of logs) {
      if (log.type !== "visit") {
        actionCounts[log.type] = (actionCounts[log.type] || 0) + 1;
      }
    }

    // Уникальные
    const devicesSet = new Set(logs.map((l) => l.device));
    const browsersSet = new Set(logs.map((l) => l.browser));

    return NextResponse.json({
      totalLogs: logs.length,
      totalSessions: sessions.length,
      actionCounts,
      devices: Array.from(devicesSet),
      browsers: Array.from(browsersSet),
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
