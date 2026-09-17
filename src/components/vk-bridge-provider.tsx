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
  isOK: boolean;            // Добавлено для Одноклассников
  isPlatform: boolean;      // Любая платформа (VK или OK) — для скрытия демо
  platform: PlatformType;
  platformUserId: string | null;  // ID пользователя на платформе (для синхронизации прогресса)
  vkUser: VKUser | null;
  okUser: { id: string; name: string } | null;  // OK user (упрощённый)
  ready: boolean;
};

const VKContext = createContext<VKContextType>({
  isVK: false,
  isOK: false,
  isPlatform: false,
  platform: "web",
  platformUserId: null,
  vkUser: null,
  okUser: null,
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
 *   - viewer_id (ID пользователя OK)
 *
 * OK не использует VK Bridge — работаем в "тихом" режиме.
 */
function detectPlatform(): {
  platform: PlatformType;
  isVK: boolean;
  isOK: boolean;
  userId: string | null;
  okUserName: string | null;
} {
  if (typeof window === "undefined") {
    return { platform: "web", isVK: false, isOK: false, userId: null, okUserName: null };
  }

  const urlParams = new URLSearchParams(window.location.search);

  // VK Mini App параметры
  const hasVKParam = urlParams.has("vk_platform") || urlParams.has("vk_user_id") || urlParams.has("vk_app_id");
  const vkUserId = urlParams.get("vk_user_id");

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

  if (hasVKParam || isVKReferer) {
    return { platform: "vk", isVK: true, isOK: false, userId: vkUserId, okUserName: null };
  }
  if (hasOKParam || isOKReferer) {
    // У OK нет user_id в URL напрямую — берём из viewer_id (если есть)
    // или используем хеш signed_request как уникальный идентификатор сессии
    const okUserId =
      urlParams.get("viewer_id") ||
      urlParams.get("uid") ||
      (urlParams.get("signed_request") || "").slice(0, 32);
    // Имя пользователя OK может прийти в viewer_name или вычисляться из API
    const okUserName = urlParams.get("viewer_name") || urlParams.get("first_name") || null;
    return { platform: "ok", isVK: false, isOK: true, userId: okUserId, okUserName };
  }
  return { platform: "web", isVK: false, isOK: false, userId: null, okUserName: null };
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
 *
 * Прогресс синхронизируется между устройствами через /api/progress:
 *   - platformUserId используется как ключ (vk_user_id для VK, signed_request hash для OK)
 */
export function VKBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isVK, setIsVK] = useState(false);
  const [isOK, setIsOK] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>("web");
  const [platformUserId, setPlatformUserId] = useState<string | null>(null);
  const [vkUser, setVkUser] = useState<VKUser | null>(null);
  const [okUser, setOkUser] = useState<{ id: string; name: string } | null>(null);
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
            const okUserIdFinal = detected.userId || `ok_${Date.now()}`;
            const okUserNameFinal = detected.okUserName || "Пользователь OK";
            setIsOK(true);
            setPlatform("ok");
            setPlatformUserId(okUserIdFinal);
            setOkUser({
              id: okUserIdFinal,
              name: okUserNameFinal,
            });
            console.log("[Platform] OK mode enabled, userId:", okUserIdFinal, "name:", okUserNameFinal);
          }
        } else if (detected.isVK) {
          // VK — инициализируем bridge
          let bridgeAvailable = false;
          try {
            bridgeAvailable = vkBridge.supports("VKWebAppInit");
          } catch {}

          let finalVkUserId = detected.userId;

          if (bridgeAvailable) {
            try {
              await vkBridge.send("VKWebAppInit", {});
            } catch {}

            // Бесшовная авторизация
            try {
              const user = await vkBridge.send("VKWebAppGetUserInfo", {});
              if (active && user) {
                setVkUser(user as VKUser);
                finalVkUserId = String((user as VKUser).id);
              }
            } catch {
              // Если bridge не сработал — используем vk_user_id из URL
              const urlParams = new URLSearchParams(window.location.search);
              const vkUserIdFromUrl = urlParams.get("vk_user_id");
              if (vkUserIdFromUrl) {
                finalVkUserId = vkUserIdFromUrl;
                if (active) setVkUser({
                  id: parseInt(vkUserIdFromUrl),
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

            // VK Rule 2.2.5: при закрытии/сворачивании мини-приложения
            // нужно остановить воспроизведение звука.
            // Событие VKWebAppViewHide приходит, когда пользователь:
            //   - Сворачивает мини-приложение (свайп вниз)
            //   - Закрывает его
            //   - Переключается на другое приложение
            // VKWebAppViewRestore — когда возвращается обратно.
            try {
              vkBridge.subscribe((event: { detail?: { type?: string } }) => {
                const eventType = event?.detail?.type;
                console.log("[VK] Bridge event:", eventType);

                if (eventType === "VKWebAppViewHide") {
                  // Останавливаем все звуки: аудио, TTS, ambient sound
                  console.log("[VK] VKWebAppViewHide — stopping all audio");

                  // 1. Web Speech API (TTS)
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    try {
                      window.speechSynthesis.cancel();
                    } catch {}
                  }

                  // 2. Все <audio> и <video> элементы на странице
                  if (typeof document !== "undefined") {
                    try {
                      const mediaElements = document.querySelectorAll("audio, video");
                      mediaElements.forEach((el) => {
                        try {
                          el.pause();
                        } catch {}
                      });
                    } catch {}
                  }

                  // 3. Кастомное событие для наших компонентов (ambient-sound, voice-input)
                  if (typeof window !== "undefined") {
                    try {
                      window.dispatchEvent(new CustomEvent("app:view-hide"));
                    } catch {}
                  }
                }

                if (eventType === "VKWebAppViewRestore") {
                  console.log("[VK] VKWebAppViewRestore");
                  if (typeof window !== "undefined") {
                    try {
                      window.dispatchEvent(new CustomEvent("app:view-restore"));
                    } catch {}
                  }
                }
              });
            } catch (e) {
              console.warn("[VK] Failed to subscribe to bridge events:", e);
            }
          }

          if (active) {
            setIsVK(true);
            setPlatform("vk");
            setPlatformUserId(finalVkUserId);
            console.log("[Platform] VK mode enabled, userId:", finalVkUserId);
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
        platformUserId,
        vkUser,
        okUser,
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

/** Хук: данные OK пользователя */
export function useOKUser() {
  return useContext(VKContext).okUser;
}

/** Хук: открыто ли в любой платформе (VK или OK) */
export function useIsPlatform() {
  return useContext(VKContext).isPlatform;
}

/** Хук: тип платформы */
export function usePlatform() {
  return useContext(VKContext).platform;
}

/** Хук: ID пользователя на платформе (для синхронизации прогресса) */
export function usePlatformUserId() {
  return useContext(VKContext).platformUserId;
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
