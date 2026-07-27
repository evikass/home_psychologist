"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Система трекинга активности пользователей.
 * Записывает в localStorage:
 * - Визиты (когда зашёл, сколько времени провёл)
 * - Действия (какие режимы диагноза использовал, какие кнопки нажимал)
 *
 * Только для админа — показывает статистику в панели профиля.
 */

export type ActivityEvent = {
  id: string;
  timestamp: number;
  type: "visit" | "diagnosis" | "chat" | "tale" | "card" | "slides" | "neuro" | "consultant" | "export" | "voice" | "theme";
  label: string;
  details?: string;
};

export type SessionInfo = {
  sessionId: string;
  startedAt: number;
  lastActiveAt: number;
  events: ActivityEvent[];
  userAgent: string;
};

const STORAGE_KEY = "masterkit_activity_v1";
const SESSION_KEY = "masterkit_session_id";
const MAX_EVENTS = 200;

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "s-unknown";
  }
}

function loadActivity(): SessionInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveActivity(sessions: SessionInfo[]) {
  try {
    // Ограничиваем количество сессий
    const trimmed = sessions.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

/** Записать событие активности */
export function trackActivity(type: ActivityEvent["type"], label: string, details?: string) {
  try {
    const sessionId = getSessionId();
    const sessions = loadActivity();

    const event: ActivityEvent = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type,
      label,
      details,
    };

    // Ищем текущую сессию
    let session = sessions.find((s) => s.sessionId === sessionId);
    if (!session) {
      session = {
        sessionId,
        startedAt: Date.now(),
        lastActiveAt: Date.now(),
        events: [],
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      };
      sessions.unshift(session);
    }

    session.events.unshift(event);
    session.lastActiveAt = Date.now();

    // Ограничиваем количество событий
    if (session.events.length > MAX_EVENTS) {
      session.events = session.events.slice(0, MAX_EVENTS);
    }

    saveActivity(sessions);
  } catch {}
}

/** Хук для отслеживания визита при загрузке */
export function useActivityTracker() {
  useEffect(() => {
    trackActivity("visit", "Вход на сайт", undefined);
  }, []);
}

/** Получить всю статистику (для админа) */
export function getActivityStats() {
  const sessions = loadActivity();

  const totalVisits = sessions.length;
  const totalEvents = sessions.reduce((sum, s) => sum + s.events.length, 0);

  // Подсчёт по типам действий
  const actionCounts: Record<string, number> = {};
  for (const s of sessions) {
    for (const e of s.events) {
      if (e.type !== "visit") {
        actionCounts[e.type] = (actionCounts[e.type] || 0) + 1;
      }
    }
  }

  // Последние 10 событий
  const recentEvents: Array<ActivityEvent & { sessionAge: string }> = [];
  for (const s of sessions) {
    for (const e of s.events) {
      recentEvents.push({
        ...e,
        sessionAge: s.startedAt === e.timestamp ? "новая сессия" : "",
      });
    }
  }
  recentEvents.sort((a, b) => b.timestamp - a.timestamp);
  const lastEvents = recentEvents.slice(0, 15);

  // Уникальные устройства (по userAgent)
  const devices = new Set(sessions.map((s) => {
    const ua = s.userAgent;
    if (/Mobile|Android|iPhone/.test(ua)) return "📱 Мобильный";
    if (/iPad|Tablet/.test(ua)) return "📲 Планшет";
    return "💻 Компьютер";
  }));

  return {
    sessions,
    totalVisits,
    totalEvents,
    actionCounts,
    lastEvents,
    devices: Array.from(devices),
  };
}

/** Форматирование времени */
export function formatActivityTime(ts: number): string {
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
