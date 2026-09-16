"use client";

// The student dashboard: student-dashboard.html's UI (template.generated.tsx)
// driven by its own logic (logic.ts) over the signed-in student's real data.
// This file only owns the interactive state the prototype kept in its DCLogic
// class — current screen, "lit" animation flag, the XP count-up, the homework
// filter — plus the wiring of its buttons to the app's router, session and
// actions.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { renderTemplate } from "./template.generated";
import { buildVals, mobileKeyForRoute, routeForMobileKey, HOME, ROUTES, type Actions, type HwFilter, type MobileKey, type Route, type UiState } from "./logic";
import { submitHomework, updateStudentAvatar } from "./actions";
import type { StudentDashboardData } from "./types";

function isRoute(path: string): path is Route {
  return (ROUTES as readonly string[]).includes(path);
}

async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Yükləmə alınmadı");
  return body.url as string;
}

export function StudentDashboard({ data, initialRoute }: { data: StudentDashboardData; initialRoute: Route }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Screen: the URL is the source of truth; pushState keeps switching instant like the file.
  const nav: Route = isRoute(pathname) ? pathname : initialRoute;
  const [mnav, setMnav] = useState<MobileKey>(() => mobileKeyForRoute(initialRoute));
  const [lit, setLit] = useState(false);
  const [xp, setXp] = useState(0);
  const [hwFilter, setHwFilter] = useState<HwFilter>("Hamısı");
  const [now, setNow] = useState(data.now);

  const avatarInput = useRef<HTMLInputElement>(null);
  const litTimer = useRef<ReturnType<typeof setTimeout>>();
  const xpTimer = useRef<ReturnType<typeof setInterval>>();

  const light = useCallback(() => {
    clearTimeout(litTimer.current);
    litTimer.current = setTimeout(() => setLit(true), 90);
  }, []);

  // The file's countXp(): eases the XP figure up to its value over 1.1s.
  const countXp = useCallback(
    (target: number) => {
      const start = performance.now();
      clearInterval(xpTimer.current);
      xpTimer.current = setInterval(() => {
        const p = Math.min(1, (performance.now() - start) / 1100);
        const eased = 1 - Math.pow(1 - p, 3);
        setXp(Math.round(target * eased));
        if (p >= 1) clearInterval(xpTimer.current);
      }, 32);
    },
    []
  );

  useEffect(() => {
    light();
    countXp(data.student.xp);
    return () => {
      clearTimeout(litTimer.current);
      clearInterval(xpTimer.current);
    };
  }, [light, countXp, data.student.xp]);

  // Clock: hydrate with the server's time, then follow the browser's.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [data.now]);

  // The site's themed cursor is not part of the approved dashboard UI. Its
  // component (mounted in the root layout) adds the class in its own effect,
  // which runs after ours on a full page load — so keep removing it while the
  // dashboard is on screen.
  useEffect(() => {
    const html = document.documentElement;
    const hadCursor = html.classList.contains("custom-cursor-active");
    html.classList.add("sd-portal");
    const strip = () => html.classList.remove("custom-cursor-active");
    strip();
    const observer = new MutationObserver(() => {
      if (html.classList.contains("custom-cursor-active")) strip();
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => {
      observer.disconnect();
      html.classList.remove("sd-portal");
      if (hadCursor) html.classList.add("custom-cursor-active");
    };
  }, []);

  const setUrl = useCallback((href: Route, replace = false) => {
    if (replace) window.history.replaceState(null, "", href);
    else window.history.pushState(null, "", href);
  }, []);

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  const actions: Actions = {
    go: (href) => {
      if (href !== nav) setUrl(href);
      setMnav(mobileKeyForRoute(href));
      setLit(false);
      light();
      window.scrollTo({ top: 0 });
    },
    goMobile: (key) => {
      const href = routeForMobileKey(key);
      if (href !== nav) setUrl(href, true);
      setMnav(key);
      setLit(false);
      light();
    },
    setHwFilter,
    logout: () => {
      void signOut({ callbackUrl: "/giris" });
    },
    goLesson: (link) => {
      if (link) window.open(link, "_blank", "noopener,noreferrer");
      else actions.go("/student/attendance");
    },
    startTask: () => actions.go("/student/homework"),
    continueCourse: (slug) => {
      if (slug) router.push(`/kurslar/${slug}`);
      else actions.go("/student/homework");
    },
    submitHomework: (submissionId) => {
      startTransition(async () => {
        const result = await submitHomework(submissionId);
        if (result.ok) {
          toast.success("Tapşırıq təhvil verildi.");
          router.refresh();
        } else {
          toast.error("Tapşırıq təhvil verilə bilmədi.");
        }
      });
    },
    changeAvatar: () => avatarInput.current?.click(),
  };

  async function onAvatarPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadFile(file);
      await updateStudentAvatar(url);
      toast.success("Profil şəkli yeniləndi.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükləmə alınmadı");
    }
  }

  const state: UiState = { nav, mnav, lit, xp, hwFilter };
  const vals = buildVals({ ...data, now }, state, actions);

  return (
    <>
      {renderTemplate(vals)}
      <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onAvatarPicked} />
    </>
  );
}

export { HOME };
