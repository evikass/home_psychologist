"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Хук для озвучивания текста через браузерный SpeechSynthesis API.
 * Работает офлайн, без бэкенда. Поддерживает русский и английский.
 */
export function useSpeech(lang: string = "ru-RU") {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!supported) return;

      // Останавливаем предыдущее
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.9;

      // Подбираем голос для нужного языка
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(
        (v) => v.lang.startsWith(lang.slice(0, 2)) || v.lang === lang
      );
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        onEnd?.();
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, lang]
  );

  const speakSequence = useCallback(
    (texts: string[], onStep?: (index: number) => void) => {
      if (!supported || texts.length === 0) return;

      window.speechSynthesis.cancel();
      let currentIndex = 0;

      const speakNext = () => {
        if (currentIndex >= texts.length) {
          setSpeaking(false);
          return;
        }
        onStep?.(currentIndex);
        const text = texts[currentIndex];
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 0.9;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(
          (v) => v.lang.startsWith(lang.slice(0, 2)) || v.lang === lang
        );
        if (voice) utterance.voice = voice;

        utterance.onend = () => {
          currentIndex++;
          if (currentIndex < texts.length) {
            // Пауза между шагами
            setTimeout(speakNext, 800);
          } else {
            setSpeaking(false);
          }
        };
        utterance.onerror = () => {
          currentIndex++;
          if (currentIndex < texts.length) {
            setTimeout(speakNext, 500);
          } else {
            setSpeaking(false);
          }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      setSpeaking(true);
      speakNext();
    },
    [supported, lang]
  );

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  return { speaking, supported, speak, speakSequence, stop };
}
