"use client";

import { useI18n } from "@/components/language-provider";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Переключатель языка RU/EN.
 * Компактная кнопка с текущим языком, клик переключает.
 */
export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  const toggle = () => {
    setLang(lang === "ru" ? "en" : "ru");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="h-8 px-2 gap-1 text-xs font-semibold"
      title={lang === "ru" ? "Switch to English" : "Переключить на русский"}
    >
      <Languages className="h-3.5 w-3.5" />
      {lang.toUpperCase()}
    </Button>
  );
}
