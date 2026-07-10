"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  BookOpen,
  Brain,
  Layers,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  NEURO_PRINCIPLES,
  NEURO_TECHNIQUES,
} from "@/lib/neurotransforming-data";
import { MipsDiagram } from "@/components/mips-diagram";
import { BrainwaveDiagram } from "@/components/brainwave-diagram";
import { NeuroCycleDiagram } from "@/components/neuro-cycle-diagram";

type Tab = "principles" | "mips" | "brainwaves" | "cycle" | "techniques";

const TABS: Array<{ id: Tab; label: string; icon: typeof Brain }> = [
  { id: "principles", label: "Принципы", icon: Sparkles },
  { id: "mips", label: "MIPS: 8 уровней", icon: Layers },
  { id: "brainwaves", label: "Состояния сознания", icon: Activity },
  { id: "cycle", label: "Цикл работы", icon: RefreshCw },
  { id: "techniques", label: "Техники", icon: BookOpen },
];

export function NeurotransformingPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("principles");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display flex-wrap">
            <Brain className="h-5 w-5 text-primary" />
            Нейротрансформинг
            <span className="text-xs text-muted-foreground font-normal">
              · С.В. Ковалёв
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Описание метода */}
        <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs leading-relaxed mb-4">
          <p className="text-foreground/80">
            <strong>Нейротрансформинг</strong> — метод работы с подсознательными программами
            через перестройку нейронных связей. Объединяет нейрофизиологию, НЛП,
            эриксоновский гипноз и трансперсональную психологию.
            Мозг пластичен — новые паттерны поведения создают новые нейронные пути.
          </p>
        </div>

        {/* Вкладки */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg mb-4 overflow-x-auto fancy-scroll">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-all whitespace-nowrap",
                tab === t.id
                  ? "bg-background shadow-sm text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "principles" && <PrinciplesTab />}
            {tab === "mips" && <MipsTab />}
            {tab === "brainwaves" && <BrainwavesTab />}
            {tab === "cycle" && <CycleTab />}
            {tab === "techniques" && <TechniquesTab />}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ===================== Принципы =====================

function PrinciplesTab() {
  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        Ключевые принципы нейротрансформинга — основа метода.
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {NEURO_PRINCIPLES.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <div className="text-2xl mb-2">{p.icon}</div>
            <h4 className="font-display font-semibold text-sm mb-1">{p.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ===================== MIPS =====================

function MipsTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold text-sm mb-1">
          MIPS — Мета-индивидуальная программная структура
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Модель Ковалёва: 8 уровней программ, управляющих человеком. От глубинных (родовые)
          к поверхностным (поведение). Чем глубже уровень — тем сильнее влияние и тем больше
          времени нужно для изменения. Кликните на уровень, чтобы увидеть детали.
        </p>
      </div>

      <MipsDiagram />

      <div className="rounded-lg bg-secondary/40 p-3 text-xs italic text-muted-foreground leading-relaxed">
        💡 <strong>Важно:</strong> Поверхностные уровни (8, 7) изменить легче, но без
        работы с глубинными (1–5) изменения не удержатся. Эффективная работа идёт сверху вниз:
        сначала заметить поведение → найти убеждение → дойти до источника → перекодировать.
      </div>
    </div>
  );
}

// ===================== Ритмы мозга =====================

function BrainwavesTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold text-sm mb-1">
          Состояния сознания — ритмы мозга
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          В каком состоянии сознания ведётся работа — такой результат получается.
          Бета — анализ, Альфа — внушение, Тета — глубинная перекодировка.
          Кликните на зону ритма, чтобы увидеть детали.
        </p>
      </div>

      <BrainwaveDiagram />

      <div className="rounded-lg bg-secondary/40 p-3 text-xs italic text-muted-foreground leading-relaxed">
        💡 <strong>Практика:</strong> Большинство техник нейротрансформинга работает
        в альфа- и тета-состояниях. Чтобы войти — нужно расслабление, дыхание, закрытые глаза.
        В бета-состоянии подсознание закрыто, изменения невозможны.
      </div>
    </div>
  );
}

// ===================== Цикл =====================

function CycleTab() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display font-semibold text-sm mb-1">
          Цикл нейротрансформации — 5 этапов
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Полный цикл работы с любой программой: от диагностики до интеграции.
          Каждый этап — необходимый шаг. Пропуск любого делает работу неполной.
          Кликните на этап, чтобы увидеть детали.
        </p>
      </div>

      <NeuroCycleDiagram />

      <div className="rounded-lg bg-secondary/40 p-3 text-xs italic text-muted-foreground leading-relaxed">
        💡 <strong>Время:</strong> Полный цикл занимает от 21 до 90 дней. Интеграция — самый
        долгий этап: мозгу нужно время, чтобы построить новые нейронные пути. Без повторения
        новая программа не закрепится.
      </div>
    </div>
  );
}

// ===================== Техники =====================

function TechniquesTab() {
  const [expanded, setExpanded] = useState<string | null>("anchoring");

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display font-semibold text-sm mb-1">
          Основные техники нейротрансформинга
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          6 техник для разных задач. От простых (якорение) до глубинных (регрессия, перекодирование).
          Нажмите на технику, чтобы развернуть шаги.
        </p>
      </div>

      <div className="space-y-2">
        {NEURO_TECHNIQUES.map((tech) => {
          const isExpanded = expanded === tech.id;
          return (
            <div
              key={tech.id}
              className={cn(
                "rounded-xl border bg-card transition-all",
                isExpanded && "shadow-sm"
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : tech.id)}
                className="w-full flex items-start gap-3 p-3 text-left hover:bg-accent/30 transition-colors rounded-xl"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    tech.level === "глубинный"
                      ? "bg-red-100 text-red-700"
                      : tech.level === "средний"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  )}
                >
                  {tech.level === "глубинный" ? "Г" : tech.level === "средний" ? "С" : "П"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-display font-semibold text-sm">{tech.name}</h4>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      {tech.level}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {tech.purpose}
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1 space-y-3 text-xs">
                      <div>
                        <div className="font-semibold text-muted-foreground uppercase text-xs tracking-wide mb-1">
                          Когда применять
                        </div>
                        <p className="text-foreground/80">{tech.when}</p>
                      </div>

                      <div>
                        <div className="font-semibold text-muted-foreground uppercase text-xs tracking-wide mb-1">
                          Шаги
                        </div>
                        <ol className="space-y-1.5">
                          {tech.steps.map((s, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="text-foreground/80 leading-relaxed">{s}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <div className="pt-2 border-t">
                        <span className="font-semibold text-primary">Результат: </span>
                        <span className="text-foreground/80">{tech.result}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg bg-secondary/40 p-3 text-xs italic text-muted-foreground leading-relaxed">
        ⚠️ <strong>Важно:</strong> Глубинные техники (Г) лучше делать с опытным наставником.
        Поверхностные (П) и средние (С) можно практиковать самостоятельно.
      </div>
    </div>
  );
}
