"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BEINGNESSES } from "@/lib/masterkit-data";
import {
  exportHistoryToJson,
  getBeingnessTrend,
  getHistoryStats,
  type HistoryEntry,
} from "@/hooks/use-diagnosis-history";

type Period = "7d" | "30d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Неделя",
  "30d": "Месяц",
  all: "Всё время",
};

const PERIOD_DAYS: Record<Period, number> = {
  "7d": 7,
  "30d": 30,
  all: 365 * 5,
};

/**
 * Расширенная панель аналитики с трендами по бытийностям за период.
 */
export function AnalyticsPanel({
  open,
  onOpenChange,
  history,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  history: HistoryEntry[];
}) {
  const [period, setPeriod] = useState<Period>("30d");

  const filteredHistory = useMemo(() => {
    if (period === "all") return history;
    const cutoff = Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000;
    return history.filter((e) => e.timestamp >= cutoff);
  }, [history, period]);

  const stats = useMemo(() => getHistoryStats(filteredHistory), [filteredHistory]);
  const trend = useMemo(
    () => getBeingnessTrend(filteredHistory, PERIOD_DAYS[period]),
    [filteredHistory, period]
  );

  // Все бытийности, которые встречаются в трендах
  const activeBeingnessIds = useMemo(() => {
    const ids = new Set<string>();
    for (const t of trend) {
      for (const id of Object.keys(t.counts)) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  }, [trend]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display flex-wrap">
            <BarChart3 className="h-5 w-5 text-primary" />
            Аналитика
            <div className="ml-auto flex gap-1">
              {(["7d", "30d", "all"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет данных за этот период.</p>
            <p className="text-xs mt-1">
              Сделайте несколько диагнозов — и здесь появится аналитика.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Сводка */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <StatCard
                icon={<Calendar className="h-4 w-4" />}
                label="Диагнозов"
                value={stats.total}
                color="bg-blue-100 text-blue-700"
              />
              <StatCard
                icon={<Trophy className="h-4 w-4" />}
                label="Проработок сделано"
                value={`${stats.doneCount} / ${stats.totalProcessings}`}
                color="bg-green-100 text-green-700"
              />
              <StatCard
                icon={<Activity className="h-4 w-4" />}
                label="Уникальных бытийностей"
                value={stats.beingnessCounts.length}
                color="bg-purple-100 text-purple-700"
              />
              <StatCard
                icon={<TrendingUp className="h-4 w-4" />}
                label="Средний уровень"
                value={
                  stats.levelCounts.length > 0
                    ? Math.round(
                        stats.levelCounts.reduce(
                          (s, l) => s + l.id * l.count,
                          0
                        ) / stats.levelCounts.reduce((s, l) => s + l.count, 0)
                      ).toString()
                    : "—"
                }
                color="bg-amber-100 text-amber-700"
              />
            </div>

            {/* График тренда по дням */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Динамика по дням
                </h3>
              </div>

              {trend.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Нет данных за период
                </p>
              ) : (
                <TrendChart trend={trend} beingnessIds={activeBeingnessIds} />
              )}
            </div>

            {/* Распределение бытийностей */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Распределение бытийностей
                </h3>
              </div>
              {stats.beingnessCounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                <div className="space-y-2">
                  {stats.beingnessCounts.map((b) => {
                    const max = stats.beingnessCounts[0]?.count || 1;
                    const pct = (b.count / max) * 100;
                    return (
                      <div key={b.id} className="flex items-center gap-2">
                        <span className="text-base w-5">{b.symbol}</span>
                        <span className="text-xs font-medium w-28 truncate">
                          {b.name}
                        </span>
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: b.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {b.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Распределение уровней */}
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-display font-semibold text-sm">
                  Уровни развития
                </h3>
              </div>
              {stats.levelCounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                <div className="flex items-end gap-2 h-24">
                  {stats.levelCounts.map((l) => {
                    const max = Math.max(...stats.levelCounts.map((x) => x.count));
                    const h = (l.count / max) * 100;
                    return (
                      <div
                        key={l.id}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <span className="text-xs font-semibold">{l.count}</span>
                        <motion.div
                          className="w-full bg-primary rounded-t-md"
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.5 }}
                          style={{ minHeight: "8px" }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {l.id}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Экспорт */}
            <div className="flex items-center justify-between rounded-xl border bg-secondary/40 p-3">
              <div className="text-xs">
                <div className="font-medium text-foreground">
                  Экспорт для работы с наставником
                </div>
                <div className="text-muted-foreground mt-0.5">
                  Скачайте всю историю в JSON
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportHistoryToJson(history)}
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Скачать JSON
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-2.5 text-center">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full mb-1 ${color}`}
      >
        {icon}
      </div>
      <div className="font-display text-lg font-bold leading-none">{value}</div>
      <div className="text-xs text-muted-foreground mt-1 leading-tight">
        {label}
      </div>
    </div>
  );
}

/**
 * Простой stacked bar chart для тренда по дням.
 */
function TrendChart({
  trend,
  beingnessIds,
}: {
  trend: Array<{
    date: Date;
    dateLabel: string;
    counts: Record<string, number>;
    total: number;
  }>;
  beingnessIds: string[];
}) {
  const maxValue = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-32 mb-2 overflow-x-auto fancy-scroll">
        {trend.map((t, i) => (
          <div
            key={i}
            className="flex-1 min-w-[16px] flex flex-col items-center gap-0.5 group relative"
            title={`${t.dateLabel}: ${t.total} диагноз(ов)`}
          >
            <div
              className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
              style={{ height: `${(t.total / maxValue) * 100}%` }}
            >
              {beingnessIds.map((id) => {
                const count = t.counts[id] ?? 0;
                if (count === 0) return null;
                const beingness = BEINGNESSES.find((b) => b.id === id);
                const heightPct = (count / t.total) * 100;
                return (
                  <div
                    key={id}
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: beingness?.color.border ?? "#888",
                    }}
                    className="w-full"
                  />
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {t.dateLabel}
            </span>
          </div>
        ))}
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-2 mt-3">
        {beingnessIds.map((id) => {
          const b = BEINGNESSES.find((x) => x.id === id);
          if (!b) return null;
          return (
            <Badge
              key={id}
              variant="outline"
              className="text-xs gap-1 py-0 h-5"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: b.color.border }}
              />
              {b.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
