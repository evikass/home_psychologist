"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Calendar,
  Check,
  Clock,
  Download,
  FileText,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "ai" | "request" | "tiers";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

type Tier = {
  id: string;
  name: string;
  duration: string;
  format: string;
  icon: typeof Video;
  features: string[];
  description: string;
};

const TIERS: Tier[] = [
  {
    id: "text",
    name: "Текстовая консультация",
    duration: "60 минут",
    format: "Чат",
    icon: MessageCircle,
    description: "Разбор ситуации в чате с наставником. Подходит для тех, кто предпочитает письменный формат.",
    features: [
      "Разбор вашей ситуации в чате",
      "Персональные проработки",
      "Поддержка в течение 7 дней",
    ],
  },
  {
    id: "video",
    name: "Видео-сессия",
    duration: "90 минут",
    format: "Zoom / Skype",
    icon: Video,
    description: "Личный разбор по видео. Наставник видит вас, слышит интонации, ведёт через проработки.",
    features: [
      "Личный разбор по видео",
      "Проработки в реальном времени",
      "Запись сессии",
      "Письменное резюме после",
    ],
  },
  {
    id: "mentor",
    name: "Сопровождение 1 месяц",
    duration: "4 сессии + чат",
    format: "Гибрид",
    icon: Sparkles,
    description: "Глубокое сопровождение: 4 сессии + безлимитный чат. Для серьёзной трансформации.",
    features: [
      "4 личных сессии (по 1 в неделю)",
      "Безлимитный чат с наставником",
      "Индивидуальный план проработок",
      "Доступ к закрытому сообществу",
    ],
  },
];

export function ConsultantModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [tab, setTab] = useState<Tab>("ai");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="h-5 w-5 text-primary" />
            Личный консультант
          </DialogTitle>
        </DialogHeader>

        {/* Вкладки */}
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg mb-4">
          <TabButton active={tab === "ai"} onClick={() => setTab("ai")} icon={Bot} label="AI-консультант" sublabel="24/7 · бесплатно" />
          <TabButton active={tab === "request"} onClick={() => setTab("request")} icon={FileText} label="Заявка наставнику" sublabel="живому человеку" />
          <TabButton active={tab === "tiers"} onClick={() => setTab("tiers")} icon={Sparkles} label="Тарифы" sublabel="демо" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "ai" && <AiConsultantTab />}
            {tab === "request" && <RequestTab />}
            {tab === "tiers" && <TiersTab />}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  sublabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Bot;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-0.5 px-2 py-2 rounded-md text-xs transition-all",
        active
          ? "bg-background shadow-sm text-primary font-semibold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="leading-tight">{label}</span>
      <span className="text-xs opacity-70">{sublabel}</span>
    </button>
  );
}

// =====================================================================
// Вкладка 1: AI-консультант — рабочий чат
// =====================================================================

function AiConsultantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        const res = await fetch("/api/consultant-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: newMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Не удалось получить ответ.");
        }
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            timestamp: Date.now(),
          },
        ]);
      } catch (e) {
        toast.error((e as Error).message || "Ошибка.");
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="space-y-3">
      {/* Описание */}
      <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs leading-relaxed">
        <div className="font-semibold text-primary mb-1 flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5" />
          AI-консультант по самотерапии
        </div>
        <p className="text-muted-foreground">
          Полноценная сессия с ИИ-наставником. Ведёт диалог, задаёт вопросы к телу,
          помогает увидеть уровень и бытийность, предлагает проработки. Бесплатно, 24/7.
        </p>
      </div>

      {/* Чат */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {messages.length === 0 ? (
          <div className="p-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-foreground/80 mb-1 font-medium">
              Здравствуй. Я здесь.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              С чем ты пришёл сегодня? Расскажи свою ситуацию — я выслушаю.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Я устал(а) и не знаю, чего хочу",
                "Не могу разобраться в отношениях",
                "Застрял(а) в работе, нет сил",
                "Хочу понять, что со мной происходит",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => void sendMessage(q)}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-full border bg-background hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto fancy-scroll p-3 space-y-3">
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
                  <span className="text-xs text-muted-foreground">Думаю…</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Поле ввода */}
        <div className="border-t p-2 flex gap-2 items-end bg-background">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите, что у вас происходит…"
            className="min-h-[44px] max-h-32 resize-none text-sm border-0 focus-visible:ring-0"
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
      </div>

      <div className="text-xs text-muted-foreground text-center">
        Enter — отправить · Shift+Enter — новая строка · Сессия не сохраняется между визитами
      </div>
    </div>
  );
}

