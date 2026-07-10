"use client";

import { useState, useEffect, useCallback } from "react";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { BEINGNESS_BY_ID, LEVELS } from "@/lib/masterkit-data";

const STORAGE_KEY = "masterkit_history_v1";
const MAX_ENTRIES = 50;

export type HistoryEntry = {
  id: string;
  timestamp: number; // epoch ms
  text: string;       // исходный текст (обрезанный)
  result: DiagnoseResponse;
};

/**
 * Хук для сохранения и загрузки истории диагнозов.
 * Хранится в localStorage, до 50 записей.
 */
export function useDiagnosisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Загрузка из localStorage при монтировании.
  // Используем функциональный апдейт через Promise.resolve для избежания
  // предупреждения react-hooks/set-state-in-effect.
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HistoryEntry[];
          if (Array.isArray(parsed) && mounted) {
            setHistory(parsed);
          }
        }
      } catch (e) {
        console.warn("[history] load error:", e);
      }
      if (mounted) setLoaded(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Сохранение в localStorage при изменении
  const persist = useCallback((entries: HistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("[history] save error:", e);
    }
  }, []);

  const addEntry = useCallback(
    (text: string, result: DiagnoseResponse) => {
      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        text: text.slice(0, 280),
        result,
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_ENTRIES);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    setHistory([]);
    persist([]);
  }, [persist]);

  return { history, loaded, addEntry, removeEntry, clearAll };
}

/** Форматирование даты для отображения */
export function formatHistoryDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffD < 7) return `${diffD} дн назад`;

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Краткая сводка записи — для списка истории */
export function getEntrySummary(entry: HistoryEntry) {
  const beingness = entry.result.beingness
    ? BEINGNESS_BY_ID[entry.result.beingness.id]
    : null;
  const level = LEVELS.find((l) => l.id === entry.result.level.id);
  return {
    beingnessName: beingness?.name ?? entry.result.beingness?.name ?? "—",
    beingnessColor: beingness?.color.border ?? "#888",
    beingnessSymbol: beingness?.symbol ?? "?",
    levelName: level?.name ?? entry.result.level.name,
    levelId: entry.result.level.id,
  };
}

/** Агрегированная статистика — для аналитики по истории */
export function getHistoryStats(history: HistoryEntry[]) {
  if (history.length === 0) {
    return {
      total: 0,
      beingnessCounts: [] as { id: string; name: string; count: number; color: string; symbol: string }[],
      levelCounts: [] as { id: number; name: string; count: number }[],
      lastDate: null as number | null,
    };
  }

  // Подсчёт по бытийностям
  const beingnessMap = new Map<string, { count: number; name: string; color: string; symbol: string }>();
  for (const e of history) {
    if (!e.result.beingness) continue;
    const id = e.result.beingness.id;
    const data = BEINGNESS_BY_ID[id];
    if (!data) continue;
    const existing = beingnessMap.get(id);
    if (existing) {
      existing.count++;
    } else {
      beingnessMap.set(id, {
        count: 1,
        name: data.name,
        color: data.color.border,
        symbol: data.symbol,
      });
    }
  }
  const beingnessCounts = Array.from(beingnessMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count);

  // Подсчёт по уровням
  const levelMap = new Map<number, { count: number; name: string }>();
  for (const e of history) {
    const id = e.result.level.id;
    const name = e.result.level.name;
    const existing = levelMap.get(id);
    if (existing) {
      existing.count++;
    } else {
      levelMap.set(id, { count: 1, name });
    }
  }
  const levelCounts = Array.from(levelMap.entries())
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.id - b.id);

  return {
    total: history.length,
    beingnessCounts,
    levelCounts,
    lastDate: history[0]?.timestamp ?? null,
  };
}
