"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { BEINGNESS_BY_ID, LEVELS } from "@/lib/masterkit-data";
import { usePlatform, usePlatformUserId, useVKReady } from "@/components/vk-bridge-provider";

const STORAGE_KEY = "masterkit_history_v1";
const MAX_ENTRIES = 50;
const SYNC_DEBOUNCE_MS = 2000; // 2 сек после последнего изменения

export type HistoryEntry = {
  id: string;
  timestamp: number; // epoch ms
  text: string;       // исходный текст (обрезанный)
  result: DiagnoseResponse;
  doneProcessings?: string[]; // индексы выполненных проработок (как строки)
};

/**
 * Хук для сохранения и загрузки истории диагнозов.
 *
 * Хранение:
 *   - В web (не платформа): только localStorage
 *   - В VK/OK: localStorage + сервер /api/progress (синхронизация между устройствами)
 *
 * VK Rule 2.3.8: прогресс должен синхронизироваться между версиями приложения
 * (vk.ru web → Android → iOS и т.д.).
 *
 * Алгоритм:
 *   1. При загрузке: если есть platformUserId — загружаем с сервера и сливаем с локальным
 *   2. При изменениях: debounce 2 сек → сохраняем на сервер
 */
export function useDiagnosisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const platform = usePlatform();
  const platformUserId = usePlatformUserId();
  const ready = useVKReady();

  // Рефы для debounce-синхронизации
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedHashRef = useRef<string>("");

  // === Загрузка при монтировании ===
  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      if (!mounted) return;

      // Сначала читаем localStorage
      let localEntries: HistoryEntry[] = [];
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as HistoryEntry[];
          if (Array.isArray(parsed)) localEntries = parsed;
        }
      } catch (e) {
        console.warn("[history] local load error:", e);
      }

      // Если на платформе — загружаем с сервера и сливаем
      const shouldSync = ready && platformUserId && (platform === "vk" || platform === "ok");

      if (shouldSync) {
        setSyncing(true);
        try {
          const url = `/api/progress?platform=${encodeURIComponent(platform)}&userId=${encodeURIComponent(platformUserId)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json() as { entries?: HistoryEntry[] };
            if (Array.isArray(data.entries)) {
              // Сливаем: серверные записи + локальные, дедуплицируем по id
              const serverEntries = data.entries;
              const allMap = new Map<string, HistoryEntry>();

              // Серверные — приоритет (т.к. это с другого устройства)
              for (const e of serverEntries) allMap.set(e.id, e);
              // Локальные дополняют (если их нет на сервере)
              for (const e of localEntries) {
                if (!allMap.has(e.id)) allMap.set(e.id, e);
              }

              // Сортируем по timestamp (новые сверху)
              const merged = Array.from(allMap.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, MAX_ENTRIES);

              if (mounted) {
                setHistory(merged);
                // Обновляем localStorage слитым результатом
                try {
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                // Запоминаем хеш — чтобы не синхронизировать то же самое обратно
                lastSyncedHashRef.current = JSON.stringify(merged);
              }
            }
          }
        } catch (e) {
          console.warn("[history] server load error:", e);
          // Fallback: используем локальные
          if (mounted) setHistory(localEntries);
        } finally {
          if (mounted) setSyncing(false);
        }
      } else {
        // Не платформа — только локальные
        if (mounted) setHistory(localEntries);
      }

      if (mounted) setLoaded(true);
    }

    Promise.resolve().then(loadHistory);

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, platform, platformUserId]);

  // === Сохранение в localStorage при изменениях ===
  const persist = useCallback((entries: HistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.warn("[history] save error:", e);
    }
  }, []);

  // === Синхронизация с сервером (debounce 2 сек) ===
  const scheduleSync = useCallback((entries: HistoryEntry[]) => {
    // Только для платформ
    if (!platformUserId || (platform !== "vk" && platform !== "ok")) return;

    // Сравниваем хеш — если ничего не изменилось, не синхронизируем
    const newHash = JSON.stringify(entries);
    if (newHash === lastSyncedHashRef.current) return;

    // Очищаем предыдущий таймер
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Debounce 2 сек
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            userId: platformUserId,
            entries,
          }),
        });
        if (res.ok) {
          lastSyncedHashRef.current = newHash;
          console.log("[history] synced to server:", entries.length, "entries");
        } else {
          console.warn("[history] sync failed:", res.status);
        }
      } catch (e) {
        console.warn("[history] sync error:", e);
      }
    }, SYNC_DEBOUNCE_MS);
  }, [platform, platformUserId]);

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
        scheduleSync(next);
        return next;
      });
    },
    [persist, scheduleSync]
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory((prev) => {
        const next = prev.filter((e) => e.id !== id);
        persist(next);
        scheduleSync(next);
        return next;
      });
    },
    [persist, scheduleSync]
  );

  const clearAll = useCallback(() => {
    setHistory([]);
    persist([]);
    scheduleSync([]);
  }, [persist, scheduleSync]);

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
        scheduleSync(next);
        return next;
      });
    },
    [persist, scheduleSync]
  );

  return {
    history,
    loaded,
    syncing,
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
