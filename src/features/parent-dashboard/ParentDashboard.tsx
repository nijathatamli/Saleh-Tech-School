"use client";

// The parent portal: parent-dashboard.html's UI (template.generated.tsx) driven
// by its own logic (logic.ts) over the signed-in parent's real data. This file
// only owns the interactive state the prototype kept in its DCLogic class —
// current screen, "lit" animation flag, month/filter/language/toggle state —
// plus the wiring of its buttons to the app's router, session and actions.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { setLocaleAction } from "@/i18n/actions";
import { renderTemplate } from "./template.generated";
import { buildVals, mobileKeyForRoute, routeForMobileKey, HOME, ROUTES, type Actions, type HwFilter, type Lang, type MobileKey, type Route, type UiState } from "./logic";
import { markAllAsRead, markOneAsRead, updateAvatar, updateNotificationPrefs, updateProfile } from "./actions";
import type { NotificationPrefs, PortalData } from "./types";

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

export function ParentDashboard({ data, initialRoute, initialChildIndex }: { data: PortalData; initialRoute: Route; initialChildIndex: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Screen: the URL is the source of truth; pushState keeps switching instant like the file.
  const nav: Route = isRoute(pathname) ? pathname : initialRoute;
  const [mnav, setMnav] = useState<MobileKey>(() => mobileKeyForRoute(initialRoute));
  const [lit, setLit] = useState(false);
  const [childIndex, setChildIndex] = useState(initialChildIndex);
  const [month, setMonth] = useState<string | null>(null);
  const [hwFilter, setHwFilter] = useState<HwFilter>("Hamısı");
  const [lang, setLang] = useState<Lang>(data.locale === "en" ? "EN" : "AZ");
  const [notif, setNotif] = useState<NotificationPrefs>(data.parent.notifications);
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

  // Clock: hydrate with the server's time, then follow the browser's.
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [data.now]);

  // Keep the toggles in step with the server after a refresh.
  useEffect(() => {
    setNotif(data.parent.notifications);
  }, [data.parent.notifications]);

  // The site's themed cursor is not part of the approved portal UI.
  useEffect(() => {
    const html = document.documentElement;
    const hadCursor = html.classList.contains("custom-cursor-active");
    html.classList.add("pp-portal");
    html.classList.remove("custom-cursor-active");
    return () => {
      html.classList.remove("pp-portal");
      if (hadCursor) html.classList.add("custom-cursor-active");
    };
  }, []);

  const childParam = useCallback(
    (index: number) => (index > 0 && data.children[index] ? `?child=${data.children[index].id}` : ""),
    [data.children]
  );

  const setUrl = useCallback(
    (href: Route, index: number, replace = false) => {
      const url = `${href}${childParam(index)}`;
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    [childParam]
  );

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router]);

  const actions: Actions = {
    go: (href) => {
      if (href !== nav) setUrl(href, childIndex);
      setMnav(mobileKeyForRoute(href));
      setLit(false);
      light();
      window.scrollTo({ top: 0 });
    },
    goMobile: (key) => {
      const href = routeForMobileKey(key);
      if (href !== nav) setUrl(href, childIndex, true);
      setMnav(key);
      setLit(false);
      light();
    },
    setMonth,
    setHwFilter,
    setLang: (l) => {
      setLang(l);
      startTransition(() => {
        void setLocaleAction(l.toLowerCase());
      });
    },
    toggleNotif: (key) => {
      const next = { ...notif, [key]: !notif[key] };
      setNotif(next); // optimistic — the switch flips at once, the row is saved behind it
      startTransition(async () => {
        await updateNotificationPrefs(next);
      });
    },
    switchChild: () => {
      if (data.children.length < 2) return;
      const next = (childIndex + 1) % data.children.length;
      setChildIndex(next);
      setUrl(nav, next, true);
      setLit(false);
      light();
    },
    selectChild: (index, href) => {
      setChildIndex(index);
      setUrl(href, index);
      setMnav(mobileKeyForRoute(href));
      setLit(false);
      light();
      window.scrollTo({ top: 0 });
    },
    logout: () => {
      void signOut({ callbackUrl: "/giris" });
    },
    goLesson: (link) => {
      if (link) window.open(link, "_blank", "noopener,noreferrer");
      else actions.go("/parent/attendance");
    },
    markAllRead: () => {
      startTransition(async () => {
        await markAllAsRead();
        router.refresh();
      });
    },
    openNotification: (id) => {
      startTransition(async () => {
        await markOneAsRead(id);
        router.refresh();
      });
    },
    saveProfile: () => {
      const inputs = document.querySelectorAll<HTMLInputElement>(".pp-desktop input[name]");
      const formData = new FormData();
      inputs.forEach((input) => formData.append(input.name, input.value));
      startTransition(async () => {
        const result = await updateProfile(formData);
        if (result?.ok) {
          toast.success("Dəyişikliklər yadda saxlanıldı.");
          router.refresh();
        } else {
          toast.error("Ad ən azı 3, telefon ən azı 9 simvol olmalıdır.");
        }
      });
    },
    cancelProfile: () => {
      document.querySelectorAll<HTMLInputElement>(".pp-desktop input[name]").forEach((input) => {
        input.value = input.defaultValue;
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
      await updateAvatar(url);
      toast.success("Profil şəkli yeniləndi.");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yükləmə alınmadı");
    }
  }

  const state: UiState = { nav, mnav, lit, childIndex, month, hwFilter, lang, notif };
  const vals = buildVals({ ...data, now }, state, actions);

  return (
    <>
      {renderTemplate(vals)}
      <input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onAvatarPicked} />
    </>
  );
}

export { HOME };
