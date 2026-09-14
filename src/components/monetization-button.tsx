"use client";

import { useState } from "react";
import { Heart, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useIsVK, useIsPlatform, useVKBridge } from "@/components/vk-bridge-provider";
import { toast } from "sonner";

/**
 * Кнопка монетизации — показывается только на платформах (VK/OK).
 *
 * VK: использует VKWebAppOpenPayForm для приёма платежей через VK Pay.
 * OK: показывает toast-сообщение (OK SDK не интегрирован).
 *
 * VK Rule 2.5: монетизация должна быть внедрена до модерации.
 *
 * Для реальной монетизации:
 *   1. Подключите VK Pay бизнес-аккаунт: https://dev.vk.com/ru/mini-apps/monetization
 *   2. Получите merchant_id
 *   3. Замените DEMO_MERCHANT_ID на реальный
 *   4. Также можно подключить VK Donut (подписки)
 */

const DEMO_MERCHANT_ID = "52589205"; // ID приложения VK — замените на реальный merchant_id

type DonationAmount = {
  amount: number;
  label: string;
  description: string;
  icon: typeof Heart;
};

const DONATION_AMOUNTS: DonationAmount[] = [
  {
    amount: 99,
    label: "Поддержать",
    description: "Чашка кофе для разработчика",
    icon: Heart,
  },
  {
    amount: 299,
    label: "Спонсор",
    description: "Помощь в развитии проекта",
    icon: Sparkles,
  },
  {
    amount: 599,
    label: "PRO",
    description: "Доступ к расширенным функциям на месяц",
    icon: Crown,
  },
];

export function MonetizationButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isVK = useIsVK();
  const isPlatform = useIsPlatform();
  const vkBridge = useVKBridge();

  // Показываем только на платформах
  if (!isPlatform) return null;

  const handleDonate = async (amount: number, label: string) => {
    setLoading(true);
    try {
      if (isVK) {
        // VK Pay — открывает форму оплаты
        try {
          await vkBridge.send("VKWebAppOpenPayForm", {
            app_id: 52589205,
            action: "pay-to-group",
            params: {
              amount: amount * 100, // копейки
              description: `Поддержка проекта «Домашний психолог» — ${label}`,
              group_id: DEMO_MERCHANT_ID,
            },
          });
          toast.success("Спасибо за вашу поддержку! ❤️");
          setOpen(false);
        } catch (e) {
          // Если VK Pay не подключён — показываем дружелюбное сообщение
          console.warn("[Monetization] VK Pay error:", e);
          toast.info(
            "Спасибо за желание поддержать! Платёжная система скоро будет подключена.",
            { duration: 4000 }
          );
          setOpen(false);
        }
      } else {
        // OK — пока нет интеграции
        toast.info(
          "Спасибо за желание поддержать! Способы поддержки скоро будут доступны.",
          { duration: 4000 }
        );
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
        type="button"
      >
        <Heart className="h-3.5 w-3.5" />
        Поддержать
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Поддержать проект
            </DialogTitle>
            <DialogDescription>
              «Домашний психолог» — бесплатный сервис самотерапии. Ваша поддержка
              помогает нам развивать проект и делать его лучше.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {DONATION_AMOUNTS.map((donation) => {
              const Icon = donation.icon;
              return (
                <button
                  key={donation.amount}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDonate(donation.amount, donation.label)}
                  className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all group text-left disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{donation.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {donation.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-base text-primary">
                      {donation.amount} ₽
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground italic leading-relaxed">
            Поддержка добровольная. Все функции сервиса остаются бесплатными
            независимо от вашего решения.
          </div>

          <Button
            variant="ghost"
            className="w-full mt-2"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Позже
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
