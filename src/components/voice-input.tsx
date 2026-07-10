"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Компонент голосового ввода.
 * Записывает аудио через MediaRecorder API, отправляет на /api/transcribe,
 * получает текст и вставляет в textarea.
 *
 * Поддерживается только в браузерах с MediaRecorder (Chrome, Firefox, Safari 14.1+).
 */
export function VoiceInput({
  onTranscribe,
  disabled,
}: {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [supported, setSupported] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "MediaRecorder" in window &&
        navigator.mediaDevices?.getUserMedia
    );
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        // Останавливаем все треки
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (blob.size < 1000) {
          toast.error("Запись слишком короткая. Попробуйте ещё раз.");
          return;
        }

        // Конвертируем в base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setTranscribing(true);
          try {
            const res = await fetch("/api/transcribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ audio: base64 }),
            });
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error || "Не удалось распознать речь.");
            }
            onTranscribe(data.text);
            toast.success("Распознано: " + data.text.slice(0, 60) + (data.text.length > 60 ? "…" : ""));
          } catch (e) {
            const msg = (e as Error).message || "Ошибка распознавания.";
            toast.error(msg);
          } finally {
            setTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setRecording(true);
      setSeconds(0);

      // Таймер
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Авто-стоп через 60 секунд
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          stopRecording();
        }
      }, 60000);
    } catch (e) {
      const msg = (e as Error).message || "Нет доступа к микрофону.";
      toast.error("Микрофон недоступен: " + msg);
    }
  }, [onTranscribe]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleToggle = () => {
    if (recording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!supported) return null;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={recording ? "destructive" : "outline"}
        size="sm"
        onClick={handleToggle}
        disabled={disabled || transcribing}
        className="h-8 gap-1.5 text-xs rounded-full"
      >
        {transcribing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : recording ? (
          <Square className="h-3 w-3" />
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
        {transcribing
          ? "Распознаю…"
          : recording
          ? formatTime(seconds)
          : "Голос"}
      </Button>

      {/* Индикатор записи */}
      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-xs text-muted-foreground">
              Говорите…
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
