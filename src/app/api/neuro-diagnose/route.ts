import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MIPS_LEVELS, BRAINWAVE_STATES, NEURO_TECHNIQUES } from "@/lib/neurotransforming-data";

export const runtime = "nodejs";
export const maxDuration = 60;

type ZaiConfig = {
  apiKey: string;
  baseUrl: string;
  token?: string;
  chatId?: string;
  userId?: string;
};

function getZaiConfig(): ZaiConfig {
  const envKey = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY || process.env.ZAI_KEY;
  const envUrl = process.env.ZAI_BASE_URL || process.env.Z_AI_BASE_URL || "https://api.z.ai/api/paas/v4";
  if (envKey) return { apiKey: envKey, baseUrl: envUrl };

  try {
    const configPaths = ["/etc/.z-ai-config", path.join(process.cwd(), ".z-ai-config")];
    for (const filePath of configPaths) {
      try {
        if (fs.existsSync(filePath)) {
          const config = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (config.baseUrl && config.apiKey) {
            return {
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              token: config.token,
              chatId: config.chatId,
              userId: config.userId,
            };
          }
        }
      } catch {}
    }
  } catch {}
  return { apiKey: "", baseUrl: envUrl };
}

const SYSTEM_PROMPT = `Ты — эксперт по нейротрансформингу С.В. Ковалёва.
Твоя задача — проанализировать «жалобное письмо» человека и выдать полный разбор ситуации
в терминах нейротрансформинга: определить подсознательную программу, её уровень, предложить
путь выхода через техники.

БАЗА ЗНАНИЙ НЕЙРОТРАНСФОРМИНГА

8 УРОВНЕЙ ПРОГРАММ (MIPS — от глубинных к поверхностным):
${MIPS_LEVELS.map((l) => `${l.id}. ${l.name} — ${l.description} Примеры: ${l.examples.join("; ")}.`).join("\n")}

4 РИТМА МОЗГА (состояния сознания):
${BRAINWAVE_STATES.map((s) => `${s.name} (${s.frequency}) — ${s.description} Практики: ${s.practices.join(", ")}.`).join("\n")}

6 ТЕХНИК НЕЙРОТРАНСФОРМИНГА:
${NEURO_TECHNIQUES.map((t) => `- ${t.name} (уровень: ${t.level}): ${t.purpose}. Когда: ${t.when}.`).join("\n")}

ПРАВИЛА АНАЛИЗА

1. Определи подсознательную программу — что человек повторяет и почему.
   Загляни как можно глубже (импринты раннего детства, убеждения, пренатальные программы).
2. Уровень MIPS — где находится корень программы (1-8). Чаще всего корень на 5-6 уровнях.
3. Рекомендуемое состояние сознания — в каком ритме мозга лучше всего работать (чаще Альфа или Тета).
4. Цикл трансформации — какие этапы нужны и сколько времени займёт.
5. Техники — 2-4 конкретные техники с пошаговыми инструкциями. Не дублируй типы.
6. Тон — тёплый, как наставник, без жаргона, но точно описывая, что видишь.
7. Цитируй слова человека — пусть увидит себя.

ФОРМАТ ОТВЕТА — строго валидный JSON, без markdown, без текста вокруг.
Схема:

{
  "program": {
    "name": "название программы (коротко, от первого лица)",
    "description": "что повторяется в жизни человека — 2-3 предложения",
    "source": "где программа сформировалась — 1-2 предложения о корне"
  },
  "mips_level": {
    "id": число 1-8,
    "name": название уровня,
    "explanation": "почему именно этот уровень — 1-2 предложения"
  },
  "recommended_state": {
    "id": "beta" | "alpha" | "theta" | "delta",
    "name": название ритма,
    "reason": "почему в этом состоянии — 1-2 предложения"
  },
  "cycle": [
    {
      "stage_id": "1" | "2" | "3" | "4" | "5",
      "stage_name": "Диагностика | Доступ к подсознанию | Поиск источника | Перекодирование | Интеграция",
      "what_to_do": "конкретное действие в этом этапе — 1-2 предложения"
    }
  ],
  "techniques": [
    {
      "id": id техники из списка выше,
      "name": название техники,
      "why_now": "почему именно эта техника сейчас — 1-2 предложения",
      "steps": ["шаг 1", "шаг 2", "..."],
      "expected_result": "что должно прийти в результате"
    }
  ],
  "integration_plan": {
    "duration_days": число (минимум 21, обычно 21-90),
    "daily_practice": "что делать ежедневно — 1-2 предложения",
    "checkpoints": ["контрольная точка через 7 дней", "...", "..."]
  },
  "summary": "2-4 предложения тёплого итога: что происходит, в чём корень, как выходить"
}

ВАЖНО:
- Возвращай ТОЛЬКО JSON. Никакого текста до или после.
- Все строки на русском языке.
- cycle должен содержать все 5 этапов с конкретными действиями для данного случая.
- techniques — 2-4 техники из разрешённого списка.
- integration_plan.duration_days — от 21 до 90.
- integration_plan.checkpoints — 2-3 контрольные точки.`;

export type NeuroDiagnosis = {
  program: {
    name: string;
    description: string;
    source: string;
  };
  mips_level: {
    id: number;
    name: string;
    explanation: string;
  };
  recommended_state: {
    id: string;
    name: string;
    reason: string;
  };
  cycle: Array<{
    stage_id: string;
    stage_name: string;
    what_to_do: string;
  }>;
  techniques: Array<{
    id: string;
    name: string;
    why_now: string;
    steps: string[];
    expected_result: string;
  }>;
  integration_plan: {
    duration_days: number;
    daily_practice: string;
    checkpoints: string[];
  };
  summary: string;
};

