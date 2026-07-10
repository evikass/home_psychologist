"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Звуковое сопровождение — медитативная фоновая музыка.
 *
 * Использует Web Audio API для генерации мягких обертонов без внешних файлов.
 * Создаёт спокойную атмосферу при просмотре схемы сознания.
 *
 * Технически: 3 осциллятора (синус) на частотах 220 Гц, 330 Гц, 440 Гц
 * (A3 + чистая квинта + октава) с медленной модуляцией громкости.
 */
export function AmbientSound() {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);

  const stop = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      // Плавное затухание
      const now = audioCtxRef.current.currentTime;
      gainRef.current.gain.cancelScheduledValues(now);
      gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
      gainRef.current.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    setTimeout(() => {
      oscillatorsRef.current.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
      if (lfoRef.current) {
        try {
          lfoRef.current.stop();
          lfoRef.current.disconnect();
        } catch {}
      }
      if (gainRef.current) {
        try {
          gainRef.current.disconnect();
        } catch {}
      }
      oscillatorsRef.current = [];
      lfoRef.current = null;
      gainRef.current = null;
    }, 600);
    setPlaying(false);
  }, []);

  const start = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext)();
      }
      // Возобновляем контекст, если он приостановлен (политика браузеров)
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.08, now + 1.5);
      masterGain.connect(ctx.destination);
      gainRef.current = masterGain;

      // 3 осциллятора — гармоника
      const frequencies = [220, 330, 440]; // A3 + чистая квинта + октава
      const types: OscillatorType[] = ["sine", "sine", "triangle"];

      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = types[i];
        osc.frequency.value = freq;

        // Лёгкая расстройка для живости
        osc.detune.value = (i - 1) * 4;

        // Индивидуальный gain
        const oscGain = ctx.createGain();
        oscGain.gain.value = i === 0 ? 0.5 : i === 1 ? 0.25 : 0.15;

        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(now);
        oscillatorsRef.current.push(osc);
      });

      // LFO для медленной модуляции громкости (дыхание)
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15; // ~6 секунд на цикл
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(masterGain.gain);
      lfo.start(now);
      lfoRef.current = lfo;

      setPlaying(true);
    } catch (e) {
      console.warn("[audio] failed:", e);
      setPlaying(false);
    }
  }, [muted]);

  const togglePlay = useCallback(() => {
    if (playing) {
      stop();
    } else {
      void start();
    }
  }, [playing, start, stop]);

  const toggleMute = useCallback(() => {
    if (!gainRef.current || !audioCtxRef.current) {
      setMuted(!muted);
      return;
    }
    const now = audioCtxRef.current.currentTime;
    const newMuted = !muted;
    gainRef.current.gain.cancelScheduledValues(now);
    gainRef.current.gain.setValueAtTime(gainRef.current.gain.value, now);
    gainRef.current.gain.linearRampToValueAtTime(
      newMuted ? 0 : 0.08,
      now + 0.3
    );
    setMuted(newMuted);
  }, [muted]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach((o) => {
        try {
          o.stop();
          o.disconnect();
        } catch {}
      });
      if (audioCtxRef.current) {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlay}
        className="h-8 px-2.5 gap-1.5 text-xs"
        title={playing ? "Выключить медитативную музыку" : "Включить медитативную музыку"}
      >
        <motion.span
          animate={playing ? { scale: [1, 1.15, 1] } : {}}
          transition={
            playing
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
        </motion.span>
        <span className="hidden sm:inline">
          {playing ? "Музыка" : "Музыка"}
        </span>
      </Button>
      {playing && (
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          className="h-8 w-8 p-0"
          title={muted ? "Включить звук" : "Выключить звук"}
        >
          {muted ? (
            <VolumeX className="h-3.5 w-3.5" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
