"use client";

import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  Clock,
  Mail,
  MessageCircle,
  Sparkles,
  User,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/**
 * Демо-модалка «Личный консультант».
 *
 * ВАЖНО: это демонстрационная заглушка. Реальная запись и оплата
 * не производятся. Для запуска нужно договориться с автором методики
 * (Дарьей Трутневой) о партнёрстве и лицензии.
 */
type ConsultantTier = {
  id: string;
  name: string;
  duration: string;
  format: string;
  icon: typeof Video;
  features: string[];
  demoBadge?: boolean;
};

const TIERS: ConsultantTier[] = [
  {
    id: "text",
    name: "Текстовая консультация",
    duration: "60 минут",
    format: "Чат в приложении",
    icon: MessageCircle,
    features: [
      "Разбор вашей ситуации в чате",
      "Персональные проработки",
      "Поддержка в течение 7 дней",
    ],
    demoBadge: true,
  },
  {
    id: "video",
    name: "Видео-сессия",
    duration: "90 минут",
    format: "Zoom / Skype",
    icon: Video,
    features: [
      "Личный разбор по видео",
      "Проработки в реальном времени",
      "Запись сессии",
      "Письменное резюме после",
    ],
    demoBadge: true,
  },
  {
    id: "mentor",
    name: "Сопровождение 1 месяц",
    duration: "4 сессии + чат",
    format: "Гибрид",
    icon: Sparkles,
    features: [
      "4 личных сессии (по 1 в неделю)",
      "Безлимитный чат с наставником",
      "Индивидуальный план проработок",
      "Доступ к закрытому сообществу",
    ],
    demoBadge: true,
  },
];

export function ConsultantModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const handleSelect = (tier: ConsultantTier) => {
    // Демо — не реальная запись
    toast.info(
      "Это демонстрационная функция. Для запуска реальных консультаций нужно партнёрство с автором методики Дарьей Трутневой.",
      { duration: 6000 }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display flex-wrap">
            <Sparkles className="h-5 w-5 text-primary" />
            Личный консультант
            <Badge
              variant="outline"
              className="text-[10px] border-amber-400/50 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300"
            >
              демо
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Предупреждение о демо */}
          <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>⚠️ Демонстрационный режим.</strong> Это заглушка функции.
            Реальная запись и оплата не производятся. Для запуска реальных
            консультаций необходимо партнёрство с автором методики —
            Дарьей Трутневой.
          </div>

          {/* Описание */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Персональная работа с сертифицированным наставником по методике
            «Мастер Кит». Глубже, чем ИИ-диагностика — наставник видит вас,
            слышит интонации, чувствует состояние и ведёт через проработки
            шаг за шагом.
          </p>

          {/* Тарифы */}
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-display font-semibold text-sm">
                          {tier.name}
                        </h4>
                        {tier.demoBadge && (
                          <Badge variant="secondary" className="text-[9px] h-4 py-0">
                            скоро
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tier.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-3 w-3" />
                          {tier.format}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {tier.features.map((f, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-xs"
                          >
                            <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-3 text-xs"
                    onClick={() => handleSelect(tier)}
                  >
                    {tier.demoBadge ? "Узнать о запуске" : "Выбрать"}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Контакты */}
          <div className="rounded-lg bg-secondary/40 p-3 text-xs">
            <div className="font-semibold mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-primary" />
              Хотите стать наставником?
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Если вы сертифицированный наставник методики «Мастер Кит» и хотите
              присоединиться к платформе — оставьте заявку. После проверки
              документов мы свяжемся с вами.
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="mt-2 text-xs h-7"
              onClick={() => {
                toast.info("Демо: форма заявки будет доступна после запуска платформы.");
                onOpenChange(false);
              }}
            >
              Оставить заявку (демо)
            </Button>
          </div>

          {/* Дисклеймер */}
          <div className="text-[10px] text-muted-foreground text-center italic leading-relaxed pt-2 border-t">
            Методика «Мастер Кит» — авторская разработка Дарьи Трутневой.
            Данное приложение — независимый инструмент, не аффилированный с
            автором. Для официальной работы рекомендуется обращаться к
            сертифицированным наставникам через официальные каналы методики.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
