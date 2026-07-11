"use client";

import { motion } from "framer-motion";
import { MIPS_LEVELS, BRAINWAVE_STATES, NEURO_CYCLE } from "@/lib/neurotransforming-data";

// ============================================================================
// 1. Компактная пирамида MIPS с подсветкой уровня диагноза
// ============================================================================

export function MipsMiniDiagram({ activeLevel }: { activeLevel: number }) {
  const LEVEL_HEIGHT = 32;
  const TOTAL_HEIGHT = LEVEL_HEIGHT * MIPS_LEVELS.length;
  const PYRAMID_WIDTH = 220;
  const CENTER_X = PYRAMID_WIDTH / 2;

  // Уровни снизу вверх (1 - основание, 8 - вершина)
  const levels = [...MIPS_LEVELS].reverse();

  return (
    <svg
      viewBox={`0 0 ${PYRAMID_WIDTH} ${TOTAL_HEIGHT}`}
      className="w-full h-auto max-w-[220px] mx-auto"
      role="img"
      aria-label={`Пирамида программ, активный уровень ${activeLevel}`}
    >
      {levels.map((level, i) => {
        const y = i * LEVEL_HEIGHT;
        const widthRatio = 0.3 + (i / (levels.length - 1)) * 0.7;
        const width = PYRAMID_WIDTH * widthRatio;
        const x = CENTER_X - width / 2;
        const isActive = activeLevel === parseInt(level.id);

        return (
          <g key={level.id}>
            {isActive && (
              <motion.rect
                x={x - 6}
                y={y + 1}
                width={width + 12}
                height={LEVEL_HEIGHT - 4}
                rx={5}
                fill="none"
                stroke={level.color}
                strokeWidth="2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.4, 1, 0.4], scale: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: `${CENTER_X}px ${y + LEVEL_HEIGHT / 2}px` }}
              />
            )}
            <rect
              x={x}
              y={y + 1}
              width={width}
              height={LEVEL_HEIGHT - 4}
              rx={4}
              fill={level.color}
              opacity={isActive ? 1 : 0.3}
            />
            <text
              x={x + 10}
              y={y + LEVEL_HEIGHT / 2 + 1}
              textAnchor="start"
              fontSize="13"
              fontWeight={isActive ? 700 : 500}
              fill="white"
              opacity={isActive ? 1 : 0.7}
            >
              {level.id}
            </text>
            <text
              x={CENTER_X}
              y={y + LEVEL_HEIGHT / 2 + 1}
              textAnchor="middle"
              fontSize="12"
              fontWeight={isActive ? 700 : 400}
              fill="white"
              opacity={isActive ? 1 : 0.6}
            >
              {level.shortName}
            </text>
            {isActive && (
              <text
                x={x + width + 8}
                y={y + LEVEL_HEIGHT / 2 + 1}
                textAnchor="start"
                fontSize="14"
                fill={level.color}
                fontWeight="700"
              >
                ←
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================================
// 2. Компактная шкала ритмов мозга с выделением рекомендованного
// ============================================================================

const STATE_DATA: Record<string, { color: string; shortName: string; freq: string }> = {
  delta: { color: "#0d9488", shortName: "Дельта", freq: "0.5–3" },
  theta: { color: "#7c3aed", shortName: "Тета", freq: "4–7" },
  alpha: { color: "#16a34a", shortName: "Альфа", freq: "8–13" },
  beta: { color: "#dc2626", shortName: "Бета", freq: "14–30" },
};

export function BrainwaveMiniBar({ activeState }: { activeState: string }) {
  const states = ["delta", "theta", "alpha", "beta"];
  const active = STATE_DATA[activeState] ?? STATE_DATA.alpha;

  return (
    <div className="w-full">
      {/* Волновая визуализация */}
      <svg viewBox="0 0 240 60" className="w-full h-auto mb-2" role="img" aria-label="Ритмы мозга">
        {/* Фоновая линия */}
        <line x1="10" y1="30" x2="230" y2="30" stroke="#e5e0d8" strokeWidth="0.5" />

        {states.map((s, i) => {
          const data = STATE_DATA[s];
          const isActive = s === activeState;
          const x = 15 + i * 55;
          const amplitude = isActive ? 18 : 6;
          const waveCount = s === "delta" ? 1.5 : s === "theta" ? 2.5 : s === "alpha" ? 4 : 7;

          // Генерируем волну
          const wavePoints = Array.from({ length: 40 }, (_, j) => {
            const wx = x + (j / 39) * 45;
            const wy = 30 + Math.sin((j / 39) * Math.PI * 2 * waveCount) * amplitude;
            return `${wx},${wy}`;
          }).join(" ");

          return (
            <g key={s}>
              {/* Цветная зона */}
              <rect
                x={x - 2}
                y={isActive ? 8 : 18}
                width={49}
                height={isActive ? 44 : 24}
                rx={4}
                fill={data.color}
                opacity={isActive ? 0.15 : 0.05}
              />
              {/* Волна */}
              <motion.polyline
                points={wavePoints}
                fill="none"
                stroke={data.color}
                strokeWidth={isActive ? 2 : 1}
                opacity={isActive ? 1 : 0.4}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: i * 0.15 }}
              />
              {/* Подпись */}
              <text
                x={x + 22.5}
                y={isActive ? 58 : 52}
                textAnchor="middle"
                fontSize="11"
                fontWeight={isActive ? 700 : 400}
                fill={data.color}
                opacity={isActive ? 1 : 0.5}
              >
                {data.shortName}
              </text>
              {/* Частота */}
              <text
                x={x + 22.5}
                y={isActive ? 5 : 12}
                textAnchor="middle"
                fontSize="7"
                fill={data.color}
                opacity={isActive ? 0.8 : 0.4}
              >
                {data.freq} Гц
              </text>
              {/* Стрелка к активному */}
              {isActive && (
                <motion.text
                  x={x + 22.5}
                  y={3}
                  textAnchor="middle"
                  fontSize="13"
                  fill={data.color}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ▼
                </motion.text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ============================================================================
// 3. Компактный цикл трансформации — горизонтальный поток
// ============================================================================

export function NeuroCycleMini({
  stages,
}: {
  stages: Array<{
    stage_id: string;
    stage_name: string;
    what_to_do: string;
  }>;
}) {
  if (!stages || stages.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto fancy-scroll pb-2">
      <div className="flex items-start gap-0 min-w-[600px] sm:min-w-0">
        {stages.map((stage, i) => {
          const cycleData = NEURO_CYCLE.find((c) => c.id === stage.stage_id);
          const color = cycleData?.color ?? "#525252";
          const isLast = i === stages.length - 1;

          return (
            <div key={i} className="flex items-start flex-1">
              {/* Этап */}
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Кружок с номером */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.15, type: "spring" }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold shrink-0 shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {stage.stage_id}
                </motion.div>
                {/* Название */}
                <div
                  className="text-xs font-semibold mt-1.5 text-center leading-tight"
                  style={{ color }}
                >
                  {stage.stage_name}
                </div>
              </div>
              {/* Стрелка-коннектор */}
              {!isLast && (
                <div className="flex items-center pt-3.5 px-0.5 shrink-0">
                  <svg width="20" height="12" viewBox="0 0 20 12">
                    <motion.path
                      d="M 2 6 L 16 6 M 12 2 L 18 6 L 12 10"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 0.5 }}
                      transition={{ delay: i * 0.15 + 0.3, duration: 0.4 }}
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 4. Таймлайн интеграции с чекпоинтами
// ============================================================================

export function IntegrationTimeline({
  durationDays,
  checkpoints,
}: {
  durationDays: number;
  checkpoints: string[];
}) {
  // Создаём точки на таймлайне
  const markers: Array<{ day: number; label: string; description?: string }> = [
    { day: 0, label: "Старт" },
  ];

  // Добавляем чекпоинты (пытаемся извлечь дни из текста)
  checkpoints.forEach((cp) => {
    const match = cp.match(/(\d+)/);
    const day = match ? parseInt(match[1]) : Math.floor(durationDays * 0.5);
    markers.push({ day, label: `День ${day}`, description: cp });
  });

  // Добавляем финал
  markers.push({ day: durationDays, label: "Результат" });

  // Сортируем по дню
  markers.sort((a, b) => a.day - b.day);

  const maxDay = durationDays;

  return (
    <div className="w-full">
      {/* Таймлайн */}
      <div className="relative pt-6 pb-2 px-2">
        {/* Линия */}
        <div className="absolute top-9 left-2 right-2 h-1 bg-secondary rounded-full" />
        <motion.div
          className="absolute top-9 left-2 h-1 bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `calc(100% - 16px)` }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />

        {/* Точки */}
        <div className="relative flex justify-between items-start">
          {markers.map((marker, i) => {
            const pct = maxDay > 0 ? (marker.day / maxDay) * 100 : 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.2 }}
                className="flex flex-col items-center"
                style={{ position: "absolute", left: `${pct}%`, transform: "translateX(-50%)" }}
              >
                {/* Точка */}
                <div
                  className={`h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm z-10 ${
                    i === 0
                      ? "bg-secondary"
                      : i === markers.length - 1
                      ? "bg-primary"
                      : "bg-primary/60"
                  }`}
                />
                {/* День */}
                <div
                  className={`text-xs font-semibold mt-1.5 text-center whitespace-nowrap ${
                    i === markers.length - 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {marker.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Чекпоинты списком */}
      {checkpoints.length > 0 && (
        <div className="mt-6 space-y-2">
          {checkpoints.map((cp, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-start gap-2 text-xs rounded-lg bg-secondary/40 p-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {i + 1}
              </span>
              <span className="text-foreground/80 leading-relaxed">{cp}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
