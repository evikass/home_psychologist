/**
 * Тест разных способов отключения reasoning_content в Z.ai GLM-4.5-flash.
 *
 * Проблема: на Vercel проде GLM-4.5-flash возвращает
 *   { content: "", reasoning_content: "..." }
 * то есть reasoning_content сжирает весь max_tokens, и content пустой.
 *
 * Решение: найти правильный параметр для отключения reasoning.
 *
 * Запуск: bun /home/z/my-project/scripts/test-thinking.ts
 */

import fs from "fs";

const config = JSON.parse(fs.readFileSync("/etc/.z-ai-config", "utf-8"));

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${config.apiKey}`,
  "X-Z-AI-From": "Z",
  "X-Token": config.token,
  "X-Chat-Id": config.chatId,
  "X-User-Id": config.userId,
};

const url = `${config.baseUrl}/chat/completions`;
const model = "glm-4.5-flash";

const systemPrompt = "Ты — помощник. Отвечай одним словом.";
const userPrompt = "Скажи привет";

const variants = [
  {
    name: "1. thinking: { type: 'disabled' }, max_tokens: 100",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 100,
      thinking: { type: "disabled" },
    },
  },
  {
    name: "2. thinking: { type: 'enabled', max_tokens: 0 }, max_tokens: 100",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 100,
      thinking: { type: "enabled", max_tokens: 0 },
    },
  },
  {
    name: "3. enable_thinking: false, max_tokens: 100",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 100,
      enable_thinking: false,
    },
  },
  {
    name: "4. thinking: false, max_tokens: 100",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 100,
      thinking: false,
    },
  },
  {
    name: "5. no thinking params, max_tokens: 500 (больше)",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    },
  },
  {
    name: "6. thinking: { type: 'disabled' }, max_tokens: 500",
    body: {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
      thinking: { type: "disabled" },
    },
  },
];

console.log("=== Z.AI THINKING PARAM TEST ===\n");

for (const variant of variants) {
  console.log(`\n--- ${variant.name} ---`);
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(variant.body),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const elapsed = Date.now() - start;
    const bodyText = await response.text();

    console.log(`Status: ${response.status}, Time: ${elapsed}ms`);

    if (response.ok) {
      const data = JSON.parse(bodyText);
      const msg = data?.choices?.[0]?.message ?? {};
      const finishReason = data?.choices?.[0]?.finish_reason;
      console.log(`finish_reason: ${finishReason}`);
      console.log(`content: "${msg.content || ""}" (len=${msg.content?.length || 0})`);
      console.log(`reasoning_content: "${(msg.reasoning_content || "").slice(0, 100)}..." (len=${msg.reasoning_content?.length || 0})`);
    } else {
      console.log(`Error: ${bodyText.slice(0, 300)}`);
    }
  } catch (e) {
    const elapsed = Date.now() - start;
    console.log(`Failed after ${elapsed}ms: ${(e as Error).name}: ${(e as Error).message}`);
  }
}

console.log("\n=== TEST COMPLETE ===");
