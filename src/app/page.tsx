"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  HelpCircle,
  History,
  Loader2,
  RotateCcw,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DiagnosisCard } from "@/components/diagnosis-card";
import { HistoryPanel } from "@/components/history-panel";
import { AnalyticsPanel } from "@/components/analytics-panel";
import { OnboardingModal, useOnboarding } from "@/components/onboarding-modal";
import { RecommendationsPanel } from "@/components/recommendations-panel";
import { LiveHints } from "@/components/live-hints";
import { AmbientSound } from "@/components/ambient-sound";
import {
  useDiagnosisHistory,
  type HistoryEntry,
} from "@/hooks/use-diagnosis-history";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { METHODOLOGY_SUMMARY, LEVELS, EMOTIONS, CONCEPTS } from "@/lib/masterkit-data";
import { getDemoDiagnosis } from "@/lib/demo-diagnoses";
import { toast } from "sonner";

// В demo-режиме (GitHub Pages) ИИ-анализ недоступен — используем предзаготовленные диагнозы.
const IS_DEMO = process.env.NEXT_PUBLIC_STATIC_DEMO === "true";

const EXAMPLES = [
  {
    label: "Усталость от отношений",
    text:
      "Я больше не могу. С мужем живём как соседи — он меня не слышит, я стараюсь, стараюсь, а в ответ холод. Внутри пустота и обида, что я для него ничего не значу. Думала, ну похудею, найду работу, тогда он меня увидит. А сил нет. Иногда думаю — а может, развестись? А потом страшно: а вдруг одна останусь, кто мне нужен в мои 40?",
  },
  {
    label: "Нет денег, не хватает",
    text:
      "Кредиты душат. Работаю на двух работах, прихожу — нет сил даже поесть. Денег всё равно мало. Боюсь, что так и буду до конца жизни выживать. Злюсь на себя — что я не могу нормально зарабатывать, как все нормальные люди. Стыдно перед детьми. Вроде все вокруг как-то живут, а я вечно в минусах.",
  },
  {
    label: "Не реализуюсь в деле",
    text:
      "У меня есть мечта — открыть свою студию. Но я вечно нахожу причины отложить: то деньги не те, то дети болеют, то «ещё не доросла». Смотрю на других, кто уже открыл — они вроде моложе и слабее меня, а у меня всё откладывается. Я понимаю, что сама себе мешаю, но не могу понять — почему.",
  },
  {
    label: "Зависимость от мнения",
    text:
      "Я не могу сделать ничего, чтобы не подумать: а что скажут? Публикую пост — удаляю через 5 минут. Хочу высказать мнение в разговоре — молчу, потому что вдруг осудят. Бесит себя в этом. Хочется просто быть собой, а тело сжимается, голос пропадает. Дома тоже самое — боюсь разочаровать маму.",
  },
];

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [currentDoneProcessings, setCurrentDoneProcessings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const {
    history,
    addEntry,
    removeEntry,
    clearAll,
    toggleProcessingDone,
  } = useDiagnosisHistory();
  const { showOnboarding, setShowOnboarding, showAgain } = useOnboarding();

  const handleSubmit = async () => {
    if (text.trim().length < 20) {
      toast.error("Опишите ситуацию подробнее — хотя бы 2–3 предложения.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (IS_DEMO) {
        // GitHub Pages: статическая версия, ИИ недоступен.
        // Симулируем задержку для UX и подбираем диагноз по ключевым словам.
        await new Promise((r) => setTimeout(r, 1200));
        const demoResult = getDemoDiagnosis(text);
        setResult(demoResult);
        setCurrentDoneProcessings([]);
        const newEntry = { id: `${Date.now()}-demo`, timestamp: Date.now(), text: text.slice(0, 280), result: demoResult };
        addEntry(text, demoResult);
        setCurrentEntryId(newEntry.id);
        return;
      }

      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Если есть детальная информация об env-переменных — показываем её
        const envInfo = data?.env_detected
          ? `\n\nСостояние переменных:\n${Object.entries(data.env_detected)
              .map(([k, v]) => `  ${k}: ${v}`)
              .join("\n")}\n\nПодробнее: /api/debug-env`
          : "";
        throw new Error((data?.error || "Не удалось получить диагноз.") + envInfo);
      }
      const finalResult = data as DiagnoseResponse;
      setResult(finalResult);
      setCurrentDoneProcessings([]);
      addEntry(text, finalResult);
      // Получаем ID только что добавленной записи (первая в истории)
      setCurrentEntryId(`${Date.now()}-0`);
    } catch (e) {
      const msg = (e as Error).message || "Что-то пошло не так.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (entry: HistoryEntry) => {
    setText(entry.text);
    setResult(entry.result);
    setCurrentEntryId(entry.id);
    setCurrentDoneProcessings(entry.doneProcessings ?? []);
    setError(null);
    setHistoryOpen(false);
    toast.success("Загружен диагноз из истории");
  };

  const handleToggleDone = (processingIndex: number) => {
    if (!currentEntryId) {
      // Локальный режим — не сохраняется
      setCurrentDoneProcessings((prev) => {
        const key = String(processingIndex);
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return Array.from(next);
      });
      return;
    }
    toggleProcessingDone(currentEntryId, processingIndex);
    setCurrentDoneProcessings((prev) => {
      const key = String(processingIndex);
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return Array.from(next);
    });
  };

  const handleReset = () => {
    setText("");
    setResult(null);
    setCurrentEntryId(null);
    setCurrentDoneProcessings([]);
    setError(null);
  };

  const handleExample = (ex: string) => {
    setText(ex);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header
        historyCount={history.length}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        onShowOnboarding={showAgain}
      />

      <OnboardingModal open={showOnboarding} onOpenChange={setShowOnboarding} />

      <AnalyticsPanel
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
        history={history}
      />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-24 safe-x">
        {/* HERO */}
        {!result && !loading && (
          <Hero onPickExample={handleExample} />
        )}

        {/* Персональные рекомендации */}
        {!result && !loading && history.length > 0 && (
          <div className="mt-6">
            <RecommendationsPanel
              history={history}
              onStartDiagnosis={() =>
                document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
        )}

        {/* ФОРМА ВВОДА — всегда, если нет результата */}
        {!result && (
          <section
            id="form"
            className="mt-6 sm:mt-10 scroll-mt-4"
            aria-label="Форма описания ситуации"
          >
            <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6">
                <label
                  htmlFor="complaint"
                  className="block text-sm font-medium text-foreground/80 mb-2"
                >
                  Опишите свою ситуацию или цель своими словами
                </label>
                <Textarea
                  id="complaint"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Пишите как есть — как жаловались бы близкому другу. Не подбирайте слова, не редактируйте. Чем честнее — тем точнее диагноз. Например: «Я уже год не могу уйти с работы, которая меня душит. Каждый вечер прихожу разбитой, но утром иду снова. Боюсь, что больше нигде не возьмут, и злюсь на себя за слабость...»"
                  className="min-h-[180px] sm:min-h-[220px] resize-y text-base leading-relaxed border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  maxLength={8000}
                />
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{text.length} / 8000</span>
                  {text.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setText("")}
                      className="hover:text-foreground transition-colors"
                    >
                      Очистить
                    </button>
                  )}
                </div>

                {/* Подсказки в реальном времени — подсветка ключевых слов */}
                {text.length > 30 && !result && !loading && (
                  <LiveHints text={text} />
                )}
              </div>

              <div className="flex items-center justify-between gap-3 p-4 sm:px-6 bg-secondary/50 border-t">
                <div className="text-xs text-muted-foreground hidden sm:block">
                  Анализ занимает 10–25 секунд
                </div>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={loading || text.trim().length < 20}
                  className="ml-auto rounded-full px-6 h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      ИИ анализирует…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Получить диагноз
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ПРИМЕРЫ */}
            {!result && !loading && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2.5">
                  Не знаете с чего начать? Попробуйте пример:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex.label}
                      type="button"
                      onClick={() => handleExample(ex.text)}
                      className="text-left rounded-xl border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {ex.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {ex.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* СОСТОЯНИЕ LOADING */}
        {loading && <LoadingState />}

        {/* ОШИБКА */}
        {error && !loading && (
          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Не получилось.</p>
              <pre className="text-foreground/70 mt-1 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                {error}
              </pre>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSubmit}
                >
                  Попробовать ещё раз
                </Button>
                <a
                  href="/api/debug-env"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center h-8 px-3 text-xs rounded-md border bg-background hover:bg-accent transition-colors"
                >
                  Проверить переменные окружения →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* РЕЗУЛЬТАТ */}
        <AnimatePresence mode="wait">
          {result && !loading && (
            <motion.div
              ref={resultRef}
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 scroll-mt-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-lg sm:text-xl font-semibold">
                  Ваш диагноз
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="rounded-full"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Новый запрос
                </Button>
              </div>
              <DiagnosisCard
                data={result}
                entryId={currentEntryId ?? undefined}
                doneProcessings={currentDoneProcessings}
                onToggleDone={handleToggleDone}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* МЕТОДИКА — раскрывающийся блок */}
        {!result && (
          <Accordion type="single" collapsible className="mt-12">
            <AccordionItem
              value="method"
              className="border rounded-xl px-4 bg-card/60"
            >
              <AccordionTrigger className="text-base font-display font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  О методике «Мастер Кит»
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-foreground/80 leading-relaxed pt-2">
                <p className="mb-3">{METHODOLOGY_SUMMARY.description}</p>
                <div className="font-medium text-foreground mb-2">Принципы:</div>
                <ul className="space-y-1.5 mb-4">
                  {METHODOLOGY_SUMMARY.principles.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-primary mt-0.5">·</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                      7 уровней развития
                    </div>
                    <ol className="space-y-1 text-xs">
                      {LEVELS.map((l) => (
                        <li key={l.id} className="flex gap-2">
                          <span className="font-semibold text-primary w-4">
                            {l.id}.
                          </span>
                          <span>
                            <span className="font-medium">{l.name}</span>{" "}
                            <span className="text-muted-foreground">— {l.short}</span>
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                      7 базовых эмоций
                    </div>
                    <ul className="space-y-1 text-xs">
                      {EMOTIONS.map((e) => (
                        <li key={e.id} className="flex gap-2">
                          <span className="text-primary mt-0.5">·</span>
                          <span>
                            <span className="font-medium">{e.name}</span>{" "}
                            <span className="text-muted-foreground">
                              — {e.body.split(".")[0].toLowerCase()}.
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Концепции Дарьи Трутневой */}
                <div className="mt-5 pt-4 border-t">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                    Ключевые концепции методики
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {CONCEPTS.map((c) => (
                      <details
                        key={c.id}
                        className="group rounded-lg border bg-card p-2.5"
                      >
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-muted-foreground group-open:rotate-90 transition-transform shrink-0" />
                            <span className="font-medium text-xs">{c.title}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 ml-5 leading-snug">
                            {c.shortDescription}
                          </p>
                        </summary>
                        <div className="mt-2 ml-5 space-y-1.5 text-[11px] leading-relaxed">
                          <p className="text-foreground/80">{c.fullDescription}</p>
                          <p className="text-primary/90 italic font-medium">
                            ✦ {c.keyInsight}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-4 italic">
                  Приложение создано как инструмент самопознания и не заменяет
                  работу с психологом или сертифицированным наставником методики.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </main>

      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        onClear={clearAll}
        onSelect={handleSelectHistory}
        onDelete={removeEntry}
      />

      <Footer />
    </div>
  );
}

function Header({
  historyCount,
  onOpenHistory,
  onOpenAnalytics,
  onShowOnboarding,
}: {
  historyCount: number;
  onOpenHistory: () => void;
  onOpenAnalytics: () => void;
  onShowOnboarding: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b safe-top">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative h-8 w-8 rounded-full bg-gradient-to-br from-primary to-amber-500/70 flex items-center justify-center shadow-sm shrink-0">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-display font-semibold text-base">Мастер Кит</span>
            <span className="text-[10px] text-muted-foreground truncate">
              ИИ-диагностика по методу Дарьи Трутневой
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <AmbientSound />
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenAnalytics}
            disabled={historyCount === 0}
            className="h-8 w-8 p-0"
            title="Аналитика"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowOnboarding}
            className="h-8 w-8 p-0"
            title="О методике"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHistory}
            className="rounded-full h-8 gap-1.5 text-xs"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">История</span>
            {historyCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-0.5 h-4 px-1.5 text-[10px] rounded-full"
              >
                {historyCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onPickExample }: { onPickExample: (s: string) => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="hero-gradient rounded-3xl p-6 sm:p-10 border border-primary/10 relative overflow-hidden"
    >
      <div className="relative z-10">
        <Badge variant="secondary" className="mb-3 text-[11px]">
          <Sparkles className="h-3 w-3 mr-1" />
          Методика Дарьи Трутневой
        </Badge>
        {IS_DEMO && (
          <Badge
            variant="outline"
            className="mb-3 ml-2 text-[11px] border-amber-400/50 text-amber-700 bg-amber-50"
          >
            Демо-версия
          </Badge>
        )}
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight tracking-tight">
          Где вы застряли —
          <br />
          и как из этого выйти
        </h1>
        <p className="mt-4 text-base sm:text-lg text-foreground/75 leading-relaxed max-w-xl">
          Опишите свою ситуацию своими словами — как жалобное письмо другу. ИИ
          определит уровень развития, застрявшую эмоцию, эмоциональную яму и
          подберёт точные проработки на этот момент.
          {IS_DEMO && (
            <span className="block mt-2 text-xs text-amber-700/90">
              ⚠️ Это демо-версия на GitHub Pages — использует предзаготовленные
              диагнозы по ключевым словам. Для живого ИИ-анализа используйте
              полную версию.
            </span>
          )}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            "7 уровней развития",
            "7 базовых эмоций",
            "Эмоциональные ямы",
            "Проработки на сейчас",
          ].map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="bg-background/70 text-foreground/80 text-xs"
            >
              {t}
            </Badge>
          ))}
        </div>

        <div className="mt-6">
          <Button
            size="lg"
            className="rounded-full h-12 px-6"
            onClick={() => {
              document
                .getElementById("form")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Начать диагностику
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* breath orb */}
      <div
        aria-hidden
        className="absolute -right-10 -bottom-12 sm:-right-4 sm:-bottom-6 pointer-events-none"
      >
        <div className="h-44 w-44 sm:h-60 sm:w-60 rounded-full bg-gradient-to-br from-amber-300/40 via-primary/20 to-transparent blur-2xl animate-breath" />
      </div>
    </motion.section>
  );
}

function LoadingState() {
  const phases = [
    "Читаю ваше письмо…",
    "Определяю уровень развития…",
    "Выявляю застрявшие эмоции…",
    "Проверяю на эмоциональные ямы…",
    "Подбираю проработки…",
  ];
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setPhase((p) => Math.min(p + 1, phases.length - 1));
    }, 2200);
    return () => clearInterval(t);
  }, [phases.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 rounded-2xl border bg-card p-8 flex flex-col items-center text-center gap-4"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300/40 via-primary/30 to-transparent blur-md animate-breath" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-7 w-7 text-primary animate-spin" />
        </div>
      </div>
      <div className="font-display text-lg font-semibold">
        {phases[phase]}
      </div>
      <div className="text-xs text-muted-foreground max-w-sm">
        ИИ читает ваши слова, сверяет их с картой 7 уровней и 7 эмоций методики
        «Мастер Кит».
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 text-xs text-muted-foreground flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between safe-bottom">
        <span>
          © {new Date().getFullYear()} · Инструмент самопознания по методике
          «Мастер Кит»
        </span>
        <span className="sm:text-right">
          Не заменяет работу с психологом или наставником.
        </span>
      </div>
    </footer>
  );
}
