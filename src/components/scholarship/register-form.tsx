"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANGS, LANG_NAMES, categoryLabelFor, type Lang } from "@/lib/scholarship/i18n";
import { PageHeader } from "./page-header";
import { cardClass, fieldClass, fieldErrorClass, labelClass, primaryButton } from "./styles";

type Category = { key: string; label: string };
type Fields = Record<string, string>;

const initial = { name: "", surname: "", category: "", fin: "", phone: "", email: "", code: "" };

type FormStrings = {
  eyebrow: string;
  title: string;
  subtitle: string;
  language: string;
  code: string;
  codeHint: string;
  name: string;
  surname: string;
  grade: string;
  chooseGrade: string;
  fin: string;
  phone: string;
  email: string;
  submit: string;
  sending: string;
  required: string;
  nameLetters: (label: string) => string;
  finFormat: string;
  phoneFormat: string;
  emailFormat: string;
  codeLength: string;
  offline: string;
  generic: string;
};

const STR: Record<Lang, FormStrings> = {
  az: {
    eyebrow: "Reqamsal Gələcək",
    title: "Qeydiyyat",
    subtitle: "Məlumatlarını və kursun verdiyi kodu daxil et. Qeydiyyatdan sonra birbaşa imtahana keçəcəksən.",
    language: "İmtahan dili",
    code: "Kursun verdiyi kod",
    codeHint: "İmtahan yalnız kursumuzun tələbələri üçündür. Kodu müəlliminizdən alın — o, 32 simvoldan ibarətdir və yalnız bir dəfə işləyir.",
    name: "Ad",
    surname: "Soyad",
    grade: "Oxuduğu sinif",
    chooseGrade: "Sinif seçin",
    fin: "FIN nömrəsi",
    phone: "Telefon nömrəsi",
    email: "E-poçt",
    submit: "Qeydiyyatdan keç və imtahana başla",
    sending: "Göndərilir...",
    required: "Bütün xanaları doldurun.",
    nameLetters: (l) => `${l} yalnız hərflərdən ibarət olmalıdır.`,
    finFormat: "FIN 7 simvoldan ibarət olmalıdır (böyük latın hərfləri və rəqəmlər).",
    phoneFormat: "Telefon nömrəsi düzgün deyil (məsələn: +994501234567).",
    emailFormat: "E-poçt ünvanı düzgün deyil.",
    codeLength: "Kod 32 simvoldan ibarət olmalıdır.",
    offline: "Əlaqə qurulmadı. İnternet bağlantınızı yoxlayın.",
    generic: "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.",
  },
  en: {
    eyebrow: "Reqamsal Gələcək",
    title: "Registration",
    subtitle: "Enter your details and the code given by the course. After registering you go straight to the exam.",
    language: "Exam language",
    code: "Course code",
    codeHint: "The exam is only for students of our course. Get the code from your teacher — it has 32 characters and works only once.",
    name: "First name",
    surname: "Last name",
    grade: "Grade",
    chooseGrade: "Choose your grade",
    fin: "FIN number",
    phone: "Phone number",
    email: "E-mail",
    submit: "Register and start the exam",
    sending: "Sending...",
    required: "Please fill in all fields.",
    nameLetters: (l) => `${l} must contain letters only.`,
    finFormat: "The FIN must be 7 characters (capital Latin letters and digits).",
    phoneFormat: "The phone number is not valid (for example: +994501234567).",
    emailFormat: "The e-mail address is not valid.",
    codeLength: "The code must be 32 characters long.",
    offline: "No connection. Check your internet connection.",
    generic: "A technical error occurred. Please try again shortly.",
  },
  ru: {
    eyebrow: "Reqamsal Gələcək",
    title: "Регистрация",
    subtitle: "Введите свои данные и код, выданный курсом. После регистрации вы сразу перейдёте к экзамену.",
    language: "Язык экзамена",
    code: "Код курса",
    codeHint: "Экзамен предназначен только для учеников нашего курса. Получите код у учителя — он состоит из 32 символов и действует только один раз.",
    name: "Имя",
    surname: "Фамилия",
    grade: "Класс",
    chooseGrade: "Выберите класс",
    fin: "Номер FIN",
    phone: "Номер телефона",
    email: "Эл. почта",
    submit: "Зарегистрироваться и начать экзамен",
    sending: "Отправка...",
    required: "Заполните все поля.",
    nameLetters: (l) => `Поле «${l}» должно содержать только буквы.`,
    finFormat: "FIN должен состоять из 7 символов (заглавные латинские буквы и цифры).",
    phoneFormat: "Номер телефона указан неверно (например: +994501234567).",
    emailFormat: "Адрес электронной почты указан неверно.",
    codeLength: "Код должен состоять из 32 символов.",
    offline: "Нет соединения. Проверьте интернет-соединение.",
    generic: "Произошла техническая ошибка. Попробуйте ещё раз немного позже.",
  },
};

