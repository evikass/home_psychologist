"use client";

import vkBridge from "@vkontakte/vk-bridge";

/**
 * Универсальный storage для платформ VK и OK.
 *
 * VK: использует VKWebAppStorageSetKey / VKWebAppStorageGetKey
 *     — встроенное хранилище VK Mini Apps, работает без внешнего сервера,
 *       синхронизируется между устройствами автоматически (привязано к vk_user_id)
 *
 * OK: использует FAPI storage.set / storage.get
 *     — встроенное хранилище OK App Platform
 *
 * Web: использует localStorage
 *
 * Это решает проблему:
 *   - Нет внешнего сервера (Vercel) → нет CORS → нет блокировки в РФ
 *   - Синхронизация между устройствами работает автоматически
 *   - VK Rule 2.3.8 выполнена
 */

const STORAGE_KEY_PROGRESS = "progress_history_v1";
const STORAGE_KEY_APPS = "psychologist_apps_v1";

type PlatformType = "vk" | "ok" | "web";

function detectPlatform(): PlatformType {
  if (typeof window === "undefined") return "web";
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("vk_platform") || urlParams.has("vk_user_id")) return "vk";
  if (
    urlParams.has("signed_request") ||
    urlParams.has("session_key") ||
    (urlParams.has("api_server") &&
      (urlParams.get("api_server")?.includes("ok.ru") ||
       urlParams.get("api_server")?.includes("odnoklassniki.ru")))
  ) return "ok";
  return "web";
}

const platform = detectPlatform();

// === VK Storage ===
async function vkStorageSet(key: string, value: string): Promise<void> {
  try {
    await vkBridge.send("VKWebAppStorageSetKey", { key, value });
  } catch (e) {
    console.warn("[storage] VK set error:", e);
    // Fallback на localStorage
    try { localStorage.setItem(`vk_${key}`, value); } catch {}
  }
}

async function vkStorageGet(key: string): Promise<string | null> {
  try {
    const result = await vkBridge.send("VKWebAppStorageGetKey", { key });
    const value = (result as { value?: string })?.value;
    return value || null;
  } catch (e) {
    console.warn("[storage] VK get error:", e);
    try { return localStorage.getItem(`vk_${key}`); } catch { return null; }
  }
}

// === OK Storage (FAPI) ===
async function okStorageSet(key: string, value: string): Promise<void> {
  try {
    const fapi = (window as unknown as { FAPI?: { Client?: { invoke?: (method: string, params: unknown, cb: (result: unknown) => void) => void } } }).FAPI;
    if (fapi?.Client?.invoke) {
      await new Promise<void>((resolve) => {
        try {
          fapi.Client.invoke("storage.set", { key, value }, () => resolve());
        } catch { resolve(); }
      });
    } else {
      // Fallback на localStorage
      localStorage.setItem(`ok_${key}`, value);
    }
  } catch (e) {
    console.warn("[storage] OK set error:", e);
    try { localStorage.setItem(`ok_${key}`, value); } catch {}
  }
}

async function okStorageGet(key: string): Promise<string | null> {
  try {
    const fapi = (window as unknown as { FAPI?: { Client?: { invoke?: (method: string, params: unknown, cb: (result: unknown) => void) => void } } }).FAPI;
    if (fapi?.Client?.invoke) {
      return await new Promise<string | null>((resolve) => {
        try {
          fapi.Client.invoke("storage.get", { key }, (result: unknown) => {
            const r = result as { value?: string };
            resolve(r?.value || null);
          });
        } catch { resolve(null); }
      });
    }
    return localStorage.getItem(`ok_${key}`);
  } catch (e) {
    console.warn("[storage] OK get error:", e);
    try { return localStorage.getItem(`ok_${key}`); } catch { return null; }
  }
}

// === Универсальный API ===

export async function platformStorageSet(key: string, value: string): Promise<void> {
  if (platform === "vk") return vkStorageSet(key, value);
  if (platform === "ok") return okStorageSet(key, value);
  // Web
  try { localStorage.setItem(`web_${key}`, value); } catch {}
}

export async function platformStorageGet(key: string): Promise<string | null> {
  if (platform === "vk") return vkStorageGet(key);
  if (platform === "ok") return okStorageGet(key);
  // Web
  try { return localStorage.getItem(`web_${key}`); } catch { return null; }
}

// === Специфичные функции для прогресса ===

export type HistoryEntry = {
  id: string;
  timestamp: number;
  text: string;
  result: unknown;
  doneProcessings?: string[];
};

/** Загрузить историю диагнозов из платформенного storage */
export async function loadProgress(): Promise<HistoryEntry[]> {
  try {
    const raw = await platformStorageGet(STORAGE_KEY_PROGRESS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn("[storage] loadProgress error:", e);
    return [];
  }
}

/** Сохранить историю диагнозов в платформенный storage */
export async function saveProgress(entries: HistoryEntry[]): Promise<void> {
  try {
    const raw = JSON.stringify(entries);
    await platformStorageGet(STORAGE_KEY_PROGRESS);
    await platformStorageSet(STORAGE_KEY_PROGRESS, raw);
    console.log("[storage] saveProgress:", entries.length, "entries on", platform);
  } catch (e) {
    console.warn("[storage] saveProgress error:", e);
  }
}

/** Отправить заявку психолога через платформенный storage */
export async function savePsychologistApplication(app: {
  name: string;
  email: string;
  specialization: string;
  experience: string;
}): Promise<void> {
  try {
    // Загружаем существующие заявки
    const raw = await platformStorageGet(STORAGE_KEY_APPS);
    const apps = raw ? JSON.parse(raw) as unknown[] : [];
    apps.push({
      ...app,
      id: `app-${Date.now()}`,
      appliedAt: new Date().toISOString(),
      platform,
    });
    await platformStorageSet(STORAGE_KEY_APPS, JSON.stringify(apps));
    console.log("[storage] psychologist application saved on", platform);
  } catch (e) {
    console.warn("[storage] saveApplication error:", e);
  }
}

export function isPlatformStorageAvailable(): boolean {
  return platform === "vk" || platform === "ok";
}

export function getStoragePlatform(): PlatformType {
  return platform;
}
