"use client";

import { useState } from "react";
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

type ProfileTab = "guest" | "user" | "psychologist";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "jenuari11";

export function RolePanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile, role, isPsychologist, isAdmin, logout, applyAsPsychologist, setProfile } = useRole();
  const [activeTab, setActiveTab] = useState<ProfileTab>("guest");
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  // При открытии панели — устанавливаем активную вкладку по роли
  useState(() => {
    if (role === "psychologist" || isAdmin) setActiveTab("psychologist");
    else if (role === "user") setActiveTab("user");
    else setActiveTab("guest");
  });

  // Если уже залогинен — показываем его вкладку
  const displayTab: ProfileTab = profile
    ? role === "psychologist" || isAdmin
      ? "psychologist"
      : "user"
    : activeTab;

  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setProfile({
        role: "admin",
        name: "Администратор",
        email: ADMIN_EMAIL,
        approved: true,
      });
      toast.success("Вход выполнен. Режим администратора.");
      setShowAdminLogin(false);
      setAdminPassword("");
      setActiveTab("psychologist");
      onOpenChange(false);
    } else {
      toast.error("Неверный пароль.");
      setAdminPassword("");
    }
  };

  const handleBecomeUser = () => {
    setProfile({
      role: "user",
      name: profile?.name || "Пользователь",
      email: profile?.email || "",
    });
    setActiveTab("user");
    toast.info("Вы вошли как пользователь.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            Профиль
            {isAdmin && (
              <Badge className="ml-1 text-xs">
                <Shield className="h-3 w-3 mr-0.5" />
                Админ
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Вкладки ролей */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-lg">
          <RoleTabButton
            active={displayTab === "guest"}
            onClick={() => {
              if (profile) {
                logout();
                toast.info("Вы вышли. Режим гостя.");
              }
              setActiveTab("guest");
            }}
            icon={User}
            label="Гость"
          />
          <RoleTabButton
            active={displayTab === "user"}
            onClick={() => {
              if (!profile) {
                handleBecomeUser();
              } else if (role !== "user" && !isAdmin) {
                setProfile({ role: "user", name: profile.name, email: profile.email });
                setActiveTab("user");
              } else {
                setActiveTab("user");
              }
            }}
            icon={Check}
            label="Пользователь"
          />
          <RoleTabButton
            active={displayTab === "psychologist"}
            onClick={() => {
              if (role === "psychologist" || isAdmin) {
                setActiveTab("psychologist");
              } else {
                setShowApplyForm(true);
              }
            }}
            icon={Award}
            label="Психолог"
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={displayTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* === ВКЛАДКА: ГОСТЬ === */}
            {displayTab === "guest" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/40 p-4 text-center">
                  <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Режим гостя</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Диагнозы, история, аналитика — без регистрации
                  </p>
                </div>

                <Button size="sm" variant="outline" className="w-full" onClick={handleBecomeUser}>
                  <Check className="h-4 w-4" />
                  Войти как пользователь
                </Button>

                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-display font-semibold text-sm">Вы психолог?</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    Зарегистрируйтесь — откроется CRM клиентов и история сессий
                  </p>
                  <Button size="sm" className="w-full" onClick={() => setShowApplyForm(true)}>
                    <Award className="h-4 w-4" />
                    Стать психологом
                  </Button>
                </div>

                {/* Админ-вход — заметная кнопка */}
                {!showAdminLogin ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-primary/20 text-muted-foreground hover:text-primary"
                    onClick={() => setShowAdminLogin(true)}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Вход для администратора
                  </Button>
                ) : (
                  <div className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="text-xs font-semibold">Вход администратора</span>
                    </div>
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                      placeholder="Пароль администратора"
                      className="text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setShowAdminLogin(false);
                          setAdminPassword("");
                        }}
                      >
                        Отмена
                      </Button>
                      <Button size="sm" className="flex-1" onClick={handleAdminLogin}>
                        <Shield className="h-3.5 w-3.5" />
                        Войти
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === ВКЛАДКА: ПОЛЬЗОВАТЕЛЬ === */}
            {displayTab === "user" && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{profile?.name || "Пользователь"}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || "без email"}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-secondary/40 p-3">
                  <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">
                    Доступно
                  </div>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> 4 режима диагноза</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> История и аналитика</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> AI-консультант</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Выбор наставника и рейтинг</li>
                    <li className="flex items-center gap-1.5 text-muted-foreground"><X className="h-3 w-3" /> CRM клиентов (только для психологов)</li>
                  </ul>
                </div>

                <Button size="sm" variant="outline" className="w-full" onClick={() => setShowApplyForm(true)}>
                  <Award className="h-3.5 w-3.5" />
                  Стать психологом
                </Button>

                <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={() => { logout(); setActiveTab("guest"); }}>
                  Выйти в режим гостя
                </Button>
              </div>
            )}

            {/* === ВКЛАДКА: ПСИХОЛОГ === */}
            {displayTab === "psychologist" && (
              <PsychologistTab
                profile={profile}
                isAdmin={isAdmin}
                role={role}
                onLogout={() => { logout(); setActiveTab("guest"); }}
                onShowApplyForm={() => setShowApplyForm(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Контакты админа */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Связь с администратором:{" "}
          <a href={`mailto:${ADMIN_EMAIL}`} className="text-primary hover:underline">{ADMIN_EMAIL}</a>
          {" · "}
          <a href={ADMIN_VK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">VK</a>
        </div>
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

// === Кнопка вкладки ===
function RoleTabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2 rounded-md text-xs transition-all ${
        active ? "bg-background shadow-sm text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

// === Вкладка: Психолог ===
function PsychologistTab({
  profile,
  isAdmin,
  role,
  onLogout,
  onShowApplyForm,
}: {
  profile: { name: string; email: string; specialization?: string; experience?: string; approved?: boolean; role?: string } | null;
  isAdmin: boolean;
  role: string;
  onLogout: () => void;
  onShowApplyForm: () => void;
}) {
  if (!profile || (role !== "psychologist" && !isAdmin)) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-secondary/40 p-4 text-center">
          <Award className="h-10 w-10 mx-auto mb-2 text-primary" />
          <p className="text-sm font-medium">Регистрация психолога</p>
          <p className="text-xs text-muted-foreground mt-1">
            Заполните заявку — администратор одобрит и откроет CRM
          </p>
        </div>
        <Button size="sm" className="w-full" onClick={onShowApplyForm}>
          <Send className="h-4 w-4" />
          Заполнить заявку
        </Button>
      </div>
    );
  }

  const approved = profile.approved || isAdmin;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isAdmin ? <Shield className="h-5 w-5" /> : <Award className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-semibold text-sm">{profile.name}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{isAdmin ? "Администратор" : "Психолог"}</Badge>
          <Badge variant="outline" className={`text-xs ${approved ? "border-green-400 text-green-700 bg-green-50" : "border-amber-400 text-amber-700 bg-amber-50"}`}>
            {approved ? <><Check className="h-3 w-3 mr-0.5" /> одобрен</> : <><Clock className="h-3 w-3 mr-0.5" /> ожидает</>}
          </Badge>
        </div>
        {profile.specialization && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="font-medium">Специализация:</span> {profile.specialization}
          </div>
        )}
      </div>

      {approved ? (
        <div className="rounded-lg bg-secondary/40 p-3">
          <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Доступно</div>
          <ul className="space-y-1 text-xs">
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Всё из режима пользователя</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> CRM клиентов и история сессий</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Привязка диагнозов к клиентам</li>
            {isAdmin && <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Управление заявками</li>}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs leading-relaxed">
          <Clock className="h-4 w-4 inline mr-1 text-amber-600" />
          <strong>Заявка отправлена.</strong> Ожидает одобрения администратора.
          CRM будет доступна после одобрения.
        </div>
      )}

      <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={onLogout}>
        Выйти
      </Button>
    </div>
  );
}

// === Форма регистрации психолога ===
function PsychologistApplyForm({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string; specialization: string; experience: string }) => void;
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
    toast.success("Заявка отправлена! Откроется почта — отправьте письмо.", { duration: 8000 });
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
            Заявка отправится администратору на <strong>{ADMIN_EMAIL}</strong>.
            После одобрения откроется CRM клиентов.
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Имя *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя Фамилия" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Специализация *</label>
            <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="КПТ, гештальт, нейротрансформинг..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Опыт работы</label>
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Опыт, образование, сертификаты..." className="min-h-[80px]" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button className="flex-1" onClick={handleSubmit}>
              <Send className="h-4 w-4" /> Отправить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
