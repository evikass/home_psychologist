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

  // Fallback: config file (sandbox)
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

/**
 * POST /api/transcribe
 * Принимает: { audio: "base64-encoded-audio-data" }
 * Возвращает: { text: "transcribed text" }
 *
 * Использует Z.ai ASR API для распознавания речи.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const audioBase64 = typeof body?.audio === "string" ? body.audio : "";

    if (!audioBase64) {
      return NextResponse.json(
        { error: "Аудиоданные не переданы." },
        { status: 400 }
      );
    }

    const config = getZaiConfig();
    if (!config.apiKey) {
      return NextResponse.json(
        { error: "Ключ Z.ai не настроен на сервере." },
        { status: 500 }
      );
    }

    const url = `${config.baseUrl}/audio/asr`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "X-Z-AI-From": "Z",
    };
    if (config.token) headers["X-Token"] = config.token;
    if (config.chatId) headers["X-Chat-Id"] = config.chatId;
    if (config.userId) headers["X-User-Id"] = config.userId;

    console.log("[transcribe] sending to Z.ai ASR, audio size:", audioBase64.length);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        file_base64: audioBase64,
      }),
    });

    const bodyText = await response.text();

    if (!response.ok) {
      console.error("[transcribe] Z.ai ASR error:", response.status, bodyText.slice(0, 300));
      return NextResponse.json(
        {
          error: `Z.ai ASR вернул ошибку ${response.status}.`,
          detail: bodyText.slice(0, 300),
        },
        { status: 502 }
      );
    }

    let data: unknown;
    try {
      data = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        { error: "Невалидный JSON от Z.ai ASR." },
        { status: 502 }
      );
    }

    // Z.ai ASR возвращает { text: "..." } или { result: "..." }
    const text =
      (data as { text?: string })?.text ||
      (data as { result?: string })?.result ||
      (data as { data?: { text?: string } })?.data?.text ||
      "";

    if (!text) {
      console.error("[transcribe] empty text in response:", bodyText.slice(0, 300));
      return NextResponse.json(
        { error: "Не удалось распознать речь. Попробуйте говорить громче и чётче." },
        { status: 502 }
      );
    }

    console.log("[transcribe] success, text length:", text.length);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[transcribe] fatal:", err);
    return NextResponse.json(
      { error: "Сервис распознавания недоступен." },
      { status: 500 }
    );
  }
}
