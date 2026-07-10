"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Eye,
  Image as ImageIcon,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetaphorCardImage } from "@/components/metaphor-card-image";
import type { CardDiagnosis } from "@/app/api/card-diagnose/route";

export function CardDiagnosisCard({ data }: { data: CardDiagnosis }) {
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
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg sm:text-xl font-semibold leading-snug mb-2">
              Метафорическая карта
            </h3>
            <p className="text-base text-foreground/85 leading-relaxed">{data.summary}</p>
          </div>
        </div>
      </Block>

      {/* 2. Карта с изображением */}
      <Block delay={0.1}>
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            {data.selected_card.title}
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <MetaphorCardImage cardId={data.selected_card.id} />
          <div className="flex-1 space-y-3 w-full">
            <div className="rounded-lg border bg-card p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                Образ на карте
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {data.selected_card.image_description}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
                Символизм
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed italic">
                {data.selected_card.symbolism}
              </p>
            </div>
          </div>
        </div>
      </Block>

      {/* 3. Анализ */}
      <Block delay={0.2}>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="font-display text-base sm:text-lg font-semibold">
            Толкование
          </h3>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Почему эта карта
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.analysis.why_this_card}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              <Eye className="h-3.5 w-3.5" />
              Что вы видите
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.analysis.what_you_see}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground font-semibold mb-1">
              Что это означает
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.analysis.what_it_means}</p>
          </div>
        </div>
      </Block>

      {/* 4. Вопросы */}
      {data.reflection_questions.length > 0 && (
        <Block delay={0.25}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">Вопросы к карте</h3>
          </div>
          <div className="space-y-2.5">
            {data.reflection_questions.map((q, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + i * 0.1 }}
                className="flex items-start gap-3 rounded-lg border bg-card p-3.5"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </div>
                <p className="text-sm text-foreground/85 leading-relaxed pt-0.5">{q}</p>
              </motion.div>
            ))}
          </div>
        </Block>
      )}

      {/* 5. Практика */}
      {data.practice.steps.length > 0 && (
        <Block delay={0.3}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base sm:text-lg font-semibold">Практика с картой</h3>
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

      <div className="text-center text-sm text-muted-foreground pt-1">
        <Eye className="inline h-4 w-4 mr-1" />
        Смотрите на карту 2-3 минуты молча — образ сам раскроет смысл
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
