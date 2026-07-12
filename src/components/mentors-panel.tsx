"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Check,
  Heart,
  Plus,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

/**
 * Панель выбора наставника с рейтингом.
 *
 * Пользователь может:
 * - Просматривать список доступных наставников
 * - Выбрать одного как "своего" наставника
 * - Ставить + баллы рейтинга (раз в день)
 * - Менять наставника
 */

type Mentor = {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  rating: number;
  isMyMentor?: boolean;
};

// Демо-наставники (в продакшене — из базы одобренных психологов)
const DEMO_MENTORS: Mentor[] = [
  {
    id: "mentor-2",
    name: "Анна Светлова",
    specialization: "Гештальт-терапия, сказкотерапия",
    experience: "8 лет практики. Сертифицированный гештальт-терапевт.",
    rating: 32,
  },
  {
    id: "mentor-3",
    name: "Михаил Орлов",
    specialization: "КПТ, mindfulness, метафорические карты",
    experience: "12 лет практики. Преподаватель КПТ.",
    rating: 28,
  },
  {
    id: "mentor-4",
    name: "Елена Дёмина",
    specialization: "Телесно-ориентированная терапия, EFT",
    experience: "6 лет практики. Телесный терапевт, EFT-практик.",
    rating: 19,
  },
];

const STORAGE_MENTOR = "masterkit_my_mentor";
const STORAGE_RATINGS = "masterkit_mentor_ratings";
const STORAGE_RATING_DATE = "masterkit_last_rating_date";

export function MentorsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [myMentorId, setMyMentorId] = useState<string | null>(null);
  const [canRateToday, setCanRateToday] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        // Загружаем рейтинги из localStorage
        const ratingsRaw = localStorage.getItem(STORAGE_RATINGS);
        const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};

        // Загружаем выбранного наставника
        const myMentor = localStorage.getItem(STORAGE_MENTOR);

        // Проверяем, можно ли ставить рейтинг сегодня
        const lastRating = localStorage.getItem(STORAGE_RATING_DATE);
        const today = new Date().toDateString();
        setCanRateToday(lastRating !== today);

        // Объединяем демо-данных с сохранёнными рейтингами
        const merged = DEMO_MENTORS.map((m) => ({
          ...m,
          rating: m.rating + (ratings[m.id] || 0),
          isMyMentor: m.id === myMentor,
        }));

        if (active) {
          setMentors(merged);
          setMyMentorId(myMentor);
        }
      } catch {}
    });
    return () => { active = false; };
  }, [open]);

  const handleChoose = (mentorId: string) => {
    try {
      localStorage.setItem(STORAGE_MENTOR, mentorId);
      setMyMentorId(mentorId);
      setMentors((prev) =>
        prev.map((m) => ({ ...m, isMyMentor: m.id === mentorId }))
      );
      const mentor = mentors.find((m) => m.id === mentorId);
      toast.success(`Вы выбрали наставника: ${mentor?.name}`);
    } catch {
      toast.error("Не удалось сохранить выбор.");
    }
  };

  const handleRemoveMentor = () => {
    try {
      localStorage.removeItem(STORAGE_MENTOR);
      setMyMentorId(null);
      setMentors((prev) =>
        prev.map((m) => ({ ...m, isMyMentor: false }))
      );
      toast.info("Вы убрали наставника.");
    } catch {}
  };

  const handleRate = (mentorId: string) => {
    if (!canRateToday) {
      toast.error("Вы уже ставили рейтинг сегодня. Возвращайтесь завтра!");
      return;
    }

    try {
      const ratingsRaw = localStorage.getItem(STORAGE_RATINGS);
      const ratings: Record<string, number> = ratingsRaw ? JSON.parse(ratingsRaw) : {};
      ratings[mentorId] = (ratings[mentorId] || 0) + 1;

      localStorage.setItem(STORAGE_RATINGS, JSON.stringify(ratings));
      localStorage.setItem(STORAGE_RATING_DATE, new Date().toDateString());
      setCanRateToday(false);

      setMentors((prev) =>
        prev.map((m) =>
          m.id === mentorId ? { ...m, rating: m.rating + 1 } : m
        )
      );

      toast.success("+1 балл рейтинга! Спасибо за оценку.");
    } catch {
      toast.error("Не удалось сохранить рейтинг.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Users className="h-5 w-5 text-primary" />
            Выбор наставника
          </DialogTitle>
        </DialogHeader>

        {/* Мой наставник */}
        {myMentorId && (
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-wide font-semibold text-primary">
                Ваш наставник
              </span>
            </div>
            {(() => {
              const m = mentors.find((m) => m.id === myMentorId);
              if (!m) return null;
              return (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
                    {m.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.specialization}</div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold text-primary shrink-0">
                    <Star className="h-3.5 w-3.5 fill-primary" />
                    {m.rating}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-7 px-2 text-xs"
                    onClick={handleRemoveMentor}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Подсказка про рейтинг */}
        <div className="rounded-lg bg-secondary/40 p-2.5 text-xs text-muted-foreground text-center">
          {canRateToday ? (
            <span>
              <Plus className="inline h-3 w-3 text-primary" /> Нажмите «+», чтобы
              повысить рейтинг наставника. Можно голосовать раз в день.
            </span>
          ) : (
            <span>
              <Check className="inline h-3 w-3 text-green-500" /> Вы уже голосовали
              сегодня. Возвращайтесь завтра!
            </span>
          )}
        </div>

        {/* Список наставников */}
        <div className="space-y-2">
          {mentors
            .sort((a, b) => b.rating - a.rating)
            .map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl border p-3 transition-all ${
                  m.isMyMentor
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Аватар */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {m.name[0]}
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{m.name}</span>
                      {i === 0 && (
                        <Badge className="text-xs py-0 h-5 bg-amber-100 text-amber-700 border-amber-300">
                          <Star className="h-3 w-3 mr-0.5 fill-amber-500" />
                          Топ
                        </Badge>
                      )}
                      {m.isMyMentor && (
                        <Badge variant="secondary" className="text-xs py-0 h-5">
                          <Heart className="h-3 w-3 mr-0.5" />
                          Ваш
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {m.specialization}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">
                      {m.experience}
                    </div>
                  </div>

                  {/* Рейтинг */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <div className="flex items-center gap-1 text-lg font-bold text-primary">
                      <Star className="h-4 w-4 fill-primary" />
                      {m.rating}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRate(m.id)}
                      disabled={!canRateToday}
                      className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold transition-all ${
                        canRateToday
                          ? "bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      title={canRateToday ? "+1 балл" : "Уже голосовали сегодня"}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Кнопка выбора */}
                  <div className="shrink-0">
                    {m.isMyMentor ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" disabled>
                        <Check className="h-3 w-3" />
                        Выбран
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleChoose(m.id)}
                      >
                        Выбрать
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Заявка наставнику */}
        <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-3 mt-3">
          <div className="text-xs leading-relaxed">
            <strong>Не нашли подходящего наставника?</strong> Оставьте заявку —
            администратор подберёт специалиста под ваш запрос.
          </div>
          <div className="mt-2 text-xs">
            <a
              href="mailto:evi-kass@mail.ru?subject=Заявка на подбор наставника"
              className="text-primary hover:underline"
            >
              ✉️ evi-kass@mail.ru
            </a>
            {" · "}
            <a
              href="https://vk.ru/evgeniikassin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              VK: vk.ru/evgeniikassin
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
