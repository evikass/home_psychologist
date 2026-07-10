import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { METAPHOR_CARDS } from "@/lib/metaphor-cards-data";

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

function extractJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) text = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  const f = text.indexOf("{"), l = text.lastIndexOf("}");
  if (f === -1 || l === -1) throw new Error("Нет JSON");
  return JSON.parse(text.slice(f, l + 1));
}

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

    const url = `${config.baseUrl}/chat/completions`;
    const headers: Record<string, string> = { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}`, "X-Z-AI-From": "Z" };
    if (config.token) headers["X-Token"] = config.token;
    if (config.chatId) headers["X-Chat-Id"] = config.chatId;
    if (config.userId) headers["X-User-Id"] = config.userId;

    const MODELS = ["glm-4.5-flash", "glm-4.6-flash", "glm-4-flash-250414", "glm-4-flash", "glm-4-air", "glm-4-plus", "glm-4"];
    for (const model of MODELS) {
      console.log(`[card-diagnose] trying: ${model}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetch(url, {
          method: "POST", headers,
          body: JSON.stringify({ model, messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: text }], temperature: 0.75, max_tokens: 2000, thinking: { type: "disabled" } }),
          signal: controller.signal,
        });
        const bodyText = await response.text();
        clearTimeout(timeout);
        if (response.ok) {
          let data: unknown; try { data = JSON.parse(bodyText); } catch { continue; }
          const msg = (data as { choices?: { message?: { content?: string; reasoning_content?: string } }[] })?.choices?.[0]?.message ?? {};
          const content = msg.content || msg.reasoning_content || "";
          if (!content) continue;
          console.log(`[card-diagnose] success: ${model}`);
          try { return NextResponse.json(validate(extractJson(content))); }
          catch (e) { return NextResponse.json({ error: "Не удалось разобрать.", raw_preview: content.slice(0, 400) }, { status: 502 }); }
        }
        const isModelError = response.status === 400 && (bodyText.includes("Unknown Model") || bodyText.toLowerCase().includes("model"));
        if (isModelError) continue;
        if (response.status === 401) return NextResponse.json({ error: "Ключ Z.ai невалиден." }, { status: 502 });
        return NextResponse.json({ error: `Z.ai API: ${response.status}` }, { status: 502 });
      } catch { clearTimeout(timeout); continue; }
    }
    return NextResponse.json({ error: "Модели недоступны." }, { status: 502 });
  } catch (err) {
    console.error("[card-diagnose] fatal:", err);
    return NextResponse.json({ error: "Сервис недоступен." }, { status: 500 });
  }
}
