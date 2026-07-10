import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Расширенный диагностический эндпоинт:
 * 1. Показывает состояние env-переменных
 * 2. Делает тестовый запрос к Z.ai с вашим ключом
 * 3. Показывает статус и тело ответа
 */
export async function GET() {
  const apiKey =
    process.env.ZAI_API_KEY ||
    process.env.Z_AI_API_KEY ||
    process.env.ZAI_KEY;

  const baseUrl =
    process.env.ZAI_BASE_URL ||
    process.env.Z_AI_BASE_URL ||
    "https://api.z.ai/api/paas/v4";

  const envStatus = {
    timestamp: new Date().toISOString(),
    runtime: process.env.RUNTIME_VERSION || "vercel",
    node_env: process.env.NODE_ENV,
    zai_env_vars: {
      ZAI_API_KEY: process.env.ZAI_API_KEY
        ? `✓ set (length=${process.env.ZAI_API_KEY.length})`
        : "✗ missing",
      Z_AI_API_KEY: process.env.Z_AI_API_KEY
        ? `✓ set (length=${process.env.Z_AI_API_KEY.length})`
        : "✗ missing",
      ZAI_KEY: process.env.ZAI_KEY
        ? `✓ set (length=${process.env.ZAI_KEY.length})`
        : "✗ missing",
      ZAI_BASE_URL: baseUrl,
    },
    zai_test_call: null as null | {
      url: string;
      status: number;
      ok: boolean;
      response_preview: string;
      error?: string;
    },
    diagnosis: "",
    next_steps: [] as string[],
  };

  if (!apiKey) {
    envStatus.diagnosis =
      "❌ Ключ Z.ai НЕ найден в env-переменных. Добавьте ZAI_API_KEY в Vercel → Settings → Environment Variables → Redeploy.";
    envStatus.next_steps = [
      "1. Откройте https://vercel.com/dashboard → ваш проект",
      "2. Settings → Environment Variables",
      "3. Добавьте: Key=ZAI_API_KEY, Value=<ваш ключ от https://z.ai>",
      "4. Отметьте Production",
      "5. Deployments → Redeploy",
    ];
    return NextResponse.json(envStatus, { status: 200 });
  }

  // Тестовый запрос к Z.ai
  const testUrl = `${baseUrl}/chat/completions`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(testUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: "Скажи привет" }],
        max_tokens: 20,
      }),
      signal: controller.signal,
    });

    const bodyText = await response.text();
    clearTimeout(timeout);

    envStatus.zai_test_call = {
      url: testUrl,
      status: response.status,
      ok: response.ok,
      response_preview: bodyText.slice(0, 500),
    };

    if (response.ok) {
      envStatus.diagnosis =
        "✅ Ключ работает! Z.ai отвечает. Если /api/diagnose всё ещё падает — проблема в чём-то другом, посмотрите Vercel Logs.";
    } else if (response.status === 401) {
      envStatus.diagnosis =
        "❌ Ключ Z.ai невалиден (401). Создайте новый на https://z.ai/manage/apikey и обновите ZAI_API_KEY в Vercel.";
      envStatus.next_steps = [
        "1. Откройте https://z.ai/manage/apikey",
        "2. Создайте новый ключ",
        "3. Vercel → Settings → Environment Variables → ZAI_API_KEY → отредактировать",
        "4. Вставьте новый ключ",
        "5. Deployments → Redeploy",
      ];
    } else if (response.status === 403) {
      envStatus.diagnosis =
        "❌ Доступ запрещён (403). Проверьте, что аккаунт Z.ai активен и у ключа есть права.";
    } else if (response.status === 429) {
      envStatus.diagnosis =
        "⚠️ Превышен лимит (429). Подождите минуту или пополните баланс на https://z.ai.";
    } else {
      envStatus.diagnosis = `❌ Z.ai вернул ошибку ${response.status}. Смотрите детали ниже.`;
    }
  } catch (e) {
    envStatus.zai_test_call = {
      url: testUrl,
      status: 0,
      ok: false,
      response_preview: "",
      error: (e as Error).message,
    };
    envStatus.diagnosis = `❌ Не удалось подключиться к Z.ai: ${(e as Error).message}`;
  }

  return NextResponse.json(envStatus, { status: 200 });
}
