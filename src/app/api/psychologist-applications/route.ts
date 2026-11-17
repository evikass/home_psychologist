import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const maxDuration = 10;
export const dynamic = "force-dynamic";

/**
 * API для заявок на роль психолога.
 *
 * Раньше использовался mailto: — но в VK/OK WebView это не работает
 * (модератор видел ошибку при нажатии «Отправить»).
 *
 * Теперь заявки сохраняются на сервере (Vercel KV или in-memory fallback)
 * и админ может просматривать их через панель администратора.
 *
 * Эндпоинты:
 *   POST /api/psychologist-applications — создать заявку
 *   GET  /api/psychologist-applications — список заявок (только для админа)
 *   POST /api/psychologist-applications?action=approve — одобрить заявку
 */

type Application = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  experience: string;
  platform: string;
  platformUserId: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
};

// In-memory fallback
type AppStore = Record<string, Application>;
const globalStore = globalThis as unknown as { __psychApps?: AppStore };
if (!globalStore.__psychApps) globalStore.__psychApps = {};
const memStore: AppStore = globalStore.__psychApps;

function isKVAvailable(): boolean {
  try {
    return !!process.env.KV_REST_API_URL || !!process.env.KV_URL;
  } catch {
    return false;
  }
}

const KV_KEY = "psychologist:applications";
const TTL_SECONDS = 365 * 24 * 60 * 60; // 1 год

function validateParams(s: string): string | null {
  if (!s) return null;
  if (s.length > 500) return null; // защита от больших данных
  return s;
}

// === GET — список заявок (для админа) ===
export async function GET() {
  try {
    let applications: Application[] = [];

    if (isKVAvailable()) {
      try {
        const raw = await kv.get<string>(KV_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Application[];
          if (Array.isArray(parsed)) applications = parsed;
        }
      } catch (e) {
        console.error("[psych-apps] KV GET error:", e);
        applications = Object.values(memStore);
      }
    } else {
      applications = Object.values(memStore);
    }

    // Сортируем — новые сверху
    applications.sort((a, b) =>
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    return NextResponse.json({
      ok: true,
      applications,
      storage: isKVAvailable() ? "kv" : "memory",
    });
  } catch (err) {
    console.error("[psych-apps] GET error:", err);
    return NextResponse.json(
      { error: "Ошибка получения заявок" },
      { status: 500 }
    );
  }
}

// === POST — создать/одобрить заявку ===
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "create";

    // === APPROVE / REJECT ===
    if (action === "approve" || action === "reject") {
      const appId = String(body?.id || "");
      if (!appId) {
        return NextResponse.json({ error: "ID заявки обязателен" }, { status: 400 });
      }

      let applications: Application[] = [];
      if (isKVAvailable()) {
        try {
          const raw = await kv.get<string>(KV_KEY);
          if (raw) applications = JSON.parse(raw) as Application[];
        } catch {}
      } else {
        applications = Object.values(memStore);
      }

      const idx = applications.findIndex(a => a.id === appId);
      if (idx === -1) {
        return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
      }

      applications[idx].status = action === "approve" ? "approved" : "rejected";

      if (isKVAvailable()) {
        try {
          await kv.set(KV_KEY, JSON.stringify(applications), { ex: TTL_SECONDS });
        } catch {}
      } else {
        memStore[appId] = applications[idx];
      }

      return NextResponse.json({
        ok: true,
        application: applications[idx],
      });
    }

    // === CREATE ===
    const name = validateParams(String(body?.name || "")) || "";
    const email = validateParams(String(body?.email || "")) || "";
    const specialization = validateParams(String(body?.specialization || "")) || "";
    const experience = validateParams(String(body?.experience || "")) || "";
    const platform = String(body?.platform || "web");
    const platformUserId = String(body?.platformUserId || "anonymous");

    if (!name || !email || specialization.length < 5) {
      return NextResponse.json(
        { error: "Заполните имя, email и специализацию" },
        { status: 400 }
      );
    }

    const application: Application = {
      id: `app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      email,
      specialization,
      experience,
      platform,
      platformUserId,
      status: "pending",
      appliedAt: new Date().toISOString(),
    };

    let applications: Application[] = [];
    if (isKVAvailable()) {
      try {
        const raw = await kv.get<string>(KV_KEY);
        if (raw) applications = JSON.parse(raw) as Application[];
      } catch {}
    } else {
      applications = Object.values(memStore);
    }

    applications.push(application);

    if (isKVAvailable()) {
      try {
        await kv.set(KV_KEY, JSON.stringify(applications), { ex: TTL_SECONDS });
      } catch (e) {
        console.error("[psych-apps] KV SET error:", e);
        memStore[application.id] = application;
      }
    } else {
      memStore[application.id] = application;
    }

    return NextResponse.json({
      ok: true,
      application,
    });
  } catch (err) {
    console.error("[psych-apps] POST error:", err);
    return NextResponse.json(
      { error: "Ошибка создания заявки" },
      { status: 500 }
    );
  }
}
