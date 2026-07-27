import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 10;

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

// POST /api/activity — записать событие
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, label, details } = body;

    if (!type || !label) {
      return NextResponse.json({ error: "type и label обязательны" }, { status: 400 });
    }

    const ua = req.headers.get("user-agent") || "unknown";
    const { browser, device } = parseUA(ua);

    const entry = await db.activityLog.create({
      data: {
        type: String(type),
        label: String(label),
        details: details ? String(details) : null,
        userAgent: ua,
        browser,
        device,
      },
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err) {
    console.error("[activity] POST error:", err);
    return NextResponse.json({ error: "Ошибка записи" }, { status: 500 });
  }
}

// GET /api/activity — получить статистику (для админа)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");

    const logs = await db.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Группируем по сессиям (по ближайшим временным меткам в пределах 30 мин)
    const sessions: Array<{
      browser: string;
      device: string;
      startedAt: Date;
      lastActiveAt: Date;
      events: typeof logs;
    }> = [];

    for (const log of logs) {
      const lastSession = sessions[sessions.length - 1];
      const logTime = log.createdAt.getTime();
      const browser = log.browser || "unknown";
      const device = log.device || "desktop";

      // Если последняя сессия того же браузера и в пределах 30 мин — добавляем к ней
      if (
        lastSession &&
        lastSession.browser === browser &&
        logTime - lastSession.lastActiveAt.getTime() < 30 * 60 * 1000
      ) {
        lastSession.events.push(log);
        lastSession.lastActiveAt = log.createdAt;
        if (log.createdAt < lastSession.startedAt) {
          lastSession.startedAt = log.createdAt;
        }
      } else {
        sessions.push({
          browser,
          device,
          startedAt: log.createdAt,
          lastActiveAt: log.createdAt,
          events: [log],
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

    // Устройства
    const devicesSet = new Set(logs.map((l) => l.device || "desktop"));
    const browsersSet = new Set(logs.map((l) => l.browser || "unknown"));

    return NextResponse.json({
      totalLogs: logs.length,
      totalSessions: sessions.length,
      actionCounts,
      devices: Array.from(devicesSet),
      browsers: Array.from(browsersSet),
      sessions: sessions.slice(0, 20).map((s) => ({
        browser: s.browser,
        device: s.device,
        startedAt: s.startedAt.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
        eventCount: s.events.length,
        recentEvents: s.events.slice(0, 5).map((e) => ({
          type: e.type,
          label: e.label,
          details: e.details,
          createdAt: e.createdAt.toISOString(),
        })),
      })),
    });
  } catch (err) {
    console.error("[activity] GET error:", err);
    return NextResponse.json({ error: "Ошибка получения статистики" }, { status: 500 });
  }
}
