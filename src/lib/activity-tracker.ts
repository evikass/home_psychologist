"use client";

import { useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api-config";

/**
 * Система трекинга активности через серверную базу данных.
 * Данные хранятся в Prisma/SQLite — видны из любого браузера.
 */

export type ActivityStats = {
  totalLogs: number;
  totalSessions: number;
  actionCounts: Record<string, number>;
  devices: string[];
  browsers: string[];
  sessions: Array<{
    browser: string;
    device: string;
    startedAt: string;
    lastActiveAt: string;
    eventCount: number;
    recentEvents: Array<{
      type: string;
      label: string;
      details: string | null;
      createdAt: string;
    }>;
  }>;
};

/** Записать событие на сервер */
export function trackActivity(type: string, label: string, details?: string) {
  try {
    fetch(buildApiUrl("/api/activity"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, details }),
    }).catch(() => {}); // silently fail — не блокируем UI
  } catch {}
}

/** Хук для отслеживания визита при загрузке */
export function useActivityTracker() {
  useEffect(() => {
    trackActivity("visit", "Вход на сайт");
  }, []);
}

/** Получить статистику с сервера (для админа) */
export async function fetchActivityStats(): Promise<ActivityStats | null> {
  try {
    const res = await fetch(buildApiUrl("/api/activity?limit=200"));
    if (!res.ok) return null;
    return (await res.json()) as ActivityStats;
  } catch {
    return null;
  }
}

/** Форматирование времени */
export function formatActivityTime(ts: string | number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  if (diffH < 24) return `${diffH} ч назад`;
  if (diffD < 7) return `${diffD} дн назад`;

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
