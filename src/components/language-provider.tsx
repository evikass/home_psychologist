"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { translate, type Lang } from "@/lib/i18n";

const STORAGE_KEY = "masterkit_lang";

type I18nContextType = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextType>({
  lang: "ru",
  setLang: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
        if (saved === "ru" || saved === "en") {
          setLangState(saved);
        }
      } catch {}
    });
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {}
    // Обновляем lang атрибут html
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLang;
    }
  }, []);

  const t = useCallback(
    (key: string) => translate(lang, key),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
