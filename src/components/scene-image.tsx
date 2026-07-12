"use client";

import { motion } from "framer-motion";

/**
 * Генератор SVG-иллюстраций для слайдов.
 * Создаёт атмосферные сцены на основе настроения и времени суток.
 */

const MOOD_COLORS: Record<string, { sky: string; ground: string; accent: string; particle: string }> = {
  спокойствие: { sky: "#bae6fd", ground: "#86efac", accent: "#fde68a", particle: "#fef3c7" },
  тревога: { sky: "#64748b", ground: "#334155", accent: "#f87171", particle: "#fca5a5" },
  надежда: { sky: "#a5f3fc", ground: "#6ee7b7", accent: "#fbbf24", particle: "#fef9c3" },
  радость: { sky: "#fef3c7", ground: "#fde68a", accent: "#fb923c", particle: "#fbbf24" },
  грусть: { sky: "#6366f1", ground: "#3730a3", accent: "#818cf8", particle: "#c7d2fe" },
  свет: { sky: "#fef9c3", ground: "#fde68a", accent: "#ffffff", particle: "#fef3c7" },
  трансформация: { sky: "#c4b5fd", ground: "#7c3aed", accent: "#fbbf24", particle: "#e9d5ff" },
};

const TIME_GRADIENTS: Record<string, { top: string; mid: string; bottom: string }> = {
  рассвет: { top: "#1e1b4b", mid: "#7c3aed", bottom: "#fbbf24" },
  день: { top: "#0ea5e9", mid: "#7dd3fc", bottom: "#e0f2fe" },
  закат: { top: "#7c2d12", mid: "#ea580c", bottom: "#fde68a" },
  ночь: { top: "#0f172a", mid: "#1e3a5f", bottom: "#334155" },
};

