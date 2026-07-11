"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Check,
  Clock,
  Lock,
  LogOut,
  Send,
  Shield,
  User,
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

/**
 * Единый вход по имени и паролю.
 * Программа сама определяет роль:
 * - Пароль админа → роль admin
 * - Имя + пароль пользователя → роль user
 * - Имя + пароль психолога → роль psychologist
 *
 * Пароли хранятся в localStorage (упрощённая модель).
 * В продакшене — серверная авторизация.
 */

// Зарегистрированные пользователи (демо, хранится в localStorage)
const USERS_KEY = "masterkit_users_v1";

type StoredUser = {
  name: string;
  password: string;
  role: "user" | "psychologist";
  email: string;
  specialization?: string;
  approved?: boolean;
};

// Начальные демо-пользователи (при первом запуске)
const INITIAL_USERS: StoredUser[] = [
  {
    name: "Администратор",
    password: ADMIN_PASSWORD,
    role: "user", // будет повышен до admin при входе
    email: ADMIN_EMAIL,
    approved: true,
  },
];

function getUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (raw) return JSON.parse(raw);
    // Первый запуск — сохраняем начальных
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

function saveUser(user: StoredUser) {
  try {
    const users = getUsers();
    const idx = users.findIndex((u) => u.name === user.name);
    if (idx >= 0) users[idx] = user;
    else users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {}
}

export function RolePanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { profile, role, isAdmin, logout, applyAsPsychologist, setProfile } = useRole();
  const [activeTab, setActiveTab] = useState<ProfileTab>("guest");
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Форма входа
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // При открытии — определяем вкладку
  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (role === "psychologist" || isAdmin) setActiveTab("psychologist");
      else if (role === "user" && profile) setActiveTab("user");
      else setActiveTab("guest");
    });
    return () => { active = false; };
  }, [open, role, isAdmin, profile]);

  const displayTab: ProfileTab = activeTab;

  // === ЕДИНЫЙ ВХОД ===
  const handleLogin = () => {
    if (!loginName.trim() || !loginPassword.trim()) {
      toast.error("Введите имя и пароль.");
      return;
    }

    // Проверка админа — имя + пароль
    if (loginName.trim().toLowerCase() === "evikass" && loginPassword === ADMIN_PASSWORD) {
      setProfile({
        role: "admin",
        name: "Администратор",
        email: ADMIN_EMAIL,
        approved: true,
      });
      toast.success("Вход выполнен. Режим администратора.");
      setLoginName("");
      setLoginPassword("");
      setActiveTab("psychologist");
      onOpenChange(false);
      return;
    }

    // Поиск среди зарегистрированных пользователей
    const users = getUsers();
    const found = users.find(
      (u) => u.name.toLowerCase() === loginName.trim().toLowerCase() &&
             u.password === loginPassword
    );

    if (found) {
      setProfile({
        role: found.role,
        name: found.name,
        email: found.email,
        specialization: found.specialization,
        approved: found.approved,
      });
      toast.success(`Добро пожаловать, ${found.name}!`);
      setLoginName("");
      setLoginPassword("");
      setActiveTab(found.role === "psychologist" ? "psychologist" : "user");
      onOpenChange(false);
    } else {
      toast.error("Неверное имя или пароль.");
    }
  };

  // === РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ ===
  const handleRegister = () => {
    if (!loginName.trim() || !loginPassword.trim()) {
      toast.error("Введите имя и пароль для регистрации.");
      return;
    }
    if (loginPassword.length < 4) {
      toast.error("Пароль должен быть минимум 4 символа.");
      return;
    }

    const users = getUsers();
    if (users.find((u) => u.name.toLowerCase() === loginName.trim().toLowerCase())) {
      toast.error("Пользователь с таким именем уже существует.");
      return;
    }

    const newUser: StoredUser = {
      name: loginName.trim(),
      password: loginPassword,
      role: "user",
      email: "",
      approved: false,
    };
    saveUser(newUser);

    setProfile({
      role: "user",
      name: newUser.name,
      email: "",
    });
    toast.success(`Регистрация успешна! Добро пожаловать, ${newUser.name}!`);
    setLoginName("");
    setLoginPassword("");
    setActiveTab("user");
    onOpenChange(false);
  };

  const handleLogout = () => {
    logout();
    setActiveTab("guest");
    toast.info("Вы вышли.");
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
            {role === "psychologist" && !isAdmin && (
              <Badge variant="secondary" className="ml-1 text-xs">
                <Award className="h-3 w-3 mr-0.5" />
                Психолог
              </Badge>
            )}
            {role === "user" && !isAdmin && (
              <Badge variant="outline" className="ml-1 text-xs">
                Пользователь
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Вкладки ролей — только для отображения текущего статуса */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/50 rounded-lg">
          <RoleTabButton active={displayTab === "guest"} onClick={() => { if (profile) handleLogout(); }} icon={User} label="Гость" />
          <RoleTabButton active={displayTab === "user"} onClick={() => { if (!profile) setActiveTab("guest"); }} icon={Check} label="Пользователь" />
          <RoleTabButton active={displayTab === "psychologist"} onClick={() => { if (!profile) setShowApplyForm(true); }} icon={Award} label="Психолог" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={displayTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* === ГОСТЬ — форма входа === */}
            {displayTab === "guest" && (
              <div className="space-y-3">
                <div className="rounded-lg bg-secondary/40 p-4 text-center">
                  <User className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Режим гостя</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Диагнозы, история, аналитика — без входа
                  </p>
                </div>

                {/* Единая форма входа */}
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="font-display font-semibold text-sm">Вход в систему</span>
                  </div>
                  <Input
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Имя"
                    className="text-sm"
                  />
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Пароль"
                    className="text-sm"
                  />
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="w-full" onClick={handleLogin}>
                      <Lock className="h-3.5 w-3.5" />
                      Войти
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" onClick={handleRegister}>
                      <User className="h-3.5 w-3.5" />
                      Регистрация
                    </Button>
                  </div>
                </div>

                {/* Стать психологом */}
                <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award className="h-4 w-4 text-primary" />
                    <span className="font-display font-semibold text-sm">Вы психолог?</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                    Отправьте заявку — после одобрения откроется CRM клиентов
                  </p>
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setShowApplyForm(true)}>
                    <Send className="h-3.5 w-3.5" />
                    Подать заявку
                  </Button>
                </div>
              </div>
            )}

            {/* === ПОЛЬЗОВАТЕЛЬ === */}
            {displayTab === "user" && (
              <div className="space-y-3">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{profile?.name || "Пользователь"}</div>
                      <div className="text-xs text-muted-foreground">{profile?.email || ""}</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                  <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground mb-2">Доступно</div>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> 4 режима диагноза</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> История и аналитика</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> AI-консультант</li>
                    <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Выбор наставника и рейтинг</li>
                    <li className="flex items-center gap-1.5 text-muted-foreground"><X className="h-3 w-3" /> CRM (только для психологов)</li>
                  </ul>
                </div>
                <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                  Выйти
                </Button>
              </div>
            )}

            {/* === ПСИХОЛОГ / АДМИН === */}
            {displayTab === "psychologist" && (
              <PsychologistTab
                profile={profile}
                isAdmin={isAdmin}
                role={role}
                onLogout={handleLogout}
                onShowApplyForm={() => setShowApplyForm(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      {/* Форма заявки психолога */}
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
  profile: { name: string; email: string; specialization?: string; experience?: string; approved?: boolean } | null;
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
            Отправьте заявку — модератор одобрит
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
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Всё из пользователя</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> CRM клиентов и сессий</li>
            {isAdmin && <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-green-500" /> Управление заявками</li>}
          </ul>
        </div>
      ) : (
        <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs leading-relaxed">
          <Clock className="h-4 w-4 inline mr-1 text-amber-600" />
          <strong>Заявка отправлена.</strong> Ожидает одобрения модератором.
          CRM будет доступна после одобрения.
        </div>
      )}

      <Button size="sm" variant="ghost" className="w-full text-destructive" onClick={onLogout}>
        <LogOut className="h-3.5 w-3.5" />
        Выйти
      </Button>
    </div>
  );
}

// === Форма заявки психолога ===
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
      toast.error("Заполните имя, email и специализацию.");
      return;
    }
    onSubmit({ name, email, specialization, experience });
    toast.success("Заявка отправлена модератору.", { duration: 6000 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Award className="h-5 w-5 text-primary" />
            Заявка психолога
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
            <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="КПТ, гештальт..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Опыт</label>
            <Textarea value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="Опыт, образование..." className="min-h-[80px]" />
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
