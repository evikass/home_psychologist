"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Компонент голосового ввода.
 *
 * Два режима работы:
 * 1. Web Speech API (SpeechRecognition) — работает в iOS Safari, Chrome на мобильных.
 *    Не требует отправки на сервер, распознаёт напрямую в браузере.
 * 2. MediaRecorder + /api/transcribe — fallback для браузеров без SpeechRecognition.
 *
 * Если ни один не доступен — кнопка не показывается.
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
  const [mode, setMode] = useState<"speech" | "recorder" | null>(null);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef<string>("");

  useEffect(() => {
    // Проверяем поддержку Web Speech API
    const SpeechRecognition =
      (typeof window !== "undefined" && (window as any).SpeechRecognition) ||
      (typeof window !== "undefined" && (window as any).webkitSpeechRecognition);

    if (SpeechRecognition) {
      setSupported(true);
      setMode("speech");
      return;
    }

    // Fallback: проверяем MediaRecorder
    if (
      typeof window !== "undefined" &&
      "MediaRecorder" in window &&
      navigator.mediaDevices?.getUserMedia
    ) {
      setSupported(true);
      setMode("recorder");
    }
  }, []);

  const startRecording = useCallback(async () => {
    finalTextRef.current = "";

    // Сначала запрашиваем permission через getUserMedia — показывает нативный диалог
    try {
      const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      permStream.getTracks().forEach((t) => t.stop());
    } catch (e) {
      const err = e as Error;
      let msg = "Нет доступа к микрофону.";
      if (err.name === "NotAllowedError" || err.name === "SecurityError")
        msg = "Доступ запрещён. Нажмите на замок 🔒 в адресной строке → Микрофон → Разрешить → обновите страницу.";
      else if (err.name === "NotFoundError") msg = "Микрофон не найден.";
      else if (err.name === "NotReadableError") msg = "Микрофон занят другим приложением.";
      else msg = err.message || msg;
      toast.error(msg, { duration: 8000 });
      return;
    }

    // === Режим 1: Web Speech API ===
    if (mode === "speech") {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let interim = "";
          let final = finalTextRef.current;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
              finalTextRef.current = final;
            } else {
              interim += transcript;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("[voice] speech error:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            toast.error("Нет доступа к микрофону. Разрешите доступ в настройках браузера.");
          } else if (event.error === "no-speech") {
            toast.error("Не услышал речь. Попробуйте говорить громче.");
          } else {
            toast.error("Ошибка распознавания: " + event.error);
          }
          setRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
        };

        recognition.onend = () => {
          const text = finalTextRef.current.trim();
          if (text) {
            onTranscribe(text);
            toast.success("Распознано: " + text.slice(0, 60) + (text.length > 60 ? "…" : ""));
          } else {
            toast.error("Не удалось распознать речь. Попробуйте ещё раз.");
          }
          setRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
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
              recognitionRef.current.stop();
            } catch {}
          }
        }, 60000);
      } catch (e) {
        const msg = (e as Error).message || "Ошибка.";
        toast.error("Голосовой ввод недоступен: " + msg);
      }
      return;
    }

    // === Режим 2: MediaRecorder + сервер ===
    if (mode === "recorder") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Подбираем поддерживаемый mimeType
        let mimeType = "audio/webm";
        if (typeof MediaRecorder.isTypeSupported === "function") {
          if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
            mimeType = "audio/webm;codecs=opus";
          } else if (MediaRecorder.isTypeSupported("audio/webm")) {
            mimeType = "audio/webm";
          } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
            mimeType = "audio/ogg;codecs=opus";
          }
        }

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType || mimeType,
          });
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;

          if (blob.size < 500) {
            toast.error("Запись слишком короткая. Попробуйте ещё раз.");
            return;
          }

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
              toast.success(
                "Распознано: " + data.text.slice(0, 60) + (data.text.length > 60 ? "…" : "")
              );
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

        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1);
        }, 1000);

        setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            stopRecording();
          }
        }, 60000);
      } catch (e) {
        const err = e as Error;
        let msg = "Нет доступа к микрофону.";
        if (err.name === "NotAllowedError") {
          msg = "Доступ к микрофону запрещён. Разрешите доступ в настройках браузера.";
        } else if (err.name === "NotFoundError") {
          msg = "Микрофон не найден. Проверьте подключение.";
        } else if (err.name === "NotReadableError") {
          msg = "Микрофон занят другим приложением.";
        } else {
          msg = err.message || msg;
        }
        toast.error(msg);
      }
    }
  }, [mode, onTranscribe]);

  const stopRecording = useCallback(() => {
    // Web Speech API
    if (mode === "speech" && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // MediaRecorder
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [mode]);

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
      streamRef.current?.getTracks().forEach((t) => t.stop());
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
