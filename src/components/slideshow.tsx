"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Loader2,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SceneImage } from "@/components/scene-image";
import type { SlideStory } from "@/app/api/slide-create/route";
import { toast } from "sonner";

const MOOD_LABELS: Record<string, string> = {
  спокойствие: "Спокойствие",
  тревога: "Тревога",
  надежда: "Надежда",
  радость: "Радость",
  грусть: "Грусть",
  свет: "Свет",
  трансформация: "Трансформация",
};

export function SlideShow({ story }: { story: SlideStory }) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const slides = story.slides;
  const total = slides.length;

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + total) % total);
  }, [total]);

  // Автоплей
  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setCurrent((c) => {
        if (c + 1 >= total) {
          setAutoPlay(false);
          return c;
        }
        return c + 1;
      });
    }, 8000); // 8 секунд на слайд
    return () => clearInterval(timer);
  }, [autoPlay, total]);

  if (!slides.length) return null;

  const slide = slides[current];
  const isLast = current === total - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Заголовок */}
      <div className="text-center">
        <Badge variant="secondary" className="text-xs mb-1">{story.type}</Badge>
        <h3 className="font-display text-lg sm:text-xl font-semibold">{story.title}</h3>
      </div>

      {/* Слайд */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-primary/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5 }}
          >
            {/* Иллюстрация */}
            <div className="aspect-[16/10] sm:aspect-[16/9]">
              <SceneImage mood={slide.mood} timeOfDay={slide.timeOfDay} sceneText={slide.scene} />
            </div>

            {/* Текст поверх */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-black/20 to-transparent">
              <div className="p-4 sm:p-6 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="text-xs bg-primary/80">{MOOD_LABELS[slide.mood] ?? slide.mood}</Badge>
                  <span className="text-xs text-white/60">{slide.timeOfDay}</span>
                </div>
                <p className="text-white text-sm sm:text-base leading-relaxed font-serif italic">
                  {slide.text}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Навигация */}
        <div className="absolute top-1/2 left-2 -translate-y-1/2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 rounded-full bg-black/40 hover:bg-black/60 border-0"
            onClick={prev}
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </Button>
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 w-9 p-0 rounded-full bg-black/40 hover:bg-black/60 border-0"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </Button>
        </div>

        {/* Кнопка автоплея */}
        <div className="absolute top-3 right-3">
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-black/40 hover:bg-black/60 border-0"
            onClick={() => setAutoPlay(!autoPlay)}
          >
            {autoPlay ? <Pause className="h-3.5 w-3.5 text-white" /> : <Play className="h-3.5 w-3.5 text-white" />}
          </Button>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="flex gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              i === current ? "bg-primary" : i < current ? "bg-primary/40" : "bg-secondary"
            }`}
          />
        ))}
      </div>

      {/* Счётчик */}
      <div className="text-center text-xs text-muted-foreground">
        Слайд {current + 1} из {total}
      </div>

      {/* Мораль — только на последнем слайде */}
      {isLast && story.moral && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border-l-4 border-primary bg-primary/5 p-4 text-center"
        >
          <Heart className="h-4 w-4 text-primary inline mr-1" />
          <span className="text-sm italic text-foreground/85">{story.moral}</span>
        </motion.div>
      )}

      {/* Управление */}
      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={prev} disabled={current === 0}>
          <ChevronLeft className="h-4 w-4" />
          Назад
        </Button>
        {!isLast ? (
          <Button size="sm" onClick={next}>
            Далее
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setCurrent(0); setAutoPlay(true); }}>
            <Sparkles className="h-4 w-4" />
            Сначала
          </Button>
        )}
      </div>
    </motion.div>
  );
}

/** Компонент-обёртка: загрузка слайдов */
export function SlideShowLoader({ text, onComplete }: { text: string; onComplete: (story: SlideStory) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/slide-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Ошибка.");
      onComplete(data as SlideStory);
    } catch (e) {
      setError((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [text, onComplete]);

  useEffect(() => {
    if (text.trim().length >= 20) {
      void generate();
    }
  }, [text, generate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-amber-300/30 blur-xl animate-breath" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Создаю визуальную историю с иллюстрациями...<br />
          Это занимает 20-30 секунд
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return null;
}
