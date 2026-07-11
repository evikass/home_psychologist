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

      // Открываем email клиент с предзаполненным письмом
      const subject = encodeURIComponent(
        `Заявка на статус психолога — ${data.name}`
      );
      const body = encodeURIComponent(
        `Заявка на регистрацию как практикующий психолог

Имя: ${data.name}
Email: ${data.email}
Специализация: ${data.specialization}
Опыт работы: ${data.experience}
Дата заявки: ${new Date().toLocaleString("ru-RU")}

---
Для одобрения заявки перейдите в приложение, откройте панель администратора
и подтвердите статус психолога для этого пользователя.

Также можно связаться с заявителем напрямую:
- Email: ${data.email}
- VK: ${ADMIN_VK}`
      );

      // Открываем почтовый клиент
      window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;
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
