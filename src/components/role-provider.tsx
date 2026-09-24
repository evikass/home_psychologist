"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

/**
 * Система ролей приложения.
 *
 * Роли:
 * - user — обычный пользователь. Видит: диагнозы, история, аналитика, консультант.
 *   Не видит: Клиенты, CRM.
 *
 * - psychologist — практикующий психолог. Видит всё, что user + Клиенты (CRM),
 *   привязка диагнозов к клиентам, расширенная аналитика.
 *   Активируется после одобрения админом.
 *
 * - admin — главный модератор. Видит всё + заявки психологов, управление.
 *
 * Хранение: localStorage (без серверной авторизации — упрощённая модель).
 * Для продакшена рекомендуется заменить на полноценную OAuth/JWT авторизацию.
 */

export type Role = "user" | "psychologist" | "admin";

export type UserProfile = {
  role: Role;
  name: string;
  email: string;
  // Для психолога:
  specialization?: string;
  experience?: string;
  approved?: boolean; // одобрено админом
  appliedAt?: string; // дата заявки
};

type RoleContextType = {
  profile: UserProfile | null;
  role: Role;
  isPsychologist: boolean;
  isAdmin: boolean;
  setProfile: (p: UserProfile) => void;
  setRole: (r: Role) => void;
  logout: () => void;
  applyAsPsychologist: (data: {
    name: string;
    email: string;
    specialization: string;
    experience: string;
  }) => void;
};

const RoleContext = createContext<RoleContextType>({
  profile: null,
  role: "user",
  isPsychologist: false,
  isAdmin: false,
  setProfile: () => {},
  setRole: () => {},
  logout: () => {},
  applyAsPsychologist: () => {},
});

const STORAGE_KEY = "masterkit_role_v1";

// Email админа для заявок
export const ADMIN_EMAIL = "evi-kass@mail.ru";
export const ADMIN_VK = "https://vk.ru/evgeniikassin";

// ID администраторов на платформах — при входе через VK/OK
// автоматически получают роль admin (без ввода пароля)
export const ADMIN_VK_IDS = ["15863253"];
export const ADMIN_OK_IDS = ["411099059723"];

/** Проверяет, является ли пользователь админом по платформенному ID */
export function isAdminByPlatformId(platform: "vk" | "ok", userId: string | null | undefined): boolean {
  if (!userId) return false;
  if (platform === "vk") return ADMIN_VK_IDS.includes(String(userId));
  if (platform === "ok") return ADMIN_OK_IDS.includes(String(userId));
  return false;
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as UserProfile;
          if (active) setProfileState(parsed);
        }
      } catch {}
    });
    return () => { active = false; };
  }, []);

  const persist = useCallback((p: UserProfile | null) => {
    try {
      if (p) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, []);

  const setProfile = useCallback(
    (p: UserProfile) => {
      setProfileState(p);
      persist(p);
    },
    [persist]
  );

  const setRole = useCallback(
    (r: Role) => {
      const newProfile: UserProfile = {
        ...(profile ?? { name: "", email: "" }),
        role: r,
      };
      setProfileState(newProfile);
      persist(newProfile);
    },
    [profile, persist]
  );

  const logout = useCallback(() => {
    setProfileState(null);
    persist(null);
  }, [persist]);

  const applyAsPsychologist = useCallback(
    (data: {
      name: string;
      email: string;
      specialization: string;
      experience: string;
    }) => {
      const newProfile: UserProfile = {
        role: "psychologist",
        name: data.name,
        email: data.email,
        specialization: data.specialization,
        experience: data.experience,
        approved: false, // ждёт одобрения админом
        appliedAt: new Date().toISOString(),
      };
      setProfileState(newProfile);
      persist(newProfile);

      // Отправляем заявку на сервер через API
      // (раньше использовался mailto: — но в VK/OK WebView это не работает,
      // модератор видел ошибку при нажатии «Отправить»)
      try {
        // Определяем платформу по URL параметрам
        const urlParams = new URLSearchParams(window.location.search);
        const hasVK = urlParams.has("vk_platform") || urlParams.has("vk_user_id");
        const hasOK =
          urlParams.has("signed_request") ||
          urlParams.has("session_key") ||
          (urlParams.has("api_server") &&
            (urlParams.get("api_server")?.includes("ok.ru") ||
             urlParams.get("api_server")?.includes("odnoklassniki.ru")));
        const platform = hasVK ? "vk" : hasOK ? "ok" : "web";
        const platformUserId =
          urlParams.get("vk_user_id") ||
          urlParams.get("viewer_id") ||
          urlParams.get("uid") ||
          urlParams.get("logged_user_id") ||
          urlParams.get("user_id") ||
          "anonymous";

        // Отправляем заявку (fire-and-forget — не блокируем UI)
        // Используем buildApiUrl из api-config — учитывает NEXT_PUBLIC_API_URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const url = apiUrl
          ? `${apiUrl}/api/psychologist-applications`
          : "/api/psychologist-applications";
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            specialization: data.specialization,
            experience: data.experience,
            platform,
            platformUserId,
          }),
        }).catch((e) => {
          console.warn("[applyAsPsychologist] Failed to submit application:", e);
        });
      } catch (e) {
        console.warn("[applyAsPsychologist] Error:", e);
      }
    },
    [persist]
  );

  const role = profile?.role ?? "user";
  // Психолог считается активным только если approved=true
  // Но если role=psychologist и approved=false — показываем статус "ожидает"
  const isPsychologist = role === "psychologist" || role === "admin";
  const isAdmin = role === "admin";

  return (
    <RoleContext.Provider
      value={{
        profile,
        role,
        isPsychologist,
        isAdmin,
        setProfile,
        setRole,
        logout,
        applyAsPsychologist,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
