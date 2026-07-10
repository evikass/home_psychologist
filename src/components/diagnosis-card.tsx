"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Heart,
  Layers,
  Lightbulb,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LevelScale } from "@/components/level-scale";
import { ConsciousnessGeometry } from "@/components/consciousness-geometry";
import { PROCESSING_BY_TYPE } from "@/lib/masterkit-data";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { cn } from "@/lib/utils";

const EMOTION_META: Record<
  string,
  { icon: typeof Flame; color: string; tint: string }
> = {
  fear: { icon: AlertCircle, color: "text-amber-700", tint: "bg-amber-100/70 border-amber-200" },
  anger: { icon: Flame, color: "text-red-700", tint: "bg-red-100/70 border-red-200" },
  resentment: { icon: TriangleAlert, color: "text-orange-700", tint: "bg-orange-100/70 border-orange-200" },
  guilt: { icon: Heart, color: "text-rose-700", tint: "bg-rose-100/70 border-rose-200" },
  shame: { icon: TriangleAlert, color: "text-purple-700", tint: "bg-purple-100/70 border-purple-200" },
  pity: { icon: Heart, color: "text-blue-700", tint: "bg-blue-100/70 border-blue-200" },
  pride: { icon: Layers, color: "text-stone-700", tint: "bg-stone-200/70 border-stone-300" },
};

const INTENSITY_LABEL: Record<string, string> = {
  низкая: "низкая",
  средняя: "средняя",
  высокая: "высокая",
};

