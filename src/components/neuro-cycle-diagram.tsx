"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { NEURO_CYCLE } from "@/lib/neurotransforming-data";

/**
 * SVG-схема цикла нейротрансформации — 5 этапов по кругу.
 *
 * Стрелки показывают направление: Диагностика → Доступ → Поиск → Перекодирование → Интеграция → (новый цикл).
 *
 * Клик по этапу — показывает детали справа.
 */
export function NeuroCycleDiagram() {
  const [selected, setSelected] = useState<string>("1");
  const selectedStage = NEURO_CYCLE.find((s) => s.id === selected);

  const SIZE = 360;
  const CENTER = SIZE / 2;
  const RADIUS = 130;
  const NODE_RADIUS = 32;

  // Позиции 5 этапов по кругу, начиная сверху
  const positions = NEURO_CYCLE.map((_, i) => {
    const angle = (360 / NEURO_CYCLE.length) * i - 90; // -90 = верх
    const rad = (angle * Math.PI) / 180;
    return {
      x: CENTER + RADIUS * Math.cos(rad),
      y: CENTER + RADIUS * Math.sin(rad),
    };
  });

  // Стрелки между этапами (по дуге)
  const arcPath = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    // Смещение к центру для изгиба
    const dx = midX - CENTER;
    const dy = midY - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const offset = 25;
    const ctrlX = midX - (dx / dist) * offset;
    const ctrlY = midY - (dy / dist) * offset;
    return `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-center">
      {/* Круговая схема */}
      <div className="w-full max-w-[400px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full h-auto"
          role="img"
          aria-label="Цикл нейротрансформации — 5 этапов"
        >
          {/* Внешний декоративный круг */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS + 20}
            fill="none"
            stroke="#ca8a04"
            strokeWidth="0.5"
            strokeDasharray="2 3"
            opacity="0.3"
          />

          {/* Стрелки между этапами */}
          {positions.map((pos, i) => {
            const next = positions[(i + 1) % positions.length];
            return (
              <path
                key={`arrow-${i}`}
                d={arcPath(pos, next)}
                fill="none"
                stroke="#ca8a04"
                strokeWidth="1.5"
                opacity="0.4"
                markerEnd="url(#arrow-neuro)"
              />
            );
          })}

          {/* Маркер стрелки */}
          <defs>
            <marker
              id="arrow-neuro"
              markerWidth="8"
              markerHeight="8"
              refX="4"
              refY="4"
              orient="auto"
            >
              <path d="M 0 0 L 8 4 L 0 8 z" fill="#ca8a04" opacity="0.6" />
            </marker>
          </defs>

          {/* Центральная надпись */}
          <text
            x={CENTER}
            y={CENTER - 5}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#7a5a40"
            opacity="0.6"
          >
            Цикл
          </text>
          <text
            x={CENTER}
            y={CENTER + 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#7a5a40"
            opacity="0.6"
          >
            нейротрансформации
          </text>

          {/* Этапы */}
          {NEURO_CYCLE.map((stage, i) => {
            const pos = positions[i];
            const isSelected = selected === stage.id;
            return (
              <g
                key={stage.id}
                onClick={() => setSelected(stage.id)}
                style={{ cursor: "pointer" }}
                tabIndex={0}
                role="button"
                aria-label={`Этап ${stage.id}: ${stage.name}`}
              >
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  fill={stage.color}
                  opacity={isSelected ? 1 : 0.6}
                  stroke={isSelected ? "white" : "transparent"}
                  strokeWidth={isSelected ? 3 : 0}
                  initial={false}
                  animate={{
                    r: isSelected ? NODE_RADIUS + 4 : NODE_RADIUS,
                    opacity: isSelected ? 1 : 0.6,
                  }}
                  transition={{ duration: 0.25 }}
                />

                {/* Номер этапа */}
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {stage.id}
                </text>

                {/* Короткое название */}
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="white"
                  opacity="0.9"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {stage.name.length > 12 ? stage.name.slice(0, 10) + "…" : stage.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Детали выбранного этапа */}
      <div className="w-full lg:flex-1">
        {selectedStage && (
          <motion.div
            key={selectedStage.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl border-2 p-4"
            style={{
              backgroundColor: `${selectedStage.color}11`,
              borderColor: selectedStage.color,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm"
                style={{ backgroundColor: selectedStage.color }}
              >
                {selectedStage.id}
              </div>
              <h4 className="font-display font-bold text-base" style={{ color: selectedStage.color }}>
                {selectedStage.name}
              </h4>
            </div>

            <p className="text-xs leading-relaxed mb-3" style={{ color: selectedStage.color }}>
              {selectedStage.description}
            </p>

            <div className="flex items-center gap-2 text-xs pt-2 border-t" style={{ borderColor: `${selectedStage.color}33` }}>
              <span className="font-semibold" style={{ color: selectedStage.color }}>
                ⏱ Длительность:
              </span>
              <span style={{ color: selectedStage.color }}>{selectedStage.duration}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
