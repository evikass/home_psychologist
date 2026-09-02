"use client";

import { useEffect, useState, createContext, useContext } from "react";
import vkBridge from "@vkontakte/vk-bridge";

type VKUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
};

type PlatformType = "vk" | "ok" | "web";

type VKContextType = {
  isVK: boolean;
  isOK: boolean;          // Добавлено для Одноклассников
  isPlatform: boolean;    // Любая платформа (VK или OK) — для скрытия демо
  platform: PlatformType;
  vkUser: VKUser | null;
  ready: boolean;
};

const VKContext = createContext<VKContextType>({
  isVK: false,
  isOK: false,
  isPlatform: false,
  platform: "web",
  vkUser: null,
  ready: false,
});

export { VKContext };

/**
 * Определяет платформу по URL-параметрам и User-Agent.
 *
 * VK Mini App добавляет:
 *   - vk_platform (например, desktop_html, mobile_android, etc.)
 *   - vk_user_id
 *   - vk_app_id
 *
 * OK (Одноклассники) App добавляет:
 *   - signed_request (HMAC-SHA256 signature)
 *   - api_server (https://api.ok.ru или https://api.odnoklassniki.ru)
 *   - apiconnection
 *   - session_key
 *
 * OK может также эмулировать VK Bridge (но не всегда), поэтому
 * проверяем и OK-параметры, и VK-параметры.
 */
function detectPlatform(): { platform: PlatformType; isVK: boolean; isOK: boolean } {
  if (typeof window === "undefined") return { platform: "web", isVK: false, isOK: false };

  const urlParams = new URLSearchParams(window.location.search);

  // VK Mini App параметры
  const hasVKParam = urlParams.has("vk_platform") || urlParams.has("vk_user_id") || urlParams.has("vk_app_id");

  // OK параметры
  const hasOKParam =
    urlParams.has("signed_request") ||
    urlParams.has("session_key") ||
    (urlParams.has("api_server") &&
      (urlParams.get("api_server")?.includes("ok.ru") ||
       urlParams.get("api_server")?.includes("odnoklassniki.ru")));

  // Доп. проверка по referrer
  const referrer = typeof document !== "undefined" ? document.referrer || "" : "";
  const isOKReferer = referrer.includes("ok.ru") || referrer.includes("odnoklassniki.ru");
  const isVKReferer = referrer.includes("vk.com") || referrer.includes("vk.ru");

  if (hasVKParam || isVKReferer) return { platform: "vk", isVK: true, isOK: false };
  if (hasOKParam || isOKReferer) return { platform: "ok", isVK: false, isOK: true };
  return { platform: "web", isVK: false, isOK: false };
}

/**
 * Провайдер VK Bridge + платформы.
 *
 * VK-режим (isVK=true):
 * - Скрыты ВСЕ внешние ссылки, демо-бейджи, монетизация
 * - Бесшовная авторизация через VKWebAppGetUserInfo
 * - Нет кнопки выхода (п. 1.2.2)
 * - Нет формы пароля
 *
 * OK-режим (isOK=true):
 * - Скрыты ВСЕ внешние ссылки, демо-бейджи, монетизация
 * - OK не использует VK Bridge — работаем в "тихом" режиме
 * - Демо-блоки не показываем (модератор OK отклонял именно за них)
 */
export function VKBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isVK, setIsVK] = useState(false);
  const [isOK, setIsOK] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>("web");
  const [vkUser, setVkUser] = useState<VKUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      if (!active) return;

      try {
        // Сначала определяем платформу по URL/рефереру
        const detected = detectPlatform();
        if (!active) return;

        if (detected.isOK) {
          // OK — отдельная платформа, VK Bridge не используется
          if (active) {
            setIsOK(true);
            setPlatform("ok");
            console.log("[Platform] OK mode enabled");
          }
        } else if (detected.isVK) {
          // VK — инициализируем bridge
          let bridgeAvailable = false;
          try {
            bridgeAvailable = vkBridge.supports("VKWebAppInit");
          } catch {}

          if (bridgeAvailable) {
            try {
              await vkBridge.send("VKWebAppInit", {});
            } catch {}

            // Бесшовная авторизация
            try {
              const user = await vkBridge.send("VKWebAppGetUserInfo", {});
              if (active) setVkUser(user as VKUser);
            } catch {
              const urlParams = new URLSearchParams(window.location.search);
              const vkUserId = urlParams.get("vk_user_id");
              if (vkUserId) {
                if (active) setVkUser({
                  id: parseInt(vkUserId),
                  first_name: "Пользователь",
                  last_name: "VK",
                });
              }
            }

            // Настройки статус-бара
            try {
              await vkBridge.send("VKWebAppSetViewSettings", {
                status_bar_style: "light",
                action_bar_color: "#c2624a",
                navigation_bar_color: "#c2624a",
              });
            } catch {}
          }

          if (active) {
            setIsVK(true);
            setPlatform("vk");
            console.log("[Platform] VK mode enabled");
          }
        } else {
          console.log("[Platform] Web mode (not VK/OK)");
        }
      } catch (e) {
        console.log("[Platform] Error:", e);
      } finally {
        if (active) setReady(true);
      }
    });

    return () => { active = false; };
  }, []);

  return (
    <VKContext.Provider
      value={{
        isVK,
        isOK,
        isPlatform: isVK || isOK,
        platform,
        vkUser,
        ready,
      }}
    >
      {children}
    </VKContext.Provider>
  );
}

/** Хук: открыто ли в VK */
export function useIsVK() {
  return useContext(VKContext).isVK;
}

/** Хук: открыто ли в OK (Одноклассники) */
export function useIsOK() {
  return useContext(VKContext).isOK;
}

/** Хук: открыто ли в любой платформе (VK или OK) */
export function useIsPlatform() {
  return useContext(VKContext).isPlatform;
}

/** Хук: тип платформы */
export function usePlatform() {
  return useContext(VKContext).platform;
}

/** Хук: данные VK пользователя */
export function useVKUser() {
  return useContext(VKContext).vkUser;
}

/** Хук: готов ли провайдер (прошла инициализация) */
export function useVKReady() {
  return useContext(VKContext).ready;
}

/** Хук: доступ к VK Bridge */
export function useVKBridge() {
  return vkBridge;
}
