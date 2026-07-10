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
  doneProcessings?: string[]; // индексы выполненных проработок (как строки)
};

/**
 * Хук для сохранения и загрузки истории диагнозов.
 * Хранится в localStorage, до 50 записей.
 * Также сохраняет отметки о выполненных проработках.
 */
export function useDiagnosisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Загрузка из localStorage при монтировании.
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

  /** Отметить проработку как выполненную (или снять отметку) */
  const toggleProcessingDone = useCallback(
    (entryId: string, processingIndex: number) => {
      setHistory((prev) => {
        const next = prev.map((e) => {
          if (e.id !== entryId) return e;
          const done = new Set(e.doneProcessings ?? []);
          const key = String(processingIndex);
          if (done.has(key)) {
            done.delete(key);
          } else {
            done.add(key);
          }
          return { ...e, doneProcessings: Array.from(done) };
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return {
    history,
    loaded,
    addEntry,
    removeEntry,
    clearAll,
    toggleProcessingDone,
  };
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
      doneCount: 0,
      totalProcessings: 0,
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

  // Подсчёт выполненных проработок
  let doneCount = 0;
  let totalProcessings = 0;
  for (const e of history) {
    totalProcessings += e.result.processings?.length ?? 0;
    doneCount += e.doneProcessings?.length ?? 0;
  }

  return {
    total: history.length,
    beingnessCounts,
    levelCounts,
    lastDate: history[0]?.timestamp ?? null,
    doneCount,
    totalProcessings,
  };
}

/**
 * Тренды по бытийностям за период.
 * Возвращает массив точек: дата + распределение бытийностей в этот день.
 */
export function getBeingnessTrend(
  history: HistoryEntry[],
  periodDays: number = 30
) {
  const now = Date.now();
  const periodMs = periodDays * 24 * 60 * 60 * 1000;
  const cutoff = now - periodMs;

  // Группируем по дням
  const byDay = new Map<string, HistoryEntry[]>();
  for (const e of history) {
    if (e.timestamp < cutoff) continue;
    const date = new Date(e.timestamp);
    const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const existing = byDay.get(dayKey) ?? [];
    existing.push(e);
    byDay.set(dayKey, existing);
  }

  // Сортируем дни по времени
  const sortedDays = Array.from(byDay.entries()).sort((a, b) => {
    const [y1, m1, d1] = a[0].split("-").map(Number);
    const [y2, m2, d2] = b[0].split("-").map(Number);
    return new Date(y1, m1 - 1, d1).getTime() - new Date(y2, m2 - 1, d2).getTime();
  });

  // Для каждого дня — сколько раз каждая бытийность
  return sortedDays.map(([dayKey, entries]) => {
    const [y, m, d] = dayKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const counts = new Map<string, number>();
    for (const e of entries) {
      if (e.result.beingness?.id) {
        counts.set(
          e.result.beingness.id,
          (counts.get(e.result.beingness.id) ?? 0) + 1
        );
      }
    }
    return {
      date,
      dateLabel: date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short",
      }),
      counts: Object.fromEntries(counts),
      total: entries.length,
    };
  });
}

/**
 * Экспорт истории в JSON-файл.
 */
export function exportHistoryToJson(history: HistoryEntry[]) {
  const data = {
    exportedAt: new Date().toISOString(),
    appVersion: "1.0",
    method: "Мастер Кит · Дарья Трутнева",
    totalEntries: history.length,
    entries: history.map((e) => ({
      id: e.id,
      date: new Date(e.timestamp).toISOString(),
      text: e.text,
      diagnosis: e.result,
      doneProcessings: e.doneProcessings ?? [],
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `masterkit-history-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
