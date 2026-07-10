"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { MIPS_LEVELS } from "@/lib/neurotransforming-data";

/**
 * SVG-схема MIPS — Мета-индивидуальная программная структура.
 * Пирамида из 8 уровней: от родовых (глубоко) до поведенческих (поверхность).
 *
 * Клик по уровню — показывает детали справа.
 */
export function MipsDiagram() {
  const [selected, setSelected] = useState<string>("5"); // импринты по умолчанию
  const selectedLevel = MIPS_LEVELS.find((l) => l.id === selected);

  const PYRAMID_WIDTH = 280;
  const LEVEL_HEIGHT = 38;
  const TOTAL_HEIGHT = LEVEL_HEIGHT * MIPS_LEVELS.length + 20;
  const CENTER_X = PYRAMID_WIDTH / 2;

  // Уровни идут снизу вверх — от родовых к поведенческим
  // 1 (родовые) — основание пирамиды, 8 (поведение) — вершина
  const levels = [...MIPS_LEVELS].reverse(); // теперь 8 (поведение) — первый, 1 (родовые) — последний

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Пирамида */}
      <div className="w-full lg:flex-1">
        <svg
          viewBox={`0 0 ${PYRAMID_WIDTH} ${TOTAL_HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="Пирамида программ MIPS — 8 уровней"
        >
          {/* Заголовок-подсказка */}
          <text
            x={CENTER_X}
            y={12}
            textAnchor="middle"
            fontSize="12"
            fill="#7a5a40"
            opacity="0.7"
          >
            ↑ поверхностные (легко изменить)
          </text>

          {levels.map((level, i) => {
            const y = 20 + i * LEVEL_HEIGHT;
            const widthRatio = 0.3 + (i / (levels.length - 1)) * 0.7;
            const width = PYRAMID_WIDTH * widthRatio;
            const x = CENTER_X - width / 2;
            const isSelected = selected === level.id;

            return (
              <g
                key={level.id}
                onClick={() => setSelected(level.id)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Уровень ${level.id}: ${level.name}`}
              >
                <motion.rect
                  x={x}
                  y={y}
                  width={width}
                  height={LEVEL_HEIGHT - 4}
                  rx={4}
                  fill={level.color}
                  opacity={isSelected ? 1 : 0.65}
                  stroke={isSelected ? "white" : "transparent"}
                  strokeWidth={isSelected ? 2 : 0}
                  initial={false}
                  animate={{
                    opacity: isSelected ? 1 : 0.65,
                  }}
                  transition={{ duration: 0.2 }}
                />

                {/* Номер уровня */}
                <text
                  x={x + 12}
                  y={y + LEVEL_HEIGHT / 2 + 1}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {level.id}
                </text>

                {/* Название уровня */}
                <text
                  x={CENTER_X}
                  y={y + LEVEL_HEIGHT / 2 + 1}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isSelected ? 700 : 500}
                  fill="white"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {level.shortName}
                </text>
              </g>
            );
          })}

          {/* Подпись снизу */}
          <text
            x={CENTER_X}
            y={TOTAL_HEIGHT - 2}
            textAnchor="middle"
            fontSize="12"
            fill="#7a5a40"
            opacity="0.7"
          >
            ↓ глубинные (корень программ)
          </text>
        </svg>
      </div>

      {/* Детали выбранного уровня */}
      <div className="w-full lg:flex-1">
        {selectedLevel && (
          <motion.div
            key={selectedLevel.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border-2 p-4 shadow-sm"
            style={{
              backgroundColor: `${selectedLevel.color}11`,
              borderColor: selectedLevel.color,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm"
                style={{ backgroundColor: selectedLevel.color }}
              >
                {selectedLevel.id}
              </div>
              <h4 className="font-display font-bold text-base" style={{ color: selectedLevel.color }}>
                {selectedLevel.name}
              </h4>
            </div>

            <p className="text-xs leading-relaxed mb-3" style={{ color: selectedLevel.color }}>
              {selectedLevel.description}
            </p>

            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide font-semibold mb-1.5" style={{ color: selectedLevel.color, opacity: 0.7 }}>
                Примеры программ:
              </div>
              <ul className="space-y-1">
                {selectedLevel.examples.map((ex, i) => (
                  <li key={i} className="text-xs italic" style={{ color: selectedLevel.color }}>
                    «{ex}»
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t" style={{ borderColor: `${selectedLevel.color}33` }}>
              <div className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: selectedLevel.color, opacity: 0.7 }}>
                Что меняется:
              </div>
              <p className="text-xs" style={{ color: selectedLevel.color }}>
                {selectedLevel.whatChanges}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
