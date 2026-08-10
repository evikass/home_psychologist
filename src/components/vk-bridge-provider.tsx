"use client";

import { useEffect, useState } from "react";
import vkBridge from "@vkontakte/vk-bridge";

/**
 * Провайдер VK Bridge.
 * Инициализирует связь с VK клиентом при загрузке.
 * Если приложение открыто не в VK — просто игнорируется.
 */
export function VKBridgeProvider({ children }: { children: React.ReactNode }) {
  const [isVK, setIsVK] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.resolve().then(async () => {
      if (!active) return;

      try {
        // Проверяем, открыто ли приложение внутри VK
        const isInVK = vkBridge.supports("VKWebAppInit");

        if (isInVK) {
          // Отправляем событие инициализации
          await vkBridge.send("VKWebAppInit", {});

          // Получаем данные пользователя
          try {
            const user = await vkBridge.send("VKWebAppGetUserInfo", {});
            console.log("[VK] User:", user);
          } catch {}

          // Устанавливаем viewport для VK
          try {
            await vkBridge.send("VKWebAppSetViewSettings", {
              status_bar_style: "light",
              action_bar_color: "#c2624a",
            });
          } catch {}

          if (active) setIsVK(true);
          console.log("[VK] Bridge initialized");
        } else {
          console.log("[VK] Not in VK context, bridge skipped");
        }
      } catch (e) {
        console.log("[VK] Bridge not available:", e);
      }
    });

    return () => { active = false; };
  }, []);

  return <>{children}</>;
}

/** Хук для проверки, открыто ли приложение в VK */
export function useIsVK() {
  const [isVK, setIsVK] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        setIsVK(vkBridge.supports("VKWebAppInit"));
      } catch {
        setIsVK(false);
      }
    });
    return () => { active = false; };
  }, []);

  return isVK;
}

/** Хук для доступа к VK Bridge */
export function useVKBridge() {
  return vkBridge;
}
