"use client";

import { useEffect, useState } from "react";

/**
 * Звёздное небо в тёмном режиме.
 * Отдельный fixed overlay div — надёжнее чем CSS body background.
 *
 * В индиго-тёмном: усиленные звёзды + фиолетовые туманности + мерцание.
 * В других тёмных палитрах: простые звёзды.
 */
export function StarsOverlay() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [palette, setPalette] = useState<string>("terracotta");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setMounted(true);
      const check = () => {
        const html = document.documentElement;
        setIsDark(html.classList.contains("dark"));
        setPalette(html.getAttribute("data-palette") || "terracotta");
      };
      check();
      // Наблюдатель за изменениями class и data-palette
      const observer = new MutationObserver(check);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-palette"],
      });
      // Сохраняем для очистки
      (window as unknown as { __starsObserver?: MutationObserver }).__starsObserver = observer;
    });
    return () => {
      active = false;
      const obs = (window as unknown as { __starsObserver?: MutationObserver }).__starsObserver;
      obs?.disconnect();
    };
  }, []);

  if (!mounted || !isDark) return null;

  const isIndigo = palette === "indigo";

  // Генерируем звёзды с случайными позициями (стабильные через seed)
  const stars = generateStars(isIndigo ? 60 : 35);
  const bigStars = generateStars(isIndigo ? 12 : 6, true);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {/* Туманности — только для индиго */}
      {isIndigo && (
        <>
          <div
            style={{
              position: "absolute",
              top: "15%",
              left: "10%",
              width: "300px",
              height: "200px",
              background:
                "radial-gradient(ellipse, oklch(0.35 0.12 285 / 0.35), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "10%",
              right: "5%",
              width: "350px",
              height: "250px",
              background:
                "radial-gradient(ellipse, oklch(0.32 0.14 295 / 0.3), transparent 70%)",
              filter: "blur(50px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "30%",
              width: "250px",
              height: "180px",
              background:
                "radial-gradient(ellipse, oklch(0.38 0.08 265 / 0.25), transparent 70%)",
              filter: "blur(35px)",
            }}
          />
        </>
      )}

      {/* Маленькие звёзды */}
      {stars.map((s, i) => (
        <div
          key={`s-${i}`}
          style={{
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: isIndigo
              ? `rgba(${s.color}, ${s.opacity})`
              : `rgba(255, 255, 255, ${s.opacity * 0.7})`,
            borderRadius: "50%",
            boxShadow: isIndigo
              ? `0 0 ${s.size * 2}px rgba(${s.color}, ${s.opacity * 0.5})`
              : `0 0 ${s.size}px rgba(255,255,255, ${s.opacity * 0.3})`,
            animation: `twinkle-star ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
          }}
        />
      ))}

      {/* Большие звёзды с лучами — только индиго */}
      {isIndigo &&
        bigStars.map((s, i) => (
          <div
            key={`b-${i}`}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size * 2}px`,
              height: `${s.size * 2}px`,
              animation: `twinkle-star ${s.duration}s ease-in-out ${s.delay}s infinite alternate`,
            }}
          >
            {/* Звезда с 4 лучами */}
            <svg
              width={s.size * 2}
              height={s.size * 2}
              viewBox="0 0 20 20"
              style={{ filter: `drop-shadow(0 0 4px rgba(220,210,255,0.8))` }}
            >
              <path
                d="M10 0 L 11 9 L 20 10 L 11 11 L 10 20 L 9 11 L 0 10 L 9 9 Z"
                fill="rgba(255,255,255,0.95)"
              />
              <circle cx="10" cy="10" r="1.5" fill="rgba(220,210,255,1)" />
            </svg>
          </div>
        ))}

      <style jsx>{`
        @keyframes twinkle-star {
          0% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.5;
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}

/** Генератор звёзд с псевдослучайными позициями */
function generateStars(count: number, big = false): Star[] {
  const stars: Star[] = [];
  // Простой seed-based генератор для стабильности
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < count; i++) {
    const colorRand = rand();
    const color = colorRand > 0.7 ? "220, 210, 255" : colorRand > 0.4 ? "255, 255, 255" : "200, 220, 255";
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      size: big ? 1.5 + rand() * 1.5 : 0.8 + rand() * 1.2,
      opacity: 0.4 + rand() * 0.6,
      duration: 2 + rand() * 4,
      delay: rand() * 3,
      color,
    });
  }
  return stars;
}

type Star = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
  color: string;
};
