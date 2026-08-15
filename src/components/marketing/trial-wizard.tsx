"use client";

import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, ChevronLeft, PartyPopper } from "lucide-react";
import type { Course } from "@prisma/client";
import { Button } from "@/components/ui/button";
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

  if (success) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
          <PartyPopper className="h-9 w-9" />
        </div>
        <h1 className="mt-8 font-display text-2xl md:text-3xl">Təşəkkürlər, {parentName.split(" ")[0]}!</h1>
        <p className="mt-4 text-grey-500 dark:text-zinc-400">
          {studentName} üçün <span className="font-bold text-secondary dark:text-white">{selectedCourse?.name}</span>{" "}
          kursuna sınaq dərsi tələbiniz qeydə alındı. Komandamız tezliklə{" "}
          <span className="font-bold text-secondary dark:text-white">{parentPhone}</span> nömrəsi ilə sizinlə əlaqə
          saxlayacaq.
        </p>
        <div className="mt-8 space-y-3 rounded-2xl border border-grey-100 p-6 text-left text-sm dark:border-zinc-800">
          <div className="flex justify-between"><span className="text-grey-500">Tarix</span><span className="font-bold">{date && formatAzDayMonth(date)}</span></div>
          <div className="flex justify-between"><span className="text-grey-500">Vaxt</span><span className="font-bold">{time}</span></div>
          <div className="flex justify-between"><span className="text-grey-500">Kurs</span><span className="font-bold">{selectedCourse?.name}</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-16">
      {/* Progress indicator */}
      <div className="mb-12 flex items-center justify-center">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i < step
                    ? "bg-primary text-white"
                    : i === step
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-grey-100 text-grey-500 dark:bg-zinc-800"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className="mt-2 hidden text-[10px] font-bold uppercase tracking-widest text-grey-500 sm:block">
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 sm:w-16 ${i < step ? "bg-primary" : "bg-grey-100 dark:bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Age */}
      {step === 0 && (
        <div>
          <h2 className="text-center font-display text-2xl">Övladınızın yaşını seçin</h2>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {ageGroups.map((g) => (
              <button
                key={g.range}
                onClick={() => setAgeRange(g.range)}
                className={`rounded-2xl border-2 p-6 text-left transition-all ${
                  ageRange === g.range ? "border-primary bg-primary/5" : "border-grey-100 dark:border-zinc-800"
                }`}
              >
                <p className="font-display text-2xl">{g.range}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">
                  {g.label}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Course */}
      {step === 1 && (
        <div>
          <h2 className="text-center font-display text-2xl">Kurs seçin</h2>
          <div className="mt-8 space-y-3">
            {filteredCourses.map((c) => (
              <button
                key={c.id}
                onClick={() => setCourseId(c.id)}
                className={`flex w-full items-center justify-between rounded-2xl border-2 p-5 text-left transition-all ${
                  courseId === c.id ? "border-primary bg-primary/5" : "border-grey-100 dark:border-zinc-800"
                }`}
              >
                <div>
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="mt-1 text-xs text-grey-500 dark:text-zinc-400">{c.shortDesc}</p>
                </div>
                {courseId === c.id && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date */}
      {step === 2 && (
        <div>
          <h2 className="text-center font-display text-2xl">Tarix seçin</h2>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {days.map((d) => (
              <button
                key={d.toISOString()}
                onClick={() => setDate(d)}
                className={`rounded-2xl border-2 p-4 text-center transition-all ${
                  date?.toDateString() === d.toDateString()
                    ? "border-primary bg-primary/5"
                    : "border-grey-100 dark:border-zinc-800"
                }`}
              >
                <p className="text-[10px] font-bold uppercase text-grey-500">
                  {formatAzWeekdayShort(d)}
                </p>
                <p className="mt-1 font-display text-lg">{d.getDate()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Time */}
      {step === 3 && (
        <div>
          <h2 className="text-center font-display text-2xl">Vaxt seçin</h2>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {timeSlots.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`rounded-2xl border-2 p-4 text-center font-bold transition-all ${
                  time === t ? "border-primary bg-primary/5 text-primary" : "border-grey-100 dark:border-zinc-800"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Parent info */}
      {step === 4 && (
        <div>
          <h2 className="text-center font-display text-2xl">Əlaqə məlumatları</h2>
          <div className="mt-8 space-y-5">
            <div>
              <Label>Valideynin adı</Label>
              <Input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Ad Soyad" />
            </div>
            <div>
              <Label>Telefon nömrəsi</Label>
              <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+994 50 123 45 67" />
            </div>
            <div>
              <Label>Uşağın adı</Label>
              <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Ad Soyad" />
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
          </div>
        </div>
      )}

      {/* Nav buttons */}
      <div className="mt-12 flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className={`flex items-center gap-1 text-sm font-bold text-grey-500 ${step === 0 ? "invisible" : ""}`}
        >
          <ChevronLeft className="h-4 w-4" /> Geri
        </button>

        {step < steps.length - 1 ? (
          <Button disabled={!canProceed()} onClick={() => setStep((s) => s + 1)} size="lg">
            Növbəti
          </Button>
        ) : (
          <Button
            disabled={!parentName || !parentPhone || !studentName || isPending}
            onClick={handleSubmit}
            size="lg"
          >
            {isPending ? "Göndərilir..." : "Sınaq dərsinə yazıl"}
          </Button>
        )}
      </div>
    </div>
  );
}
