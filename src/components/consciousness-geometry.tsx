"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  BEINGNESSES,
  getTransitionsFrom,
  type Beingness,
} from "@/lib/masterkit-data";

/**
 * Геометрия Сознания — интерактивная SVG-схема в таро-стиле.
 *
 * Структура:
 *   - Центральное «Я» (чёрный круг с буквой, орнаментальная рамка)
 *   - 9 цветных радиальных сегментов (бытийностей)
 *   - Стрелки переходов от активной бытийности (куда двигаться)
 *   - Внешний декоративный круг с рунами/стихиями
 *   - При hover/click — панель детализации
 */
export function ConsciousnessGeometry({
  activeBeingnessId,
  onSelect,
}: {
  activeBeingnessId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    activeBeingnessId ?? null
  );

  const segments = BEINGNESSES.filter(
    (b) => b.id !== "self" && b.id !== "witness"
  );
  // НАБЛЮДАТЕЛЬ — на внешнем орбитальном круге, не сегмент

  // Параметры
  const SIZE = 440;
  const CENTER = SIZE / 2;
  const INNER_R = 56;
  const OUTER_R = 165;
  const LABEL_R = 192;
  const ORBIT_R = 210; // круг для НАБЛЮДАТЕЛЯ

  const polar = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  const segmentPath = (angleStart: number, angleEnd: number) => {
    const a1 = polar(angleStart, INNER_R);
    const a2 = polar(angleStart, OUTER_R);
    const b1 = polar(angleEnd, OUTER_R);
    const b2 = polar(angleEnd, INNER_R);
    const largeArc = angleEnd - angleStart > 180 ? 1 : 0;
    return [
      `M ${a1.x} ${a1.y}`,
      `L ${a2.x} ${a2.y}`,
      `A ${OUTER_R} ${OUTER_R} 0 ${largeArc} 1 ${b1.x} ${b1.y}`,
      `L ${b2.x} ${b2.y}`,
      `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${a1.x} ${a1.y}`,
      "Z",
    ].join(" ");
  };

  // Путь для стрелки между двумя точками через центр
  const arrowPath = (fromAngle: number, toAngle: number) => {
    const start = polar(fromAngle, OUTER_R - 8);
    const end = polar(toAngle, OUTER_R - 8);
    // Изогнутая стрелка, проходящая чуть снаружи
    const midAngle = (fromAngle + toAngle) / 2;
    const control = polar(midAngle, OUTER_R + 28);
    return `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`;
  };

  const activeId = activeBeingnessId ?? selectedId;
  const hovered = hoveredId ?? activeId;
  const hoveredData = BEINGNESSES.find((b) => b.id === hovered);

  // Переходы из активной бытийности
  const transitions = activeId && activeId !== "self" && activeId !== "witness"
    ? getTransitionsFrom(activeId)
    : [];

  const handleClick = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  // Найти угол сегмента по id
  const getAngle = (id: string) =>
    BEINGNESSES.find((b) => b.id === id)?.angle ?? 0;

  // Таро-руны по кругу (стихийные символы)
  const RUNES = ["☽", "✦", "❋", "✺", "◈", "✷", "✤", "◉", "❂", "✵", "✸", "✧"];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-[460px] mx-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-auto"
          role="img"
          aria-label="Геометрия сознания — карта 9 бытийностей"
        >
          <defs>
            {/* Радиальные градиенты для сегментов */}
            {BEINGNESSES.map((b) => (
              <radialGradient
                key={b.id}
                id={`grad-${b.id}`}
                cx="50%"
                cy="50%"
                r="75%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={b.color.base} stopOpacity="0.95" />
                <stop offset="70%" stopColor={b.color.base} stopOpacity="0.65" />
                <stop offset="100%" stopColor={b.color.light} stopOpacity="0.35" />
              </radialGradient>
            ))}

            {/* Свечение */}
            {BEINGNESSES.map((b) => (
              <radialGradient
                key={`glow-${b.id}`}
                id={`glow-${b.id}`}
                cx="50%"
                cy="50%"
                r="50%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={b.color.glow} stopOpacity="0.55" />
                <stop offset="100%" stopColor={b.color.glow} stopOpacity="0" />
              </radialGradient>
            ))}

            {/* Золотой градиент для орнаментов */}
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#eab308" />
              <stop offset="50%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>

            {/* Фильтр свечения */}
            <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>

            {/* Узор для рамки — повторяющиеся руны */}
            <pattern
              id="rune-pattern"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <text
                x="10"
                y="14"
                textAnchor="middle"
                fontSize="8"
                fill="#ca8a04"
                opacity="0.4"
              >
                ✦
              </text>
            </pattern>
          </defs>

          {/* Внешний декоративный круг с рунами (таро-стиль) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R + 14}
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R + 8}
            fill="none"
            stroke="#ca8a04"
            strokeWidth="0.5"
            strokeDasharray="1 3"
            opacity="0.5"
          />

          {/* Руны по кругу */}
          {RUNES.map((rune, i) => {
            const a = (360 / RUNES.length) * i;
            const pos = polar(a, ORBIT_R + 14);
            return (
              <text
                key={i}
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fontSize="11"
                fill="#a16207"
                opacity="0.55"
                style={{ userSelect: "none" }}
              >
                {rune}
              </text>
            );
          })}

          {/* Внутренний орбитальный круг для НАБЛЮДАТЕЛЯ */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={ORBIT_R}
            fill="none"
            stroke="#a3a3a3"
            strokeWidth="0.8"
            strokeDasharray="2 4"
            opacity="0.4"
          />

          {/* НАБЛЮДАТЕЛЬ — орбитальная позиция (сверху) */}
          {(() => {
            const w = BEINGNESSES.find((b) => b.id === "witness");
            if (!w) return null;
            const pos = polar(0, ORBIT_R);
            const isActive = activeId === "witness";
            return (
              <g
                onClick={() => handleClick("witness")}
                onMouseEnter={() => setHoveredId("witness")}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label="Бытийность НАБЛЮДАТЕЛЬ"
              >
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={14}
                  fill={w.color.base}
                  stroke={isActive ? w.color.glow : "white"}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  animate={{
                    scale: isActive ? 1.2 : 1,
                  }}
                  style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fontSize="14"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {w.symbol}
                </text>
                <text
                  x={pos.x}
                  y={pos.y - 22}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? w.color.base : "#525252"}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {w.name}
                </text>
              </g>
            );
          })()}

          {/* Сегменты-бытийности */}
          {segments.map((b) => {
            const segmentAngle = 360 / segments.length;
            const startAngle = b.angle - segmentAngle / 2;
            const endAngle = b.angle + segmentAngle / 2;
            const isActive = activeId === b.id;
            const isHovered = hoveredId === b.id;
            const labelPos = polar(b.angle, LABEL_R);

            return (
              <g
                key={b.id}
                onClick={() => handleClick(b.id)}
                onMouseEnter={() => setHoveredId(b.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Бытийность ${b.name}`}
              >
                {/* Свечение при активном/hover */}
                {(isActive || isHovered) && (
                  <motion.path
                    d={segmentPath(startAngle - 4, endAngle + 4)}
                    fill={`url(#glow-${b.id})`}
                    filter="url(#blur-glow)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}

                {/* Сам сегмент */}
                <motion.path
                  d={segmentPath(startAngle, endAngle)}
                  fill={`url(#grad-${b.id})`}
                  stroke={isActive ? b.color.base : "white"}
                  strokeWidth={isActive ? 2.5 : 1}
                  initial={false}
                  animate={{
                    scale: isActive ? 1.05 : 1,
                    opacity: activeId && !isActive ? 0.5 : 1,
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    transformOrigin: `${CENTER}px ${CENTER}px`,
                  }}
                />

                {/* Иконка сегмента (стихия) */}
                <text
                  x={polar(b.angle, (INNER_R + OUTER_R) / 2 + 8).x}
                  y={polar(b.angle, (INNER_R + OUTER_R) / 2 + 8).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="22"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {b.symbol}
                </text>

                {/* Название сегмента */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={isActive ? "11" : "9"}
                  fontWeight={isActive ? 700 : 500}
                  fill={isActive ? b.color.base : "oklch(0.4 0.02 30)"}
                  style={{
                    pointerEvents: "none",
                    userSelect: "none",
                    transition: "all 0.2s",
                  }}
                >
                  {b.name}
                </text>
              </g>
            );
          })}

          {/* Стрелки переходов от активной бытийности */}
          {activeId &&
            activeId !== "self" &&
            activeId !== "witness" &&
            transitions.map((t, i) => {
              if (t.to === "self") return null; // стрелку в центр не рисуем
              const fromAngle = getAngle(t.from);
              const toAngle = getAngle(t.to);
              const path = arrowPath(fromAngle, toAngle);
              const midAngle = (fromAngle + toAngle) / 2;
              const labelPos = polar(midAngle, OUTER_R + 42);
              const toData = BEINGNESSES.find((b) => b.id === t.to);

              return (
                <motion.g
                  key={`trans-${i}`}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={toData?.color.glow ?? "#ca8a04"}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    opacity="0.7"
                    markerEnd="url(#arrowhead)"
                  />
                  {/* Маленькая метка «→» у конца стрелки */}
                  <circle
                    cx={polar(toAngle, OUTER_R - 8).x}
                    cy={polar(toAngle, OUTER_R - 8).y}
                    r="3"
                    fill={toData?.color.glow ?? "#ca8a04"}
                  />
                </motion.g>
              );
            })}

          {/* Маркер стрелки */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#ca8a04" />
            </marker>
          </defs>

          {/* Внутренний круг-разделитель с золотой рамкой (таро-стиль) */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R + 4}
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R}
            fill="none"
            stroke="#ca8a04"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            opacity="0.6"
          />

          {/* === Центральное «Я» с симметричными переливающимися узорами === */}
          <defs>
            {/* Переливающийся радиальный градиент для центра */}
            <radialGradient id="self-gradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2a1a3a">
                <animate
                  attributeName="stop-color"
                  values="#2a1a3a;#4a2a5a;#2a1a3a"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#1a1a2a">
                <animate
                  attributeName="stop-color"
                  values="#1a1a2a;#2a2a4a;#1a1a2a"
                  dur="6s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#0a0a1a" />
            </radialGradient>

            {/* Золотой градиент для узоров */}
            <linearGradient id="gold-shimmer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde68a">
                <animate
                  attributeName="stop-color"
                  values="#fde68a;#ca8a04;#fde68a;#fbbf24;#fde68a"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="#ca8a04">
                <animate
                  attributeName="stop-color"
                  values="#ca8a04;#fbbf24;#ca8a04;#fde68a;#ca8a04"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor="#a16207">
                <animate
                  attributeName="stop-color"
                  values="#a16207;#ca8a04;#a16207;#78350f;#a16207"
                  dur="8s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            {/* Вращающийся узор-звезда */}
            <pattern
              id="mandala-pattern"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${CENTER} ${CENTER})`}
            >
              <path
                d="M 10 2 L 12 8 L 18 10 L 12 12 L 10 18 L 8 12 L 2 10 L 8 8 Z"
                fill="url(#gold-shimmer)"
                opacity="0.15"
              />
            </pattern>
          </defs>

          {/* Внешний переливающийся круг центра */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R - 4}
            fill="url(#self-gradient)"
            animate={{
              scale: activeId === "self" ? 1.08 : 1,
            }}
            transition={{ duration: 0.4 }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          {/* Вращающиеся симметричные узоры — 8-конечная звезда */}
          <motion.g
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (360 / 8) * i;
              const rad = ((angle - 90) * Math.PI) / 180;
              const r1 = INNER_R - 8;
              const r2 = INNER_R - 18;
              const r3 = INNER_R - 12;
              const x1 = CENTER + r1 * Math.cos(rad);
              const y1 = CENTER + r1 * Math.sin(rad);
              const x2 = CENTER + r2 * Math.cos(rad);
              const y2 = CENTER + r2 * Math.sin(rad);
              // Промежуточная точка для создания «лепестка»
              const midAngle = angle + 22.5;
              const midRad = ((midAngle - 90) * Math.PI) / 180;
              const mx = CENTER + r3 * Math.cos(midRad);
              const my = CENTER + r3 * Math.sin(midRad);
              return (
                <path
                  key={i}
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke="url(#gold-shimmer)"
                  strokeWidth="0.8"
                  opacity="0.5"
                />
              );
            })}
          </motion.g>

          {/* Внутренняя вращающаяся в обратную сторону звезда (8 лучей) */}
          <motion.g
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          >
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (360 / 8) * i + 22.5;
              const rad = ((angle - 90) * Math.PI) / 180;
              const r1 = INNER_R - 14;
              const r2 = INNER_R - 24;
              const x1 = CENTER + r1 * Math.cos(rad);
              const y1 = CENTER + r1 * Math.sin(rad);
              const x2 = CENTER + r2 * Math.cos(rad);
              const y2 = CENTER + r2 * Math.sin(rad);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#gold-shimmer)"
                  strokeWidth="0.5"
                  opacity="0.4"
                />
              );
            })}
          </motion.g>

          {/* Концентрические окружности — символ слоёв сознания */}
          {[INNER_R - 8, INNER_R - 14, INNER_R - 20].map((r, i) => (
            <circle
              key={i}
              cx={CENTER}
              cy={CENTER}
              r={r}
              fill="none"
              stroke="url(#gold-shimmer)"
              strokeWidth="0.4"
              opacity={0.35 - i * 0.08}
              strokeDasharray={i === 1 ? "1 2" : undefined}
            />
          ))}

          {/* 12 симметричных точек-звёзд по внутреннему кругу */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (360 / 12) * i;
            const pos = polar(a, INNER_R - 10);
            return (
              <motion.circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r="1.5"
                fill="url(#gold-shimmer)"
                animate={{
                  opacity: [0.3, 0.9, 0.3],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: (i * 0.25) % 3,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
              />
            );
          })}

          {/* 6-конечная звезда Давида (два треугольника) — сакральная геометрия */}
          <motion.g
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            opacity="0.25"
          >
            <polygon
              points={(() => {
                const r = INNER_R - 16;
                return Array.from({ length: 3 })
                  .map((_, i) => {
                    const a = (120 * i - 90) * (Math.PI / 180);
                    return `${CENTER + r * Math.cos(a)},${CENTER + r * Math.sin(a)}`;
                  })
                  .join(" ");
              })()}
              fill="none"
              stroke="url(#gold-shimmer)"
              strokeWidth="0.6"
            />
            <polygon
              points={(() => {
                const r = INNER_R - 16;
                return Array.from({ length: 3 })
                  .map((_, i) => {
                    const a = (120 * i + 90) * (Math.PI / 180);
                    return `${CENTER + r * Math.cos(a)},${CENTER + r * Math.sin(a)}`;
                  })
                  .join(" ");
              })()}
              fill="none"
              stroke="url(#gold-shimmer)"
              strokeWidth="0.6"
            />
          </motion.g>

          {/* Дыхательная аура вокруг «Я» */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R - 4}
            fill="none"
            stroke={BEINGNESSES[0].color.glow}
            strokeWidth="2"
            animate={{
              r: [INNER_R - 4, INNER_R + 6, INNER_R - 4],
              opacity: [0.6, 0.15, 0.6],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Орнаментальные точки вокруг «Я» — внешний ряд */}
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (360 / 24) * i;
            const pos = polar(a, INNER_R - 5);
            return (
              <circle
                key={i}
                cx={pos.x}
                cy={pos.y}
                r="0.8"
                fill="url(#gold-shimmer)"
                opacity="0.4"
              />
            );
          })}

          {/* Буква «Я» в центре */}
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="38"
            fontWeight="800"
            fill="white"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            Я
          </text>

          {/* Линии-связи от центра к каждому сегменту */}
          {segments.map((b) => {
            const inner = polar(b.angle, INNER_R);
            const outer = polar(b.angle, OUTER_R);
            return (
              <line
                key={`line-${b.id}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="white"
                strokeWidth="0.5"
                opacity="0.4"
                style={{ pointerEvents: "none" }}
              />
            );
          })}
        </svg>

        <div className="text-center mt-1 text-[10px] text-muted-foreground">
          Нажмите на сегмент — увидите детали и путь перехода
        </div>
      </div>

      {/* Детализирующая панель */}
      {hoveredData && hoveredData.id !== "self" && (
        <motion.div
          key={hoveredData.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full rounded-xl border-2 p-4 shadow-sm relative"
          style={{
            backgroundColor: hoveredData.color.panel,
            borderColor: hoveredData.color.border,
            color: hoveredData.color.text,
          }}
        >
          {/* Декоративная рамка таро-стиля */}
          <div
            className="absolute top-1 right-1 text-xs opacity-30"
            style={{ color: hoveredData.color.border }}
          >
            ✦ ❋ ✦
          </div>
          <div
            className="absolute bottom-1 left-1 text-xs opacity-30"
            style={{ color: hoveredData.color.border }}
          >
            ✦ ❋ ✦
          </div>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl">{hoveredData.symbol}</span>
            <div>
              <div
                className="font-display text-lg font-bold leading-none"
                style={{ color: hoveredData.color.border }}
              >
                {hoveredData.fullName}
              </div>
              <div
                className="text-xs italic"
                style={{ color: hoveredData.color.text, opacity: 0.75 }}
              >
                {hoveredData.subtitle} · стихия: {hoveredData.element}
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-2.5" style={{ color: hoveredData.color.text }}>
            {hoveredData.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <div
                className="font-semibold mb-1 uppercase tracking-wide"
                style={{ color: hoveredData.color.border }}
              >
                Ресурс
              </div>
              <p style={{ color: hoveredData.color.text, opacity: 0.85 }}>
                {hoveredData.resource}
              </p>
            </div>
            <div>
              <div
                className="font-semibold mb-1 uppercase tracking-wide"
                style={{ color: hoveredData.color.border }}
              >
                Ловушка
              </div>
              <p style={{ color: hoveredData.color.text, opacity: 0.85 }}>
                {hoveredData.trap}
              </p>
            </div>
          </div>

          {hoveredData.qualities.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {hoveredData.qualities.map((q, i) => (
                <span
                  key={i}
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: hoveredData.color.border,
                    color: "white",
                    opacity: 0.85,
                  }}
                >
                  {q}
                </span>
              ))}
            </div>
          )}

          {/* Блок переходов — куда двигаться из этой бытийности */}
          {getTransitionsFrom(hoveredData.id).length > 0 && (
            <div className="mt-3 pt-3 border-t" style={{ borderColor: `${hoveredData.color.border}33` }}>
              <div
                className="font-semibold mb-1.5 uppercase tracking-wide text-xs"
                style={{ color: hoveredData.color.border }}
              >
                Куда двигаться →
              </div>
              <ul className="space-y-1.5">
                {getTransitionsFrom(hoveredData.id).map((t, i) => {
                  const target = BEINGNESSES.find((b) => b.id === t.to);
                  return (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <span style={{ color: hoveredData.color.border }}>→</span>
                      <div>
                        <span className="font-medium" style={{ color: target?.color.border }}>
                          {target?.name}
                        </span>
                        <span style={{ opacity: 0.7 }}> — {t.condition}. </span>
                        <span style={{ opacity: 0.85 }}>{t.practice}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* Активный бейдж */}
      {activeId && activeId !== "self" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-xs"
        >
          <span
            className="inline-block px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor:
                (BEINGNESSES.find((b) => b.id === activeId) as Beingness)?.color.border,
              color: "white",
            }}
          >
            ● Сейчас вы здесь: {(BEINGNESSES.find((b) => b.id === activeId) as Beingness)?.name}
          </span>
        </motion.div>
      )}
    </div>
  );
}
