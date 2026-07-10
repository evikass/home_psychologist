/**
 * Международная система (i18n) — переводы UI-строк для RU и EN.
 *
 * Использование:
 *   const { t, lang, setLang } = useI18n();
 *   t("hero.title") // → "Где вы застряли" или "Where you're stuck"
 */

export type Lang = "ru" | "en";

type Dict = Record<string, string>;

const ru: Dict = {
  // Header
  "header.title": "Домашний психолог",
  "header.subtitle": "ИИ-диагностика и самотерапия",
  "header.history": "История",
  "header.analytics": "Аналитика",
  "header.about": "О методике",
  "header.beta": "бета",

  // Hero
  "hero.badge": "Самотерапия · ИИ-наставник",
  "hero.demo_badge": "Демо-версия",
  "hero.title": "Где вы застряли —\nи как из этого выйти",
  "hero.subtitle": "Опишите свою ситуацию своими словами — как жалобное письмо другу. ИИ определит эмоциональное состояние, застрявшие эмоции, базовые потребности и подберёт точные практики для самотерапии.",
  "hero.demo_warning": "⚠️ Это демо-версия на GitHub Pages — использует предзаготовленные диагнозы по ключевым словам. Для живого ИИ-анализа используйте полную версию.",
  "hero.cta": "Начать диагностику",
  "hero.tag.levels": "7 уровней развития",
  "hero.tag.emotions": "7 базовых эмоций",
  "hero.tag.pits": "Эмоциональные ямы",
  "hero.tag.processings": "Проработки на сейчас",

  // Form
  "form.label": "Опишите свою ситуацию или цель своими словами",
  "form.placeholder": "Пишите как есть — как жаловались бы близкому другу. Не подбирайте слова, не редактируйте. Чем честнее — тем точнее диагноз. Например: «Я уже год не могу уйти с работы, которая меня душит. Каждый вечер прихожу разбитой, но утром иду снова. Боюсь, что больше нигде не возьмут, и злюсь на себя за слабость...»",
  "form.clear": "Очистить",
  "form.submit": "Получить диагноз",
  "form.submitting": "ИИ анализирует…",
  "form.analyze_time": "Анализ занимает 10–25 секунд",
  "form.examples_label": "Не знаете с чего начать? Попробуйте пример:",

  // Examples
  "example.relationships": "Усталость от отношений",
  "example.money": "Нет денег, не хватает",
  "example.realization": "Не реализуюсь в деле",
  "example.opinion": "Зависимость от мнения",

  // Loading
  "loading.1": "Читаю ваше письмо…",
  "loading.2": "Определяю уровень развития…",
  "loading.3": "Выявляю застрявшие эмоции…",
  "loading.4": "Проверяю на эмоциональные ямы…",
  "loading.5": "Подбираю проработки…",
  "loading.hint": "ИИ читает ваши слова, сверяет их с картой 7 уровней и 7 эмоций методики «Мастер Кит».",

  // Result
  "result.title": "Ваш диагноз",
  "result.new": "Новый запрос",
  "result.what_happens": "Что происходит",
  "result.level": "Уровень развития",
  "result.emotions": "Застрявшие эмоции",
  "result.geometry": "Геометрия сознания",
  "result.geometry_hint": "В какой бытийности вы сейчас отождествлены — подсвечено на схеме.",
  "result.pit": "Эмоциональная яма",
  "result.processings": "Проработки на сейчас",
  "result.processings_hint": "Сделайте по порядку. Каждая — 5–20 минут, с контактом с телом. Отмечайте выполненные — прогресс сохранится.",
  "result.done": "сделал(а)",
  "result.next_step": "Следующий шаг сегодня",
  "result.try_again": "Попробовать ещё раз",
  "result.check_env": "Проверить переменные окружения →",
  "result.failed": "Не получилось.",
  "result.click_segment": "Нажмите на сегмент — увидите детали и путь перехода",
  "result.why": "Почему",
  "result.duration": "Результат",
  "result.iterative": "После проработки опишите, что изменилось — получите следующий слой.",

  // History
  "history.title": "История диагнозов",
  "history.empty": "История пуста.",
  "history.empty_hint": "Сделайте первый диагноз — он автоматически сохранится здесь.",
  "history.total": "Всего:",
  "history.clear_all": "Очистить всё",
  "history.beingnesses": "Бытийности",
  "history.levels": "Уровни развития",

  // Analytics
  "analytics.title": "Аналитика",
  "analytics.period_week": "Неделя",
  "analytics.period_month": "Месяц",
  "analytics.period_all": "Всё время",
  "analytics.no_data": "Нет данных за этот период.",
  "analytics.no_data_hint": "Сделайте несколько диагнозов — и здесь появится аналитика.",
  "analytics.diagnoses": "Диагнозов",
  "analytics.done": "Проработок сделано",
  "analytics.unique_beingnesses": "Уникальных бытийностей",
  "analytics.avg_level": "Средний уровень",
  "analytics.trend": "Динамика по дням",
  "analytics.distribution": "Распределение бытийностей",
  "analytics.levels_dist": "Уровни развития",
  "analytics.export": "Экспорт для работы с наставником",
  "analytics.export_hint": "Скачайте всю историю в JSON",
  "analytics.download_json": "Скачать JSON",

  // Onboarding
  "onboarding.welcome": "Добро пожаловать",
  "onboarding.convenience_title": "Просто как разговор с другом",
  "onboarding.convenience_subtitle": "Никаких тестов, регистраций и сложных терминов. Вы пишете — приложение понимает.",
  "onboarding.scope_title": "Глубокая карта сознания",
  "onboarding.scope_subtitle": "Приложение построено на полной базе методики Дарьи Трутневой.",
  "onboarding.levels_title": "7 уровней — для чего",
  "onboarding.levels_subtitle": "Каждый уровень — это базовая задача, которую нужно закрыть, чтобы двигаться дальше. Нельзя перепрыгнуть.",
  "onboarding.community_title": "Сообщество «Мастер Кит»",
  "onboarding.next": "Далее",
  "onboarding.prev": "Назад",
  "onboarding.start": "Начать",
  "onboarding.step": "Листайте, чтобы узнать больше",
  "onboarding.ready": "Готово к старту",

  // Methodology
  "methodology.title": "О методе самотерапии",
  "methodology.principles": "Принципы:",
  "methodology.levels": "7 уровней развития",
  "methodology.emotions": "7 базовых эмоций",
  "methodology.concepts": "Ключевые концепции методики",
  "methodology.disclaimer": "Приложение создано как инструмент самопознания и не заменяет работу с психологом или сертифицированным наставником методики.",

  // Errors
  "error.too_short": "Опишите ситуацию подробнее — хотя бы 2–3 предложения.",
  "error.too_long": "Текст слишком длинный — до 8000 символов.",
  "error.generic": "Что-то пошло не так.",
  "error.no_ai": "ИИ не вернул ответ. Попробуйте ещё раз.",
  "error.parse": "Не удалось разобрать диагноз ИИ. Попробуйте переформулировать или повторить.",

  // Voice
  "voice.button": "Голос",
  "voice.recording": "Говорите…",
  "voice.transcribing": "Распознаю…",
  "voice.too_short": "Запись слишком короткая. Попробуйте ещё раз.",
  "voice.no_mic": "Микрофон недоступен",
  "voice.recognized": "Распознано",

  // Theme
  "theme.light": "Светлая тема",
  "theme.dark": "Тёмная тема",
  "theme.palette": "Цветовая палитра",
  "theme.palette_note": "Палитры активны в светлой теме",

  // Misc
  "misc.now_here": "Сейчас вы здесь",
  "misc.where_to_go": "Куда двигаться →",
  "misc.resource": "Ресурс",
  "misc.trap": "Ловушка",
};