// =====================================================================
// Вкладка 2: Заявка живому наставнику — рабочая форма
// =====================================================================

function RequestTab() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [situation, setSituation] = useState("");
  const [format, setFormat] = useState<string>("text");

  const handleSubmit = () => {
    if (!name.trim() || !contact.trim() || situation.trim().length < 20) {
      toast.error("Заполните имя, контакт и опишите ситуацию (минимум 20 символов).");
      return;
    }

    const tier = TIERS.find((t) => t.id === format);
    const date = new Date().toLocaleString("ru-RU");

    const requestText = `ЗАЯВКА НА КОНСУЛЬТАЦИЮ
Метод самотерапии «Домашний психолог»

Дата заявки: ${date}

Имя: ${name}
Контакт: ${contact}
Желаемый формат: ${tier?.name ?? format} (${tier?.duration ?? ""})

ОПИСАНИЕ СИТУАЦИИ:
${situation}

---
Эта заявка сформирована в приложении «Домашний психолог» (https://home-psychologist.vercel.app).
Приложение — независимый инструмент самотерапии.
Для официальной работы с методикой обращайтесь к сертифицированным наставникам
через удобный канал связи.`;

    // Скачивание файла
    const blob = new Blob([requestText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `consultant-request-${dateStr}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Заявка сформирована! Файл скачан — отправьте его наставнику через любой удобный канал.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-3 text-xs leading-relaxed">
        <div className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
          📋 Заполните заявку — наставник свяжется с вами
        </div>
        <p className="text-blue-800/80 dark:text-blue-300/80">
          После заполнения формы заявка скачается как текстовый файл.
          Вы сможете отправить его любому сертифицированному наставнику методики
          через удобный канал (email, Telegram, WhatsApp).
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">
            Ваше имя *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Как к вам обращаться"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">
            Контакт для связи *
          </label>
          <Input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Email или Telegram @username"
            className="text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">
            Желаемый формат консультации
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TIERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormat(t.id)}
                className={cn(
                  "text-left p-2.5 rounded-lg border-2 transition-all",
                  format === t.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <t.icon className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium">{t.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t.duration} · {t.format}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/80 mb-1">
            Опишите вашу ситуацию * <span className="text-muted-foreground">(минимум 20 символов)</span>
          </label>
          <Textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Что происходит? С чем хотите разобраться? Чем больше деталей — тем точнее наставник сможет помочь."
            className="min-h-[120px] text-sm"
            maxLength={3000}
          />
          <div className="text-xs text-muted-foreground text-right mt-0.5">
            {situation.length} / 3000
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4" />
          Сформировать заявку
        </Button>

        <div className="text-xs text-muted-foreground text-center italic leading-relaxed pt-2 border-t">
          Заявка не отправляется автоматически. Вы получите текстовый файл,
          который нужно самостоятельно переслать наставнику. Это гарантирует,
          что ваши данные не покидают ваш контроль.
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Вкладка 3: Тарифы — информация
// =====================================================================

function TiersTab() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
        <strong>ℹ️ Информационный раздел.</strong> Реальная запись и оплата
        не производятся. Для запуска платных консультаций необходимо официальное
        партнёрство с профильными специалистами.
      </div>

      <div className="space-y-3">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <tier.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-display font-semibold text-sm">
                    {tier.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs h-4 py-0">
                    демо
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {tier.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" />
                    {tier.format}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {tier.description}
                </p>
                <ul className="space-y-1">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground text-center italic leading-relaxed pt-2 border-t">
        Данное приложение — независимый инструмент самотерапии, объединяющий открытые психологические методы.
      </div>
    </div>
  );
}
