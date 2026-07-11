"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Edit2,
  Mail,
  Phone,
  Plus,
  Trash2,
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
import { toast } from "sonner";

type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
  sessions: Session[];
};

type Session = {
  id: string;
  date: string;
  mode: string;
  summary: string | null;
  situation: string | null;
  levelId: number | null;
  beingnessId: string | null;
  nextStep: string | null;
  notes: string | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Активен", color: "bg-green-100 text-green-700" },
  paused: { label: "Пауза", color: "bg-amber-100 text-amber-700" },
  finished: { label: "Завершён", color: "bg-gray-100 text-gray-500" },
};

const MODE_LABELS: Record<string, string> = {
  standard: "Стандарт",
  neuro: "Нейро",
  tale: "Сказка",
  card: "Карта",
};

export function ClientsPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (res.ok) {
        setClients(data);
      }
    } catch {
      toast.error("Не удалось загрузить клиентов.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadClients();
    }
  }, [open, loadClients]);

  const handleAdd = async (data: Partial<Client>) => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success("Клиент добавлен.");
      setShowAddForm(false);
      void loadClients();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleUpdate = async (id: string, data: Partial<Client>) => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка обновления");
      toast.success("Сохранено.");
      setEditingClient(null);
      void loadClients();
    } catch {
      toast.error("Не удалось сохранить.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить клиента и все его сессии?")) return;
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      toast.success("Клиент удалён.");
      setSelectedClient(null);
      void loadClients();
    } catch {
      toast.error("Не удалось удалить.");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Users className="h-5 w-5 text-primary" />
            Клиенты
            <Badge variant="secondary" className="ml-1">{clients.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        {selectedClient ? (
          /* === КАРТОЧКА КЛИЕНТА === */
          <ClientDetail
            client={selectedClient}
            onBack={() => setSelectedClient(null)}
            onEdit={() => setEditingClient(selectedClient)}
            onDelete={() => handleDelete(selectedClient.id)}
          />
        ) : (
          /* === СПИСОК КЛИЕНТОВ === */
          <div className="space-y-3">
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Добавить клиента
            </Button>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Загрузка...
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">
                  Пока нет клиентов. Нажмите «Добавить клиента».
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clients.map((c) => {
                  const status = STATUS_LABELS[c.status] ?? STATUS_LABELS.active;
                  const sessionCount = c.sessions?.length ?? 0;
                  const lastSession = c.sessions?.[0];
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer"
                      onClick={() => setSelectedClient(c)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{c.name}</span>
                            <Badge variant="outline" className={`text-xs ${status.color}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {sessionCount} сессий
                            </span>
                            {lastSession && (
                              <span>последняя: {formatDate(lastSession.date)}</span>
                            )}
                            {c.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {c.phone}
                              </span>
                            )}
                          </div>
                          {c.tags && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {c.tags.split(",").map((t, i) => (
                                <Badge key={i} variant="secondary" className="text-xs py-0">
                                  {t.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {/* Форма добавления */}
      <ClientForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAdd}
      />

      {/* Форма редактирования */}
      <ClientForm
        open={!!editingClient}
        onOpenChange={(v) => !v && setEditingClient(null)}
        client={editingClient}
        onSubmit={(data) => editingClient && handleUpdate(editingClient.id, data)}
      />
    </Dialog>
  );
}

// === КАРТОЧКА КЛИЕНТА С ИСТОРИЕЙ ===

function ClientDetail({
  client,
  onBack,
  onEdit,
  onDelete,
}: {
  client: Client;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="p-1 h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-semibold">{client.name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {client.email}
              </span>
            )}
            <span>
              <Calendar className="h-3 w-3 inline mr-0.5" />
              с {new Date(client.createdAt).toLocaleDateString("ru-RU")}
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} className="p-1 h-8 w-8">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="p-1 h-8 w-8 text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Теги и заметки */}
      {client.tags && (
        <div className="flex flex-wrap gap-1.5">
          {client.tags.split(",").map((t, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {t.trim()}
            </Badge>
          ))}
        </div>
      )}
      {client.notes && (
        <div className="rounded-lg bg-secondary/40 p-3 text-sm text-foreground/80 leading-relaxed">
          {client.notes}
        </div>
      )}

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">
            {client.sessions?.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">сессий</div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">
            {client.sessions?.filter((s) => s.mode === "standard").length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">стандарт</div>
        </div>
        <div className="rounded-lg border bg-card p-2.5 text-center">
          <div className="font-display text-xl font-bold text-primary">
            {client.sessions?.filter((s) => s.mode === "neuro").length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground">нейро</div>
        </div>
      </div>

      {/* История сессий */}
      <div>
        <h4 className="font-display font-semibold text-sm mb-2">История сессий</h4>
        {client.sessions?.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Пока нет сессий. Сессии добавляются автоматически при диагнозе,
            если выбран клиент.
          </div>
        ) : (
          <div className="space-y-2">
            {client.sessions?.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {MODE_LABELS[s.mode] ?? s.mode}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(s.date)}
                  </span>
                </div>
                {s.summary && (
                  <p className="text-sm text-foreground/80 leading-relaxed mb-1">
                    {s.summary}
                  </p>
                )}
                {s.nextStep && (
                  <div className="text-xs text-muted-foreground italic mt-1">
                    → {s.nextStep}
                  </div>
                )}
                {s.notes && (
                  <div className="text-xs mt-1 pt-1 border-t text-foreground/70">
                    📝 {s.notes}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// === ФОРМА ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ===

function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client?: Client | null;
  onSubmit: (data: Partial<Client>) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      if (client) {
        setName(client.name);
        setPhone(client.phone ?? "");
        setEmail(client.email ?? "");
        setTags(client.tags ?? "");
        setNotes(client.notes ?? "");
        setStatus(client.status);
      } else {
        setName("");
        setPhone("");
        setEmail("");
        setTags("");
        setNotes("");
        setStatus("active");
      }
    });
    return () => { active = false; };
  }, [client, open]);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Имя обязательно.");
      return;
    }
    onSubmit({ name, phone, email, tags, notes, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <User className="h-5 w-5 text-primary" />
            {client ? "Редактировать" : "Новый клиент"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Имя *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя клиента" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Телефон</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Теги (через запятую)</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="тревога, отношения, деньги" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Заметки</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация о клиенте..."
              className="min-h-[80px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Статус</label>
            <div className="flex gap-2">
              {Object.entries(STATUS_LABELS).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs border-2 transition-all ${
                    status === key ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button className="flex-1" onClick={handleSubmit}>
              {client ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
