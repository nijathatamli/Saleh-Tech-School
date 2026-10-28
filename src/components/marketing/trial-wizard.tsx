"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, Check, CheckCircle2, ChevronLeft, PartyPopper } from "lucide-react";
import type { Course } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrialBooking } from "@/app/(marketing)/sinaq-dersi/actions";

const ageGroups = [
  { range: "6-8", label: "Tech Explorer", age: 7 },
  { range: "9-11", label: "Young Developer", age: 10 },
  { range: "12-14", label: "Tech Builder", age: 13 },
  { range: "15-18", label: "Future Engineer", age: 16 },
];

const timeSlots = ["10:00", "12:00", "14:00", "16:00", "18:00", "19:30"];

// Browser Intl support for the "az" locale is inconsistent (falls back to
// English weekday abbreviations, mangles long month names), so format
// Azerbaijani date labels by hand instead of via toLocaleDateString.
const azWeekdaysShort = ["Baz", "B.e", "Ç.a", "Ç", "C.a", "C", "Şən"];
const azMonths = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];

function formatAzWeekdayShort(d: Date) {
  return azWeekdaysShort[d.getDay()];
}
function formatAzDayMonth(d: Date) {
  return `${d.getDate()} ${azMonths[d.getMonth()]}`;
}

function nextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

const steps = ["Yaş", "Kurs", "Tarix", "Vaxt", "Məlumat"];