// Messages the API sends (Azerbaijani) -> shown in the chosen language.
const SERVER: Record<string, Record<"en" | "ru", string>> = {
  "FIN artıq qeydiyyatdan keçib.": { en: "This FIN is already registered.", ru: "Этот FIN уже зарегистрирован." },
  "Bu kod artıq istifadə olunub.": { en: "This code has already been used.", ru: "Этот код уже использован." },
  "Kod düzgün deyil. 32 simvoldan ibarət kursun verdiyi kodu daxil edin.": { en: "The code is not valid. Enter the 32-character code given by the course.", ru: "Код недействителен. Введите 32-символьный код, выданный курсом." },
  "Çox sayda cəhd edildi. Bir az sonra yenidən cəhd edin.": { en: "Too many attempts. Please try again later.", ru: "Слишком много попыток. Попробуйте позже." },
  "Seçdiyiniz sinif düzgün deyil.": { en: "The selected grade is not valid.", ru: "Выбранный класс недопустим." },
  "Bütün xanaları doldurun.": { en: "Please fill in all fields.", ru: "Заполните все поля." },
  "Texniki xəta baş verdi. Bir az sonra yenidən cəhd edin.": { en: "A technical error occurred. Please try again shortly.", ru: "Произошла техническая ошибка. Попробуйте ещё раз немного позже." },
};
const localize = (msg: string, lang: Lang) => (lang === "az" ? msg : SERVER[msg]?.[lang] ?? msg);

