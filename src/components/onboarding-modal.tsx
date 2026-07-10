"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Layers,
  Lightbulb,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  ONBOARDING_DATA,
  CONCEPTS,
  METHODOLOGY_SUMMARY,
} from "@/lib/masterkit-data";
import { toast } from "sonner";

const STORAGE_KEY = "masterkit_onboarding_seen_v1";

/**
 * Онбординг для новых пользователей.
 * Показывается автоматически при первом визите (пока не закрыт).
 *
 * 5 слайдов:
 *   1. Приветствие + преимущества
 *   2. Удобство пользования
 *   3. Объём методики + практичность
 *   4. 7 уровней — для чего
 *   5. Сообщество
 */
export function OnboardingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState(0);
  const totalSteps = 6;

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto fancy-scroll p-0">
        {/* Прогресс */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 sm:px-6 py-2.5 flex items-center gap-3">
          <div className="flex-1 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {step + 1} / {totalSteps}
          </span>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <Slide1 />}
              {step === 1 && <Slide2 />}
              {step === 2 && <Slide3 />}
              {step === 3 && <Slide4 />}
              {step === 4 && <Slide5 />}
              {step === 5 && <Slide6 />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Навигация */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={step === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
          <span className="text-xs text-muted-foreground hidden sm:block">
            {step === totalSteps - 1
              ? "Готово к старту"
              : "Листайте, чтобы узнать больше"}
          </span>
          <Button size="sm" onClick={handleNext} className="gap-1">
            {step === totalSteps - 1 ? (
              <>
                Начать <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Далее <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Слайд 1: Приветствие + преимущества */
function Slide1() {
  return (
    <div>
      <div className="text-center mb-6">
        <div className="inline-flex h-16 w-16 rounded-full bg-gradient-to-br from-primary to-amber-500/70 items-center justify-center mb-3 shadow-sm">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          Добро пожаловать
        </h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          {METHODOLOGY_SUMMARY.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ONBOARDING_DATA.benefits.map((b, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-3.5 flex gap-3 items-start"
          >
            <div className="text-2xl shrink-0">{b.icon}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Слайд 2: Удобство пользования */
function Slide2() {
  return (
    <div>
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Compass className="h-3.5 w-3.5" />
          Удобство
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          Просто как разговор с другом
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Никаких тестов, регистраций и сложных терминов. Вы пишете — приложение понимает.
        </p>
      </div>

      <ul className="space-y-2.5">
        {ONBOARDING_DATA.convenience.map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg bg-secondary/40 p-3"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {i + 1}
            </div>
            <span className="text-sm leading-relaxed">{c}</span>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Lightbulb className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Как использовать</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Откройте приложение, когда чувствуете, что «зависли». Опишите ситуацию
          своими словами — как будто жалуетесь близкому другу. Через 20–30 секунд
          получите диагноз и точные практики.
        </p>
      </div>
    </div>
  );
}

/** Слайд 3: Объём + практичность */
function Slide3() {
  const scope = ONBOARDING_DATA.scope;
  return (
    <div>
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Layers className="h-3.5 w-3.5" />
          Объём методики
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          Глубокая карта сознания
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Приложение построено на полной базе методики Дарьи Трутневой.
        </p>
      </div>

      {/* Цифры объёма */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
        {[
          { num: scope.levels, label: "Уровней развития" },
          { num: scope.emotions, label: "Базовых эмоций" },
          { num: scope.pits, label: "Эмоц. ям" },
          { num: scope.beingnesses, label: "Бытийностей" },
          { num: scope.processings, label: "Типов проработок" },
          { num: scope.transitions, label: "Переходов" },
          { num: scope.examples, label: "Примеров" },
          { num: "∞", label: "Ситуаций" },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-lg border bg-card p-3 text-center"
          >
            <div className="font-display text-2xl font-bold text-primary">
              {s.num}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Практичность */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Check className="h-3.5 w-3.5" />
          Сколько времени это занимает
        </div>
        {ONBOARDING_DATA.practicality.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg bg-secondary/40 p-3"
          >
            <Badge variant="outline" className="font-mono text-xs shrink-0">
              {p.time}
            </Badge>
            <span className="text-sm">{p.use}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Слайд 4: 7 уровней — для чего */
function Slide4() {
  return (
    <div>
      <div className="mb-4">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Layers className="h-3.5 w-3.5" />
          Карта развития
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          7 уровней — для чего
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Каждый уровень — это базовая задача, которую нужно закрыть, чтобы
          двигаться дальше. Нельзя перепрыгнуть.
        </p>
      </div>

      <div className="space-y-1.5 max-h-[360px] overflow-y-auto fancy-scroll pr-1">
        {ONBOARDING_DATA.levelGuide.map((l) => (
          <details
            key={l.level}
            className="group rounded-lg border bg-card p-3"
          >
            <summary className="flex items-center gap-3 cursor-pointer list-none">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {l.level}
              </div>
              <span className="font-semibold text-sm flex-1">{l.name}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
            </summary>
            <div className="mt-2 pl-10 space-y-1.5 text-xs">
              <p>
                <span className="text-muted-foreground">Для кого: </span>
                {l.forWhat}
              </p>
              <p>
                <span className="text-muted-foreground">Признаки: </span>
                {l.signs}
              </p>
              <p>
                <span className="text-muted-foreground">Движение: </span>
                {l.moveTo}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

/** Слайд 5: Сообщество */
function Slide5() {
  const community = ONBOARDING_DATA.community;
  return (
    <div>
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Users className="h-3.5 w-3.5" />
          Сообщество
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          {community.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {community.description}
        </p>
      </div>

      <ul className="space-y-1.5 mb-5">
        {community.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* Демо-заглушки вместо внешних ссылок */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
          Каналы сообщества (демо)
        </div>
        {community.links.map((link, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              toast.info("Демо: ссылка будет доступна после официального партнёрства с автором методики.", {
                duration: 5000,
              })
            }
            className="w-full flex items-center gap-3 rounded-lg border bg-card p-3 hover:border-primary/40 hover:shadow-sm transition-all group text-left"
          >
            <ArrowRight className="h-4 w-4 text-primary shrink-0 group-hover:translate-x-1 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm flex items-center gap-2">
                {link.label}
                <Badge variant="outline" className="text-[9px] h-4 py-0 text-amber-700 border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300">
                  демо
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">{link.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-lg bg-secondary/40 p-3 text-xs text-muted-foreground italic leading-relaxed">
        <Shield className="h-3.5 w-3.5 inline-block mr-1 mb-0.5" />
        {community.note}
      </div>
    </div>
  );
}

/** Слайд 6: О Дарье Трутневой — авторе методики */
function Slide6() {
  const author = ONBOARDING_DATA.author;
  return (
    <div>
      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          Автор методики
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
          {author.name}
        </h2>
        <div className="text-sm text-primary font-medium mt-1">{author.role}</div>
      </div>

      {/* Портрет-заглушка */}
      <div className="flex justify-center mb-4">
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 border-2 border-primary/20 flex items-center justify-center shadow-sm">
          <span className="font-display text-3xl font-bold text-primary">ДТ</span>
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </div>

      <p className="text-sm text-foreground/85 leading-relaxed mb-4">
        {author.bio}
      </p>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-2">
          Ключевые идеи методики
        </div>
        <ul className="space-y-1.5">
          {author.keyIdeas.map((idea, i) => (
            <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
              <span className="text-primary mt-0.5 shrink-0">✦</span>
              <span>{idea}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-3 mb-4">
        <div className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-1">
          Философия методики
        </div>
        <p className="text-sm italic text-foreground/80 leading-relaxed">
          {author.philosophy}
        </p>
      </div>

      <div className="rounded-lg bg-secondary/40 p-3 text-[11px] text-muted-foreground italic leading-relaxed">
        <Shield className="h-3.5 w-3.5 inline-block mr-1 mb-0.5" />
        {author.disclaimer}
      </div>
    </div>
  );
}

/**
 * Хук: показывает онбординг, если пользователь видит его впервые.
 */
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      try {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
          setShowOnboarding(true);
        }
      } catch {
        // localStorage недоступен — не показываем
      }
    });
  }, []);

  const showAgain = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setShowOnboarding(true);
  };

  return { showOnboarding, setShowOnboarding, showAgain };
}
