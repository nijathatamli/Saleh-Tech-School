"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type Highlight = {
  bg: string;
  border: string;
  image: string;
  imageClass?: string;
  title: string;
  desc: string;
  ageLabel: string;
  levelLabel: string;
  durationLabel: string;
  tags: string[];
  instructor: string;
  price: string;
  start: string;
  seats: string;
  format: string;
};

const highlights: Highlight[] = [
  {
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-yellow-300 dark:border-yellow-800",
    image: "/assets/course-it.png",
    title: "IT və Kompüter Mühəndisliyi kursu",
    desc: "Texnologiya dünyasına ilk addımını at!",
    ageLabel: "10-15",
    levelLabel: "Başlanğıc",
    durationLabel: "15 ay",
    tags: ["figma", "javascript", "html", "css", "cybersecurity"],
    instructor: "Emin Qasımov",
    price: "180 AZN/ay",
    start: "16 Sentyabr 2026",
    seats: "4 yer qalıb",
    format: "Həftədə 2 dərs, offline",
  },
  {
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-400 dark:border-red-800",
    image: "/assets/course-cyber.png",
    title: "Kibertəhlükəsizlik Kursu",
    desc: "Rəqəmsal dünyanı təhlükəsiz et!",
    ageLabel: "11-17",
    levelLabel: "Qabaqcıl",
    durationLabel: "12 ay",
    tags: ["şəbəkə", "linux", "blue team", "red team", "pentest"],
    instructor: "Tural Zeynalov",
    price: "220 AZN/ay",
    start: "23 Sentyabr 2026",
    seats: "2 yer qalıb",
    format: "Həftədə 3 dərs, offline",
  },
  {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-300 dark:border-green-800",
    image: "/assets/course-robotics.webp",
    title: "Robotexnika kursu",
    desc: "Öz robotunu yarat, proqramla və idarə et!",
    ageLabel: "8-12",
    levelLabel: "Başlanğıc",
    durationLabel: "6 ay",
    tags: ["arduino", "lego", "vex", "sensor", "led", "steam"],
    instructor: "Nigar Əliyeva",
    price: "160 AZN/ay",
    start: "30 Sentyabr 2026",
    seats: "6 yer qalıb",
    format: "Həftədə 2 dərs, offline",
  },
  {
    bg: "bg-lime-50 dark:bg-lime-950/40",
    border: "border-blue-800 dark:border-blue-700",
    image: "/assets/course-leadership.webp",
    imageClass: "w-28 h-32 md:w-32 md:h-36 object-bottom",
    title: "Liderlik Təlimləri",
    desc: "Texnologiya dünyasına ilk addımını at!",
    ageLabel: "10-16",
    levelLabel: "Başlanğıc",
    durationLabel: "1 ay",
    tags: ["nitq", "liderlik", "inkişaf", "soft skills", "komanda idarəetməsi"],
    instructor: "Emin Qasımov",
    price: "140 AZN/ay",
    start: "7 Oktyabr 2026",
    seats: "8 yer qalıb",
    format: "Həftədə 1 dərs, offline",
  },
  {
    bg: "bg-green-100 dark:bg-green-950/40",
    border: "border-transparent dark:border-green-800",
    image: "/assets/course-summer.webp",
    title: "Yay Məktəbi: IT və Proqramlaşdırma",
    desc: "Texnologiya dünyasına ilk addımını at!",
    ageLabel: "10-15",
    levelLabel: "Başlanğıc",
    durationLabel: "3 ay",
    tags: ["html", "css", "figma", "IT"],
    instructor: "Nigar Əliyeva",
    price: "120 AZN/ay",
    start: "14 Oktyabr 2026",
    seats: "10 yer qalıb",
    format: "Həftədə 2 dərs, offline",
  },
  {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-300 dark:border-blue-800",
    image: "/assets/course-ai.png",
    title: "Süni İntellekt Mühəndisliyi kursu",
    desc: "Gələcəyin texnologiyasını öyrən!",
    ageLabel: "12-17",
    levelLabel: "Qabaqcıl",
    durationLabel: "8 ay",
    tags: ["artificial intelligence", "AI", "machine learning", "computer vision"],
    instructor: "Tural Zeynalov",
    price: "240 AZN/ay",
    start: "21 Oktyabr 2026",
    seats: "3 yer qalıb",
    format: "Həftədə 3 dərs, online",
  },
];

