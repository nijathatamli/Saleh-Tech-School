"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, getSession } from "next-auth/react";
import { AnimatePresence, motion, useAnimationControls, useReducedMotion, type Variants } from "framer-motion";
import { Check, Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFoxPose } from "@/components/auth/fox-pose";

const WINK_MS = 900; // the mascot winks before the panel opens

const list: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 260, damping: 24 } },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduce = useReducedMotion();
  const { setPose } = useFoxPose();
  const shake = useAnimationControls();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const showRef = useRef(false); // the focus handler runs inside the click that flips `show`, before the state is new

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (res?.error) {
      setError("Email və ya şifrə yanlışdır.");
      passwordRef.current?.select(); // focuses the field (which would send the mascot "shy"), so the pose comes after
      setPose("oops");
      if (!reduce) void shake.start({ x: [0, -12, 11, -8, 6, -3, 0], transition: { duration: 0.5 } });
      return;
    }
    setDone(true);
    setPose("wink");
    if (!reduce) await new Promise((r) => setTimeout(r, WINK_MS));

    const callbackUrl = searchParams.get("callbackUrl");
    if (callbackUrl) {
      router.push(callbackUrl);
    } else {
      const session = await getSession();
      const roleHome: Record<string, string> = {
        PARENT: "/parent",
        TEACHER: "/teacher",
        STUDENT: "/student",
        ADMIN: "/admin",
        BLOGGER: "/blogger",
      };
      router.push(roleHome[session?.user.role ?? "PARENT"] ?? "/parent");
    }
    router.refresh();
  }

  return (
    <motion.div animate={shake}>
      <motion.form onSubmit={handleSubmit} variants={reduce ? undefined : list} initial={reduce ? false : "hidden"} animate="show">
        <motion.div variants={reduce ? undefined : item}>
          <h1 className="font-app text-2xl font-extrabold text-navy-900">Xoş gəlmisiniz</h1>
          <p className="mt-1 text-sm text-navy-400">Hesabınıza daxil olun</p>
        </motion.div>

        <motion.div variants={reduce ? undefined : item} className="mt-5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setPose("watch")}
            placeholder="siz@nümunə.az"
          />
        </motion.div>
        <motion.div variants={reduce ? undefined : item} className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">Şifrə</Label>
            <Link href="/sifre-unutdum" className="text-xs font-bold text-electric-600 hover:underline">
              Şifrəni unutmusunuz?
            </Link>
          </div>
          <div className="relative">
            <Input
              ref={passwordRef}
              id="password"
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPose(showRef.current ? "watch" : "shy")}
              onBlur={() => { setCaps(false); setPose("watch"); }}
              onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
              onKeyDown={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
              placeholder="••••••••"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => {
                showRef.current = !showRef.current;
                setShow(showRef.current);
                setPose(showRef.current ? "watch" : "shy"); // while the password is on show the mascot is allowed to look
                passwordRef.current?.focus();
              }}
              aria-label={show ? "Şifrəni gizlət" : "Şifrəni göstər"}
              aria-pressed={show}
              className="auth-eye"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={show ? "off" : "on"} initial={reduce ? false : { opacity: 0, rotate: -40, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, rotate: 40, scale: 0.6 }} transition={{ duration: 0.16 }} className="flex">
                  {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          <AnimatePresence initial={false}>
            {caps && (
              <motion.p
                key="caps"
                role="status"
                initial={reduce ? false : { opacity: 0, height: 0, y: -6 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                className="auth-hint overflow-hidden"
              >
                <TriangleAlert className="h-3.5 w-3.5" /> Caps Lock açıqdır
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence initial={false}>
          {error && (
            <motion.p
              key="err"
              role="alert"
              initial={reduce ? false : { opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={reduce ? undefined : { opacity: 0, height: 0 }}
              className="auth-error mt-5 overflow-hidden text-sm font-semibold"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div variants={reduce ? undefined : item} className="mt-5">
          <Button type="submit" variant="app" size="lg" disabled={loading || done} className="auth-submit w-full" data-state={done ? "done" : loading ? "loading" : "idle"}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={done ? "done" : loading ? "loading" : "idle"}
                className="inline-flex items-center gap-2"
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: 0.16 }}
              >
                {done ? (
                  <>
                    <Check className="h-4 w-4" /> Daxil oldunuz
                  </>
                ) : loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Yoxlanılır...
                  </>
                ) : (
                  "Daxil ol"
                )}
              </motion.span>
            </AnimatePresence>
          </Button>
        </motion.div>

        <motion.p variants={reduce ? undefined : item} className="mt-5 text-center text-sm text-navy-400">
          Hesabınız yoxdur?{" "}
          <Link href="/sinaq-dersi" className="font-bold text-electric-600 hover:underline">
            Qeydiyyatdan keçin
          </Link>
        </motion.p>
      </motion.form>
    </motion.div>
  );
}
