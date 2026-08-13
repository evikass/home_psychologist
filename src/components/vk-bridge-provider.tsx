"use client";

import { useEffect, useState, createContext, useContext, useCallback } from "react";
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
};

const VKContext = createContext<VKContextType>({
  isVK: false,
  vkUser: null,
});

export { VKContext };

/**
 * Провайдер VK Bridge.
 *
 * При открытии в VK:
 * 1. Инициализирует VK Bridge
 * 2. Получает данные пользователя (бесшовная авторизация)
 * 3. Устанавливает isVK=true — для скрытия запрещённого контента
 *
 * При открытии вне VK — просто игнорируется.
 */
export function VKBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isVK, setIsVK] = useState(false);
  const [vkUser, setVkUser] = useState<VKUser | null>(null);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      if (!active) return;

      try {
        const isInVK = vkBridge.supports("VKWebAppInit");

        if (isInVK) {
          // Инициализация
          await vkBridge.send("VKWebAppInit", {});
          console.log("[VK] Bridge initialized");

          // Бесшовная авторизация — получаем пользователя
          try {
            const user = await vkBridge.send("VKWebAppGetUserInfo", {});
            console.log("[VK] User:", user.id, user.first_name);
            if (active) setVkUser(user as VKUser);
          } catch (e) {
            console.log("[VK] GetUserInfo failed:", e);
          }

          // Настройки статус-бара
          try {
            await vkBridge.send("VKWebAppSetViewSettings", {
              status_bar_style: "light",
              action_bar_color: "#c2624a",
              navigation_bar_color: "#c2624a",
            });
          } catch {}

          if (active) setIsVK(true);
        } else {
          console.log("[VK] Not in VK context");
        }
      } catch (e) {
        console.log("[VK] Bridge error:", e);
      }
    });

    return () => { active = false; };
  }, []);

  return (
    <VKContext.Provider value={{ isVK, vkUser }}>
      {children}
    </VKContext.Provider>
  );
}

/** Хук: открыто ли в VK */
export function useIsVK() {
  const ctx = useContext(VKContext);
  return ctx.isVK;
}

/** Хук: данные VK пользователя */
export function useVKUser() {
  const ctx = useContext(VKContext);
  return ctx.vkUser;
}

/** Хук: доступ к VK Bridge */
export function useVKBridge() {
  return vkBridge;
}