export function TrialWizard({ courses, defaultCourseSlug }: { courses: Course[]; defaultCourseSlug?: string }) {
  const [step, setStep] = useState(0);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(
    courses.find((c) => c.slug === defaultCourseSlug)?.id ?? null
  );
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [studentName, setStudentName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const days = useMemo(() => nextDays(14), []);
  const selectedAge = ageGroups.find((g) => g.range === ageRange)?.age ?? 10;
  const filteredCourses = courses.filter((c) => selectedAge >= c.minAge && selectedAge <= c.maxAge);
  const selectedCourse = courses.find((c) => c.id === courseId);

  function canProceed() {
    if (step === 0) return !!ageRange;
    if (step === 1) return !!courseId;
    if (step === 2) return !!date;
    if (step === 3) return !!time;
    return true;
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createTrialBooking({
        parentName,
        parentPhone,
        studentName,
        studentAge: selectedAge,
        courseId: courseId ?? undefined,
        preferredDate: (date ?? new Date()).toISOString(),
        preferredTime: time ?? timeSlots[0],
      });
      if (result.status === "success") {
        setSuccess(true);
      } else if (result.status === "error") {
        setError(result.message);
      }
    });
  }

  // one look for every choice button: frosted when idle, solid orange with white text when chosen (strong contrast), a tick in the corner
  const choice = (on: boolean) =>
    `group relative rounded-2xl border p-5 text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary ${
      on
        ? "border-transparent bg-[linear-gradient(135deg,#F26A00,#D14F00)] text-white shadow-[0_12px_28px_-10px_rgba(209,79,0,0.7)] scale-[1.02]"
        : "border-grey-200 bg-white/85 text-secondary shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-primary hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:border-primary dark:hover:bg-white/20"
    }`;
  const tick = (on: boolean) =>
    on ? (
      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#D14F00]">
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    ) : null;
  const sub = (on: boolean) => (on ? "text-white/90" : "text-grey-800/75 dark:text-zinc-300");
  const primaryBtn =
    "inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#F26A00,#D14F00)] px-8 py-4 text-[15px] font-bold text-white shadow-[0_12px_28px_-10px_rgba(209,79,0,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-10px_rgba(209,79,0,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.97] disabled:pointer-events-none disabled:bg-none disabled:bg-grey-200 disabled:text-grey-800/70 disabled:shadow-none dark:disabled:bg-zinc-700 dark:disabled:text-zinc-300";

  if (success) {
    return (
      <div className="relative isolate mx-auto max-w-lg py-16">
        <div className="glass glass-strong relative rounded-[2rem] p-8 text-center text-secondary dark:text-white md:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F26A00,#D14F00)] text-white shadow-[0_12px_28px_-10px_rgba(209,79,0,0.7)]">
            <PartyPopper className="h-9 w-9" />
          </div>
          <h1 className="mt-8 font-display text-2xl md:text-3xl">Təşəkkürlər, {parentName.split(" ")[0]}!</h1>
          <p className="mt-4 leading-relaxed text-grey-800/80 dark:text-zinc-300">
            {studentName} üçün <span className="font-bold text-secondary dark:text-white">{selectedCourse?.name}</span>{" "}
            kursuna sınaq dərsi tələbiniz qeydə alındı. Komandamız tezliklə{" "}
            <span className="font-bold text-secondary dark:text-white">{parentPhone}</span> nömrəsi ilə sizinlə əlaqə
            saxlayacaq.
          </p>
          <div className="glass-chip mt-8 space-y-3 rounded-2xl p-6 text-left text-sm">
            <div className="flex justify-between"><span className="text-grey-800/70 dark:text-zinc-300">Tarix</span><span className="font-bold">{date && formatAzDayMonth(date)}</span></div>
            <div className="flex justify-between"><span className="text-grey-800/70 dark:text-zinc-300">Vaxt</span><span className="font-bold">{time}</span></div>
            <div className="flex justify-between"><span className="text-grey-800/70 dark:text-zinc-300">Kurs</span><span className="font-bold">{selectedCourse?.name}</span></div>
          </div>
        </div>
      </div>
    );
  }

  const titles = ["Övladınızın yaşını seçin", "Kurs seçin", "Tarix seçin", "Vaxt seçin", "Əlaqə məlumatları"];

  return (
    <div className="mx-auto max-w-2xl py-12 md:py-16">
      <div className="glass glass-strong relative rounded-[2rem] p-6 text-secondary dark:text-white sm:p-10">
        {/* Progress indicator */}
        <div className="mb-10 flex items-start justify-center" role="list" aria-label="Addımlar">
          {steps.map((label, i) => (
            <div key={label} className="flex items-start" role="listitem" aria-current={i === step ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                    i < step
                      ? "bg-[linear-gradient(135deg,#F26A00,#D14F00)] text-white"
                      : i === step
                      ? "bg-[linear-gradient(135deg,#F26A00,#D14F00)] text-white shadow-[0_0_0_5px_rgba(242,106,0,0.22)]"
                      : "bg-white text-grey-800 ring-1 ring-grey-200 dark:bg-white/10 dark:text-zinc-200 dark:ring-white/20"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`mt-2 hidden text-[11px] font-bold uppercase tracking-wider sm:block ${i <= step ? "text-secondary dark:text-white" : "text-grey-800/60 dark:text-zinc-400"}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="mx-2 mt-5 h-1 w-6 overflow-hidden rounded-full bg-grey-200/80 dark:bg-white/15 sm:w-14">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#F26A00,#D14F00)] transition-all duration-500" style={{ width: i < step ? "100%" : "0%" }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#C2410C] dark:text-orange-300">Addım {step + 1} / {steps.length}</p>
        <h2 className="mt-2 text-center font-display text-2xl md:text-3xl">{titles[step]}</h2>

        {/* Step 0: Age */}
        {step === 0 && (
          <div className="mt-8 grid grid-cols-2 gap-4">
            {ageGroups.map((g) => (
              <button key={g.range} onClick={() => setAgeRange(g.range)} className={`${choice(ageRange === g.range)} p-6`}>
                {tick(ageRange === g.range)}
                <p className="font-display text-2xl">{g.range}</p>
                <p className={`mt-1 text-xs font-bold uppercase tracking-widest ${sub(ageRange === g.range)}`}>{g.label}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 1: Course */}
        {step === 1 && (
          <div className="mt-8 space-y-3">
            {filteredCourses.map((c) => (
              <button key={c.id} onClick={() => setCourseId(c.id)} className={`${choice(courseId === c.id)} flex w-full items-center justify-between pr-14`}>
                {tick(courseId === c.id)}
                <div>
                  <p className="text-[15px] font-bold">{c.name}</p>
                  <p className={`mt-1 text-xs ${sub(courseId === c.id)}`}>{c.shortDesc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Date */}
        {step === 2 && (
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {days.map((d) => {
              const on = date?.toDateString() === d.toDateString();
              return (
                <button key={d.toISOString()} onClick={() => setDate(d)} className={`${choice(on)} p-4 text-center`}>
                  <span className={`block text-[11px] font-bold uppercase ${sub(on)}`}>{formatAzWeekdayShort(d)}</span>
                  <span className="mt-1 block font-display text-xl">{d.getDate()}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 3: Time */}
        {step === 3 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {timeSlots.map((t) => (
              <button key={t} onClick={() => setTime(t)} className={`${choice(time === t)} p-4 text-center text-base font-bold`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Parent info */}
        {step === 4 && (
          <div className="mt-8 space-y-5">
            <div>
              <Label className="font-bold text-secondary dark:text-white">Valideynin adı</Label>
              <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Ad Soyad" className="mt-2 border-grey-200 bg-white py-3.5 text-base text-secondary shadow-[0_1px_3px_rgba(0,0,0,0.08)] placeholder:text-grey-800/50 focus:border-primary dark:border-white/25 dark:bg-white/10 dark:text-white dark:shadow-none dark:placeholder:text-zinc-400" />
            </div>
            <div>
              <Label className="font-bold text-secondary dark:text-white">Telefon nömrəsi</Label>
              <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+994 50 123 45 67" className="mt-2 border-grey-200 bg-white py-3.5 text-base text-secondary shadow-[0_1px_3px_rgba(0,0,0,0.08)] placeholder:text-grey-800/50 focus:border-primary dark:border-white/25 dark:bg-white/10 dark:text-white dark:shadow-none dark:placeholder:text-zinc-400" />
            </div>
            <div>
              <Label className="font-bold text-secondary dark:text-white">Uşağın adı</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ad Soyad" className="mt-2 border-grey-200 bg-white py-3.5 text-base text-secondary shadow-[0_1px_3px_rgba(0,0,0,0.08)] placeholder:text-grey-800/50 focus:border-primary dark:border-white/25 dark:bg-white/10 dark:text-white dark:shadow-none dark:placeholder:text-zinc-400" />
            </div>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
          </div>
        )}

        {/* Nav buttons */}
        <div className="mt-10 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`flex items-center gap-1 rounded-full px-3 py-2 text-sm font-bold text-grey-800 transition-colors hover:text-primary dark:text-zinc-200 ${step === 0 ? "invisible" : ""}`}
          >
            <ChevronLeft className="h-4 w-4" /> Geri
          </button>

          {step < steps.length - 1 ? (
            <button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} className={primaryBtn}>
              Növbəti <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button disabled={!parentName || !parentPhone || !studentName || isPending} onClick={handleSubmit} className={primaryBtn}>
              {isPending ? "Göndərilir..." : "Sınaq dərsinə yazıl"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