const en: Dict = {
  // Header
  "header.title": "Home Psychologist",
  "header.subtitle": "AI diagnosis and self-therapy",
  "header.history": "History",
  "header.analytics": "Analytics",
  "header.about": "About",
  "header.beta": "beta",

  // Hero
  "hero.badge": "Self-therapy · AI guide",
  "hero.demo_badge": "Demo",
  "hero.title": "Where you're stuck —\nand how to get out",
  "hero.subtitle": "Describe your situation in your own words — like a letter to a friend. AI will determine your emotional state, stuck emotions, basic needs, and suggest precise practices for self-therapy.",
  "hero.demo_warning": "⚠️ This is a demo version on GitHub Pages — uses pre-prepared diagnoses by keywords. For live AI analysis, use the full version.",
  "hero.cta": "Start diagnosis",
  "hero.tag.levels": "7 development levels",
  "hero.tag.emotions": "7 basic emotions",
  "hero.tag.pits": "Emotional pits",
  "hero.tag.processings": "Practices for now",

  // Form
  "form.label": "Describe your situation or goal in your own words",
  "form.placeholder": "Write as you would complain to a close friend. Don't choose words, don't edit. The more honest — the more accurate the diagnosis. For example: \"I've been unable to leave a job that suffocates me for a year now. Every evening I come home broken, but in the morning I go again. I'm afraid no one else will hire me, and I'm angry at myself for being weak...\"",
  "form.clear": "Clear",
  "form.submit": "Get diagnosis",
  "form.submitting": "AI is analyzing…",
  "form.analyze_time": "Analysis takes 10–25 seconds",
  "form.examples_label": "Don't know where to start? Try an example:",

  // Examples
  "example.relationships": "Relationship fatigue",
  "example.money": "No money, not enough",
  "example.realization": "Not realizing myself",
  "example.opinion": "Dependence on opinions",

  // Loading
  "loading.1": "Reading your letter…",
  "loading.2": "Determining development level…",
  "loading.3": "Identifying stuck emotions…",
  "loading.4": "Checking for emotional pits…",
  "loading.5": "Selecting practices…",
  "loading.hint": "AI reads your words, comparing them with the map of 7 levels and 7 emotions of the \"Master Kit\" method.",

  // Result
  "result.title": "Your diagnosis",
  "result.new": "New request",
  "result.what_happens": "What's happening",
  "result.level": "Development level",
  "result.emotions": "Stuck emotions",
  "result.geometry": "Geometry of consciousness",
  "result.geometry_hint": "Which beingness you're identified with now is highlighted on the diagram.",
  "result.pit": "Emotional pit",
  "result.processings": "Practices for now",
  "result.processings_hint": "Do them in order. Each takes 5–20 minutes, with body contact. Mark completed ones — progress is saved.",
  "result.done": "done",
  "result.next_step": "Next step today",
  "result.try_again": "Try again",
  "result.check_env": "Check environment variables →",
  "result.failed": "Didn't work.",
  "result.click_segment": "Click a segment to see details and transition path",
  "result.why": "Why",
  "result.duration": "Result",
  "result.iterative": "After the practice, describe what changed — get the next layer.",

  // History
  "history.title": "Diagnosis history",
  "history.empty": "History is empty.",
  "history.empty_hint": "Make your first diagnosis — it will be automatically saved here.",
  "history.total": "Total:",
  "history.clear_all": "Clear all",
  "history.beingnesses": "Beingnesses",
  "history.levels": "Development levels",

  // Analytics
  "analytics.title": "Analytics",
  "analytics.period_week": "Week",
  "analytics.period_month": "Month",
  "analytics.period_all": "All time",
  "analytics.no_data": "No data for this period.",
  "analytics.no_data_hint": "Make several diagnoses — and analytics will appear here.",
  "analytics.diagnoses": "Diagnoses",
  "analytics.done": "Practices done",
  "analytics.unique_beingnesses": "Unique beingnesses",
  "analytics.avg_level": "Avg level",
  "analytics.trend": "Daily dynamics",
  "analytics.distribution": "Beingness distribution",
  "analytics.levels_dist": "Development levels",
  "analytics.export": "Export for work with a mentor",
  "analytics.export_hint": "Download all history as JSON",
  "analytics.download_json": "Download JSON",

  // Onboarding
  "onboarding.welcome": "Welcome",
  "onboarding.convenience_title": "As simple as talking to a friend",
  "onboarding.convenience_subtitle": "No tests, registrations, or complex terms. You write — the app understands.",
  "onboarding.scope_title": "Deep map of consciousness",
  "onboarding.scope_subtitle": "The app is built on the full database of Darya Trutneva's method.",
  "onboarding.levels_title": "7 levels — what for",
  "onboarding.levels_subtitle": "Each level is a basic task that needs to be closed before moving forward. You can't skip.",
  "onboarding.community_title": "Master Kit Community",
  "onboarding.next": "Next",
  "onboarding.prev": "Back",
  "onboarding.start": "Start",
  "onboarding.step": "Scroll to learn more",
  "onboarding.ready": "Ready to start",

  // Methodology
  "methodology.title": "About the self-therapy method",
  "methodology.principles": "Principles:",
  "methodology.levels": "7 development levels",
  "methodology.emotions": "7 basic emotions",
  "methodology.concepts": "Key concepts of the method",
  "methodology.disclaimer": "The app is created as a self-discovery tool and does not replace work with a psychologist or certified mentor of the method.",

  // Errors
  "error.too_short": "Describe the situation in more detail — at least 2–3 sentences.",
  "error.too_long": "Text too long — up to 8000 characters.",
  "error.generic": "Something went wrong.",
  "error.no_ai": "AI returned no response. Try again.",
  "error.parse": "Couldn't parse the AI diagnosis. Try rephrasing or repeating.",

  // Voice
  "voice.button": "Voice",
  "voice.recording": "Speaking…",
  "voice.transcribing": "Recognizing…",
  "voice.too_short": "Recording too short. Try again.",
  "voice.no_mic": "Microphone unavailable",
  "voice.recognized": "Recognized",

  // Theme
  "theme.light": "Light theme",
  "theme.dark": "Dark theme",
  "theme.palette": "Color palette",
  "theme.palette_note": "Palettes active in light theme",

  // Misc
  "misc.now_here": "You are here now",
  "misc.where_to_go": "Where to go →",
  "misc.resource": "Resource",
  "misc.trap": "Trap",
};

const DICTS: Record<Lang, Dict> = { ru, en };

export function translate(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? DICTS.ru[key] ?? key;
}
