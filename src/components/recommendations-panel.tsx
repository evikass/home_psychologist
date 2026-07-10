"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Info,
  Lightbulb,
  Sparkles,
  X,
} from "lucide-react";
import {
  getRecommendations,
  type Recommendation,
} from "@/lib/masterkit-data";
import type { HistoryEntry } from "@/hooks/use-diagnosis-history";

const ICONS = {
  warning: AlertCircle,
  suggestion: Lightbulb,
  practice: Sparkles,
  info: Info,
};

const COLORS = {
  warning: "border-amber-300 bg-amber-50 text-amber-900",
  suggestion: "border-blue-300 bg-blue-50 text-blue-900",
  practice: "border-purple-300 bg-purple-50 text-purple-900",
  info: "border-primary/30 bg-primary/5 text-foreground",
};

/**
 * Блок персональных рекомендаций — на основе истории диагнозов.
 * Показывается на главной странице, если есть что порекомендовать.
 */
export function RecommendationsPanel({
  history,
  onStartDiagnosis,
}: {
  history: HistoryEntry[];
  onStartDiagnosis?: () => void;
}) {
  const recs = getRecommendations(history);

  if (recs.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {recs.map((rec, i) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            onStartDiagnosis={onStartDiagnosis}
            delay={i * 0.05}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function RecommendationCard({
  rec,
  onStartDiagnosis,
  delay = 0,
}: {
  rec: Recommendation;
  onStartDiagnosis?: () => void;
  delay?: number;
}) {
  const Icon = ICONS[rec.type];
  const colorClass = COLORS[rec.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-xl border-2 p-3.5 ${colorClass}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm mb-0.5">{rec.title}</div>
          <p className="text-xs leading-relaxed opacity-90">{rec.message}</p>
          {rec.action && (
            <button
              onClick={onStartDiagnosis}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100 transition-opacity"
            >
              {rec.action.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
