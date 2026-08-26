import { NextRequest, NextResponse } from "next/server";
import {
  getZaiConfig,
  callZaiChat,
  extractJson,
  handleZaiError,
} from "@/lib/zai-helper";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Ты — сказочник и поэт. Создай терапевтическую историю (сказку, притчу или стих) на основе ситуации человека, разбитую на сцены-слайды.

ПРАВИЛА:
1. 5-7 сцен, каждая — короткий текст (2-4 предложения) + описание визуального образа
2. Образ должен быть конкретным: "туманный лес на рассвете", "одинокий фонарь у дороги" — для генерации SVG
3. Указать настроение сцены (одно слово): спокойствие, тревога, надежда, радость, грусть, свет, трансформация
4. Указать время суток: рассвет, день, закат, ночь
5. Последняя сцена — всегда светлая, с выходом/решением
6. Текст должен быть поэтичным, тёплым, метафоричным
7. История должна отражать ситуацию человека, но через образы

ФОРМАТ — строго JSON:
{
  "title": "название истории",
  "type": "сказка" | "притча" | "стих",
  "slides": [
    {
      "text": "текст сцены (2-4 предложения)",
      "scene": "описание визуального образа (например: 'туманный лес на рассвете, между деревьями пробивается золотой свет')",
      "mood": "спокойствие|тревога|надежда|радость|грусть|свет|трансформация",
      "timeOfDay": "рассвет|день|закат|ночь"
    }
  ],
  "moral": "мораль истории — 1-2 предложения"
}

ВАЖНО: Возвращай ТОЛЬКО JSON. 5-7 слайдов.`;

export type Slide = {
  text: string;
  scene: string;
  mood: string;
  timeOfDay: string;
};

export type SlideStory = {
  title: string;
  type: string;
  slides: Slide[];
  moral: string;
};

function validate(d: unknown): SlideStory {
  const obj = d as Record<string, unknown>;
  if (!obj) throw new Error("Не объект");
  return {
    title: String(obj.title ?? "История"),
    type: String(obj.type ?? "сказка"),
    slides: Array.isArray(obj.slides) ? (obj.slides as Record<string, unknown>[]).map((s) => ({
      text: String(s.text ?? ""),
      scene: String(s.scene ?? ""),
      mood: String(s.mood ?? "спокойствие"),
      timeOfDay: String(s.timeOfDay ?? "день"),
    })) : [],
    moral: String(obj.moral ?? ""),
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
      temperature: 0.85,
      maxTokens: 1500,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    try {
      return NextResponse.json(validate(extractJson(result.content)));
    } catch (e) {
      console.error("[slide-create-edge] parse error:", (e as Error).message);
      return NextResponse.json(
        { error: "Не удалось разобрать.", raw_preview: result.content.slice(0, 400) },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("[slide-create-edge] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
