"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { DiagnoseResponse } from "@/lib/masterkit-prompt";
import { useI18n } from "@/components/language-provider";
import { toast } from "sonner";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

const STARTER_QUESTIONS_RU = [
  "Что я сейчас чувствую в теле?",
  "Почему я застрял(а) в этой ситуации?",
  "Как мне начать проработку прямо сейчас?",
  "Чему меня учит эта ситуация?",
];

const STARTER_QUESTIONS_EN = [
  "What am I feeling in my body right now?",
  "Why am I stuck in this situation?",
  "How do I start the practice right now?",
  "What is this situation teaching me?",
];

/**
 * AI-чат для углублённой проработки диагноза.
 * Ведёт диалог с учётом контекста диагноза (бытийность, эмоции, яма).
 */
export function AiChat({
  diagnosis,
  lang = "ru",
}: {
  diagnosis: DiagnoseResponse;
  lang?: "ru" | "en";
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const starters = lang === "en" ? STARTER_QUESTIONS_EN : STARTER_QUESTIONS_RU;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            diagnosis,
            lang,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Не удалось получить ответ.");
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (e) {
        const msg = (e as Error).message || "Ошибка.";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, diagnosis, lang]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 overflow-hidden">
      {/* Заголовок — кликабельный, сворачивается */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 p-4 hover:bg-primary/10 transition-colors text-left"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-semibold text-sm sm:text-base">
            {lang === "en" ? "Deepen with AI dialogue" : "Углубить с ИИ-наставником"}
          </div>
          <div className="text-xs text-muted-foreground">
            {lang === "en"
              ? "Ask anything about your diagnosis and practice"
              : "Спросите про диагноз, эмоции, проработки — диалог вёл с учётом вашего состояния"}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Стартовые вопросы — только если нет сообщений */}
              {messages.length === 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {lang === "en" ? "Try asking:" : "Попробуйте спросить:"}
                  </div>
                  {starters.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => void sendMessage(q)}
                      disabled={loading}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-background hover:bg-accent transition-colors border"
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              )}

              {/* История сообщений */}
              {messages.length > 0 && (
                <div className="max-h-[400px] overflow-y-auto fancy-scroll space-y-3 py-2">
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2.5",
                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                          m.role === "user"
                            ? "bg-secondary text-secondary-foreground"
                            : "bg-primary text-primary-foreground"
                        )}
                      >
                        {m.role === "user" ? (
                          <User className="h-3.5 w-3.5" />
                        ) : (
                          <Bot className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "flex-1 max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          m.role === "user"
                            ? "bg-secondary text-secondary-foreground rounded-tr-sm"
                            : "bg-background border rounded-tl-sm"
                        )}
                      >
                        {m.content}
                      </div>
                    </motion.div>
                  ))}

                  {/* Индикатор набора */}
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2.5"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5 bg-background border rounded-2xl rounded-tl-sm px-4 py-3">
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {lang === "en" ? "Thinking…" : "Думаю…"}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Поле ввода */}
              <div className="flex gap-2 items-end">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    lang === "en"
                      ? "Ask your question…"
                      : "Спросите что-то…"
                  }
                  className="min-h-[44px] max-h-32 resize-none text-sm bg-background"
                  disabled={loading}
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={() => void sendMessage(input)}
                  disabled={loading || !input.trim()}
                  className="h-11 px-4 shrink-0 rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground text-center">
                {lang === "en"
                  ? "Enter — send, Shift+Enter — new line"
                  : "Enter — отправить, Shift+Enter — новая строка"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
