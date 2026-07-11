import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 60;

type ZaiConfig = { apiKey: string; baseUrl: string; token?: string; chatId?: string; userId?: string; };

function getZaiConfig(): ZaiConfig {
  const envKey = process.env.ZAI_API_KEY || process.env.Z_AI_API_KEY || process.env.ZAI_KEY;
  const envUrl = process.env.ZAI_BASE_URL || process.env.Z_AI_BASE_URL || "https://api.z.ai/api/paas/v4";
  if (envKey) return { apiKey: envKey, baseUrl: envUrl };
  try {
    const configPaths = ["/etc/.z-ai-config", path.join(process.cwd(), ".z-ai-config")];
    for (const fp of configPaths) {
      try {
        if (fs.existsSync(fp)) {
          const c = JSON.parse(fs.readFileSync(fp, "utf-8"));
          if (c.baseUrl && c.apiKey) return { apiKey: c.apiKey, baseUrl: c.baseUrl, token: c.token, chatId: c.chatId, userId: c.userId };
        }
      } catch {}
    }
  } catch {}
  return { apiKey: "", baseUrl: envUrl };
}

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

function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const f = text.indexOf("{"), l = text.lastIndexOf("}");
  if (f === -1 || l === -1) throw new Error("Нет JSON");
  return JSON.parse(text.slice(f, l + 1));
}

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

    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}`, "X-Z-AI-From": "Z" };
    if (config.token) headers["X-Token"] = config.token;
    if (config.chatId) headers["X-Chat-Id"] = config.chatId;
    if (config.userId) headers["X-User-Id"] = config.userId;

    const MODELS = ["glm-4.5-flash", "glm-4.6-flash", "glm-4-flash-250414", "glm-4-flash", "glm-4-air", "glm-4-plus", "glm-4"];
    for (const model of MODELS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetch(url, {
          method: "POST", headers,
          body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: text }], temperature: 0.85, max_tokens: 2500, thinking: { type: "disabled" } }),
          signal: controller.signal,
        });
        const bodyText = await response.text();
        clearTimeout(timeout);
        if (response.ok) {
          let data: unknown; try { data = JSON.parse(bodyText); } catch { continue; }
          const msg = (data as { choices?: { message?: { content?: string; reasoning_content?: string } }[] })?.choices?.[0]?.message ?? {};
          const content = msg.content || msg.reasoning_content || "";
          if (!content) continue;
          try { return NextResponse.json(validate(extractJson(content))); }
          catch (e) { return NextResponse.json({ error: "Не удалось разобрать.", raw_preview: content.slice(0, 400) }, { status: 502 }); }
        }
        const isModelError = response.status === 400 && (bodyText.includes("Unknown Model") || bodyText.toLowerCase().includes("model"));
        if (isModelError) continue;
        return NextResponse.json({ error: `Z.ai API: ${response.status}` }, { status: 502 });
      } catch { clearTimeout(timeout); continue; }
    }
    return NextResponse.json({ error: "Модели недоступны." }, { status: 502 });
  } catch (err) {
    console.error("[slide-create] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
