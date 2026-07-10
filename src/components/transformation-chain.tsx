"use client";

import { motion } from "framer-motion";
import {
  Award,
  Brain,
  Cloud,
  Heart,
  Target,
  TrendingDown,
  Zap,
} from "lucide-react";

/**
 * Цепочка трансформации по методике Дарьи Трутневой.
 *
 * Визуальная вертикальная схема причинно-следственных связей:
 *   УСТАНОВКИ → ЭМОЦИИ → МЫСЛИ → ДЕЙСТВИЯ → РЕЗУЛЬТАТ
 *   + Аксиома 1:1: «Всё, что есть в моей реальности — результат моих подсознательных желаний»
 *
 * По образцу оригинальной схемы методики.
 */
type ChainStep = {
  id: string;
  name: string;
  icon: typeof Target;
  description: string;
  color: {
    bg: string;
    border: string;
    icon: string;
    text: string;
  };
  /** Куда переходит, если на этом этапе застрять */
  ifStuck: string;
};

const CHAIN_STEPS: ChainStep[] = [
  {
    id: "settings",
    name: "УСТАНОВКИ",
    icon: Target,
    description: "Базовые программы подсознания — то, во что человек неосознанно верит о себе и мире",
    color: {
      bg: "oklch(0.96 0.01 30)",
      border: "oklch(0.5 0.04 30)",
      icon: "oklch(0.5 0.04 30)",
      text: "oklch(0.25 0.03 30)",
    },
    ifStuck: "Если установка деструктивна — она будет порождать болезненные эмоции",
  },
  {
    id: "emotions",
    name: "ЭМОЦИИ",
    icon: Heart,
    description: "Энергетический отклик на установку. Эмоция — это энергия, которая дальше движет мысль",
    color: {
      bg: "oklch(0.96 0.02 15)",
      border: "oklch(0.55 0.18 25)",
      icon: "oklch(0.55 0.18 25)",
      text: "oklch(0.3 0.06 25)",
    },
    ifStuck: "Если эмоцию подавлять — она копится в теле и порождает скрученные мысли",
  },
  {
    id: "thoughts",
    name: "МЫСЛИ",
    icon: Cloud,
    description: "Интерпретация эмоции. Мысль — это то, как человек объясняет себе, что он чувствует",
    color: {
      bg: "oklch(0.96 0.015 250)",
      border: "oklch(0.5 0.15 260)",
      icon: "oklch(0.5 0.15 260)",
      text: "oklch(0.25 0.03 260)",
    },
    ifStuck: "Если мысль токсична — она породит разрушительное действие",
  },
  {
    id: "actions",
    name: "ДЕЙСТВИЯ",
    icon: Zap,
    description: "Реальное поведение. Действие — это материализованная мысль, превращённая в поступок",
    color: {
      bg: "oklch(0.96 0.02 160)",
      border: "oklch(0.5 0.13 160)",
      icon: "oklch(0.5 0.13 160)",
      text: "oklch(0.25 0.04 160)",
    },
    ifStuck: "Если действие неосознанно — оно приведёт к результату, который не нужен",
  },
  {
    id: "result",
    name: "РЕЗУЛЬТАТ",
    icon: Award,
    description: "Итог. Реальность, которую человек создал. Это зеркало его подсознательных программ",
    color: {
      bg: "oklch(0.94 0.025 80)",
      border: "oklch(0.5 0.13 80)",
      icon: "oklch(0.5 0.13 80)",
      text: "oklch(0.28 0.05 80)",
    },
    ifStuck: "Если результат не нравится — нужно возвращаться к установке, а не менять действия",
  },
];

/**
 * Базовая аксиома методики Дарьи Трутневой.
 */
const AXIOM = {
  title: "Аксиома 1:1",
  text: "Всё, что есть в моей реальности — результат моих подсознательных желаний",
  explanation:
    "Любой результат — не «случайность» и не «внешняя несправедливость». Это точное отражение того, что человек глубоко (часто неосознанно) хочет. Чтобы изменить результат — нужно изменить установку, а не действия.",
};

export function TransformationChain({
  /** Если есть — подсвечивает «застрявший» этап */
  stuckAtId,
  compact = false,
}: {
  stuckAtId?: string;
  compact?: boolean;
}) {
  return (
    <div className="w-full">
      {/* Цепочка этапов */}
      <div className="flex flex-col items-center gap-0">
        {CHAIN_STEPS.map((step, i) => {
          const isStuck = stuckAtId === step.id;
          const Icon = step.icon;
          return (
            <div key={step.id} className="w-full flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="w-full max-w-md"
              >
                <div
                  className="relative rounded-xl border-2 p-4 shadow-sm transition-all"
                  style={{
                    backgroundColor: step.color.bg,
                    borderColor: isStuck ? step.color.icon : step.color.border,
                    borderWidth: isStuck ? "3px" : "2px",
                  }}
                >
                  {/* Бейдж «застряли» */}
                  {isStuck && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1"
                    >
                      <TrendingDown className="h-2.5 w-2.5" />
                      застряли
                    </motion.div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Иконка в круге */}
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: "white",
                        border: `2px solid ${step.color.icon}`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: step.color.icon }}
                      />
                    </div>

                    {/* Название и описание */}
                    <div className="flex-1 min-w-0">
                      <div
                        className="font-display font-bold text-base leading-none mb-1"
                        style={{ color: step.color.text }}
                      >
                        {step.name}
                      </div>
                      {!compact && (
                        <p className="text-xs leading-snug" style={{ color: step.color.text, opacity: 0.75 }}>
                          {step.description}
                        </p>
                      )}
                    </div>

                    {/* Номер этапа */}
                    <div
                      className="font-display text-2xl font-bold opacity-20"
                      style={{ color: step.color.icon }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Подсказка «если застрять» — только для подсвеченного этапа */}
                  {isStuck && !compact && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 pt-3 border-t text-xs italic"
                      style={{ borderColor: `${step.color.icon}33`, color: step.color.text }}
                    >
                      <span className="font-semibold not-italic">⚠️ Если застрять: </span>
                      {step.ifStuck}
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Пунктирная связь к следующему этапу */}
              {i < CHAIN_STEPS.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="flex flex-col gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                  </div>
                  {/* Стрелка вниз */}
                  <div className="text-muted-foreground/60 text-xs mt-0.5">↓</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Аксиома 1:1 — итоговый блок */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-4 mx-auto max-w-lg rounded-xl border-2 bg-primary/5 border-primary/30 p-4 relative"
      >
        {/* Декоративные линии вокруг заголовка */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 h-px bg-primary/30" />
          <div className="flex items-center gap-1.5">
            <Brain className="h-4 w-4 text-primary" />
            <h4 className="font-display font-bold text-sm text-primary">
              {AXIOM.title}
            </h4>
          </div>
          <div className="flex-1 h-px bg-primary/30" />
        </div>

        <p className="text-center text-sm font-medium italic leading-relaxed text-foreground/85">
          «{AXIOM.text}»
        </p>

        {!compact && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed text-center">
            {AXIOM.explanation}
          </p>
        )}
      </motion.div>
    </div>
  );
}