export function DiagnosisCard({
  data,
  entryId,
  doneProcessings = [],
  onToggleDone,
}: {
  data: DiagnoseResponse;
  entryId?: string;
  doneProcessings?: string[];
  onToggleDone?: (processingIndex: number) => void;
}) {
  const [localDone, setLocalDone] = useState<Set<string>>(
    new Set(doneProcessings)
  );

  const handleToggle = (index: number) => {
    const key = String(index);
    setLocalDone((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    onToggleDone?.(index);
  };

  const doneCount = localDone.size;
  const totalCount = data.processings.length;
  return (
    <motion.div
      className="flex flex-col gap-4 sm:gap-5"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {/* 1. Сводный диагноз */}
      <Block delay={0}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug mb-2">
              Что происходит
            </h3>
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
              {data.diagnosis_summary}
            </p>
          </div>
        </div>
      </Block>

      {/* 2. Уровень развития */}
      <Block delay={0.05}>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Уровень развития
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {data.level.id} / 7
          </Badge>
        </div>
        <div className="mb-3">
          <div className="font-display text-2xl sm:text-3xl font-semibold text-primary">
            {data.level.name}
          </div>
        </div>
        <LevelScale activeId={data.level.id} />
        <p className="mt-4 text-sm text-foreground/75 leading-relaxed">
          {data.level.summary}
        </p>
      </Block>

      {/* 3. Эмоции */}
      {data.emotions.length > 0 && (
        <Block delay={0.1}>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Застрявшие эмоции
            </h3>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {data.emotions.map((e, i) => {
              const meta = EMOTION_META[e.id] ?? EMOTION_META.fear;
              const Icon = meta.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-xl border p-3.5 flex flex-col gap-2",
                    meta.tint
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", meta.color)} />
                    <span className="font-medium text-foreground">{e.name}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto text-[10px] py-0 px-1.5 h-5"
                    >
                      {INTENSITY_LABEL[e.intensity] ?? e.intensity}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/70 italic leading-relaxed">
                    «{e.evidence}»
                  </p>
                </div>
              );
            })}
          </div>
        </Block>
      )}

      {/* 3.5. Геометрия сознания — бытийность */}
      {data.beingness && (
        <Block delay={0.13}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Геометрия сознания
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            В какой бытийности вы сейчас отождествлены — подсвечено на схеме.
          </p>

          <ConsciousnessGeometry activeBeingnessId={data.beingness.id} />

          {/* Цитата-доказательство из текста */}
          <div className="mt-4 rounded-lg border-l-4 bg-secondary/40 px-4 py-2.5 text-sm">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Почему {data.beingness.name}
            </div>
            <p className="italic text-foreground/80 leading-relaxed">
              «{data.beingness.evidence}»
            </p>
            <p className="mt-1.5 text-foreground/70 leading-relaxed">
              {data.beingness.explanation}
            </p>
          </div>
        </Block>
      )}

      {/* 4. Эмоциональная яма */}
      {data.pit && (
        <Block delay={0.15}>
          <div className="flex items-center gap-2 mb-3">
            <ArrowDown className="h-4 w-4 text-destructive" />
            <h3 className="font-display text-base sm:text-lg font-semibold text-destructive">
              Эмоциональная яма
            </h3>
          </div>
          <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4">
            <div className="font-display text-xl font-semibold text-destructive mb-1">
              {data.pit.name}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-3">
              {data.pit.explanation}
            </p>
            {data.pit.signs_matched.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.pit.signs_matched.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[11px] border-destructive/30 text-destructive bg-background/60"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Block>
      )}

      {/* 5. Проработки — главный блок */}
      <Block delay={0.2}>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Проработки на сейчас
          </h3>
          {totalCount > 0 && (
            <Badge
              variant={doneCount === totalCount ? "default" : "secondary"}
              className="ml-auto text-[10px]"
            >
              {doneCount} / {totalCount}
              {doneCount === totalCount && " ✓"}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Сделайте по порядку. Каждая — 5–20 минут, с контактом с телом.
          Отмечайте выполненные — прогресс сохранится.
        </p>

        <div className="flex flex-col gap-3">
          {data.processings.map((p, i) => {
            const meta = PROCESSING_BY_TYPE[p.type];
            const isDone = localDone.has(String(i));
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border bg-card p-4 sm:p-5 shadow-sm transition-all",
                  isDone && "opacity-60 border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isDone ? "bg-primary/30 text-primary" : "bg-primary text-primary-foreground"
                  )}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-display text-base font-semibold leading-snug">
                        {p.title}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {meta?.type ?? p.type}
                      </Badge>
                      {isDone && (
                        <Badge className="text-[10px] h-5 bg-primary/15 text-primary border-primary/30">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          сделано
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                      {p.why_now}
                    </p>
                  </div>
                  {/* Чекбокс «сделано» */}
                  <label
                    className="flex items-center gap-1.5 cursor-pointer shrink-0 mt-1 group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isDone}
                      onCheckedChange={() => handleToggle(i)}
                      id={`done-${entryId ?? "current"}-${i}`}
                    />
                    <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">
                      сделал(а)
                    </span>
                  </label>
                </div>

                <Separator className="my-3" />

                <ol className="space-y-2 mb-3">
                  {p.steps.map((s, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {j + 1}
                      </span>
                      <span className="text-foreground/85">{s}</span>
                    </li>
                  ))}
                </ol>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-foreground/70">
                    <Clock className="h-3.5 w-3.5" />
                    {p.duration}
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/40">·</span>
                  <span className="text-foreground/70">
                    <span className="text-muted-foreground">Результат:</span>{" "}
                    {p.expected}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      {/* 6. Следующий шаг */}
      <Block delay={0.25}>
        <div className="rounded-xl bg-gradient-to-br from-primary/10 via-accent/40 to-secondary/40 border border-primary/15 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/15 p-2 shrink-0">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1">
                Следующий шаг сегодня
              </div>
              <p className="text-sm sm:text-base text-foreground font-medium leading-snug">
                {data.next_step}
              </p>
            </div>
          </div>
        </div>
      </Block>

      {/* 7. Подсказка про iterative use */}
      <div className="text-center text-xs text-muted-foreground pt-1">
        <ArrowRight className="inline h-3 w-3 mr-1" />
        После проработки опишите, что изменилось — получите следующий слой.
      </div>
    </motion.div>
  );
}

function Block({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card className="shadow-sm">
        <CardHeader className="pb-0 pt-4 sm:pt-5">
          <CardTitle className="sr-only">Блок</CardTitle>
        </CardHeader>
        <CardContent className="pt-3 sm:pt-4">{children}</CardContent>
      </Card>
    </motion.div>
  );
}
