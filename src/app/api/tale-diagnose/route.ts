import { NextRequest, NextResponse } from "next/server";
import { TALES } from "@/lib/tale-therapy-data";
import {
  getZaiConfig,
  callZaiChat,
  extractJson,
  handleZaiError,
} from "@/lib/zai-helper";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты — сказкотерапевт. Твоя задача — проанализировать ситуацию человека и:
1. Подобрать из имеющейся базы подходящую сказку или притчу
2. Написать персонализированную терапевтическую сказку, если ни одна из базы не подходит идеально
3. Дать разбор: почему именно эта история, какой в ней смысл для данной ситуации, какие вопросы для размышления

БАЗА ГОТОВЫХ СКАЗОК И ПРИТЧ:
${TALES.map((t) => `ID: ${t.id} | Тип: ${t.type} | Название: «${t.title}» | Темы: ${t.themes.join(", ")} | Суть: ${t.summary}`).join("\n")}

ПРАВИЛА:
1. Сначала попробуй подобрать готовую сказку/притчу из базы, если темы совпадают.
2. Если готовая не подходит идеально — напиши оригинальную персонализированную сказку (не из базы).
3. Сказка должна говорить с подсознанием через образы, а не через прямые советы.
4. Разбор должен объяснять, ПОЧЕМУ эта история — про ситуацию человека.
5. Вопросы для размышления должны возвращать человека к себе и телу.
6. Тон — тёплый, мудрый, как старый рассказчик у костра.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "selected_tale": {
    "id": "id из базы ИЛИ null если написана новая",
    "type": "сказка" | "притча" | "метафора",
    "title": "название",
    "source": "из базы" | "оригинальная"
  },
  "tale_text": "полный текст подобранной или написанной сказки/притчи",
  "diagnosis": {
    "theme": "главная тема ситуации человека (одно-два слова)",
    "connection": "2-3 предложения: как эта история связана с ситуацией человека",
    "insight": "2-3 предложения: какой ключевой инсайт несёт эта история для данного случая"
  },
  "moral": "мораль истории — 1-2 предложения, персонализированные под ситуацию",
  "reflection_questions": [
    "вопрос 1 для размышления (возвращает к себе)",
    "вопрос 2",
    "вопрос 3"
  ],
  "practice": {
    "title": "название практики по мотивам сказки",
    "steps": ["шаг 1", "шаг 2", "шаг 3"],
    "duration": "примерная длительность"
  },
  "summary": "2-3 предложения тёплого итога"
}

ВАЖНО:
- Возвращай ТОЛЬКО JSON.
- Все строки на русском.
- Если selected_tale.id — из базы, то tale_text должен быть текстом из базы (можно слегка адаптировать).
- Если source = "оригинальная" — tale_text должен быть новой, написанной ИИ сказкой.
- reflection_questions — 3 вопроса, не больше, не меньше.
- practice.steps — 3-5 шагов.`;

export type TaleDiagnosis = {
  selected_tale: {
    id: string | null;
    type: string;
    title: string;
    source: string;
  };
  tale_text: string;
  diagnosis: {
    theme: string;
    connection: string;
    insight: string;
  };
  moral: string;
  reflection_questions: string[];
  practice: {
    title: string;
    steps: string[];
    duration: string;
  };
  summary: string;
};

function validate(d: unknown): TaleDiagnosis {
  const obj = d as Record<string, unknown>;
  if (!obj) throw new Error("Не объект");
  return {
    selected_tale: {
      id: (obj.selected_tale as Record<string, unknown>)?.id as string | null ?? null,
      type: String((obj.selected_tale as Record<string, unknown>)?.type ?? "сказка"),
      title: String((obj.selected_tale as Record<string, unknown>)?.title ?? ""),
      source: String((obj.selected_tale as Record<string, unknown>)?.source ?? "оригинальная"),
    },
    tale_text: String(obj.tale_text ?? ""),
    diagnosis: {
      theme: String((obj.diagnosis as Record<string, unknown>)?.theme ?? ""),
      connection: String((obj.diagnosis as Record<string, unknown>)?.connection ?? ""),
      insight: String((obj.diagnosis as Record<string, unknown>)?.insight ?? ""),
    },
    moral: String(obj.moral ?? ""),
    reflection_questions: Array.isArray(obj.reflection_questions) ? (obj.reflection_questions as string[]).map(String) : [],
    practice: {
      title: String((obj.practice as Record<string, unknown>)?.title ?? ""),
      steps: Array.isArray((obj.practice as Record<string, unknown>)?.steps) ? ((obj.practice as Record<string, unknown>).steps as string[]).map(String) : [],
      duration: String((obj.practice as Record<string, unknown>)?.duration ?? ""),
    },
    summary: String(obj.summary ?? ""),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (text.length < 20) {
      return NextResponse.json({ error: "Опишите ситуацию подробнее." }, { status: 400 });
    }

    const config = getZaiConfig();
    if (!config.apiKey) {
      return NextResponse.json({ error: "Ключ Z.ai не настроен." }, { status: 500 });
    }

    const result = await callZaiChat(config, SYSTEM_PROMPT, text, {
      temperature: 0.8,
      maxTokens: 1500,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    try {
      return NextResponse.json(validate(extractJson(result.content)));
    } catch (e) {
      console.error("[tale-diagnose-edge] parse error:", (e as Error).message);
      return NextResponse.json(
        { error: "Не удалось разобрать. Попробуйте ещё.", raw_preview: result.content.slice(0, 400) },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[tale-diagnose-edge] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
