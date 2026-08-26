/**
 * Построение системного промпта для LLM по методу самотерапии.
 * Краткая версия — для быстрого ответа в рамках лимитов serverless.
 */
import {
  LEVELS,
  EMOTIONS,
  PITS,
  PROCESSINGS,
  BEINGNESSES,
  type ProcessingType,
} from "./masterkit-data";

export const SYSTEM_PROMPT = `Ты — наставник по самотерапии. Проанализируй ситуацию и верни JSON-диагноз.

Уровни 1-7: ${LEVELS.map((l) => `${l.id}:${l.name}`).join(", ")}.
Эмоции (id): ${EMOTIONS.map((e) => `${e.id}:${e.name}`).join(", ")}.
Ямы (id): ${PITS.map((p) => `${p.id}:${p.name}`).join(", ")}.
Бытийности (id): ${BEINGNESSES.filter(b=>b.id!=="self").map((b) => `${b.id}:${b.name}`).join(", ")}.
Проработки (type): ${PROCESSINGS.map((p) => p.type).join(", ")}.

Правила: 1-2 эмоции, 0-1 яма (или null), 1 бытийность, 2-3 проработки. Тёплый тон. Цитируй слова человека. steps — 3-5 шагов.

Ответ — строго JSON:
{"level":{"id":1-7,"name":"","summary":""},"emotions":[{"id":"","name":"","intensity":"","evidence":""}],"pit":{"id":"","name":"","signs_matched":[],"explanation":""},"beingness":{"id":"","name":"","evidence":"","explanation":""},"diagnosis_summary":"","processings":[{"type":"","title":"","why_now":"","steps":[],"expected":"","duration":""}],"next_step":""}

pit может быть null. Только JSON на русском.`;

export type DiagnoseResponse = {
  level: {
    id: number;
    name: string;
    summary: string;
  };
  emotions: {
    id: string;
    name: string;
    intensity: "низкая" | "средняя" | "высокая";
    evidence: string;
  }[];
  pit: {
    id: string;
    name: string;
    signs_matched: string[];
    explanation: string;
  } | null;
  beingness: {
    id: string;
    name: string;
    evidence: string;
    explanation: string;
  } | null;
  diagnosis_summary: string;
  processings: {
    type: ProcessingType;
    title: string;
    why_now: string;
    steps: string[];
    expected: string;
    duration: string;
  }[];
  next_step: string;
};

/** Список валидных id для проверки ответа LLM */
export const VALID_EMOTION_IDS = EMOTIONS.map((e) => e.id);
export const VALID_PIT_IDS = PITS.map((p) => p.id);
export const VALID_PROCESSING_TYPES = PROCESSINGS.map((p) => p.type);
export const VALID_BEINGNESS_IDS = BEINGNESSES.filter((b) => b.id !== "self").map(
  (b) => b.id
);
