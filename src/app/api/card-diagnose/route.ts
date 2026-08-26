import { NextRequest, NextResponse } from "next/server";
import { METAPHOR_CARDS } from "@/lib/metaphor-cards-data";
import {
  getZaiConfig,
  callZaiChat,
  extractJson,
  handleZaiError,
} from "@/lib/zai-helper";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты — метафорический картотерапевт. Твоя задача — проанализировать ситуацию человека и подобрать метафорическую карту, которая отражает его состояние и даёт ключ к выходу.

БАЗА МЕТАФОРИЧЕСКИХ КАРТ:
${METAPHOR_CARDS.map((c) => `ID: ${c.id} | Название: «${c.title}» | Темы: ${c.themes.join(", ")} | Образ: ${c.imageDescription} | Символизм: ${c.symbolism} | Ключевые слова: ${c.keywords.join(", ")}`).join("\n")}

ПРАВИЛА:
1. Подбери ОДНУ карту из базы, которая лучше всего отражает ситуацию.
2. Объясни, ПОЧЕМУ эта карта — про данного человека.
3. Опиши, что человек видит на карте и что это символизирует.
4. Дай 3 вопроса для работы с картой.
5. Предложи практику на основе образа карты.
6. Тон — мудрый, образный, как толкователь снов.

ФОРМАТ ОТВЕТА — строго JSON:
{
  "selected_card": {
    "id": "id из базы",
    "title": "название карты",
    "image_description": "описание образа из базы",
    "symbolism": "символизм из базы"
  },
  "analysis": {
    "why_this_card": "2-3 предложения: почему именно эта карта отражает ситуацию",
    "what_you_see": "2-3 предложения: что человек видит на карте и как это связано с ним",
    "what_it_means": "2-3 предложения: что этот образ символизирует для данного случая"
  },
  "reflection_questions": ["вопрос 1", "вопрос 2", "вопрос 3"],
  "practice": {
    "title": "название практики на основе карты",
    "steps": ["шаг 1", "шаг 2", "шаг 3"],
    "duration": "длительность"
  },
  "summary": "2-3 предложения тёплого итога"
}

ВАЖНО:
- Возвращай ТОЛЬКО JSON.
- Все строки на русском.
- selected_card.id — обязательно из базы.
- reflection_questions — ровно 3 вопроса.
- practice.steps — 3-5 шагов.`;

export type CardDiagnosis = {
  selected_card: {
    id: string;
    title: string;
    image_description: string;
    symbolism: string;
  };
  analysis: {
    why_this_card: string;
    what_you_see: string;
    what_it_means: string;
  };
  reflection_questions: string[];
  practice: {
    title: string;
    steps: string[];
    duration: string;
  };
  summary: string;
};

function validate(d: unknown): CardDiagnosis {
  const obj = d as Record<string, unknown>;
  if (!obj) throw new Error("Не объект");
  const sc = obj.selected_card as Record<string, unknown>;
  if (!sc || !sc.id) throw new Error("Нет карты");
  return {
    selected_card: { id: String(sc.id), title: String(sc.title ?? ""), image_description: String(sc.image_description ?? ""), symbolism: String(sc.symbolism ?? "") },
    analysis: {
      why_this_card: String((obj.analysis as Record<string, unknown>)?.why_this_card ?? ""),
      what_you_see: String((obj.analysis as Record<string, unknown>)?.what_you_see ?? ""),
      what_it_means: String((obj.analysis as Record<string, unknown>)?.what_it_means ?? ""),
    },
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
    if (text.length < 20) return NextResponse.json({ error: "Опишите ситуацию подробнее." }, { status: 400 });

    const config = getZaiConfig();
    if (!config.apiKey) return NextResponse.json({ error: "Ключ Z.ai не настроен." }, { status: 500 });

    const result = await callZaiChat(config, SYSTEM_PROMPT, text, {
      temperature: 0.75,
      maxTokens: 1500,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    try {
      return NextResponse.json(validate(extractJson(result.content)));
    } catch (e) {
      console.error("[card-diagnose-edge] parse error:", (e as Error).message);
      return NextResponse.json(
        { error: "Не удалось разобрать.", raw_preview: result.content.slice(0, 400) },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[card-diagnose-edge] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
