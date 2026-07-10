"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BEINGNESSES, EMOTIONS, PITS } from "@/lib/masterkit-data";

/**
 * Анализирует текст в реальном времени и подсвечивает ключевые слова
 * из бытийностей, эмоций и ям.
 *
 * Показывает пользователю «мы уже видим в вас...» — намёки на диагноз.
 */
export function LiveHints({ text }: { text: string }) {
  const matches = useMemo(() => analyzeText(text), [text]);

  if (matches.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 rounded-lg bg-secondary/50 border border-primary/15 p-2.5"
    >
      <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">
        ИИ уже видит в вашем тексте:
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {matches.slice(0, 8).map((m, i) => (
            <motion.span
              key={`${m.kind}-${m.id}`}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: i * 0.02 }}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${m.color}22`,
                color: m.color,
                border: `1px solid ${m.color}44`,
              }}
            >
              <span>{m.symbol}</span>
              <span className="font-medium">{m.name}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type Match = {
  id: string;
  name: string;
  kind: "beingness" | "emotion" | "pit";
  color: string;
  symbol: string;
};

function analyzeText(text: string): Match[] {
  if (!text || text.length < 10) return [];
  const lower = text.toLowerCase();
  const matches: Match[] = [];
  const seen = new Set<string>();

  // Бытийности
  for (const b of BEINGNESSES) {
    if (b.id === "self" || b.id === "witness") continue;
    for (const marker of b.markers) {
      if (lower.includes(marker.toLowerCase())) {
        const key = `b-${b.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            id: b.id,
            name: b.name,
            kind: "beingness",
            color: b.color.border,
            symbol: b.symbol,
          });
        }
        break;
      }
    }
  }

  // Эмоции (по триггер-словам из levels или другим признакам)
  const emotionKeywords: Record<string, string[]> = {
    fear: ["боюсь", "страшно", "напуган", "в ужасе", "опасаюсь", "тревожно"],
    anger: ["злюсь", "бесит", "ненавижу", "раздражает", "в гневе", "ярост"],
    resentment: ["обидел", "обидно", "обида", "не заслужил", "обесцени"],
    guilt: ["виноват", "вина", "моя вина", "из-за меня", "я долж"],
    shame: ["стыдно", "стыд", "позор", "провалиться", "как я могу"],
    pity: ["жалко", "жалость", "бедный", "несчастный"],
    pride: ["я лучше", "выше этого", "они не доросли", "превосход"],
  };
  for (const e of EMOTIONS) {
    const kws = emotionKeywords[e.id] ?? [];
    for (const kw of kws) {
      if (lower.includes(kw)) {
        const key = `e-${e.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            id: e.id,
            name: e.name,
            kind: "emotion",
            color: "#7c3aed",
            symbol: "⚡",
          });
        }
        break;
      }
    }
  }

  // Ямы
  const pitKeywords: Record<string, string[]> = {
    victim: ["виноваты", "со мной так", "ничего не зависит", "не моя вина"],
    rescuer: ["надо помочь", "без меня не", "я должен спасти"],
    persecutor: ["они заплатят", "накажу", "отмщение", "несправедливо"],
    dependence: ["не могу без", "без него умру", "без неё не выживу"],
    loneliness: ["одинок", "никто не понимает", "никому не нужен"],
    insecurity: ["недостаточно", "не дорос", "ещё подумаю", "не готов"],
    hopeless: ["бессмысленно", "никогда не", "нет выхода", "безысходно"],
  };
  for (const p of PITS) {
    const kws = pitKeywords[p.id] ?? [];
    for (const kw of kws) {
      if (lower.includes(kw)) {
        const key = `p-${p.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          matches.push({
            id: p.id,
            name: p.name,
            kind: "pit",
            color: "#dc2626",
            symbol: "⬇",
          });
        }
        break;
      }
    }
  }

  return matches;
}
