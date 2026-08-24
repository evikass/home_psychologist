"use client";

import { useEffect, useState, createContext, useContext } from "react";
import vkBridge from "@vkontakte/vk-bridge";

type VKUser = {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
};

type VKContextType = {
  isVK: boolean;
  vkUser: VKUser | null;
  ready: boolean;
};

const VKContext = createContext<VKContextType>({
  isVK: false,
  vkUser: null,
  ready: false,
});

export { VKContext };

/**
 * Провайдер VK Bridge.
 *
 * VK-режим (isVK=true):
 * - Скрыты ВСЕ внешние ссылки, демо-бейджи, монетизация
 * - Бесшовная авторизация через VKWebAppGetUserInfo
 * - Нет кнопки выхода (п. 1.2.2)
 * - Нет формы пароля
 */
export function VKBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isVK, setIsVK] = useState(false);
  const [vkUser, setVkUser] = useState<VKUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      if (!active) return;

      try {
        // Проверяем URL параметр vk_platform — VK добавляет его к iframe
        const urlParams = new URLSearchParams(window.location.search);
        const hasVKParam = urlParams.has("vk_platform") || urlParams.has("vk_user_id");

        // Также проверяем через bridge
        let bridgeAvailable = false;
        try {
          bridgeAvailable = vkBridge.supports("VKWebAppInit");
        } catch {}

        const isVKEnvironment = hasVKParam || bridgeAvailable;

        if (isVKEnvironment) {
          // Инициализация
          try {
            await vkBridge.send("VKWebAppInit", {});
          } catch {}

          // Бесшовная авторизация
          try {
            const user = await vkBridge.send("VKWebAppGetUserInfo", {});
            if (active) setVkUser(user as VKUser);
          } catch {
            // Если bridge не сработал — берём из URL
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

          if (active) {
            setIsVK(true);
            console.log("[VK] VK mode enabled");
          }
        } else {
          console.log("[VK] Not in VK, full mode");
        }
      } catch (e) {
        console.log("[VK] Error:", e);
      } finally {
        if (active) setReady(true);
      }
    });

    return () => { active = false; };
  }, []);

  return (
    <VKContext.Provider value={{ isVK, vkUser, ready }}>
      {children}
    </VKContext.Provider>
  );
}

/** Хук: открыто ли в VK */
export function useIsVK() {
  return useContext(VKContext).isVK;
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
