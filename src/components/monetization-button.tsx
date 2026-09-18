"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useIsVK, useVKBridge } from "@/components/vk-bridge-provider";
import { toast } from "sonner";

/**
 * Кнопка монетизации — показывается ТОЛЬКО в VK (VKWebAppOpenPayForm).
 *
 * В OK не показывается, потому что OK не поддерживает VKWebAppOpenPayForm.
 *
 * VK Rule 2.5: монетизация должна быть внедрена до модерации.
 *
 * Это добровольный донат — без обещаний расширенных функций.
 * Все функции сервиса остаются бесплатными для всех пользователей.
 *
 * Для реальной монетизации (когда будет merchant_id):
 *   1. Подключите VK Pay бизнес-аккаунт: https://dev.vk.com/ru/mini-apps/monetization
 *   2. Получите merchant_id (group_id для приёма платежей)
 *   3. Замените DEMO_MERCHANT_ID ниже на реальный
 */

const DEMO_MERCHANT_ID = "52589205"; // ID приложения VK — замените на реальный merchant_id

type DonationAmount = {
  amount: number;
  label: string;
  description: string;
};

const DONATION_AMOUNTS: DonationAmount[] = [
  {
    amount: 100,
    label: "Поддержать",
    description: "Добровольный взнос в благодарность проекту",
  },
  {
    amount: 300,
    label: "Помочь развитию",
    description: "Поддержка в создании новых функций",
  },
  {
    amount: 500,
    label: "Стать спонсором",
    description: "Значимый вклад в развитие сервиса",
  },
];

export function MonetizationButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isVK = useIsVK();
  const vkBridge = useVKBridge();

  // Показываем ТОЛЬКО в VK — в OK VKWebAppOpenPayForm не поддерживается
  // (модератор OK отклонил заявку из-за этого)
  if (!isVK) return null;

  const handleDonate = async (amount: number, label: string) => {
    setLoading(true);
    try {
      // VK Pay — открывает форму оплаты
      try {
        await vkBridge.send("VKWebAppOpenPayForm", {
          app_id: 52589205,
          action: "pay-to-group",
          params: {
            amount: amount * 100, // копейки
            description: `Добровольная поддержка проекта «Домашний психолог» — ${label}`,
            group_id: DEMO_MERCHANT_ID,
          },
        });
        toast.success("Спасибо за вашу поддержку! ❤️");
        setOpen(false);
      } catch (e) {
        // Если VK Pay не доступен (не подключён бизнес-аккаунт) —
        // просто благодарим, без обещаний «скоро будет подключено»
        console.warn("[Monetization] VK Pay error:", e);
        toast.success("Спасибо за ваше желание поддержать проект!", {
          duration: 4000,
        });
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
              «Домашний психолог» — бесплатный сервис самотерапии. Это
              добровольный взнос в благодарность авторам. Все функции
              остаются бесплатными для всех.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {DONATION_AMOUNTS.map((donation) => (
              <button
                key={donation.amount}
                type="button"
                disabled={loading}
                onClick={() => handleDonate(donation.amount, donation.label)}
                className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all group text-left disabled:opacity-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-5 w-5" />
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
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground italic leading-relaxed">
            Поддержка добровольная. Все функции сервиса бесплатны для всех
            пользователей независимо от взноса.
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
