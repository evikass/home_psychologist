"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Компонент голосового ввода.
 *
 * Стратегия работы:
 * 1. Сначала запрашиваем permission через getUserMedia (показывает нативный диалог)
 * 2. Пробуем Web Speech API (SpeechRecognition)
 * 3. Если SpeechRecognition падает — автоматически переходим на MediaRecorder
 * 4. Если MediaRecorder тоже недоступен — показываем понятную ошибку
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
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef<string>("");
  const fallbackToRecorderRef = useRef<boolean>(false);

  useEffect(() => {
    // Проверяем поддержку хотя бы одного метода
    const hasSpeech =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    const hasRecorder =
      typeof window !== "undefined" &&
      "MediaRecorder" in window &&
      !!navigator.mediaDevices?.getUserMedia;

    setSupported(hasSpeech || hasRecorder);
  }, []);

  const stopRecording = useCallback(() => {
    // Web Speech API
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    // MediaRecorder
    if (mediaRecorderRef.current?.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    setRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
  }, []);

  // === MediaRecorder mode ===
  const startWithMediaRecorder = useCallback(
    async (stream: MediaStream) => {
      // Подбираем поддерживаемый mimeType
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/3gpp",
        "",
      ];

      let mimeType = "";
      for (const c of candidates) {
        if (!c || (typeof MediaRecorder.isTypeSupported === "function" && MediaRecorder.isTypeSupported(c))) {
          mimeType = c;
          break;
        }
      }

      try {
        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;

          const blob = new Blob(chunksRef.current, {
            type: mediaRecorder.mimeType || mimeType || "audio/webm",
          });

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
              toast.error((e as Error).message || "Ошибка распознавания.");
            } finally {
              setTranscribing(false);
            }
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        streamRef.current = stream;
        setRecording(true);
        startTimer();

        setTimeout(() => {
          if (mediaRecorderRef.current?.state === "recording") {
            stopRecording();
          }
        }, 60000);
      } catch (e) {
        stream.getTracks().forEach((t) => t.stop());
        toast.error("Не удалось запустить запись: " + (e as Error).message);
      }
    },
    [onTranscribe, startTimer, stopRecording]
  );

  // === Web Speech API mode ===
  const startWithSpeechRecognition = useCallback(
    (stream: MediaStream) => {
      // Останавливаем поток от getUserMedia — SpeechRecognition использует свой
      stream.getTracks().forEach((t) => t.stop());

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        // Fallback на MediaRecorder
        startWithMediaRecorder(stream).catch(() => {});
        return;
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.continuous = true;
        recognition.interimResults = true;
        finalTextRef.current = "";

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTextRef.current += transcript;
            } else {
              interim += transcript;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("[voice] speech error:", event.error);

          // При ошибках доступа — пробуем MediaRecorder
          if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed" ||
            event.error === "audio-capture" ||
            event.error === "network"
          ) {
            if (!fallbackToRecorderRef.current) {
              fallbackToRecorderRef.current = true;
              toast.info("Переключаюсь на альтернативный режим записи…");
              // Запрашиваем новый поток и переходим на MediaRecorder
              navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((newStream) => startWithMediaRecorder(newStream))
                .catch((err) => {
                  toast.error(
                    "Микрофон недоступен. Проверьте:\n• Разрешение в настройках браузера\n• Что микрофон не занят другим приложением"
                  );
                });
              return;
            }
          }

          if (event.error === "no-speech") {
            toast.error("Не услышал речь. Попробуйте говорить громче.");
          } else if (event.error === "aborted") {
            // Нормальная остановка
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
          if (text && !fallbackToRecorderRef.current) {
            onTranscribe(text);
            toast.success(
              "Распознано: " + text.slice(0, 60) + (text.length > 60 ? "…" : "")
            );
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
        startTimer();

        setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch {}
          }
        }, 60000);
      } catch (e) {
        // Если SpeechRecognition не запустился — пробуем MediaRecorder
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((newStream) => startWithMediaRecorder(newStream))
          .catch(() => {
            toast.error("Голосовой ввод недоступен в этом браузере.");
          });
      }
    },
    [onTranscribe, startTimer, startWithMediaRecorder]
  );

  const startRecording = useCallback(async () => {
    fallbackToRecorderRef.current = false;
    finalTextRef.current = "";

    try {
      // ВСЕГДА сначала запрашиваем permission через getUserMedia
      // Это показывает нативный диалог разрешения в браузере
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Проверяем поддержку SpeechRecognition
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        startWithSpeechRecognition(stream);
      } else {
        // Нет SpeechRecognition — используем MediaRecorder
        startWithMediaRecorder(stream);
      }
    } catch (e) {
      const err = e as Error;
      let msg = "Нет доступа к микрофону.";
      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        msg =
          "Доступ к микрофону запрещён.\n\nЧтобы разрешить:\n" +
          "1. Нажмите на значок замка 🔒 в адресной строке\n" +
          "2. Найдите «Микрофон»\n" +
          "3. Выберите «Разрешить»\n" +
          "4. Обновите страницу";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "Микрофон не найден. Проверьте подключение.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Микрофон занят другим приложением. Закройте другие приложения с микрофоном.";
      } else if (err.name === "AbortError") {
        msg = "Доступ к микрофону прерван. Попробуйте ещё раз.";
      } else {
        msg = err.message || msg;
      }
      toast.error(msg, { duration: 8000 });
    }
  }, [startWithSpeechRecognition, startWithMediaRecorder]);

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
