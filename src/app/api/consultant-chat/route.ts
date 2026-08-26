import { NextRequest, NextResponse } from "next/server";
import {
  getZaiConfig,
  callZaiMessagesEdge,
  handleZaiError,
} from "@/lib/zai-edge";

export const runtime = "edge";
export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

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

    const result = await callZaiMessagesEdge(config, apiMessages, {
      temperature: 0.75,
      maxTokens: 600,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    console.log("[consultant-edge] success");
    return NextResponse.json({ content: result.content });
  } catch (err) {
    console.error("[consultant-edge] fatal:", err);
    return NextResponse.json(
      { error: "Сервис консультанта недоступен." },
      { status: 500 }
    );
  }
}