function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("В ответе LLM нет валидного JSON");
  }
  return JSON.parse(text.slice(first, last + 1));
}

function validateDiagnosis(d: unknown): NeuroDiagnosis {
  if (!d || typeof d !== "object") throw new Error("Ответ не объект");
  const obj = d as Record<string, unknown>;

  const program = obj.program as Record<string, unknown>;
  if (!program) throw new Error("Нет поля program");

  const mipsLevel = obj.mips_level as Record<string, unknown>;
  if (!mipsLevel || typeof mipsLevel.id !== "number" || mipsLevel.id < 1 || mipsLevel.id > 8) {
    throw new Error("Невалидный mips_level");
  }

  const recState = obj.recommended_state as Record<string, unknown>;
  const validStates = ["beta", "alpha", "theta", "delta"];
  if (!recState || !validStates.includes(recState.id as string)) {
    throw new Error("Невалидный recommended_state");
  }

  const cycle = Array.isArray(obj.cycle) ? obj.cycle : [];
  const techniques = Array.isArray(obj.techniques) ? obj.techniques : [];
  const integration = obj.integration_plan as Record<string, unknown>;

  if (!integration || typeof integration.duration_days !== "number") {
    throw new Error("Невалидный integration_plan");
  }

  return {
    program: {
      name: String(program.name ?? ""),
      description: String(program.description ?? ""),
      source: String(program.source ?? ""),
    },
    mips_level: {
      id: mipsLevel.id as number,
      name: String(mipsLevel.name ?? ""),
      explanation: String(mipsLevel.explanation ?? ""),
    },
    recommended_state: {
      id: recState.id as string,
      name: String(recState.name ?? ""),
      reason: String(recState.reason ?? ""),
    },
    cycle: cycle.map((c) => {
      const co = c as Record<string, unknown>;
      return {
        stage_id: String(co.stage_id ?? ""),
        stage_name: String(co.stage_name ?? ""),
        what_to_do: String(co.what_to_do ?? ""),
      };
    }),
    techniques: techniques.map((t) => {
      const to = t as Record<string, unknown>;
      return {
        id: String(to.id ?? ""),
        name: String(to.name ?? ""),
        why_now: String(to.why_now ?? ""),
        steps: Array.isArray(to.steps) ? (to.steps as string[]).map(String) : [],
        expected_result: String(to.expected_result ?? ""),
      };
    }),
    integration_plan: {
      duration_days: integration.duration_days as number,
      daily_practice: String(integration.daily_practice ?? ""),
      checkpoints: Array.isArray(integration.checkpoints)
        ? (integration.checkpoints as string[]).map(String)
        : [],
    },
    summary: String(obj.summary ?? ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Опишите ситуацию подробнее — хотя бы 2–3 предложения." },
        { status: 400 }
      );
    }

    const config = getZaiConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { error: "Ключ Z.ai не настроен на сервере." },
        { status: 500 }
      );
    }

    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-Z-AI-From": "Z",
    };
    if (config.token) headers["X-Token"] = config.token;
    if (config.chatId) headers["X-Chat-Id"] = config.chatId;
    if (config.userId) headers["X-User-Id"] = config.userId;

    const MODELS_TO_TRY = [
      "glm-4.5-flash",
      "glm-4.6-flash",
      "glm-4-flash-250414",
      "glm-4-flash",
      "glm-4-air",
      "glm-4-plus",
      "glm-4",
    ];

    let lastError: { status: number; body: string } | null = null;

    for (const model of MODELS_TO_TRY) {
      console.log(`[neuro-diagnose] trying model: ${model}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: text },
            ],
            temperature: 0.7,
            max_tokens: 2800,
            thinking: { type: "disabled" },
          }),
          signal: controller.signal,
        });

        const bodyText = await response.text();
        clearTimeout(timeout);

        if (response.ok) {
          let data: unknown;
          try {
            data = JSON.parse(bodyText);
          } catch {
            continue;
          }
          const message = (data as { choices?: { message?: { content?: string; reasoning_content?: string } }[] })
            ?.choices?.[0]?.message ?? {};
          const content = message.content || message.reasoning_content || "";
          if (!content) continue;

          console.log(`[neuro-diagnose] success with model: ${model}, content length: ${content.length}`);
          try {
            const parsed = validateDiagnosis(extractJson(content));
            return NextResponse.json(parsed);
          } catch (e) {
            console.error("[neuro-diagnose] parse error:", (e as Error).message);
            return NextResponse.json(
              { error: "Не удалось разобрать диагноз. Попробуйте ещё раз.", raw_preview: content.slice(0, 400) },
              { status: 502 }
            );
          }
        }

        const isModelError =
          response.status === 400 &&
          (bodyText.includes("Unknown Model") || bodyText.toLowerCase().includes("model"));
        if (isModelError) {
          lastError = { status: response.status, body: bodyText };
          continue;
        }

        if (response.status === 401) {
          return NextResponse.json(
            { error: "Ключ Z.ai невалиден (401). Создайте новый на z.ai." },
            { status: 502 }
          );
        }

        return NextResponse.json(
          { error: `Z.ai API error: ${response.status}` },
          { status: 502 }
        );
      } catch {
        clearTimeout(timeout);
        continue;
      }
    }

    return NextResponse.json({ error: "Все модели недоступны." }, { status: 502 });
  } catch (err) {
    console.error("[neuro-diagnose] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
