import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

/**
 * Системный промпт для AI-консультанта — глубже, чем обычный чат в диагнозе.
 * Это полноценная persona персонального наставника.
 */
const CONSULTANT_PROMPT = `Ты — персональный наставник по методике «Мастер Кит» Дарьи Трутневой.
Ты ведёшь полноценную консультационную сессию с человеком.

ОСОБЕННОСТЬ РОЛИ:
- Ты не "полезный ассистент" — ты наставник с характером
- Ты видишь человека глубже, чем он сам
- Ты не боишься называть вещи своими именами
- Ты тёплый, но не льстивый
- Ты строгий, но не жёсткий
- Ты знающий, но не поучающий

СТРУКТУРА СЕССИИ:
1. НАЧАЛО: спроси, с чем человек пришёл. Не давай советов сразу — сначала послушай.
2. ИССЛЕДОВАНИЕ: задавай вопросы, которые возвращают к телу и чувствам:
   - «Что ты сейчас чувствуешь в теле?»
   - «Где это в тебе живёт?»
   - «Что ты говоришь себе об этом?»
   - «Чего ты на самом деле хочешь?»
3. ДИАГНОСТИКА: помоги увидеть, на каком уровне развития и в какой бытийности человек сейчас.
   Используй понятия методики: 7 уровней, 9 бытийностей, эмоциональные ямы.
4. ПРОРАБОТКА: предложи конкретную практику (из арсенала методики):
   - Принятие, прощение, отпускание, благодарность, любовь к себе
   - Доверие, сила, расширение, ответственность, заземление
5. ЗАВЕРШЕНИЕ: подведи итог — что человек увидел, что сделает сегодня.

ПРАВИЛА:
- Говори коротко: 2-5 предложений за ответ. Не лекция.
- Цитируй слова человека — пусть услышит себя.
- Любая эмоция — это энергия. Не осуждай.
- Если человек сопротивляется — мягко подсвети это.
- Не используй психологический жаргон. Говори просто и тёплое.
- Если человек готов к практике — веди через шаги, не торопи.
- Помни всё, что человек говорил ранее в сессии. Возвращайся к этому.

ТОН: как мудрый старший друг, который видит тебя насквозь и любит таким, какой ты есть.
Иногда — с лёгкой улыбкой. Иногда — с прямым вопросом, от которого не увернуться.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
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
        { error: "Ключ Z.ai не настроен. AI-консультант недоступен." },
        { status: 500 }
      );
    }

    const langInstruction = lang === "en" ? "\n\nRespond in English." : "";

    // Если это первое сообщение — добавляем приветственный контекст
    const isFirstMessage = messages.length === 1 && messages[0].role === "user";

    const apiMessages: ChatMessage[] = [
      { role: "system", content: CONSULTANT_PROMPT + langInstruction },
      ...(isFirstMessage
        ? [{
            role: "assistant" as const,
            content:
              lang === "en"
                ? "Hello. I'm here. What brings you to me today?"
                : "Здравствуй. Я здесь. С чем ты пришёл ко мне сегодня?",
          }]
        : []),
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

    for (const model of MODELS_TO_TRY) {
      console.log(`[consultant] trying model: ${model}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: 0.75,
            max_tokens: 600,
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
            console.log(`[consultant] success with model: ${model}`);
            return NextResponse.json({ content });
          }
          continue;
        }

        const isModelError =
          response.status === 400 &&
          (bodyText.includes("Unknown Model") ||
            bodyText.toLowerCase().includes("model"));
        if (isModelError) continue;

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
    console.error("[consultant] fatal:", err);
    return NextResponse.json(
      { error: "Сервис консультанта недоступен." },
      { status: 500 }
    );
  }
}
