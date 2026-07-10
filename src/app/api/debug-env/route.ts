import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Расширенный диагностический эндпоинт:
 * 1. Показывает состояние env-переменных
 * 2. Делает тестовый запрос к Z.ai с разными моделями
 * 3. Показывает статус и тело ответа для каждой модели
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
    zai_models_test: [] as Array<{
      model: string;
      status: number;
      ok: boolean;
      response_preview: string;
    }>,
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

  const testUrl = `${baseUrl}/chat/completions`;
  const MODELS_TO_TRY = [
    "glm-4-flash-250414",
    "glm-4-flash",
    "glm-4-air",
    "glm-4.5-flash",
    "glm-4.6-flash",
    "glm-4-plus",
    "glm-4",
  ];

  let workingModel: string | null = null;

  for (const model of MODELS_TO_TRY) {
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
          model,
          messages: [{ role: "user", content: "Скажи привет" }],
          max_tokens: 20,
        }),
        signal: controller.signal,
      });

      const bodyText = await response.text();
      clearTimeout(timeout);

      envStatus.zai_models_test.push({
        model,
        status: response.status,
        ok: response.ok,
        response_preview: bodyText.slice(0, 200),
      });

      if (response.ok && !workingModel) {
        workingModel = model;
      }
    } catch (e) {
      envStatus.zai_models_test.push({
        model,
        status: 0,
        ok: false,
        response_preview: `Error: ${(e as Error).message}`,
      });
    }
  }

  if (workingModel) {
    envStatus.diagnosis = `✅ Ключ работает! Рабочая модель: ${workingModel}. Диагностика должна работать на главной странице.`;
  } else if (envStatus.zai_models_test.some((m) => m.status === 401)) {
    envStatus.diagnosis =
      "❌ Ключ Z.ai невалиден (401). Создайте новый на https://z.ai/manage/apikey и обновите ZAI_API_KEY в Vercel.";
    envStatus.next_steps = [
      "1. Откройте https://z.ai/manage/apikey",
      "2. Создайте новый ключ",
      "3. Vercel → Settings → Environment Variables → ZAI_API_KEY → отредактировать",
      "4. Вставьте новый ключ",
      "5. Deployments → Redeploy",
    ];
  } else if (envStatus.zai_models_test.some((m) => m.status === 403)) {
    envStatus.diagnosis =
      "❌ Доступ запрещён (403). Проверьте, что аккаунт Z.ai активен и у ключа есть права.";
  } else if (envStatus.zai_models_test.some((m) => m.status === 429)) {
    envStatus.diagnosis =
      "⚠️ Превышен лимит (429). Подождите минуту или пополните баланс на https://z.ai.";
  } else {
    envStatus.diagnosis =
      "❌ Ни одна модель не сработала. Смотрите детали ниже — возможно, нужно активировать модель в личном кабинете Z.ai.";
  }

  return NextResponse.json(envStatus, { status: 200 });
}
