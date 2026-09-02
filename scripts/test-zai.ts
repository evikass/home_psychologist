/**
 * Простой тест Z.ai API — проверяем, отвечает ли вообще и за какое время.
 * Использует внутренний API (internal-api.z.ai/v1) с JWT-токеном.
 *
 * Запуск: bun /home/z/my-project/scripts/test-zai.ts
 */

import fs from "fs";

const config = JSON.parse(fs.readFileSync("/etc/.z-ai-config", "utf-8"));

console.log("=== Z.AI API TEST ===");
console.log("Base URL:", config.baseUrl);
console.log("API Key:", config.apiKey);
console.log("Chat ID:", config.chatId);
console.log("Token length:", config.token?.length || 0);
console.log("User ID:", config.userId);
console.log("");

const MODELS = ["glm-4.5-flash", "glm-4.6-flash", "glm-4-flash-250414", "glm-4-flash", "glm-4-air", "glm-4-plus", "glm-4"];

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${config.apiKey}`,
  "X-Z-AI-From": "Z",
  "X-Token": config.token,
  "X-Chat-Id": config.chatId,
  "X-User-Id": config.userId,
};

const url = `${config.baseUrl}/chat/completions`;

const simplePrompt = "Скажи «привет» одним словом.";
const systemPrompt = "Ты — помощник. Отвечай кратко.";

for (const model of MODELS) {
  console.log(`\n--- Testing model: ${model} ---`);
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: simplePrompt },
        ],
        temperature: 0.5,
        max_tokens: 100,
        thinking: { type: "disabled" },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - start;
    const bodyText = await response.text();

    console.log(`Status: ${response.status}`);
    console.log(`Time: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);

    if (response.ok) {
      try {
        const data = JSON.parse(bodyText);
        const msg = data?.choices?.[0]?.message ?? {};
        const content = msg.content || msg.reasoning_content || "(empty)";
        console.log(`Content: ${String(content).slice(0, 200)}`);
        console.log(`✓ Model ${model} WORKS`);
        break;
      } catch (e) {
        console.log(`Parse error: ${bodyText.slice(0, 200)}`);
      }
    } else {
      console.log(`Error body: ${bodyText.slice(0, 300)}`);
      const isModelError = response.status === 400 && (bodyText.includes("Unknown Model") || bodyText.toLowerCase().includes("model"));
      if (isModelError) {
        console.log(`→ Model not available, trying next`);
        continue;
      }
      if (response.status === 401) {
        console.log(`→ Auth error, stopping`);
        break;
      }
    }
  } catch (e) {
    const elapsed = Date.now() - start;
    console.log(`Failed after ${elapsed}ms: ${(e as Error).name}: ${(e as Error).message}`);
    if ((e as Error).name === "AbortError") {
      console.log(`→ Timeout, trying next model`);
    }
  }
}

console.log("\n=== TEST COMPLETE ===");
