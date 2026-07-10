"use client";

import { LEVELS } from "@/lib/masterkit-data";
import { cn } from "@/lib/utils";

export function LevelScale({ activeId }: { activeId: number }) {
  return (
    <div className="w-full">
      <div className="flex items-end justify-between gap-1 sm:gap-2">
        {LEVELS.map((l) => {
          const active = l.id === activeId;
          const height = 28 + l.id * 8;
          return (
            <div
              key={l.id}
              className="flex flex-1 flex-col items-center gap-1.5"
              aria-label={`Уровень ${l.id} — ${l.name}${active ? " (активный)" : ""}`}
            >
              <div
                className={cn(
                  "flex w-full items-end justify-center rounded-t-md transition-all duration-500",
                  active
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-secondary-foreground/60"
                )}
                style={{ height: `${height}px` }}
              >
                <span
                  className={cn(
                    "text-xs font-semibold leading-none mb-1",
                    active && "scale-110"
                  )}
                >
                  {l.id}
                </span>
              </div>
              <span
                className={cn(
                  "text-xs sm:text-xs text-center leading-tight hidden sm:block",
                  active ? "text-foreground font-medium" : "text-muted-foreground/70"
                )}
              >
                {l.name}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center text-xs text-muted-foreground">
        Шкала 7 уровней развития · сейчас активен{" "}
        <span className="font-semibold text-foreground">уровень {activeId}</span>
      </div>
    </div>
  );
}
