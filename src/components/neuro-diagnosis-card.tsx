"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MIPS_LEVELS, BRAINWAVE_STATES } from "@/lib/neurotransforming-data";
import type { NeuroDiagnosis } from "@/app/api/neuro-diagnose/route";
import {
  MipsMiniDiagram,
  BrainwaveMiniBar,
  NeuroCycleMini,
  IntegrationTimeline,
} from "@/components/neuro-mini-diagrams";

const STATE_COLORS: Record<string, string> = {
  beta: "#dc2626",
  alpha: "#16a34a",
  theta: "#7c3aed",
  delta: "#0d9488",
};

export function NeuroDiagnosisCard({ data }: { data: NeuroDiagnosis }) {
  const mipsLevelData = MIPS_LEVELS.find((l) => l.id === data.mips_level.id);
  const stateData = BRAINWAVE_STATES.find((s) => s.id === data.recommended_state.id);
  const stateColor = STATE_COLORS[data.recommended_state.id] ?? "#525252";

  return (
    <motion.div
      className="flex flex-col gap-4 sm:gap-5"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
    >
      {/* 1. Сводный диагноз */}
      <Block delay={0}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug mb-2">
              Нейро-разбор
            </h3>
            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
              {data.summary}
            </p>
          </div>
        </div>
      </Block>

      {/* 2. Подсознательная программа */}
      <Block delay={0.05}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Подсознательная программа
          </h3>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Название программы
            </div>
            <p className="font-display font-semibold text-base text-primary">
              «{data.program.name}»
            </p>
          </div>
          <Separator />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Что повторяется
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {data.program.description}
            </p>
          </div>
          <Separator />
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Источник (корень)
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed italic">
              {data.program.source}
            </p>
          </div>
        </div>
      </Block>

      {/* 3. Уровень MIPS */}
      <Block delay={0.1}>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Уровень программы (MIPS)
          </h3>
          <Badge variant="secondary" className="ml-auto">
            {data.mips_level.id} / 8
          </Badge>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {/* Текстовое описание */}
          <div
            className="rounded-xl border-2 p-4 flex-1 min-w-0 w-full"
            style={{
              backgroundColor: `${mipsLevelData?.color ?? "#525252"}11`,
              borderColor: mipsLevelData?.color ?? "#525252",
            }}
          >
            <div
              className="font-display text-xl font-bold mb-1"
              style={{ color: mipsLevelData?.color ?? "#525252" }}
            >
              {data.mips_level.name}
            </div>
            <p
              className="text-sm leading-relaxed mb-2"
              style={{ color: mipsLevelData?.color ?? "#525252" }}
            >
              {data.mips_level.explanation}
            </p>
            {mipsLevelData && (
              <div className="pt-2 border-t" style={{ borderColor: `${mipsLevelData.color}33` }}>
                <div className="text-[10px] uppercase tracking-wide font-semibold mb-1 opacity-70" style={{ color: mipsLevelData.color }}>
                  Что меняется на этом уровне
                </div>
                <p className="text-xs" style={{ color: mipsLevelData.color }}>
                  {mipsLevelData.whatChanges}
                </p>
              </div>
            )}
          </div>
          {/* Графическая пирамида */}
          <div className="shrink-0 w-full sm:w-auto">
            <MipsMiniDiagram activeLevel={data.mips_level.id} />
          </div>
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground text-center">
          Уровень {data.mips_level.id} из 8 · глубже → сложнее изменить, но изменения устойчивее
        </div>
      </Block>

      {/* 4. Рекомендуемое состояние сознания */}
      <Block delay={0.15}>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Состояние для работы
          </h3>
        </div>
        <div
          className="rounded-xl border-2 p-4"
          style={{ backgroundColor: `${stateColor}11`, borderColor: stateColor }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: stateColor }}
            >
              {data.recommended_state.name[0]}
            </div>
            <span className="font-display font-bold text-base" style={{ color: stateColor }}>
              {data.recommended_state.name}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ backgroundColor: stateColor, color: "white" }}
            >
              {stateData?.frequency}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: stateColor }}>
            {data.recommended_state.reason}
          </p>
          {stateData && (
            <div className="mt-2 pt-2 border-t text-xs" style={{ borderColor: `${stateColor}33`, color: stateColor }}>
              {stateData.description}
            </div>
          )}
        </div>
        {/* Графическая шкала ритмов */}
        <div className="mt-3">
          <BrainwaveMiniBar activeState={data.recommended_state.id} />
        </div>
      </Block>

      {/* 5. Цикл нейротрансформации */}
      {data.cycle.length > 0 && (
        <Block delay={0.2}>
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Цикл трансформации
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            5 этапов работы с программой — от диагностики до интеграции
          </p>
          {/* Графический поток этапов */}
          <div className="mb-4 rounded-lg bg-secondary/30 p-3">
            <NeuroCycleMini stages={data.cycle} />
          </div>
          <div className="space-y-2">
            {data.cycle.map((stage, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border bg-card p-3"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {stage.stage_id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-sm mb-0.5">
                    {stage.stage_name}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {stage.what_to_do}
                  </p>
                </div>
                {i < data.cycle.length - 1 && (
                  <div className="text-muted-foreground text-xs self-center hidden sm:block">
                    ↓
                  </div>
                )}
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* 6. Техники */}
      {data.techniques.length > 0 && (
        <Block delay={0.25}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Техники для выхода
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Конкретные практики для работы с этой программой
          </p>
          <div className="flex flex-col gap-3">
            {data.techniques.map((tech, i) => (
              <div key={i} className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display text-base font-semibold leading-snug">
                      {tech.name}
                    </h4>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                      {tech.why_now}
                    </p>
                  </div>
                </div>

                <Separator className="my-3" />

                <ol className="space-y-2 mb-3">
                  {tech.steps.map((s, j) => (
                    <li key={j} className="flex gap-2.5 text-sm leading-relaxed">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {j + 1}
                      </span>
                      <span className="text-foreground/85">{s}</span>
                    </li>
                  ))}
                </ol>

                <div className="text-xs text-foreground/70 pt-2 border-t">
                  <span className="text-muted-foreground">Результат: </span>
                  {tech.expected_result}
                </div>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* 7. План интеграции */}
      <Block delay={0.3}>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            План интеграции
          </h3>
          <Badge variant="secondary" className="ml-auto">
            <Clock className="h-3 w-3 mr-1" />
            {data.integration_plan.duration_days} дней
          </Badge>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Ежедневная практика
            </div>
            <p className="text-sm text-foreground/85 leading-relaxed">
              {data.integration_plan.daily_practice}
            </p>
          </div>
          {/* Графический таймлайн */}
          <div className="pt-2">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Таймлайн интеграции
            </div>
            <IntegrationTimeline
              durationDays={data.integration_plan.duration_days}
              checkpoints={data.integration_plan.checkpoints}
            />
          </div>
        </div>
      </Block>

      {/* Подсказка */}
      <div className="text-center text-xs text-muted-foreground pt-1">
        <Sparkles className="inline h-3 w-3 mr-1" />
        После интеграции сделайте новый нейро-диагноз — программа должна измениться
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
