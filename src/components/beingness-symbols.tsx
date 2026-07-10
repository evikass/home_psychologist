/**
 * Оригинальные SVG-символы стихий для бытийностей.
 * Каждый символ — уникальная мини-мандала, не эмодзи.
 *
 * Символы рисуются в квадрате viewBox="0 0 24 24",
 * центрируются и масштабируются под размер лепестка.
 */

type SymbolProps = {
  size?: number;
  className?: string;
};

/** 🔥 ОГОНЬ — для СИЛЬНАЯ */
export function FireSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Внешнее пламя */}
      <path
        d="M12 2 C 13 5, 16 7, 16 11 C 16 13, 15 14, 14 14 C 14 12, 13 11, 12 10 C 12 12, 10 13, 10 15 C 10 17, 11 18, 12 18 C 13 18, 14 17, 14 16 C 15 17, 15 19, 14 20 C 13 21, 11 21, 10 20 C 8 18, 7 15, 8 12 C 9 9, 11 7, 12 2 Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Внутреннее пламя */}
      <path
        d="M12 8 C 12.5 9, 13 10, 13 11 C 13 12, 12.5 13, 12 13 C 11.5 13, 11 12, 11 11 C 11 10, 11.5 9, 12 8 Z"
        fill="white"
        opacity="0.7"
      />
      {/* Искра */}
      <circle cx="12" cy="15" r="1" fill="white" opacity="0.9" />
    </svg>
  );
}

/** 💧 ВОДА — для УДОВНАЯ */
export function WaterSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Капля */}
      <path
        d="M12 2 C 8 8, 5 12, 5 16 C 5 19, 8 22, 12 22 C 16 22, 19 19, 19 16 C 19 12, 16 8, 12 2 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Блик */}
      <path
        d="M10 12 C 9 14, 9 16, 10 17 C 11 16, 11 14, 10 12 Z"
        fill="white"
        opacity="0.6"
      />
      {/* Волны внутри */}
      <path
        d="M8 17 Q 10 16, 12 17 T 16 17"
        stroke="white"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

/** ⚖️ ЗЕМЛЯ/ВЕСЫ — для КОНТРОЛЁР */
export function EarthSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Гора */}
      <path
        d="M2 20 L 8 8 L 12 14 L 16 6 L 22 20 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Снежная вершина */}
      <path
        d="M14 10 L 16 6 L 18 10 C 17 9.5, 16 9.5, 15 10 C 14.5 9.8, 14 9.8, 14 10 Z"
        fill="white"
        opacity="0.7"
      />
      {/* Вторая вершина */}
      <path
        d="M6 14 L 8 8 L 10 14 C 9 13.5, 8 13.5, 7 14 C 6.5 13.8, 6 13.8, 6 14 Z"
        fill="white"
        opacity="0.6"
      />
      {/* Линия земли */}
      <line x1="1" y1="20" x2="23" y2="20" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/** ⚙️ МЕТАЛЛ/ШЕСТЕРНЯ — для ПРОМЕЖУТОЧНАЯ */
export function MetalSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Шестерёнка */}
      <path
        d="M12 2 L 13 4 L 15 3.5 L 15.5 5.5 L 17.5 6 L 17 8 L 19 9 L 18 11 L 20 12 L 18 13 L 19 15 L 17 16 L 17.5 18 L 15.5 18.5 L 15 20.5 L 13 20 L 12 22 L 11 20 L 9 20.5 L 8.5 18.5 L 6.5 18 L 7 16 L 5 15 L 6 13 L 4 12 L 6 11 L 5 9 L 7 8 L 6.5 6 L 8.5 5.5 L 9 3.5 L 11 4 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Внутренний круг */}
      <circle cx="12" cy="12" r="3.5" fill="white" opacity="0.4" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6" />
      <circle cx="12" cy="12" r="0.8" fill="white" opacity="0.8" />
    </svg>
  );
}

