import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

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
  },
];

export function CourseHighlights() {
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
    </section>
  );
}
