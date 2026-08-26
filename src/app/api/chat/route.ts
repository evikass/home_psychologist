import { NextRequest, NextResponse } from "next/server";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
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

    const result = await callZaiMessagesEdge(config, apiMessages, {
      temperature: 0.7,
      maxTokens: 500,
    });

    if (!result.ok) {
      return handleZaiError(result, NextResponse);
    }

    console.log("[chat-edge] success");
    return NextResponse.json({ content: result.content });
  } catch (err) {
    console.error("[chat-edge] fatal:", err);
    return NextResponse.json(
      { error: "Сервис чата недоступен." },
      { status: 500 }
    );
  }
}