export function CourseHighlights() {
  const [active, setActive] = useState<Highlight | null>(null);

  return (
    <section className="px-6 py-32 md:px-20">
      <div className="mx-auto mb-20 max-w-2xl space-y-4 text-center">
        <h2 className="font-display text-3xl leading-tight md:text-4xl">Uşaqlar üçün IT və Proqramlaşdırma kursları!</h2>
        <p className="text-grey-500 dark:text-zinc-400">Kurslarımızda müxtəlif növ və istiqamət üçün texnologiyalar tədris olunur</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {highlights.map((h) => (
          <div
            key={h.title}
            onClick={() => setActive(h)}
            className={`highlight-card relative overflow-hidden rounded-3xl border-2 p-8 ${h.bg} ${h.border}`}
          >
            <Image
              src={h.image}
              alt={`${h.title} personajı`}
              width={128}
              height={128}
              className={`pointer-events-none absolute -bottom-3 -right-3 object-contain drop-shadow-lg ${h.imageClass ?? "h-28 w-28 md:h-32 md:w-32"}`}
            />
            <div className="relative z-10 max-w-[80%] space-y-4">
              <h3 className="font-display text-lg leading-snug">{h.title}</h3>
              <p className="text-sm text-grey-600">{h.desc}</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary dark:text-white" />
                  <span><b>Yaş:</b> {h.ageLabel}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary dark:text-white" />
                  <span><b>Səviyyə:</b> {h.levelLabel}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-secondary dark:text-white" />
                  <span><b>Müddət:</b> {h.durationLabel}</span>
                </li>
              </ul>
            </div>
            <div className="tag-track-mask relative z-10 mt-6 overflow-hidden">
              <div className="tag-track flex w-max animate-tag-scroll gap-2">
                {[...h.tags, ...h.tags].map((t, i) => (
                  <span
                    key={i}
                    aria-hidden={i >= h.tags.length}
                    className="whitespace-nowrap rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold dark:bg-white/10 dark:text-white"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-6"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setActive(null)}
        >
          <div className="animate-pop-in relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-zinc-900">
            <button
              onClick={() => setActive(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-grey-100 text-secondary transition-colors hover:bg-grey-200 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
              aria-label="Bağla"
            >
              ✕
            </button>
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Kurs məlumatı (demo)
            </span>
            <h3 className="mb-6 font-display text-2xl leading-snug">{active.title}</h3>
            <ul className="space-y-4 text-sm">
              {[
                ["Müəllim", active.instructor],
                ["Qiymət", active.price],
                ["Növbəti başlanğıc", active.start],
                ["Qalan yerlər", active.seats],
                ["Format", active.format],
              ].map(([label, value], i, arr) => (
                <li
                  key={label}
                  className={`flex items-center justify-between ${i < arr.length - 1 ? "border-b border-grey-100 pb-3 dark:border-zinc-800" : ""}`}
                >
                  <span className="text-grey-500 dark:text-zinc-400">{label}</span>
                  <span className="font-bold text-secondary dark:text-white">{value}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/sinaq-dersi"
              onClick={() => setActive(null)}
              className="mt-8 block rounded-full bg-primary px-8 py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-primary-dark"
            >
              Sınaq dərsinə yazıl
            </Link>
            <p className="mt-4 text-center text-[10px] text-grey-500 dark:text-zinc-400">
              *Nümunə məlumatdır, dəqiq detallar üçün bizimlə əlaqə saxlayın.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
