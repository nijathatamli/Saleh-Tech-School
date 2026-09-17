"use client";

// The teacher dashboard: teacher-dashboard.html's UI (template.generated.tsx)
// driven by its own logic (logic.ts) over the signed-in teacher's real data.
// This file only owns the interactive state the prototype kept in its DCLogic
// class — screen + drill-down, calendar month/day, add-lesson draft,
// attendance marks, score picks, filters, toggles, "lit" animation — plus the
// wiring of its buttons to the router, session and server actions. Lessons,
// attendance and grades persist through actions.ts instead of component state.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { renderTemplate } from "./template.generated";
import { buildVals, mobileKeyForSection, sectionForMobileKey, TIME_SLOTS, type Actions, type Detail, type HwFilter, type Mark, type MobileKey, type NotifPrefs, type Section, type UiState } from "./logic";
import { parseTeacherPath, pathFor, sectionForDetail, type Screen } from "./routes";
import { createHomework, createLesson, deleteLesson, saveAttendance, saveGrades, sendStudentNote, updateTeacherAvatar, updateTeacherProfile } from "./actions";
import { parts } from "@/features/parent-dashboard/az";
import type { TeacherDashboardData } from "./types";

const DEFAULT_NOTIF: NotifPrefs = { submission: true, absence: true, weekly: false };

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Yükləmə alınmadı");
  return body.url as string;
}