export function SceneImage({ mood, timeOfDay, sceneText }: { mood: string; timeOfDay: string; sceneText: string }) {
  const moodColors = MOOD_COLORS[mood] ?? MOOD_COLORS.спокойствие;
  const timeGrad = TIME_GRADIENTS[timeOfDay] ?? TIME_GRADIENTS.день;
  const isNight = timeOfDay === "ночь" || timeOfDay === "рассвет";

  // Определяем элементы сцены по ключевым словам
  const hasForest = /лес|дерев|рощ|парк/.test(sceneText);
  const hasWater = /море|озер|река|вод|ручей|океан/.test(sceneText);
  const hasMountain = /гор|холм|скал|вершин/.test(sceneText);
  const hasPath = /дорог|троп|путь|мост/.test(sceneText);
  const hasBuilding = /дом|башн|храм|дворец|фонар/.test(sceneText);
  const hasBird = /птиц|орёл|ласточ|журавл/.test(sceneText);
  const hasFlower = /цвет|роз|тюльпан|ромаш|лепест/.test(sceneText);
  const hasRain = /дожд|капл|ливен/.test(sceneText);
  const hasSnow = /снег|метел|зим|снеж/.test(sceneText);

  return (
    <svg viewBox="0 0 400 280" className="w-full h-full" role="img" aria-label={`Сцена: ${sceneText}`}>
      <defs>
        <linearGradient id={`sky-${mood}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={timeGrad.top} />
          <stop offset="50%" stopColor={timeGrad.mid} />
          <stop offset="100%" stopColor={timeGrad.bottom} />
        </linearGradient>
        <radialGradient id={`sun-${mood}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={moodColors.accent} stopOpacity="1" />
          <stop offset="60%" stopColor={moodColors.accent} stopOpacity="0.4" />
          <stop offset="100%" stopColor={moodColors.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Небо */}
      <rect width="400" height="200" fill={`url(#sky-${mood})`} />

      {/* Звёзды для ночи */}
      {isNight && Array.from({ length: 15 }).map((_, i) => {
        const x = (i * 37) % 380 + 10;
        const y = (i * 23) % 120 + 10;
        return <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill="#fef3c7" opacity={0.6 + (i % 3) * 0.15} />;
      })}

      {/* Солнце/Луна */}
      <circle cx={300} cy={70} r={35} fill={`url(#sun-${mood})`} />
      <circle cx={300} cy={70} r={18} fill={isNight ? "#f5f5f4" : moodColors.accent} opacity={0.9} />
      {isNight && <circle cx={295} cy={65} r={4} fill="#d6d3d1" opacity="0.5" />}

      {/* Горы */}
      {hasMountain && (
        <>
          <path d="M0 200 L80 120 L140 160 L220 100 L300 150 L400 130 L400 200 Z" fill={timeGrad.top} opacity="0.6" />
          <path d="M0 200 L60 150 L120 170 L200 130 L280 160 L400 140 L400 200 Z" fill={timeGrad.top} opacity="0.4" />
        </>
      )}

      {/* Вода */}
      {hasWater && (
        <>
          <path d="M0 200 L400 200 L400 250 Q300 245 200 250 Q100 255 0 250 Z" fill={moodColors.sky} opacity="0.5" />
          <path d="M50 215 Q100 212 150 215 T250 215 T350 215" fill="none" stroke={moodColors.particle} strokeWidth="1" opacity="0.4" />
          <path d="M30 230 Q80 227 130 230 T230 230 T330 230" fill="none" stroke={moodColors.particle} strokeWidth="0.8" opacity="0.3" />
        </>
      )}

      {/* Лес / деревья */}
      {hasForest && (
        <>
          {[50, 100, 150, 250, 320, 370].map((x, i) => {
            const h = 40 + (i % 3) * 20;
            const w = 25 + (i % 2) * 10;
            return (
              <g key={i}>
                <rect x={x - 2} y={200 - h + 20} width="4" height={h - 20} fill="#525252" opacity="0.5" />
                <path d={`M ${x} ${200 - h} L ${x - w} ${200 - h + 25} L ${x + w} ${200 - h + 25} Z`} fill={moodColors.ground} opacity={0.6 + (i % 2) * 0.2} />
                <path d={`M ${x} ${200 - h - 5} L ${x - w + 5} ${200 - h + 15} L ${x + w - 5} ${200 - h + 15} Z`} fill={moodColors.ground} opacity={0.7} />
              </g>
            );
          })}
        </>
      )}

      {/* Дорога / тропа */}
      {hasPath && (
        <path d="M200 200 Q180 230 150 260 Q120 275 100 280" fill="none" stroke={moodColors.particle} strokeWidth="8" opacity="0.3" strokeLinecap="round" />
      )}

      {/* Дом / здание */}
      {hasBuilding && (
        <g>
          <rect x={150} y={150} width={50} height={50} fill={timeGrad.top} opacity="0.7" />
          <path d="M145 155 L175 130 L205 155 Z" fill={moodColors.accent} opacity="0.6" />
          <rect x={165} y={170} width={12} height={15} fill={moodColors.accent} opacity="0.8" />
          <rect x={160} y={180} width={8} height={20} fill={moodColors.accent} opacity="0.5" />
        </g>
      )}

      {/* Птицы */}
      {hasBird && [
        { x: 100, y: 50, s: 1 },
        { x: 140, y: 40, s: 0.8 },
        { x: 180, y: 55, s: 0.9 },
      ].map((b, i) => (
        <path key={i} d={`M ${b.x} ${b.y} Q ${b.x + 8 * b.s} ${b.y - 5 * b.s} ${b.x + 16 * b.s} ${b.y} Q ${b.x + 24 * b.s} ${b.y - 5 * b.s} ${b.x + 32 * b.s} ${b.y}`}
          fill="none" stroke="#1c1917" strokeWidth="1.5" opacity="0.5" />
      ))}

      {/* Цветы */}
      {hasFlower && [60, 280, 340].map((x, i) => (
        <g key={i} transform={`translate(${x}, 250)`}>
          <line x1="0" y1="0" x2="0" y2="-20" stroke={moodColors.ground} strokeWidth="1.5" opacity="0.6" />
          <circle cx="0" cy="-22" r="5" fill={moodColors.accent} opacity="0.8" />
          <circle cx="0" cy="-22" r="2" fill="#fef3c7" />
        </g>
      ))}

      {/* Дождь */}
      {hasRain && Array.from({ length: 20 }).map((_, i) => {
        const x = (i * 23) % 400;
        const y = (i * 17) % 180;
        return <line key={i} x1={x} y1={y} x2={x - 3} y2={y + 12} stroke={moodColors.particle} strokeWidth="1" opacity="0.4" />;
      })}

      {/* Снег */}
      {hasSnow && Array.from({ length: 25 }).map((_, i) => {
        const x = (i * 19) % 400;
        const y = (i * 13) % 180;
        return <circle key={i} cx={x} cy={y} r="2" fill="#ffffff" opacity="0.6" />;
      })}

      {/* Земля */}
      {!hasWater && (
        <path d="M0 200 L400 200 L400 280 L0 280 Z" fill={moodColors.ground} opacity="0.3" />
      )}

      {/* Частицы настроения — плавающие огоньки/пыльца */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i * 47) % 380 + 10;
        const y = (i * 31) % 150 + 30;
        return (
          <motion.circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 3 : 2}
            fill={moodColors.particle}
            opacity="0.5"
            animate={{ cy: [y, y - 15, y], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
          />
        );
      })}

      {/* Лёгкий туман снизу */}
      <rect y="180" width="400" height="100" fill={moodColors.particle} opacity="0.1" />
      <ellipse cx="200" cy="220" rx="200" ry="30" fill={moodColors.particle} opacity="0.08" />
    </svg>
  );
}
