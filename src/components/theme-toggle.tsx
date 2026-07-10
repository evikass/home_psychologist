"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Moon, Palette, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Цветовые палитры — добавляют CSS-переменные поверх базовой темы.
 * Применяются через data-palette атрибут на <html>.
 */
const PALETTES = [
  {
    id: "terracotta",
    name: "Терракота",
    nameEn: "Terracotta",
    colors: { primary: "#c2624a", accent: "#e8a87c", bg: "#fdf6f0" },
    swatch: "#c2624a",
  },
  {
    id: "emerald",
    name: "Изумруд",
    nameEn: "Emerald",
    colors: { primary: "#059669", accent: "#34d399", bg: "#f0fdf4" },
    swatch: "#059669",
  },
  {
    id: "indigo",
    name: "Индиго",
    nameEn: "Indigo",
    colors: { primary: "#4f46e5", accent: "#818cf8", bg: "#eef2ff" },
    swatch: "#4f46e5",
  },
  {
    id: "rose",
    name: "Роза",
    nameEn: "Rose",
    colors: { primary: "#e11d48", accent: "#fb7185", bg: "#fff1f2" },
    swatch: "#e11d48",
  },
] as const;

const PALETTE_STORAGE_KEY = "masterkit_palette";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [palette, setPalette] = useState<string>("terracotta");

  const applyPalette = (id: string) => {
    const root = document.documentElement;
    root.setAttribute("data-palette", id);
  };

  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (!mounted) return;
      setMounted(true);
      try {
        const saved = localStorage.getItem(PALETTE_STORAGE_KEY);
        if (saved && mounted) {
          setPalette(saved);
          applyPalette(saved);
        }
      } catch {}
    });
    return () => { mounted = false; };
  }, []);

  const handleToggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSelectPalette = (id: string) => {
    setPalette(id);
    applyPalette(id);
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, id);
    } catch {}
    setPaletteOpen(false);
  };

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="relative flex items-center">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleTheme}
        className="h-8 w-8 p-0"
        title={isDark ? "Светлая тема" : "Тёмная тема"}
      >
        {isDark ? (
          <Sun className="h-3.5 w-3.5" />
        ) : (
          <Moon className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPaletteOpen(!paletteOpen)}
        className="h-8 w-8 p-0"
        title="Цветовая палитра"
      >
        <Palette className="h-3.5 w-3.5" />
      </Button>

      <AnimatePresence>
        {paletteOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setPaletteOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-10 z-50 rounded-xl border bg-popover shadow-lg p-2 min-w-[160px]"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold px-2 py-1 mb-1">
                Палитра
              </div>
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPalette(p.id)}
                  className="flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-accent transition-colors text-left"
                >
                  <span
                    className="h-5 w-5 rounded-full shrink-0 border-2 border-white/50 shadow-sm"
                    style={{ backgroundColor: p.swatch }}
                  />
                  <span className="text-xs font-medium flex-1">{p.name}</span>
                  {palette === p.id && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
              ))}
              {isDark && (
                <p className="text-[10px] text-muted-foreground px-2 pt-1.5 pb-0.5 italic">
                  В тёмной теме индиго — звёздное небо ✨
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
