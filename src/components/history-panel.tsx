"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  History,
  Trash2,
  X,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatHistoryDate,
  getEntrySummary,
  getHistoryStats,
  type HistoryEntry,
} from "@/hooks/use-diagnosis-history";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { LEVELS } from "@/lib/masterkit-data";

/**
 * Панель истории диагнозов пользователя.
 * Сохраняется в localStorage, до 50 записей.
 * Показывает: список, статистику, возможность вернуться к прошлому диагнозу.
 */
export function HistoryPanel({
  open,
  onOpenChange,
  history,
  onClear,
  onSelect,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  history: HistoryEntry[];
  onClear: () => void;
  onSelect: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
}) {
  const stats = getHistoryStats(history);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <History className="h-5 w-5 text-primary" />
            История диагнозов
          </DialogTitle>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">История пуста.</p>
            <p className="text-xs mt-1">
              Сделайте первый диагноз — он автоматически сохранится здесь.
            </p>
          </div>
        ) : (
          <>
            {/* Статистика */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* По бытийностям */}
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Бытийности
                </div>
                {stats.beingnessCounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-1.5">
                    {stats.beingnessCounts.slice(0, 5).map((b) => {
                      const max = stats.beingnessCounts[0]?.count || 1;
                      const pct = (b.count / max) * 100;
                      return (
                        <div key={b.id} className="flex items-center gap-2">
                          <span className="text-base">{b.symbol}</span>
                          <span className="text-xs font-medium w-24 truncate">
                            {b.name}
                          </span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: b.color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-6 text-right">
                            {b.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* По уровням */}
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Уровни развития
                </div>
                {stats.levelCounts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">—</p>
                ) : (
                  <div className="space-y-1">
                    {stats.levelCounts.map((l) => {
                      const levelData = LEVELS.find((x) => x.id === l.id);
                      const max = Math.max(...stats.levelCounts.map((x) => x.count));
                      const pct = (l.count / max) * 100;
                      return (
                        <div key={l.id} className="flex items-center gap-2">
                          <span className="text-xs font-semibold w-4">
                            {l.id}
                          </span>
                          <span className="text-xs w-28 truncate">
                            {l.name}
                          </span>
                          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-6 text-right">
                            {l.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Список записей */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Всего: {stats.total}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClear}
                  className="text-destructive hover:text-destructive text-xs h-7"
                >
                  <Trash2 className="h-3 w-3" />
                  Очистить всё
                </Button>
              </div>

              <AnimatePresence initial={false}>
                {history.map((entry) => {
                  const summary = getEntrySummary(entry);
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer group"
                      onClick={() => onSelect(entry)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                          style={{
                            backgroundColor: `${summary.beingnessColor}22`,
                            color: summary.beingnessColor,
                          }}
                        >
                          {summary.beingnessSymbol}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span
                              className="font-display text-sm font-semibold"
                              style={{ color: summary.beingnessColor }}
                            >
                              {summary.beingnessName}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 py-0">
                              ур. {summary.levelId} · {summary.levelName}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {formatHistoryDate(entry.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                            «{entry.text}»
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive"
                          aria-label="Удалить запись"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
