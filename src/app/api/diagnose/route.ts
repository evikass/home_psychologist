import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import {
  SYSTEM_PROMPT,
  VALID_EMOTION_IDS,
  VALID_PIT_IDS,
  VALID_PROCESSING_TYPES,
  type DiagnoseResponse,
} from "@/lib/masterkit-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Безопасный парсинг JSON-ответа LLM — модель иногда оборачивает в ```json */
function extractJson(raw: string): unknown {
  let text = raw.trim();

  // снять markdown-обёртку
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  }

  // найти первый { и последний }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("В ответе LLM нет валидного JSON-объекта");
  }
  const slice = text.slice(first, last + 1);
  return JSON.parse(slice);
}

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
          (eo.intensity as DiagnoseResponse["emotions"][number]["intensity"]) ?? "средняя",
        evidence: String(eo.evidence ?? ""),
      };
    }),
    pit,
    diagnosis_summary: String(obj.diagnosis_summary ?? ""),
    processings: cleanProcessings,
    next_step: String(obj.next_step ?? ""),
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
    if (text.length > 8000) {
      return NextResponse.json(
        { error: "Текст слишком длинный — до 8000 символов." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
      temperature: 0.6,
      max_tokens: 2400,
      thinking: { type: "disabled" },
    });

    const raw = completion.choices?.[0]?.message?.content ?? "";
    if (!raw) {
      return NextResponse.json(
        { error: "ИИ не вернул ответ. Попробуйте ещё раз." },
        { status: 502 }
      );
    }

    let parsed: DiagnoseResponse;
    try {
      parsed = validateDiagnosis(extractJson(raw));
    } catch (e) {
      console.error(
        "[diagnose] parse error:",
        (e as Error).message,
        "\nraw:",
        raw.slice(0, 500)
      );
      return NextResponse.json(
        {
          error:
            "Не удалось разобрать диагноз ИИ. Попробуйте переформулировать или повторить.",
          raw_preview: raw.slice(0, 400),
        },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[diagnose] fatal:", err);
    return NextResponse.json(
      { error: "Сервис недоступен. Попробуйте через минуту." },
      { status: 500 }
    );
  }
}