/** 🌀 ВОЗДУХ/СПИРАЛЬ — для РЕГУЛЯТОР */
export function AirSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Спираль */}
      <path
        d="M12 12 m 0 0 a 1 1 0 0 1 2 0 a 2 2 0 0 1 -4 0 a 3 3 0 0 1 6 0 a 4 4 0 0 1 -8 0 a 5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Точка в центре */}
      <circle cx="12" cy="12" r="1.2" fill="currentColor" opacity="0.9" />
      {/* Воздушные линии */}
      <path
        d="M5 6 Q 8 5, 11 6"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
      <path
        d="M13 18 Q 16 17, 19 18"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 💗 СВЕТ/СЕРДЦЕ — для ЛЮБЯЩАЯ */
export function LightSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Сердце */}
      <path
        d="M12 21 C 12 21, 3 14, 3 8 C 3 5, 5 3, 8 3 C 10 3, 11 4, 12 6 C 13 4, 14 3, 16 3 C 19 3, 21 5, 21 8 C 21 14, 12 21, 12 21 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Блик */}
      <path
        d="M8 6 C 7 7, 7 8, 8 9 C 9 8, 9 7, 8 6 Z"
        fill="white"
        opacity="0.6"
      />
      {/* Лучи света */}
      <circle cx="12" cy="11" r="1.5" fill="white" opacity="0.5" />
    </svg>
  );
}

/** ✨ ЭФИР/ЗВЕЗДА — для ТВОРЯЩАЯ */
export function AetherSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* 8-конечная звезда */}
      <path
        d="M12 2 L 14 9 L 22 9 L 15.5 13 L 18 21 L 12 16.5 L 6 21 L 8.5 13 L 2 9 L 10 9 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Внутренняя звезда */}
      <path
        d="M12 6 L 13 10 L 17 10 L 14 12 L 15 16 L 12 13.5 L 9 16 L 10 12 L 7 10 L 11 10 Z"
        fill="white"
        opacity="0.5"
      />
      {/* Центральная точка */}
      <circle cx="12" cy="12" r="1" fill="white" opacity="0.9" />
    </svg>
  );
}

/** 💎 КРИСТАЛЛ — для ВОЛЯЩАЯ */
export function CrystalSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Кристалл (ромб) */}
      <path
        d="M12 2 L 20 10 L 12 22 L 4 10 Z"
        fill="currentColor"
        opacity="0.85"
      />
      {/* Грани */}
      <path
        d="M12 2 L 16 10 L 12 22 L 8 10 Z"
        fill="white"
        opacity="0.25"
      />
      <path
        d="M4 10 L 12 10 L 20 10"
        stroke="white"
        strokeWidth="0.6"
        opacity="0.5"
      />
      {/* Блик */}
      <path
        d="M10 5 L 12 8 L 11 10 L 9 7 Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
}

/** 👁 ПУСТОТА/ГЛАЗ — для НАБЛЮДАТЕЛЬ */
export function VoidSymbol({ size = 24, className }: SymbolProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Глаз — миндалевидная форма */}
      <path
        d="M2 12 Q 12 4, 22 12 Q 12 20, 2 12 Z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M2 12 Q 12 4, 22 12 Q 12 20, 2 12 Z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        opacity="0.85"
      />
      {/* Радужка */}
      <circle cx="12" cy="12" r="3.5" fill="currentColor" opacity="0.7" />
      {/* Зрачок */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      {/* Блик */}
      <circle cx="10.5" cy="10.5" r="0.6" fill="white" opacity="0.9" />
    </svg>
  );
}

/** Карта: id бытийности → компонент символа */
export const BEINGNESS_SYMBOLS: Record<string, React.ComponentType<SymbolProps>> = {
  strong: FireSymbol,
  pleasure: WaterSymbol,
  controller: EarthSymbol,
  intermediate: MetalSymbol,
  regulator: AirSymbol,
  loving: LightSymbol,
  creating: AetherSymbol,
  willing: CrystalSymbol,
  witness: VoidSymbol,
};