export function TeacherDashboard({ data, initialScreen }: { data: TeacherDashboardData; initialScreen: Screen }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Screen: the URL is the source of truth.
  const parsed = parseTeacherPath(pathname.replace(/^\/teacher\/?/, "").split("/").filter(Boolean), searchParams.get("lesson") ?? undefined);
  const screen: Screen = parsed ?? initialScreen;
  const nav: Section = screen.section;
  const detail: Detail = screen.detail;

  const today = parts(data.now);
  const [mnav, setMnav] = useState<MobileKey>(() => mobileKeyForSection(initialScreen.section));
  const [lit, setLit] = useState(false);
  const [hwFilter, setHwFilter] = useState<HwFilter>("Hamısı");
  const [classFilter, setClassFilter] = useState("Hamısı");
  const [notif, setNotif] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const [month, setMonth] = useState({ y: today.y, m: today.m });
  const [pickedDay, setPickedDay] = useState(today.d);
  const [addingLesson, setAddingLesson] = useState(false);
  const [draftClassId, setDraftClassId] = useState<string | null>(null);
  const [draftTime, setDraftTime] = useState(TIME_SLOTS[4]);
  const [attMarks, setAttMarks] = useState<Record<string, Mark>>({});
  const [attSaved, setAttSaved] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [gradesSaved, setGradesSaved] = useState(false);
  const [newHwClassId, setNewHwClassId] = useState<string | null>(null);
  const [now, setNow] = useState(data.now);

  const avatarInput = useRef<HTMLInputElement>(null);
  const litTimer = useRef<ReturnType<typeof setTimeout>>();

  const light = useCallback(() => {
    clearTimeout(litTimer.current);
    litTimer.current = setTimeout(() => setLit(true), 90);
  }, []);

  useEffect(() => {
    light();
    return () => clearTimeout(litTimer.current);
  }, [light]);

  // Re-run the entrance animation and reset per-screen drafts whenever the URL changes.
  const screenKey = pathFor(screen);
  useEffect(() => {
    setLit(false);
    light();
    setAttSaved(false);
    setGradesSaved(false);
    setScores({});
    window.scrollTo({ top: 0 });
  }, [screenKey, light]);

  // Attendance marks start from what is already recorded for the lesson.
  const attendanceLessonId = detail?.kind === "attendance" ? detail.lessonId ?? "" : null;
  useEffect(() => {
    if (attendanceLessonId === null) return;
    const next: Record<string, Mark> = {};
    if (attendanceLessonId) {
      for (const s of data.students) {
        const a = s.attendance.find((x) => x.lessonId === attendanceLessonId);
        if (a) next[s.id] = a.status === "PRESENT" ? "p" : a.status === "LATE" ? "l" : "a";
      }
    }
    setAttMarks(next);
  }, [attendanceLessonId, data.students]);

  // Clock: hydrate with the server's time, then follow the browser's.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [data.now]);

  // Notification preferences have no backend field (no migrations) — remembered per browser.
  const notifKey = `td-notif-${data.teacher.userId}`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(notifKey);
      if (stored) setNotif({ ...DEFAULT_NOTIF, ...JSON.parse(stored) });
    } catch {}
  }, [notifKey]);

  // The site's themed cursor is not part of the approved dashboard UI; its
  // component re-adds the class after ours on a full load, so keep stripping it.
  useEffect(() => {
    const html = document.documentElement;
    const hadCursor = html.classList.contains("custom-cursor-active");
    html.classList.add("td-portal");
    const strip = () => html.classList.remove("custom-cursor-active");
    strip();
    const observer = new MutationObserver(() => {
      if (html.classList.contains("custom-cursor-active")) strip();
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      html.classList.remove("td-portal");
      if (hadCursor) html.classList.add("custom-cursor-active");
    };
  }, []);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  // Every screen change goes through the router (not bare pushState as in the
  // other portals): this dashboard saves on almost every screen and each save
  // calls router.refresh(), which only keeps the mounted component — and its
  // calendar/marks/draft state — when Next's tree matches the current URL.
  const navigate = useCallback(
    (next: Screen, replace = false) => {
      const url = pathFor(next);
      if (url === pathFor(screen)) return;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [screen, router]
  );

  const actions: Actions = {
    go: (href) => {
      navigate({ section: href, detail: null });
      setMnav(mobileKeyForSection(href));
    },
    goMobile: (key) => {
      navigate({ section: sectionForMobileKey(key), detail: null }, true);
      setMnav(key);
      setLit(false);
      light();
    },
    back: () => {
      if (window.history.length > 1) router.back();
      else navigate({ section: nav, detail: null });
    },
    open: (d) => navigate({ section: sectionForDetail(d), detail: d }),
    setHwFilter,
    setClassFilter,
    toggleNotif: (key) => {
      setNotif((s) => {
        const next = { ...s, [key]: !s[key] };
        try {
          localStorage.setItem(notifKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    prevMonth: () => {
      setMonth((m) => (m.m === 0 ? { y: m.y - 1, m: 11 } : { y: m.y, m: m.m - 1 }));
      setPickedDay(1);
    },
    nextMonth: () => {
      setMonth((m) => (m.m === 11 ? { y: m.y + 1, m: 0 } : { y: m.y, m: m.m + 1 }));
      setPickedDay(1);
    },
    pickDay: setPickedDay,
    startAdd: () => setAddingLesson(true),
    cancelAdd: () => setAddingLesson(false),
    setDraftClass: setDraftClassId,
    setDraftTime,
    confirmAdd: (classId, isoDate) => {
      startTransition(async () => {
        const result = await createLesson({ classId, date: isoDate });
        if (result.ok) {
          setAddingLesson(false);
          toast.success("Dərs əlavə edildi.");
          router.refresh();
        } else toast.error("Dərs əlavə edilə bilmədi.");
      });
    },
    removeLesson: (lessonId) => {
      if (!window.confirm("Bu dərs silinsin? Davamiyyət qeydləri də silinəcək.")) return;
      startTransition(async () => {
        const result = await deleteLesson(lessonId);
        if (result.ok) {
          toast.success("Dərs silindi.");
          router.refresh();
        } else toast.error("Dərs silinə bilmədi.");
      });
    },
    markAll: (studentIds) => {
      const next: Record<string, Mark> = {};
      for (const id of studentIds) next[id] = "p";
      setAttMarks(next);
      setAttSaved(false);
    },
    setMark: (studentId, mark) => {
      setAttMarks((m) => ({ ...m, [studentId]: mark }));
      setAttSaved(false);
    },
    saveAttendance: (lessonId) => {
      startTransition(async () => {
        const result = await saveAttendance(lessonId, attMarks);
        if (result.ok) {
          setAttSaved(true);
          toast.success("Davamiyyət yadda saxlanıldı.");
          router.refresh();
        } else toast.error("Davamiyyət yadda saxlanıla bilmədi.");
      });
    },
    pickScore: (submissionId, score) => {
      setScores((s) => ({ ...s, [submissionId]: score }));
      setGradesSaved(false);
    },
    saveGrades: (rows) => {
      const picked = rows.filter((r) => scores[r.submissionId]);
      if (!picked.length) {
        toast("Əvvəlcə bal seçin.");
        return;
      }
      const payload = picked.map((r) => ({
        submissionId: r.submissionId,
        score: Number(scores[r.submissionId]),
        feedback: document.querySelector<HTMLInputElement>(`.td-desktop input[name="${r.inputName}"]`)?.value ?? "",
      }));
      startTransition(async () => {
        const result = await saveGrades(payload);
        if (result.ok) {
          setGradesSaved(true);
          toast.success(`${result.count} təhvil qiymətləndirildi.`);
          router.refresh();
        } else toast.error("Qiymətlər yadda saxlanıla bilmədi.");
      });
    },
    setNewHwClass: setNewHwClassId,
    createHw: (classId) => {
      const read = (name: string) => document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`.td-desktop [name="${name}"]`)?.value ?? "";
      if (!classId) {
        toast.error("Sinif seçin.");
        return;
      }
      startTransition(async () => {
        const result = await createHomework({ classId, title: read("hwTitle"), description: read("hwDescription"), dueDate: read("hwDueDate") });
        if (result.ok) {
          toast.success("Tapşırıq təyin edildi.");
          router.refresh();
          navigate({ section: "/teacher/homework", detail: null });
        } else if (result.error === "no-lesson") toast.error("Bu sinif üçün əvvəlcə təqvimdən dərs əlavə edin.");
        else toast.error("Başlıq və təsvir ən azı 3 simvol, son tarix seçilməlidir.");
      });
    },
    sendNote: (studentId) => {
      const note = document.querySelector<HTMLTextAreaElement>('.td-desktop textarea[name="teacherNote"]');
      const text = note?.value ?? "";
      if (text.trim().length < 3) {
        toast("Əvvəlcə qeyd yazın.");
        return;
      }
      startTransition(async () => {
        const result = await sendStudentNote(studentId, text);
        if (result.ok) {
          toast.success("Qeyd valideynə göndərildi.");
          if (note) note.value = "";
        } else toast.error("Qeyd göndərilə bilmədi.");
      });
    },
    writeParent: (email, studentName) => {
      if (!email) {
        toast("Valideynin e-poçtu yoxdur.");
        return;
      }
      const note = document.querySelector<HTMLTextAreaElement>('.td-desktop textarea[name="teacherNote"]')?.value ?? "";
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(`${studentName} — müəllim qeydi`)}&body=${encodeURIComponent(note)}`;
    },
    changeAvatar: () => avatarInput.current?.click(),
    saveProfile: () => {
      const formData = new FormData();
      document.querySelectorAll<HTMLInputElement>(".td-desktop input[name]").forEach((input) => formData.append(input.name, input.value));
      startTransition(async () => {
        const result = await updateTeacherProfile(formData);
        if (result.ok) {
          toast.success("Dəyişikliklər yadda saxlanıldı.");
          router.refresh();
        } else toast.error("Ad və vəzifə ən azı 3, telefon ən azı 9 simvol olmalıdır.");
      });
    },
    cancelProfile: () => {
      document.querySelectorAll<HTMLInputElement>(".td-desktop input[name]").forEach((input) => {
        input.value = input.defaultValue;
      });
    },
    logout: () => {
      void signOut({ callbackUrl: "/giris" });
    },
  };

  async function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadFile(file);
      await updateTeacherAvatar(url);
      toast.success("Profil şəkli yeniləndi.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükləmə alınmadı");
    }
  }

  const state: UiState = { nav, detail, mnav, lit, hwFilter, classFilter, notif, month, pickedDay, addingLesson, draftClassId, draftTime, attMarks, attSaved, scores, gradesSaved, newHwClassId };
  const vals = buildVals({ ...data, now }, state, actions);

  return (
    <>
      {renderTemplate(vals)}
      <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onAvatarPicked} />
    </>
  );
}
