"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BRAINWAVE_STATES } from "@/lib/neurotransforming-data";

/**
 * SVG-схема уровней сознания — 4 ритма мозга (бета, альфа, тета, дельта).
 * Горизонтальная шкала частот с интерактивными зонами.
 *
 * Клик по зоне — показывает детали снизу.
 */
export function BrainwaveDiagram() {
  const [selected, setSelected] = useState<string>("alpha");
  const selectedState = BRAINWAVE_STATES.find((s) => s.id === selected);

  const WIDTH = 600;
  const HEIGHT = 180;
  const PADDING = 40;
  const TRACK_Y = 80;
  const TRACK_HEIGHT = 50;

  // Расчёт позиции каждого ритма на шкале (логарифмическая шкала от 0.5 до 30 Гц)
  const logScale = (freq: number) => {
    const minLog = Math.log10(0.5);
    const maxLog = Math.log10(30);
    const ratio = (Math.log10(freq) - minLog) / (maxLog - minLog);
    return PADDING + ratio * (WIDTH - 2 * PADDING);
  };

  return (
    <div className="space-y-4">
      <div>
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="Уровни сознания — 4 ритма мозга"
        >
          {/* Фоновая шкала */}
          <line
            x1={PADDING}
            y1={TRACK_Y + TRACK_HEIGHT / 2}
            x2={WIDTH - PADDING}
            y2={TRACK_Y + TRACK_HEIGHT / 2}
            stroke="#e5e0d8"
            strokeWidth="1"
          />

          {/* Волновая линия фона */}
          <path
            d={`M ${PADDING} ${TRACK_Y + TRACK_HEIGHT / 2} 
                ${Array.from({ length: 50 })
                  .map((_, i) => {
                    const x = PADDING + (i / 50) * (WIDTH - 2 * PADDING);
                    const y = TRACK_Y + TRACK_HEIGHT / 2 + Math.sin(i * 0.5) * 15 * (1 - i / 50);
                    return `L ${x} ${y}`;
                  })
                  .join(" ")}`}
            fill="none"
            stroke="#d4c8b8"
            strokeWidth="1"
            opacity="0.4"
          />

          {/* Зоны ритмов */}
          {BRAINWAVE_STATES.map((state) => {
            const x1 = logScale(state.range[0]);
            const x2 = logScale(state.range[1]);
            const width = x2 - x1;
            const isSelected = selected === state.id;

            return (
              <g
                key={state.id}
                onClick={() => setSelected(state.id)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Ритм: ${state.name}`}
              >
                <motion.rect
                  x={x1}
                  y={TRACK_Y}
                  width={width}
                  height={TRACK_HEIGHT}
                  rx={6}
                  fill={state.color}
                  opacity={isSelected ? 0.95 : 0.5}
                  stroke={isSelected ? "white" : "transparent"}
                  strokeWidth={isSelected ? 2 : 0}
                  initial={false}
                  animate={{ opacity: isSelected ? 0.95 : 0.5 }}
                  transition={{ duration: 0.2 }}
                />

                {/* Название ритма */}
                <text
                  x={(x1 + x2) / 2}
                  y={TRACK_Y + 18}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {state.name.split("-")[0]}
                </text>

                {/* Частота */}
                <text
                  x={(x1 + x2) / 2}
                  y={TRACK_Y + 35}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  opacity="0.85"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {state.frequency}
                </text>

                {/* Подпись снизу */}
                <text
                  x={(x1 + x2) / 2}
                  y={TRACK_Y + TRACK_HEIGHT + 15}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#7a5a40"
                  opacity={isSelected ? 1 : 0.5}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {state.when.split(",")[0]}
                </text>
              </g>
            );
          })}

          {/* Стрелки-подсказки */}
          <text
            x={PADDING}
            y={20}
            textAnchor="start"
            fontSize="9"
            fill="#7a5a40"
            opacity="0.7"
          >
            ← глубокий транс
          </text>
          <text
            x={WIDTH - PADDING}
            y={20}
            textAnchor="end"
            fontSize="9"
            fill="#7a5a40"
            opacity="0.7"
          >
            активное бодрствование →
          </text>

          {/* Частота по краям */}
          <text x={PADDING} y={HEIGHT - 5} textAnchor="start" fontSize="9" fill="#7a5a40" opacity="0.5">
            0.5 Гц
          </text>
          <text x={WIDTH - PADDING} y={HEIGHT - 5} textAnchor="end" fontSize="9" fill="#7a5a40" opacity="0.5">
            30 Гц
          </text>
        </svg>
      </div>

      {/* Детали выбранного ритма */}
      {selectedState && (
        <motion.div
          key={selectedState.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-xl border-2 p-4"
          style={{
            backgroundColor: `${selectedState.color}11`,
            borderColor: selectedState.color,
          }}
        >
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-display font-bold text-base" style={{ color: selectedState.color }}>
              {selectedState.name}
            </h4>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ backgroundColor: selectedState.color, color: "white" }}
            >
              {selectedState.frequency}
            </span>
          </div>

          <p className="text-sm leading-relaxed mb-3" style={{ color: selectedState.color }}>
            {selectedState.description}
          </p>

          <div className="mb-3">
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: selectedState.color, opacity: 0.7 }}>
              Когда возникает:
            </div>
            <p className="text-xs" style={{ color: selectedState.color }}>
              {selectedState.when}
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide font-semibold mb-1.5" style={{ color: selectedState.color, opacity: 0.7 }}>
              Практики в этом состоянии:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedState.practices.map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedState.color,
                    color: "white",
                    opacity: 0.85,
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
