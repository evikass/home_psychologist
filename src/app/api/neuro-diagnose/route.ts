import { NextRequest, NextResponse } from "next/server";
import { MIPS_LEVELS, BRAINWAVE_STATES, NEURO_TECHNIQUES } from "@/lib/neurotransforming-data";
import {
  getZaiConfig,
  callZaiChat,
  extractJson,
  handleZaiError,
} from "@/lib/zai-helper";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

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

    const result = await callZaiChat(config, SYSTEM_PROMPT, text, {
      temperature: 0.7,
      maxTokens: 1500,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    try {
      const parsed = validateDiagnosis(extractJson(result.content));
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("[neuro-diagnose-edge] parse error:", (e as Error).message);
      return NextResponse.json(
        {
          error: "Не удалось разобрать диагноз. Попробуйте ещё раз.",
          raw_preview: result.content.slice(0, 400),
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[neuro-diagnose-edge] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
