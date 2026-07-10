"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  BookText,
  CheckCircle2,
  Clock,
  Heart,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { TaleDiagnosis } from "@/app/api/tale-diagnose/route";

const TYPE_ICONS: Record<string, typeof BookOpen> = {
  сказка: BookOpen,
  притча: BookText,
  метафора: Lightbulb,
};

export function TaleDiagnosisCard({ data }: { data: TaleDiagnosis }) {
  const TypeIcon = TYPE_ICONS[data.selected_tale.type] ?? BookOpen;

  return (
    <motion.div
      className="flex flex-col gap-4 sm:gap-5"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
    >
      {/* 1. Сводка */}
      <Block delay={0}>
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug mb-2">
              Сказкотерапия
            </h3>
            <p className="text-base text-foreground/85 leading-relaxed">
              {data.summary}
            </p>
          </div>
        </div>
      </Block>

      {/* 2. Сказка / Притча */}
      <Block delay={0.1}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <TypeIcon className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            {data.selected_tale.title}
          </h3>
          <Badge variant="secondary" className="text-xs capitalize">
            {data.selected_tale.type}
          </Badge>
          <Badge
            variant="outline"
            className="text-xs"
          >
            {data.selected_tale.source === "из базы" ? "из коллекции" : "оригинальная ✨"}
          </Badge>
        </div>

        {/* Текст сказки в красивой рамке */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6 relative overflow-hidden">
          {/* Декоративные углы */}
          <div className="absolute top-2 right-2 text-primary/20 text-lg">✦</div>
          <div className="absolute bottom-2 left-2 text-primary/20 text-lg">✦</div>

          <div className="prose prose-sm max-w-none">
            <p className="text-base text-foreground/85 leading-relaxed whitespace-pre-line font-serif italic">
              {data.tale_text}
            </p>
          </div>
        </div>
      </Block>

      {/* 3. Разбор */}
      <Block delay={0.2}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Почему именно эта история
          </h3>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-secondary/40 p-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Тема вашей ситуации
            </div>
            <Badge variant="secondary" className="text-sm">
              {data.diagnosis.theme}
            </Badge>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Как история связана с вашей ситуацией
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.diagnosis.connection}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Ключевой инсайт
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {data.diagnosis.insight}
            </p>
          </div>
        </div>
      </Block>

      {/* 4. Мораль */}
      <Block delay={0.25}>
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-wide text-primary font-semibold">
              Мораль для вас
            </span>
          </div>
          <p className="text-base italic text-foreground/85 leading-relaxed">
            {data.moral}
          </p>
        </div>
      </Block>

      {/* 5. Вопросы для размышления */}
      {data.reflection_questions.length > 0 && (
        <Block delay={0.3}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Вопросы для размышления
            </h3>
          </div>
          <div className="space-y-2.5">
            {data.reflection_questions.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3 rounded-lg border bg-card p-3.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed pt-0.5">
                  {q}
                </p>
              </motion.div>
            ))}
          </div>
        </Block>
      )}

      {/* 6. Практика по мотивам сказки */}
      {data.practice.steps.length > 0 && (
        <Block delay={0.35}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">
              Практика по мотивам сказки
            </h3>
          </div>
          <p className="text-sm text-foreground/70 mb-3">{data.practice.title}</p>
          <div className="rounded-xl border bg-card p-4">
            <ol className="space-y-2.5 mb-3">
              {data.practice.steps.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-foreground/85 leading-relaxed pt-0.5">{s}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
              <Clock className="h-3.5 w-3.5" />
              {data.practice.duration}
            </div>
          </div>
        </Block>
      )}

      {/* Подсказка */}
      <div className="text-center text-sm text-muted-foreground pt-1">
        <BookOpen className="inline h-4 w-4 mr-1" />
        Прочитайте сказку ещё раз через день — откроются новые слои смысла
      </div>
    </motion.div>
  );
}

function Block({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
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
