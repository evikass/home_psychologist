"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRIVACY_STORAGE_KEY = "masterkit_privacy_accepted_v1";

/**
 * Политика конфиденциальности и согласие пользователя.
 *
 * VK Rule 1.1.4: до начала обработки ПД пользователь должен согласиться
 * с политикой конфиденциальности сервиса.
 *
 * При первом открытии показывается модальное окно с текстом политики.
 * После согласия — сохраняется в localStorage и больше не показывается.
 *
 * На платформах (VK/OK) также показываем ссылку в Footer.
 */

const PRIVACY_TEXT = `# Политика конфиденциальности «Домашний психолог»

Дата вступления в силу: ${new Date().getFullYear()}

## 1. Общие положения

Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок
обработки и защиты персональных данных пользователей мини-приложения
«Домашний психолог» (далее — «Сервис»).

Использование Сервиса означает безоговорочное согласие пользователя с настоящей
Политикой и указанными в ней условиями обработки персональных данных.

## 2. Какие данные мы обрабатываем

### 2.1. Данные, предоставляемые платформой (VK/OK)

При входе через VK или OK автоматически передаются:
- ID пользователя на платформе (vk_user_id / OK viewer_id)
- Имя и фамилия (только в VK, через VKWebAppGetUserInfo)

### 2.2. Данные, вводимые пользователем

- Текстовые описания ситуаций для ИИ-диагностики
- История диагнозов (текст + результат)
- Отметки о выполненных проработках
- Заявки на роль психолога (имя, email, специализация)

### 2.3. Технические данные

- Тип браузера и устройство (для аналитики)
- Время визитов и действий

## 3. Цели обработки данных

- Предоставление ИИ-диагностики и самотерапии
- Синхронизация прогресса между устройствами
- Аналитика использования сервиса
- Обработка заявок на роль психолога

## 4. Хранение данных

- История диагнозов хранится на сервере 90 дней, затем удаляется
- Профиль пользователя (имя, email) хранится в localStorage браузера
- На платформах (VK/OK) ID используется как ключ для синхронизации
- Технические данные хранятся в течение 30 дней

## 5. Передача данных третьим лицам

Мы не передаём ваши персональные данные третьим лицам, за исключением:
- Платформы VK/OK — для авторизации и синхронизации
- ИИ-провайдера (для генерации диагнозов) — только текст описания ситуации,
  без персональных данных

## 6. Защита данных

- Все запросы передаются по HTTPS
- Доступ к серверу ограничен
- Регулярное обновление безопасности

## 7. Права пользователя

Вы имеете право:
- Отказаться от обработки данных (прекратить использование Сервиса)
- Удалить свои данные (через настройки браузера — очистить localStorage)
- Отозвать согласие в любой момент

## 8. Использование cookies

Сервис не использует файлы cookies для отслеживания.
Используется только localStorage для хранения настроек и истории.

## 9. Контактная информация

По вопросам обработки персональных данных:
- Email: evi-kass@mail.ru

## 10. Изменения Политики

Мы можем обновлять эту Политику. Уведомление об изменениях будет
размещено в Сервисе. Продолжение использования Сервиса после изменений
означает согласие с обновлённой Политикой.

---

*Сервис «Домашний психолог» не заменяет профессиональную психологическую
помощь. В острых состояниях обращайтесь к специалисту.*`;

export function PrivacyConsent({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const [showModal, setShowModal] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      try {
        const accepted = localStorage.getItem(PRIVACY_STORAGE_KEY);
        if (!accepted && mounted) {
          setShowModal(true);
        }
      } catch {}
    });
    return () => { mounted = false; };
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, new Date().toISOString());
    } catch {}
    setShowModal(false);
    onOpenChange(false);
  };

  const handleDecline = () => {
    // Если отказался — закрываем приложение
    setShowModal(false);
    onOpenChange(false);
    if (typeof window !== "undefined") {
      // Показываем страницу с сообщением
      document.body.innerHTML = `
        <div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px 20px; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #c2624a;">Сервис недоступен</h2>
          <p style="color: #666; line-height: 1.6;">
            Для использования сервиса «Домашний психолог» необходимо согласие
            с политикой конфиденциальности.<br><br>
            Пожалуйста, закройте приложение и откройте его снова, чтобы
            ознакомиться с политикой.
          </p>
        </div>
      `;
    }
  };

  return (
    <>
      {/* Модальное окно согласия при первом визите */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Заголовок */}
              <div className="flex items-center gap-3 p-5 border-b">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display font-semibold text-base">
                    Политика конфиденциальности
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Пожалуйста, ознакомьтесь перед началом использования
                  </p>
                </div>
              </div>

              {/* Краткий текст */}
              <ScrollArea className="flex-1 p-5 max-h-[50vh]">
                <div className="text-sm text-foreground/80 leading-relaxed space-y-3">
                  <p>
                    Сервис «Домашний психолог» обрабатывает следующие данные:
                  </p>
                  <ul className="space-y-1.5 text-xs ml-4">
                    <li>• ID пользователя VK/OK (для авторизации)</li>
                    <li>• Имя и фамилия (в VK, через VKWebAppGetUserInfo)</li>
                    <li>• Текстовые описания ситуаций для ИИ-диагностики</li>
                    <li>• История диагнозов и отметки о проработках</li>
                    <li>• Тип браузера и устройство (для аналитики)</li>
                  </ul>
                  <p>
                    Данные хранятся на сервере 90 дней, затем удаляются.
                    Мы не передаём ваши данные третьим лицам, кроме ИИ-провайдера
                    (для генерации диагнозов — только текст описания, без персональных данных).
                  </p>
                  <p>
                    Полный текст политики доступен по кнопке ниже.
                  </p>
                </div>
              </ScrollArea>

              {/* Кнопки */}
              <div className="p-5 border-t space-y-2">
                <div className="flex gap-2">
                  <Button
                    onClick={handleAccept}
                    className="flex-1"
                    size="sm"
                  >
                    <Check className="h-4 w-4" />
                    Принимаю и продолжаю
                  </Button>
                  <Button
                    onClick={handleDecline}
                    variant="outline"
                    size="sm"
                  >
                    Не принимаю
                  </Button>
                </div>
                <button
                  onClick={() => setShowFullPolicy(true)}
                  className="w-full text-xs text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Прочитать полную политику →
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Полная политика — по кнопке */}
      <Dialog open={showFullPolicy} onOpenChange={setShowFullPolicy}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Политика конфиденциальности
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
              {PRIVACY_TEXT}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Хук: дал ли пользователь согласие с политикой */
export function usePrivacyAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!localStorage.getItem(PRIVACY_STORAGE_KEY);
  } catch {
    return false;
  }
}

/** Компонент для открытия полной политики из Footer */
export function PrivacyPolicyModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Политика конфиденциальности
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed text-foreground/80">
            {PRIVACY_TEXT}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
