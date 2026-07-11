"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Check,
  Clock,
  Mail,
  Send,
  Shield,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole, ADMIN_EMAIL, ADMIN_VK } from "@/components/role-provider";
import { toast } from "sonner";

export function RolePanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile, role, isPsychologist, isAdmin, logout, applyAsPsychologist } = useRole();
  const [showApplyForm, setShowApplyForm] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            Профиль
          </DialogTitle>
        </DialogHeader>

        {!profile ? (
          /* === Гость — обычный пользователь === */
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary/40 p-4 text-center">
              <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Вы вошли как гость</p>
              <p className="text-xs text-muted-foreground mt-1">
                Обычный пользователь: диагнозы, история, аналитика
              </p>
            </div>

            <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-primary" />
                <h4 className="font-display font-semibold text-sm">
                  Вы практикующий психолог?
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Зарегистрируйтесь как психолог — откроется CRM для клиентов,
                история сессий, расширенная аналитика.
                Заявка отправляется администратору на одобрение.
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={() => setShowApplyForm(true)}
              >
                <Award className="h-4 w-4" />
                Стать психологом
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Администратор:{" "}
              <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">
                {ADMIN_EMAIL}
              </a>
              {" · "}
              <a href={ADMIN_VK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                VK
              </a>
            </div>
          </div>
        ) : (
          /* === Зарегистрированный пользователь === */
          <div className="space-y-4">
            {/* Информация о профиле */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {isAdmin ? <Shield className="h-5 w-5" /> : isPsychologist ? <Award className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{profile.name || "Без имени"}</div>
                  <div className="text-xs text-muted-foreground">{profile.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-xs"
                >
                  {role === "admin" ? "Администратор" : role === "psychologist" ? "Психолог" : "Пользователь"}
                </Badge>
                {role === "psychologist" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      profile.approved
                        ? "border-green-400 text-green-700 bg-green-50"
                        : "border-amber-400 text-amber-700 bg-amber-50"
                    }`}
                  >
                    {profile.approved ? (
                      <><Check className="h-3 w-3 mr-0.5" /> одобрен</>
                    ) : (
                      <><Clock className="h-3 w-3 mr-0.5" /> ожидает одобрения</>
                    )}
                  </Badge>
                )}
              </div>

              {profile.specialization && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Специализация:</span> {profile.specialization}
                </div>
              )}
              {profile.experience && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Опыт:</span> {profile.experience}
                </div>
              )}
            </div>

            {/* Статус ожидания */}
            {role === "psychologist" && !profile.approved && (
              <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs leading-relaxed">
                <Clock className="h-4 w-4 inline mr-1 text-amber-600" />
                <strong>Заявка отправлена.</strong> Ожидает одобрения администратором.
                Функционал психолога (CRM клиентов) будет доступен после одобрения.
                <div className="mt-2">
                  Статус заявки можно уточнить у администратора:
                  <br />
                  <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">
                    {ADMIN_EMAIL}
                  </a>
                  {" · "}
                  <a href={ADMIN_VK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    VK
                  </a>
                </div>
              </div>
            )}

            {/* Функционал по ролям */}
            <div className="rounded-lg bg-secondary/40 p-3">
              <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
                Доступный функционал
              </div>
              <ul className="space-y-1.5 text-xs">
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-green-500" />
                  4 режима диагноза (стандарт, нейро, сказки, карты)
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-green-500" />
                  История диагнозов и аналитика
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-green-500" />
                  AI-консультант и конcультант-заявка
                </li>
                {(isPsychologist && profile.approved) || isAdmin ? (
                  <>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-500" />
                      CRM клиентов и история сессий
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 text-green-500" />
                      Привязка диагнозов к клиентам
                    </li>
                  </>
                ) : (
                  <li className="flex items-center gap-1.5 text-muted-foreground">
                    <X className="h-3 w-3 text-muted-foreground/50" />
                    CRM клиентов (только для психологов)
                  </li>
                )}
                {isAdmin && (
                  <li className="flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-green-500" />
                    Управление заявками психологов
                  </li>
                )}
              </ul>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2">
              {!isPsychologist && !isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowApplyForm(true)}
                >
                  <Award className="h-3.5 w-3.5" />
                  Стать психологом
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  logout();
                  toast.info("Вы вышли из профиля.");
                  onOpenChange(false);
                }}
              >
                Выйти
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Форма регистрации психолога */}
      <PsychologistApplyForm
        open={showApplyForm}
        onOpenChange={setShowApplyForm}
        onSubmit={applyAsPsychologist}
      />
    </Dialog>
  );
}

function PsychologistApplyForm({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: {
    name: string;
    email: string;
    specialization: string;
    experience: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [experience, setExperience] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || specialization.trim().length < 5) {
      toast.error("Заполните имя, email и специализацию (минимум 5 символов).");
      return;
    }
    onSubmit({ name, email, specialization, experience });
    toast.success(
      "Заявка отправлена администратору! Откроется почтовый клиент — отправьте письмо для подтверждения.",
      { duration: 8000 }
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Award className="h-5 w-5 text-primary" />
            Регистрация психолога
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-3 text-xs leading-relaxed">
            После заполнения формы заявка отправится администратору на{" "}
            <strong>{ADMIN_EMAIL}</strong>. После одобрения откроется CRM
            для ведения клиентов.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ваше имя *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя Фамилия" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Специализация *</label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="КПТ, гештальт, нейротрансформинг..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Опыт работы</label>
            <Textarea
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="Опишите ваш опыт, образование, сертификаты..."
              className="min-h-[80px]"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Связь с администратором:
            <br />
            <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">
              {ADMIN_EMAIL}
            </a>
            {" · "}
            <a href={ADMIN_VK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              VK
            </a>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              <Send className="h-4 w-4" />
              Отправить заявку
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
