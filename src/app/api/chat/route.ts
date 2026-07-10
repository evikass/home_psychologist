import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";

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
  const envKey =
    process.env.ZAI_API_KEY ||
    process.env.Z_AI_API_KEY ||
    process.env.ZAI_KEY;
  const envUrl =
    process.env.ZAI_BASE_URL ||
    process.env.Z_AI_BASE_URL ||
    "https://api.z.ai/api/paas/v4";

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

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const CHAT_SYSTEM_PROMPT = `Ты — тёплый, мудрый наставник по методике «Мастер Кит» Дарьи Трутневой.
Сейчас ты ведёшь диалоговую проработку с человеком, который только что получил диагноз.

ПРАВИЛА ДИАЛОГА:
1. Говори коротко — 2-4 предложения за ответ. Не лекция, а живой разговор.
2. Не давай советов сразу. Сначала помоги человеку самому увидеть.
3. Используй вопросы, которые возвращают к телу и к чувствам: «Что ты сейчас чувствуешь в теле?», «Где это в тебе?»
4. Цитируй слова человека — пусть услышит себя.
5. Не осуждай. Любое состояние — нормально. Любая эмоция — это энергия.
6. Если человек сопротивляется — не дави. Мягко подсвети, что видишь сопротивление.
7. Если человек готов к практике — предложи конкретный шаг из арсенала методики:
   - Принятие, прощение, отпускание, благодарность, любовь к себе, доверие, сила, расширение, ответственность, заземление
8. Помни контекст диагноза — к какой бытийности, эмоции, яме человек привязан.
   Возвращай его к этому контексту, если уходит в сторону.
9. Если человек говорит «я не знаю» — это нормально. Предложи просто подышать или почувствовать тело.
10. Не используй психологический жаргон. Говори простыми, тёплыми словами.

ТОН: как старший друг, который видит тебя насквозь и любит таким, какой ты есть.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const diagnosis = body?.diagnosis as DiagnoseResponse | undefined;
    const lang = body?.lang === "en" ? "en" : "ru";

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "Сообщения не переданы." },
        { status: 400 }
      );
    }

    const config = getZaiConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { error: "Ключ Z.ai не настроен. AI-чат недоступен." },
        { status: 500 }
      );
    }

    const diagnosisContext = diagnosis
      ? `\n\nКОНТЕКСТ ДИАГНОЗА ЧЕЛОВЕКА (используй это в работе):
- Уровень развития: ${diagnosis.level?.name} (${diagnosis.level?.summary})
- Застрявшие эмоции: ${diagnosis.emotions?.map((e) => e.name).join(", ") || "не определены"}
- Эмоциональная яма: ${diagnosis.pit?.name ? diagnosis.pit.name + " — " + diagnosis.pit.explanation : "нет"}
- Ведущая бытийность: ${diagnosis.beingness?.name ? diagnosis.beingness.name + " — " + diagnosis.beingness.explanation : "не определена"}
- Краткий диагноз: ${diagnosis.diagnosis_summary}
- Рекомендованные проработки: ${diagnosis.processings?.map((p) => p.title).join("; ") || "нет"}

Веди диалог с учётом этого контекста. Помогай человеку прожить и проработать то, что видно в диагнозе.`
      : "";

    const langInstruction = lang === "en" ? "\n\nRespond in English." : "";

    const apiMessages: ChatMessage[] = [
      { role: "system", content: CHAT_SYSTEM_PROMPT + diagnosisContext + langInstruction },
      ...messages.map((m: { role: string; content: string }) => ({
        role: (m.role === "assistant" ? "assistant" : "user") as "user" | "assistant",
        content: String(m.content ?? ""),
      })),
    ];

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
      console.log(`[chat] trying model: ${model}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 500,
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

          if (content) {
            console.log(`[chat] success with model: ${model}`);
            return NextResponse.json({ content });
          }
          continue;
        }

        const isModelError =
          response.status === 400 &&
          (bodyText.includes("Unknown Model") ||
            bodyText.toLowerCase().includes("model"));
        if (isModelError) {
          lastError = { status: response.status, body: bodyText };
          continue;
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

    return NextResponse.json(
      { error: "Все модели недоступны." },
      { status: 502 }
    );
  } catch (err) {
    console.error("[chat] fatal:", err);
    return NextResponse.json(
      { error: "Сервис чата недоступен." },
      { status: 500 }
    );
  }
}
