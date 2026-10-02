"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { PublicQuestion } from "@/lib/scholarship/exam";
import { Rich } from "./rich";
import { CheckCircle2 } from "lucide-react";
import { EXAM_STRINGS, type Lang } from "@/lib/scholarship/i18n";
import { cardClass, fieldClass, outlineButton, primaryButton } from "./styles";

type Answers = Record<string, string | null>;
type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; categoryLabel: string; durationMinutes: number; subjects: { subject: string; label: string }[] }
  | { kind: "running"; questions: PublicQuestion[]; expiresAt: number; offset: number }
  | { kind: "done"; timedOut: boolean };

const SAVE_RETRY_MS = 4000;

function formatClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function ExamRunner({ studentName, categoryLabel, lang }: { studentName: string; categoryLabel: string; lang: Lang }) {
  const router = useRouter();
  const t = EXAM_STRINGS[lang];
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "failed">("saved");

  const answersRef = useRef<Answers>({});
  const dirty = useRef<Map<string, string | null>>(new Map());
  const typedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const autoSubmitted = useRef(false);

  const toLogin = useCallback(() => router.replace("/teqaud/qeydiyyat"), [router]);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // ---------------------------------------------------------------- load
  const load = useCallback(async () => {
    setPhase({ kind: "loading" });
    try {
      const res = await fetch("/api/scholarship/exam", { cache: "no-store" });
      if (res.status === 401) return toLogin();
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setPhase({ kind: "error", message: t.loadFailed });
        return;
      }
      if (data.status === "NOT_STARTED") {
        return setPhase({ kind: "ready", categoryLabel: data.categoryLabel, durationMinutes: data.durationMinutes, subjects: data.subjects });
      }
      if (data.status === "SUBMITTED") return setPhase({ kind: "done", timedOut: !!data.timedOut });
      answersRef.current = data.answers ?? {};
      setAnswers(data.answers ?? {});
      setPhase({
        kind: "running",
        questions: data.questions,
        expiresAt: new Date(data.expiresAt).getTime(),
        offset: new Date(data.serverNow).getTime() - Date.now(),
      });
      // resume on the first unanswered question
      const firstOpen = (data.questions as PublicQuestion[]).findIndex((q) => !(data.answers ?? {})[q.id]);
      setIndex(firstOpen === -1 ? 0 : firstOpen);
    } catch {
      setPhase({ kind: "error", message: `${t.loadFailed} ${t.offline}` });
    }
  }, [router, toLogin, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function start() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/scholarship/exam/start", { method: "POST" });
      if (res.status === 401) return toLogin();
      if (!res.ok) {
        setStartError(t.loadFailed);
        return;
      }
      await load();
    } catch {
      setStartError(t.offline);
    } finally {
      setStarting(false);
    }
  }

  // ---------------------------------------------------------------- autosave
  const flush = useCallback(async () => {
    if (!dirty.current.size) return;
    setSaveState("saving");
    let failed = false;
    for (const [questionId, answer] of Array.from(dirty.current.entries())) {
      try {
        const res = await fetch("/api/scholarship/exam/answer", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer }),
        });
        if (res.status === 401) return toLogin();
        if (res.status === 409) {
          // attempt closed (time ran out or submitted elsewhere): show the stored state
          dirty.current.clear();
          void load();
          return;
        }
        if (res.ok || res.status === 400) {
          if (dirty.current.get(questionId) === answer) dirty.current.delete(questionId);
        } else failed = true;
      } catch {
        failed = true;
      }
    }
    setSaveState(failed || dirty.current.size ? "failed" : "saved");
  }, [load, toLogin]);

  useEffect(() => {
    if (phase.kind !== "running") return;
    const t = setInterval(() => {
      if (dirty.current.size) void flush();
    }, SAVE_RETRY_MS);
    return () => clearInterval(t);
  }, [phase.kind, flush]);

  function record(questionId: string, answer: string | null) {
    answersRef.current = { ...answersRef.current, [questionId]: answer };
    setAnswers(answersRef.current);
    dirty.current.set(questionId, answer);
  }

  function choose(q: PublicQuestion, label: string) {
    record(q.id, answers[q.id] === label ? null : label);
    void flush();
  }

  function typeAnswer(q: PublicQuestion, value: string) {
    record(q.id, value);
    const timers = typedTimers.current;
    clearTimeout(timers.get(q.id));
    timers.set(q.id, setTimeout(() => void flush(), 600));
  }

  // ---------------------------------------------------------------- timer
  const running = phase.kind === "running" ? phase : null;
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const remaining = running ? running.expiresAt - (now + running.offset) : 0;

  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      for (const t of Array.from(typedTimers.current.values())) clearTimeout(t);
      const res = await fetch("/api/scholarship/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersRef.current }),
      });
      if (res.status === 401) return toLogin();
      if (!res.ok) {
        setSubmitError(t.submitFailed);
        autoSubmitted.current = false;
        return;
      }
      dirty.current.clear();
      setConfirming(false);
      setPhase({ kind: "done", timedOut: autoSubmitted.current });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError(t.offline);
      autoSubmitted.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [toLogin, t]);

  useEffect(() => {
    if (running && remaining <= 0 && !autoSubmitted.current) {
      autoSubmitted.current = true;
      void submit();
    }
  }, [running, remaining, submit]);

  // leaving mid-exam is almost always a mistake
  useEffect(() => {
    if (!running) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [running]);

  // ---------------------------------------------------------------- derived
  const questions = running?.questions ?? [];
  const groups = useMemo(() => {
    const out: { subject: string; label: string; items: { q: PublicQuestion; i: number }[] }[] = [];
    questions.forEach((q, i) => {
      let g = out.find((x) => x.subject === q.subject);
      if (!g) out.push((g = { subject: q.subject, label: q.subjectLabel, items: [] }));
      g.items.push({ q, i });
    });
    return out;
  }, [questions]);

  // ---------------------------------------------------------------- views
  if (phase.kind === "loading") {
    return (
      <div className="mx-auto max-w-3xl py-24 text-center text-grey-500 dark:text-zinc-400" role="status">
        {t.loading}
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className={`mx-auto max-w-lg space-y-6 text-center ${cardClass}`}>
        <p role="alert" className="font-semibold text-red-500">{phase.message}</p>
        <button onClick={() => void load()} className={primaryButton}>{t.retry}</button>
      </div>
    );
  }

  if (phase.kind === "done") return <Done timedOut={phase.timedOut} studentName={studentName} categoryLabel={categoryLabel} t={t} />;

  if (phase.kind === "ready") {
    return (
      <div className={`mx-auto max-w-2xl space-y-8 ${cardClass}`}>
        <div className="space-y-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{categoryLabel}</p>
          <h1 className="font-display text-3xl">{t.hello(studentName.split(" ")[0])}</h1>
          <p className="text-sm text-grey-500 dark:text-zinc-400">
            {phase.subjects.map((s) => s.label).join(" · ")} · {t.minutes(phase.durationMinutes)}
          </p>
        </div>
        <ul className="space-y-3">
          {t.rules.map((r) => (
            <li key={r} className="flex items-start gap-3 text-sm text-grey-500 dark:text-zinc-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {r}
            </li>
          ))}
        </ul>
        <button onClick={() => void start()} disabled={starting} className={`${primaryButton} w-full`}>
          {starting ? t.starting : t.start}
        </button>
        {startError && <p role="alert" className="text-center text-sm font-semibold text-red-500">{startError}</p>}
        <p className="text-center text-xs text-grey-500 dark:text-zinc-400">
          {t.notYou(studentName)}{" "}
          <Link href="/teqaud/qeydiyyat" className="font-bold text-primary hover:underline">{t.notYouLink}</Link>
        </p>
      </div>
    );
  }

  const q = questions[index];
  const low = remaining < 5 * 60_000;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary">{q.subjectLabel}</span>
            <span className="text-sm font-bold" aria-live="polite">
              {t.question(q.indexInSubject, q.subjectTotal)}
            </span>
          </div>
          <div
            role="timer"
            aria-label={t.timeLeft}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tabular-nums ${low ? "border-red-400 text-red-500" : "border-grey-200 dark:border-zinc-700"}`}
          >
            <Clock className="h-4 w-4" />
            {formatClock(remaining)}
          </div>
        </div>

        <article key={q.id} className={`${cardClass} animate-in fade-in duration-300`}>
          <div className="space-y-5 text-base leading-relaxed">
            {q.stem && <p className="font-semibold leading-relaxed"><Rich html={q.stem} /></p>}
            {q.images.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="mx-auto max-h-[440px] w-auto max-w-full rounded-2xl border border-grey-100 bg-white dark:border-zinc-700" />
            ))}
          </div>

          {q.typed ? (
            <div className="mt-8">
              <label htmlFor={`typed-${q.id}`} className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">
                {t.yourAnswer}
              </label>
              <input
                id={`typed-${q.id}`}
                value={answers[q.id] ?? ""}
                onChange={(e) => typeAnswer(q, e.target.value)}
                maxLength={40}
                inputMode="text"
                autoComplete="off"
                className={fieldClass}
                placeholder={t.typeAnswer}
              />
            </div>
          ) : (
            <div role="radiogroup" aria-label={t.options} className={`mt-8 grid gap-3 ${q.options.every((o) => !o.html) ? "grid-cols-2 sm:grid-cols-5" : ""}`}>
              {q.options.map((o) => {
                const selected = answers[q.id] === o.label;
                return (
                  <button
                    key={o.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => choose(q, o.label)}
                    className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left text-sm transition-all ${
                      selected ? "border-primary bg-primary/5" : "border-grey-100 hover:border-primary/60 dark:border-zinc-700"
                    }`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected ? "bg-primary text-white" : "bg-grey-100 dark:bg-zinc-800"}`}>
                      {o.label}
                    </span>
                    {o.html && <Rich html={o.html} />}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className={`${outlineButton} !px-6 !py-4`}>
              <ChevronLeft className="h-4 w-4" /> {t.prev}
            </button>
            <p className="hidden text-xs text-grey-500 dark:text-zinc-400 sm:block" role="status">
              {saveState === "saving" ? t.saving : saveState === "failed" ? t.saveFailed : t.saved}
            </p>
            {index < questions.length - 1 ? (
              <button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))} className={`${primaryButton} !px-6 !py-4`}>
                {t.next} <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={() => setConfirming(true)} className={`${primaryButton} !px-6 !py-4`}>{t.finish}</button>
            )}
          </div>
        </article>
      </div>

      <aside className={`${cardClass} h-fit !p-6 lg:sticky lg:top-28`} aria-label={t.questions}>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">{t.questions}</p>
        <div className="space-y-5">
          {groups.map((g) => (
            <div key={g.subject}>
              <p className="mb-2 text-xs font-bold">{g.label}</p>
              <div className="grid grid-cols-5 gap-2">
                {g.items.map(({ q: item, i }) => {
                  const done = !!answers[item.id];
                  return (
                    <button
                      key={item.id}
                      onClick={() => setIndex(i)}
                      aria-label={t.questionAria(g.label, item.indexInSubject)}
                      aria-current={i === index ? "step" : undefined}
                      className={`h-9 rounded-xl text-xs font-bold transition-all ${
                        i === index ? "bg-primary text-white" : done ? "bg-primary/10 text-primary" : "border border-grey-200 text-grey-500 hover:border-primary dark:border-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {item.indexInSubject}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setConfirming(true)} className={`${outlineButton} mt-6 w-full !py-4`}>{t.finish}</button>
      </aside>

      {confirming && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6" style={{ backdropFilter: "blur(4px)" }} onClick={(e) => e.target === e.currentTarget && !submitting && setConfirming(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="finish-title" className="animate-pop-in w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
            <h2 id="finish-title" className="font-display text-xl">{t.confirmTitle}</h2>
            <p className="mt-4 text-sm text-grey-500 dark:text-zinc-400">{t.confirmText}</p>
            {submitError && <p role="alert" className="mt-4 text-sm font-semibold text-red-500">{submitError}</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setConfirming(false)} disabled={submitting} className={`${outlineButton} flex-1 !px-4 !py-4`}>{t.back}</button>
              <button onClick={() => void submit()} disabled={submitting} className={`${primaryButton} flex-1 !px-4 !py-4`}>{submitting ? t.sending : t.complete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Done({ timedOut, studentName, categoryLabel, t }: { timedOut: boolean; studentName: string; categoryLabel: string; t: (typeof EXAM_STRINGS)[Lang] }) {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className={`${cardClass} space-y-5 text-center`}>
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{t.doneLabel}</p>
        <h1 className="font-display text-2xl md:text-3xl">{t.thanks(studentName.split(" ")[0])}</h1>
        <p className="text-sm text-grey-500 dark:text-zinc-400">{categoryLabel}</p>
        {timedOut && (
          <p className="rounded-2xl bg-grey-50 px-5 py-3 text-sm text-grey-500 dark:bg-zinc-950 dark:text-zinc-400">
            {t.timedOut}
          </p>
        )}
        <p className="text-sm text-grey-500 dark:text-zinc-400">{t.received}</p>
      </div>
      <div className="flex justify-center">
        <Link href="/" className={primaryButton}>{t.home}</Link>
      </div>
    </div>
  );
}
