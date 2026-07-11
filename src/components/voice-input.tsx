"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Компонент голосового ввода через Web Speech API.
 *
 * Работает в Chrome (desktop + Android), Safari (iOS), Edge.
 * Не требует сервера — распознавание происходит в браузере.
 *
 * Если браузер не поддерживает SpeechRecognition — кнопка не показывается.
 */
export function VoiceInput({
  onTranscribe,
  disabled,
}: {
  onTranscribe: (text: string) => void;
  disabled?: boolean;
}) {
  const [recording, setRecording] = useState(false);
  const [transcribing] = useState(false);
  const [supported, setSupported] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalTextRef = useRef<string>("");
  const stoppedManuallyRef = useRef<boolean>(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const SR =
          (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
          (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);
        if (SR) {
          setSupported(true);
        }
      } catch {
        setSupported(false);
      }
    });
    return () => { active = false; };
  }, []);

  const startRecording = useCallback(async () => {
    finalTextRef.current = "";
    stoppedManuallyRef.current = false;

    try {
      const SR =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SR) {
        toast.error("Голосовой ввод не поддерживается в этом браузере. Используйте Chrome или Safari.");
        return;
      }

      const recognition = new SR();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = false;

      // Для continuous=false — onresult вызывается один раз с финальным результатом
      recognition.onresult = (event: any) => {
        let text = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            text += event.results[i][0].transcript;
          }
        }
        if (text.trim()) {
          finalTextRef.current = text.trim();
        }
      };

      recognition.onerror = (event: any) => {
        console.error("[voice] error:", event.error);

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          toast.error(
            "Доступ к микрофону запрещён.\n\nНажмите на значок камеры/микрофона 🔒 в адресной строке → Разрешите микрофон → Обновите страницу.",
            { duration: 10000 }
          );
        } else if (event.error === "no-speech") {
          if (finalTextRef.current.trim()) {
            onTranscribe(finalTextRef.current.trim());
            toast.success("Распознано: " + finalTextRef.current.trim().slice(0, 60));
          } else {
            toast.error("Не услышал речь. Попробуйте говорить громче и чётче.");
          }
        } else if (event.error === "audio-capture") {
          toast.error("Не удалось получить доступ к микрофону. Проверьте подключение.");
        } else if (event.error === "network") {
          toast.error("Ошибка сети при распознавании. Проверьте интернет.");
        } else if (event.error === "aborted") {
          // Нормальная остановка — не показываем ошибку
        } else {
          toast.error("Ошибка распознавания: " + event.error);
        }

        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recognition.onend = () => {
        const text = finalTextRef.current.trim();
        if (text) {
          onTranscribe(text);
          toast.success(
            "Распознано: " + text.slice(0, 60) + (text.length > 60 ? "…" : "")
          );
        } else if (!stoppedManuallyRef.current) {
          toast.error("Не удалось распознать речь. Попробуйте ещё раз.");
        }
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        recognitionRef.current = null;
      };

      recognition.start();
      recognitionRef.current = recognition;
      setRecording(true);
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);

      // Авто-стоп через 60 секунд
      setTimeout(() => {
        if (recognitionRef.current) {
          try {
            stoppedManuallyRef.current = true;
            recognitionRef.current.stop();
          } catch {}
        }
      }, 60000);
    } catch (e) {
      toast.error("Не удалось запустить голосовой ввод: " + (e as Error).message);
    }
  }, [onTranscribe]);

  const stopRecording = useCallback(() => {
    stoppedManuallyRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
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
            <span className="text-xs text-muted-foreground">Говорите…</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
