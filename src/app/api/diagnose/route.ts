import { NextRequest, NextResponse } from "next/server";
import {
  SYSTEM_PROMPT,
  VALID_EMOTION_IDS,
  VALID_PIT_IDS,
  VALID_PROCESSING_TYPES,
  VALID_BEINGNESS_IDS,
  type DiagnoseResponse,
} from "@/lib/masterkit-prompt";
import {
  getZaiConfig,
  callZaiChat,
  extractJson,
  handleZaiError,
} from "@/lib/zai-helper";

/**
 * Node.js runtime — ретраи, до 60 сек таймаут.
 * Ранее было Edge (25 сек) — но это вызывало 504 на проде.
 */
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function validateDiagnosis(d: unknown): DiagnoseResponse {
  if (!d || typeof d !== "object") throw new Error("Ответ не объект");
  const obj = d as Record<string, unknown>;

  const level = obj.level as Record<string, unknown>;
  if (!level || typeof level.id !== "number" || level.id < 1 || level.id > 7) {
    throw new Error("Невалидный level");
  }

  const emotions = Array.isArray(obj.emotions) ? obj.emotions : [];
  for (const e of emotions) {
    const eo = e as Record<string, unknown>;
    if (!VALID_EMOTION_IDS.includes(eo.id as string)) {
      throw new Error("Невалидная эмоция: " + String(eo.id));
    }
  }

  let pit: DiagnoseResponse["pit"] = null;
  if (obj.pit && typeof obj.pit === "object") {
    const po = obj.pit as Record<string, unknown>;
    if (!VALID_PIT_IDS.includes(po.id as string)) {
      throw new Error("Невалидная яма: " + String(po.id));
    }
    pit = {
      id: po.id as string,
      name: String(po.name ?? ""),
      signs_matched: Array.isArray(po.signs_matched)
        ? (po.signs_matched as string[]).map(String)
        : [],
      explanation: String(po.explanation ?? ""),
    };
  }

  let beingness: DiagnoseResponse["beingness"] | null = null;
  const bo = obj.beingness as Record<string, unknown> | undefined;
  if (bo && typeof bo === "object" && bo.id) {
    if (!VALID_BEINGNESS_IDS.includes(bo.id as string)) {
      throw new Error("Невалидная бытийность: " + String(bo.id));
    }
    beingness = {
      id: bo.id as string,
      name: String(bo.name ?? ""),
      evidence: String(bo.evidence ?? ""),
      explanation: String(bo.explanation ?? ""),
    };
  }

  const processings = Array.isArray(obj.processings) ? obj.processings : [];
  const cleanProcessings = processings.map((p, i) => {
    const po = p as Record<string, unknown>;
    const type = po.type as string;
    if (!VALID_PROCESSING_TYPES.includes(type as never)) {
      throw new Error(`Проработка #${i + 1}: невалидный тип «${type}»`);
    }
    return {
      type: type as DiagnoseResponse["processings"][number]["type"],
      title: String(po.title ?? ""),
      why_now: String(po.why_now ?? ""),
      steps: Array.isArray(po.steps) ? (po.steps as string[]).map(String) : [],
      expected: String(po.expected ?? ""),
      duration: String(po.duration ?? ""),
    };
  });

  return {
    level: {
      id: level.id as number,
      name: String(level.name ?? ""),
      summary: String(level.summary ?? ""),
    },
    emotions: emotions.map((e) => {
      const eo = e as Record<string, unknown>;
      return {
        id: eo.id as string,
        name: String(eo.name ?? ""),
        intensity:
          (eo.intensity as DiagnoseResponse["emotions"][number]["intensity"]) ??
          "средняя",
        evidence: String(eo.evidence ?? ""),
      };
    }),
    pit,
    beingness,
    diagnosis_summary: String(obj.diagnosis_summary ?? ""),
    processings: cleanProcessings,
    next_step: String(obj.next_step ?? ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const lang = body?.lang === "en" ? "en" : "ru";

    const langInstruction =
      lang === "en"
        ? "\n\nВАЖНО: Весь диагноз и все тексты в JSON должны быть на АНГЛИЙСКОМ языке. " +
          "Переводите названия уровней, эмоций, ям и бытийностей на английский. " +
          "Проработки тоже на английском."
        : "";

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Опишите ситуацию подробнее — хотя бы 2–3 предложения." },
        { status: 400 }
      );
    }
    if (text.length > 8000) {
      return NextResponse.json(
        { error: "Текст слишком длинный — до 8000 символов." },
        { status: 400 }
      );
    }

    const config = getZaiConfig();

    if (!config.apiKey) {
      return NextResponse.json(
        {
          error:
            "На Vercel не задана переменная окружения ZAI_API_KEY. Откройте Vercel → ваш проект → Settings → Environment Variables → добавьте ZAI_API_KEY.",
          env_detected: {
            ZAI_API_KEY: process.env.ZAI_API_KEY ? "✓ set" : "✗ missing",
            Z_AI_API_KEY: process.env.Z_AI_API_KEY ? "✓ set" : "✗ missing",
            ZAI_KEY: process.env.ZAI_KEY ? "✓ set" : "✗ missing",
          },
        },
        { status: 500 }
      );
    }

    console.log(
      `[diagnose-edge] start: text_length=${text.length}, key_length=${config.apiKey.length}`
    );

    const result = await callZaiChat(
      config,
      SYSTEM_PROMPT + langInstruction,
      text,
      { temperature: 0.6, maxTokens: 1500 }
    );

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    console.log(`[diagnose-edge] got content, length=${result.content.length}`);

    try {
      const parsed = validateDiagnosis(extractJson(result.content));
      console.log("[diagnose-edge] success");
      return NextResponse.json(parsed);
    } catch (e) {
      console.error(
        "[diagnose-edge] parse error:",
        (e as Error).message,
        "\nraw:",
        result.content.slice(0, 500)
      );
      return NextResponse.json(
        {
          error:
            "Не удалось разобрать диагноз ИИ. Попробуйте переформулировать или повторить.",
          raw_preview: result.content.slice(0, 400),
        },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[diagnose-edge] fatal:", err);
    const msg = (err as Error)?.message ?? "Unknown error";
    return NextResponse.json(
      { error: "Сервис недоступен. " + msg },
      { status: 500 }
    );
  }
}
