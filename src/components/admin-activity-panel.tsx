"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  fetchActivityStats,
  formatActivityTime,
  type ActivityStats,
} from "@/lib/activity-tracker";

const TYPE_LABELS: Record<string, string> = {
  visit: "Вход на сайт",
  diagnosis: "Стандартный диагноз",
  neuro: "Нейро-диагноз",
  tale: "Сказкотерапия",
  card: "Метафорические карты",
  slides: "Слайды",
  chat: "AI-чат",
  consultant: "Консультант",
  export: "Экспорт PDF",
  voice: "Голосовой ввод",
  theme: "Смена темы",
};

const TYPE_COLORS: Record<string, string> = {
  visit: "text-blue-600 bg-blue-50",
  diagnosis: "text-primary bg-primary/10",
  neuro: "text-purple-600 bg-purple-50",
  tale: "text-amber-600 bg-amber-50",
  card: "text-green-600 bg-green-50",
  slides: "text-cyan-600 bg-cyan-50",
  chat: "text-indigo-600 bg-indigo-50",
  consultant: "text-rose-600 bg-rose-50",
  export: "text-gray-600 bg-gray-50",
  voice: "text-teal-600 bg-teal-50",
  theme: "text-orange-600 bg-orange-50",
};

function getDeviceIcon(device: string) {
  if (device === "mobile") return <Smartphone className="h-3.5 w-3.5" />;
  if (device === "tablet") return <Tablet className="h-3.5 w-3.5" />;
  return <Monitor className="h-3.5 w-3.5" />;
}

function getDeviceLabel(device: string): string {
  if (device === "mobile") return "📱 Мобильный";
  if (device === "tablet") return "📲 Планшет";
  return "💻 Компьютер";
}

export function AdminActivityPanel() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await fetchActivityStats();
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      await refresh();
    });
    const interval = setInterval(() => {
      if (active) void refresh();
    }, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [refresh]);

  if (loading) {
    return (
      <div className="space-y-4 mt-4 pt-4 border-t-2 border-primary/10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Загрузка активности...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-4 mt-4 pt-4 border-t-2 border-primary/10">
        <div className="text-xs text-muted-foreground text-center">
          Не удалось загрузить статистику.
        </div>
      </div>
    );
  }

  const maxAction = Math.max(1, ...Object.values(stats.actionCounts));

  return (
    <div className="space-y-4 mt-4 pt-4 border-t-2 border-primary/10">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <h4 className="font-display font-semibold text-sm">Активность на сайте</h4>
        <button
          onClick={() => void refresh()}
          className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          ↻ обновить
        </button>
      </div>

      {/* Сводка */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">{stats.totalSessions}</div>
          <div className="text-xs text-muted-foreground">визитов</div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">{stats.totalLogs}</div>
          <div className="text-xs text-muted-foreground">действий</div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">
            {stats.browsers.length}
          </div>
          <div className="text-xs text-muted-foreground">браузеров</div>
        </div>
      </div>

      {/* Браузеры */}
      {stats.browsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stats.browsers.map((b) => (
            <Badge key={b} variant="outline" className="text-xs">
              {b}
            </Badge>
          ))}
          {stats.devices.map((d) => (
            <Badge key={d} variant="secondary" className="text-xs">
              {getDeviceLabel(d)}
            </Badge>
          ))}
        </div>
      )}

      {/* Топ действий */}
      {Object.keys(stats.actionCounts).length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
            Что использовали
          </div>
          <div className="space-y-1.5">
            {Object.entries(stats.actionCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-xs font-medium w-36 truncate">
                    {TYPE_LABELS[type] ?? type}
                  </span>
                  <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(count / maxAction) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary w-6 text-right">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Последние визиты */}
      <div>
        <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
          Последние визиты
        </div>
        <div className="space-y-2 max-h-[350px] overflow-y-auto fancy-scroll">
          {stats.sessions.slice(0, 15).map((session, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-card p-2.5"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getDeviceIcon(session.device)}
                  <span className="font-medium">{session.browser}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-0.5" />
                  {formatActivityTime(session.startedAt)}
                </span>
                <Badge variant="outline" className="text-xs py-0 h-4">
                  {session.eventCount} действий
                </Badge>
                <span className="text-xs text-muted-foreground/70 ml-auto">
                  последнее: {formatActivityTime(session.lastActiveAt)}
                </span>
              </div>
              {/* Последние действия в сессии */}
              <div className="mt-2 space-y-1">
                {session.recentEvents.slice(0, 4).map((e, j) => (
                  <div key={j} className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${TYPE_COLORS[e.type] ?? "text-gray-600 bg-gray-50"}`}>
                      {TYPE_LABELS[e.type] ?? e.type}
                    </span>
                    <span className="text-muted-foreground">{formatActivityTime(e.createdAt)}</span>
                    {e.details && (
                      <span className="text-muted-foreground/60 truncate">— {e.details}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {stats.sessions.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          Пока нет данных об активности.
        </div>
      )}
    </div>
  );
}
