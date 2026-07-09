import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

/**
 * Диагностический эндпоинт: показывает, видит ли сервер env-переменные.
 * Не раскрывает значения ключей — только факт их наличия и длину.
 *
 * Используется для отладки на Vercel: если ZAI_API_KEY здесь не виден,
 * значит переменная не добавлена или не передеплоено.
 */
export async function GET() {
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
      ZAI_BASE_URL: process.env.ZAI_BASE_URL || "(default: https://api.z.ai/api/paas/v4)",
      Z_AI_BASE_URL: process.env.Z_AI_BASE_URL || "(default)",
    },
    config_file_exists: {
      project_root: "(not checked on Vercel — file system read-only)",
    },
    diagnosis: "",
    next_steps: [] as string[],
  };

  const anyKeySet = !!(
    process.env.ZAI_API_KEY ||
    process.env.Z_AI_API_KEY ||
    process.env.ZAI_KEY
  );

  if (anyKeySet) {
    envStatus.diagnosis =
      "✅ Ключ Z.ai найден в env-переменных. Диагностика должна работать.";
    envStatus.next_steps = [
      "Если всё равно ошибка — проверьте Vercel Logs на наличие других сообщений.",
      "Возможно, ключ невалиден — создайте новый на https://z.ai/manage/apikey",
    ];
  } else {
    envStatus.diagnosis =
      "❌ Ключ Z.ai НЕ найден в env-переменных. Это причина ошибки 'Configuration file not found'.";
    envStatus.next_steps = [
      "1. Откройте https://vercel.com/dashboard → ваш проект",
      "2. Settings → Environment Variables",
      "3. Добавьте: Key=ZAI_API_KEY, Value=<ваш ключ от https://z.ai>",
      "4. Отметьте все окружения: Production + Preview + Development",
      "5. Сохраните",
      "6. Deployments → последний деплой → ⋮ → Redeploy",
      "7. После redeploy снова откройте этот URL /api/debug-env",
    ];
  }

  return NextResponse.json(envStatus, { status: 200 });
}