function validate(v: typeof initial, t: FormStrings): Fields {
  const e: Fields = {};
  const nameOk = (s: string) => s.trim().length >= 2 && /^[\p{L}][\p{L}'’ .-]*$/u.test(s.trim());
  if (!v.name.trim()) e.name = t.required;
  else if (!nameOk(v.name)) e.name = t.nameLetters(t.name);
  if (!v.surname.trim()) e.surname = t.required;
  else if (!nameOk(v.surname)) e.surname = t.nameLetters(t.surname);
  if (!v.category) e.category = t.required;
  const fin = v.fin.replace(/\s+/g, "").toUpperCase();
  if (!fin) e.fin = t.required;
  else if (!/^[A-Z0-9]{7}$/.test(fin)) e.fin = t.finFormat;
  const phone = v.phone.trim().replace(/[\s().-]/g, "");
  if (!phone) e.phone = t.required;
  else if (!/^\+?\d{9,15}$/.test(phone)) e.phone = t.phoneFormat;
  const email = v.email.trim();
  if (!email) e.email = t.required;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = t.emailFormat;
  const code = v.code.replace(/[\s-]/g, "");
  if (!code) e.code = t.required;
  else if (code.length !== 32) e.code = t.codeLength;
  return e;
}

export function RegisterForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("az");
  const t = STR[lang];
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Fields>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors((x) => ({ ...x, [k]: "" }));
  };

  function changeLang(next: Lang) {
    setLang(next);
    setErrors({});
    setFormError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const local = validate(values, t);
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const res = await fetch("/api/scholarship/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, language: lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // registered and signed in by the response cookie: straight into the exam
        router.push("/teqaud/imtahan");
        return;
      }
      if (data.fields) setErrors(Object.fromEntries(Object.entries(data.fields as Fields).map(([k, m]) => [k, localize(m, lang)])));
      setFormError(data.error ? localize(data.error, lang) : t.generic);
    } catch {
      setFormError(t.offline);
    } finally {
      setBusy(false);
    }
  }

  const cls = (k: string) => `${fieldClass} ${errors[k] ? fieldErrorClass : ""}`;
  const err = (k: string) =>
    errors[k] ? (
      <p id={`${k}-error`} role="alert" className="mt-2 text-xs font-semibold text-red-500">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: string) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `${k}-error` : undefined });

  return (
    <>
      <PageHeader eyebrow={t.eyebrow} title={t.title}>
        {t.subtitle}
      </PageHeader>
      <form onSubmit={submit} noValidate lang={lang} className={`mx-auto max-w-xl space-y-6 ${cardClass}`}>
        <fieldset>
          <legend className={labelClass}>{t.language}</legend>
          <div role="radiogroup" aria-label={t.language} className="grid grid-cols-3 gap-2">
            {LANGS.map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={lang === l}
                onClick={() => changeLang(l)}
                className={`rounded-2xl border-2 px-3 py-3 text-sm font-bold transition-all ${
                  lang === l ? "border-primary bg-primary/5 text-primary" : "border-grey-100 hover:border-primary/60 dark:border-zinc-700"
                }`}
              >
                {LANG_NAMES[l]}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="code" className={labelClass}>{t.code}</label>
          <input id="code" name="code" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={40} value={values.code} onChange={set("code")} className={`${cls("code")} font-mono uppercase tracking-wider`} placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" {...aria("code")} />
          <p className="mt-2 text-xs text-grey-500 dark:text-zinc-400">{t.codeHint}</p>
          {err("code")}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>{t.name}</label>
            <input id="name" name="name" autoComplete="given-name" value={values.name} onChange={set("name")} className={cls("name")} placeholder="Əli" {...aria("name")} />
            {err("name")}
          </div>
          <div>
            <label htmlFor="surname" className={labelClass}>{t.surname}</label>
            <input id="surname" name="surname" autoComplete="family-name" value={values.surname} onChange={set("surname")} className={cls("surname")} placeholder="Vəliyev" {...aria("surname")} />
            {err("surname")}
          </div>
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>{t.grade}</label>
          <select id="category" name="category" value={values.category} onChange={set("category")} className={cls("category")} {...aria("category")}>
            <option value="">{t.chooseGrade}</option>
            {categories.map((c) => (
              <option key={c.key} value={c.key}>{categoryLabelFor(c.key, c.label, lang)}</option>
            ))}
          </select>
          {err("category")}
        </div>

        <div>
          <label htmlFor="fin" className={labelClass}>{t.fin}</label>
          <input id="fin" name="fin" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={12} value={values.fin} onChange={set("fin")} className={`${cls("fin")} uppercase tracking-widest`} placeholder="1A2B3C4" {...aria("fin")} />
          {err("fin")}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className={labelClass}>{t.phone}</label>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone} onChange={set("phone")} className={cls("phone")} placeholder="+994 50 123 45 67" {...aria("phone")} />
            {err("phone")}
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>{t.email}</label>
            <input id="email" name="email" type="email" inputMode="email" autoComplete="email" value={values.email} onChange={set("email")} className={cls("email")} placeholder="ad@numune.az" {...aria("email")} />
            {err("email")}
          </div>
        </div>

        {formError && (
          <p role="alert" className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300">
            {formError}
          </p>
        )}

        <button type="submit" disabled={busy || categories.length === 0} className={`${primaryButton} w-full`}>
          {busy ? t.sending : t.submit}
        </button>
      </form>
    </>
  );
}
