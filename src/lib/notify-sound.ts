// The notification sound is synthesised with the Web Audio API (a soft three-note glass chime), so there is no audio
// file to download, license or lose. Browsers only allow sound after the visitor has touched the page once; the
// context is created and resumed on the first tap / key press, and a banner that arrives before that is silent
// instead of throwing. The visitor can switch the sound off from the banner; the choice is remembered.
const KEY = "sts-notif-sound";

let ctx: AudioContext | null = null;
/** when a chime was asked for while the browser still blocked audio (0 = none waiting) */
let waiting = 0;

const Ctor = () => (typeof window === "undefined" ? undefined : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);

function context(): AudioContext | null {
  if (ctx) return ctx;
  const C = Ctor();
  if (!C) return null;
  try {
    ctx = new C();
  } catch {
    return null;
  }
  return ctx;
}

/** Call once on the client: the first tap or key press unlocks audio for the rest of the visit. */
export function armNotifySound() {
  if (typeof window === "undefined") return () => {};
  const unlock = () => {
    const c = context();
    if (!c) return;
    const done = () => {
      if (c.state !== "running" || !waiting || Date.now() - waiting > 30_000) return;
      waiting = 0;
      chime(c); // a banner arrived before the page was touched: it is heard now, with the first tap
    };
    if (c.state === "suspended") void c.resume().then(done, () => {});
    else done();
  };
  const opts = { capture: true, passive: true } as const;
  window.addEventListener("pointerdown", unlock, opts);
  window.addEventListener("keydown", unlock, opts);
  return () => {
    window.removeEventListener("pointerdown", unlock, opts);
    window.removeEventListener("keydown", unlock, opts);
  };
}

export function soundEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private mode: the choice just is not remembered */
  }
}

/** One note: a sine with a quiet octave overtone and a fast, bell-like decay. */
function note(c: AudioContext, out: AudioNode, freq: number, at: number, len: number, gain: number) {
  for (const [mult, level, type] of [[1, 1, "sine"], [2, 0.28, "sine"], [3.01, 0.08, "triangle"]] as const) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq * mult;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain * level, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(at + len + 0.05);
  }
}

function chime(c: AudioContext) {
  const t = c.currentTime + 0.02;
  const master = c.createGain();
  master.gain.value = 0.9;
  master.connect(c.destination);
  note(c, master, 1318.51, t, 0.9, 0.5); //          E6
  note(c, master, 1567.98, t + 0.11, 0.9, 0.42); //  G6
  note(c, master, 2093.0, t + 0.23, 1.3, 0.38); //   C7
}

export type SoundResult = "played" | "blocked" | "off";

/** Plays the chime if sound is on. "blocked": the browser has not allowed audio yet (nothing on the page was touched);
 *  the chime is kept and plays with the first tap or key press, and the caller can tell the visitor. */
export function playNotifySound(): SoundResult {
  if (!soundEnabled()) return "off";
  const c = context();
  if (!c) return "off";
  const later = () => { waiting = Date.now(); };
  try {
    if (c.state === "running") {
      chime(c);
      return "played";
    }
    void c.resume().then(
      () => {
        const st: AudioContextState = c.state; // read again: it may have changed since the call
        if (st !== "running") return later();
        waiting = 0;
        chime(c);
      },
      later
    );
    later();
    return "blocked";
  } catch {
    return "off";
  }
}
