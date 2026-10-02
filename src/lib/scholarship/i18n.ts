// Languages the scholarship exam is offered in. Safe to import from client components.
export const LANGS = ["az", "en", "ru"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_NAMES: Record<Lang, string> = { az: "Azərbaycan dili", en: "English", ru: "Русский" };
export const isLang = (v: unknown): v is Lang => typeof v === "string" && (LANGS as readonly string[]).includes(v);

type Subject = "LOGIC" | "MATH" | "ENGLISH";
export const SUBJECT_LABELS: Record<Lang, Record<Subject, string>> = {
  az: { LOGIC: "Məntiq", MATH: "Math", ENGLISH: "English" },
  en: { LOGIC: "Logic", MATH: "Math", ENGLISH: "English" },
  ru: { LOGIC: "Логика", MATH: "Математика", ENGLISH: "Английский" },
};

/** "5-6" -> "5–6-cı sinif" (az, from the DB), "Grades 5–6", "5–6 классы". */
export function categoryLabelFor(key: string, azLabel: string, lang: Lang): string {
  if (lang === "az") return azLabel;
  const [a, b] = key.split("-");
  const range = b ? `${a}–${b}` : a;
  if (lang === "en") return b ? `Grades ${range}` : `Grade ${range}`;
  return b ? `${range} классы` : `${range} класс`;
}

export type ExamStrings = {
  loading: string;
  loadFailed: string;
  retry: string;
  hello: (name: string) => string;
  minutes: (n: number) => string;
  rules: string[];
  start: string;
  starting: string;
  notYou: (name: string) => string;
  notYouLink: string;
  question: (i: number, n: number) => string;
  timeLeft: string;
  prev: string;
  next: string;
  finish: string;
  saving: string;
  saveFailed: string;
  saved: string;
  yourAnswer: string;
  typeAnswer: string;
  options: string;
  questions: string;
  questionAria: (subject: string, i: number) => string;
  confirmTitle: string;
  confirmText: string;
  back: string;
  complete: string;
  sending: string;
  submitFailed: string;
  offline: string;
  doneLabel: string;
  thanks: (name: string) => string;
  timedOut: string;
  received: string;
  home: string;
};

export const EXAM_STRINGS: Record<Lang, ExamStrings> = {
  az: {
    loading: "İmtahan yüklənir...",
    loadFailed: "İmtahan məlumatları yüklənmədi.",
    retry: "Yenidən cəhd et",
    hello: (n) => `Hazırsan, ${n}?`,
    minutes: (n) => `${n} dəqiqə`,
    rules: [
      "Düyməyə basdığınız andan sayğac işləməyə başlayır və dayandırılmır.",
      "Cavablarınız avtomatik yadda saxlanılır; istədiyiniz vaxt əvvəlki suallara qayıda bilərsiniz.",
      "İmtahan yalnız bir dəfə verilir. Vaxt bitəndə imtahan avtomatik təqdim olunur.",
      "Sabit internet bağlantınızın olduğundan əmin olun.",
    ],
    start: "İmtahana başla",
    starting: "Yüklənir...",
    notYou: (n) => `Siz ${n} deyilsiniz?`,
    notYouLink: "Başqa şəxs kimi qeydiyyatdan keç",
    question: (i, n) => `Sual ${i} / ${n}`,
    timeLeft: "Qalan vaxt",
    prev: "Əvvəlki",
    next: "Növbəti",
    finish: "Bitir",
    saving: "Yadda saxlanılır...",
    saveFailed: "Yadda saxlanmadı, yenidən cəhd edilir...",
    saved: "Cavab yadda saxlanıldı",
    yourAnswer: "Cavabınız",
    typeAnswer: "Cavabı yazın",
    options: "Cavab variantları",
    questions: "Suallar",
    questionAria: (s, i) => `${s}, sual ${i}`,
    confirmTitle: "İmtahanı tamamlayırsınız?",
    confirmText: "Təqdim etdikdən sonra cavabları dəyişmək mümkün olmayacaq. Bütün sualları nəzərdən keçirdiyinizə əmin olun.",
    back: "Suallara qayıt",
    complete: "İmtahanı tamamla",
    sending: "Göndərilir...",
    submitFailed: "Nəticə göndərilmədi. Yenidən cəhd edin.",
    offline: "Əlaqə qurulmadı. İnternet bağlantınızı yoxlayın.",
    doneLabel: "İmtahan tamamlandı",
    thanks: (n) => `Təşəkkürlər, ${n}!`,
    timedOut: "Vaxt bitdiyi üçün imtahan avtomatik təqdim edildi.",
    received: "Cavablarınız qəbul edildi və məktəb administrasiyasına göndərildi.",
    home: "Ana səhifə",
  },
  en: {
    loading: "Loading the exam...",
    loadFailed: "The exam could not be loaded.",
    retry: "Try again",
    hello: (n) => `Ready, ${n}?`,
    minutes: (n) => `${n} minutes`,
    rules: [
      "The timer starts the moment you press the button and cannot be paused.",
      "Your answers are saved automatically; you can go back to earlier questions at any time.",
      "The exam can be taken only once. When time runs out it is submitted automatically.",
      "Make sure you have a stable internet connection.",
    ],
    start: "Start the exam",
    starting: "Loading...",
    notYou: (n) => `Not ${n}?`,
    notYouLink: "Register as someone else",
    question: (i, n) => `Question ${i} / ${n}`,
    timeLeft: "Time left",
    prev: "Previous",
    next: "Next",
    finish: "Finish",
    saving: "Saving...",
    saveFailed: "Not saved, retrying...",
    saved: "Answer saved",
    yourAnswer: "Your answer",
    typeAnswer: "Type your answer",
    options: "Answer options",
    questions: "Questions",
    questionAria: (s, i) => `${s}, question ${i}`,
    confirmTitle: "Finish the exam?",
    confirmText: "You will not be able to change your answers after submitting. Make sure you have reviewed all the questions.",
    back: "Back to questions",
    complete: "Finish the exam",
    sending: "Submitting...",
    submitFailed: "Your answers could not be submitted. Please try again.",
    offline: "No connection. Check your internet connection.",
    doneLabel: "Exam completed",
    thanks: (n) => `Thank you, ${n}!`,
    timedOut: "Time ran out, so the exam was submitted automatically.",
    received: "Your answers have been received and sent to the school administration.",
    home: "Home page",
  },
  ru: {
    loading: "Экзамен загружается...",
    loadFailed: "Не удалось загрузить экзамен.",
    retry: "Повторить",
    hello: (n) => `Готов, ${n}?`,
    minutes: (n) => `${n} минут`,
    rules: [
      "Таймер запускается в момент нажатия кнопки и не останавливается.",
      "Ответы сохраняются автоматически; вы можете в любое время вернуться к предыдущим вопросам.",
      "Экзамен проводится только один раз. Когда время заканчивается, он отправляется автоматически.",
      "Убедитесь, что у вас стабильное интернет-соединение.",
    ],
    start: "Начать экзамен",
    starting: "Загрузка...",
    notYou: (n) => `Вы не ${n}?`,
    notYouLink: "Зарегистрироваться как другой человек",
    question: (i, n) => `Вопрос ${i} / ${n}`,
    timeLeft: "Осталось времени",
    prev: "Назад",
    next: "Далее",
    finish: "Завершить",
    saving: "Сохранение...",
    saveFailed: "Не сохранено, повторная попытка...",
    saved: "Ответ сохранён",
    yourAnswer: "Ваш ответ",
    typeAnswer: "Введите ответ",
    options: "Варианты ответа",
    questions: "Вопросы",
    questionAria: (s, i) => `${s}, вопрос ${i}`,
    confirmTitle: "Завершить экзамен?",
    confirmText: "После отправки изменить ответы будет нельзя. Убедитесь, что вы просмотрели все вопросы.",
    back: "Вернуться к вопросам",
    complete: "Завершить экзамен",
    sending: "Отправка...",
    submitFailed: "Не удалось отправить ответы. Попробуйте ещё раз.",
    offline: "Нет соединения. Проверьте интернет-соединение.",
    doneLabel: "Экзамен завершён",
    thanks: (n) => `Спасибо, ${n}!`,
    timedOut: "Время вышло, поэтому экзамен был отправлен автоматически.",
    received: "Ваши ответы получены и отправлены администрации школы.",
    home: "На главную",
  },
};
