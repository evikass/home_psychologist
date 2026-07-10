"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BEINGNESSES, type Beingness } from "@/lib/masterkit-data";

/**
 * Геометрия Сознания — интерактивная SVG-схема.
 *
 * Структура:
 *   - Центральное «Я» (чёрный круг с буквой)
 *   - 5 цветных радиальных сегментов (бытийностей)
 *   - При active beingness — свечение + увеличение + панели
 *
 * Адаптивна: на мобильных рисует компактнее, на десктопе — крупнее.
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

  // Сегменты-бытийности (без центра «Я»)
  const segments = BEINGNESSES.filter((b) => b.id !== "self");

  // Параметры круга
  const SIZE = 360;
  const CENTER = SIZE / 2;
  const INNER_R = 56;  // радиус центрального «Я»
  const OUTER_R = 150; // внешний радиус
  const LABEL_R = 178; // где ставить текст-метку

  // Преобразование угла (0 = верх, по часовой) в x,y
  const polar = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  // SVG path для сегмента (pie slice с радиальным градиентом)
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

  // Активный/выделенный сегмент
  const activeId = activeBeingnessId ?? selectedId;
  const hovered = hoveredId ?? activeId;
  const hoveredData = BEINGNESSES.find((b) => b.id === hovered);

  const handleClick = (id: string) => {
    setSelectedId(id);
    onSelect?.(id);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-[400px] mx-auto">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-auto"
          role="img"
          aria-label="Геометрия сознания — карта 5 бытийностей"
        >
          <defs>
            {/* Радиальные градиенты для каждого сегмента */}
            {segments.map((b) => (
              <radialGradient
                key={b.id}
                id={`grad-${b.id}`}
                cx="50%"
                cy="50%"
                r="75%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={b.color.base} stopOpacity="0.95" />
                <stop offset="70%" stopColor={b.color.base} stopOpacity="0.7" />
                <stop offset="100%" stopColor={b.color.light} stopOpacity="0.4" />
              </radialGradient>
            ))}

            {/* Свечение для активного сегмента */}
            {segments.map((b) => (
              <radialGradient
                key={`glow-${b.id}`}
                id={`glow-${b.id}`}
                cx="50%"
                cy="50%"
                r="50%"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor={b.color.glow} stopOpacity="0.5" />
                <stop offset="100%" stopColor={b.color.glow} stopOpacity="0" />
              </radialGradient>
            ))}

            {/* Фильтр свечения */}
            <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          {/* Внешний круг-обрамление */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={OUTER_R + 8}
            fill="none"
            stroke="oklch(0.85 0.03 50)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.5"
          />

          {/* Сегменты-бытийности */}
          {segments.map((b, i) => {
            // Каждый сегмент — 72° (360/5), со смещением для равномерности
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
                    scale: isActive ? 1.04 : 1,
                    opacity: activeId && !isActive ? 0.55 : 1,
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
                  fontSize="20"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {b.symbol}
                </text>

                {/* Название сегмента (внешняя метка) */}
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

          {/* Внутренний круг-разделитель */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R}
            fill="none"
            stroke="oklch(0.9 0.02 50)"
            strokeWidth="2"
          />

          {/* Центральное «Я» */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R - 4}
            fill={BEINGNESSES[0].color.base}
            animate={{
              scale: activeId === "self" ? 1.08 : 1,
            }}
            transition={{ duration: 0.4 }}
            style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
          />

          {/* Дыхательная аура вокруг «Я» */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_R - 4}
            fill="none"
            stroke={BEINGNESSES[0].color.glow}
            strokeWidth="2"
            animate={{
              r: [INNER_R - 4, INNER_R + 4, INNER_R - 4],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Буква «Я» в центре */}
          <text
            x={CENTER}
            y={CENTER}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="36"
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

        {/* Подсказка под схемой */}
        <div className="text-center mt-1 text-[10px] text-muted-foreground">
          Нажмите на сегмент, чтобы узнать больше
        </div>
      </div>

      {/* Детализирующая панель — меняется при наведении/выборе */}
      {hoveredData && hoveredData.id !== "self" && (
        <motion.div
          key={hoveredData.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full rounded-xl border-2 p-4 shadow-sm"
          style={{
            backgroundColor: hoveredData.color.panel,
            borderColor: hoveredData.color.border,
            color: hoveredData.color.text,
          }}
        >
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
        </motion.div>
      )}

      {/* Если активный сегмент — отдельный бейдж «сейчас вы здесь» */}
      {activeId && activeId !== "self" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-xs"
        >
          <span
            className="inline-block px-3 py-1 rounded-full font-medium"
            style={{
              backgroundColor: (BEINGNESSES.find((b) => b.id === activeId) as Beingness)?.color
                .border,
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
