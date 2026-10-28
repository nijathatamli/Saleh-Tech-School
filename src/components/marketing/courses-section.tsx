import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const courses = [
  {
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_4d78f13579_72fa6a1d65880b79.png",
    alt: "Uşaqlar üçün kibertəhlükəsizlik kursu: qalxan və kilid təsviri",
    badge: "Yeni",
    title: "Kibertəhlükəsizlik Əsasları",
    desc: "Uşaqlar rəqəmsal dünyanı necə qorumağı və etik hakerlik prinsiplərini öyrənirlər.",
    duration: "8 Ay",
  },
  {
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_96dae3585e_7e155be2988d8706.png",
    alt: "Uşaq noutbukda Python ilə proqramlaşdırma kursunda kod yazır",
    title: "Python ilə Proqramlaşdırma",
    desc: "Dünyanın ən populyar proqramlaşdırma dilini əyləncəli layihələrlə mənimsəyin.",
    duration: "6 Ay",
  },
  {
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_55f76a70f6_e6f3256ef5c6b526.png",
    alt: "Yeniyetmələr robototexnika dərsində robot qolu yığır",
    title: "Robototexnika və IoT",
    desc: "Öz robotlarınızı yaradın və onları kod vasitəsilə canlandırın.",
    duration: "9 Ay",
  },
];

export function CoursesSection() {
  return (
    <section id="courses" className="bg-grey-50 px-6 py-32 dark:bg-zinc-900 md:px-20">
      <div className="mb-20 flex flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-xl space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Ən çox seçilənlər</span>
          <h2 className="font-display text-3xl leading-tight md:text-5xl">Populyar kurslarımız</h2>
        </div>
        <Link
          href="/kurslar"
          className="rounded-full border border-grey-200 px-8 py-3 text-xs font-bold uppercase tracking-widest transition-all hover:bg-secondary hover:text-white dark:border-zinc-700 dark:hover:bg-white dark:hover:text-secondary"
        >
          Hamısına bax
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {courses.map((c) => (
          <div
            key={c.title}
            className="course-card group cursor-pointer overflow-hidden rounded-3xl border border-grey-100 bg-white transition-all dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="relative h-72 overflow-hidden">
              <Image
                src={c.image}
                alt={c.alt}
                fill
                sizes="400px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {c.badge && (
                <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                  {c.badge}
                </div>
              )}
            </div>
            <div className="glass glass-lift glass-sweep relative -mt-24 mx-3 mb-3 space-y-4 rounded-2xl p-6 text-secondary dark:text-white">
              <h3 className="font-display text-xl transition-colors group-hover:text-primary">{c.title}</h3>
              <p className="line-clamp-3 text-sm leading-relaxed text-grey-800/80 dark:text-zinc-300">{c.desc}</p>
              <div className="flex items-center justify-between border-t border-white/50 pt-4 dark:border-white/15">
                <span className="text-xs font-bold text-secondary dark:text-white">{c.duration}</span>
                <span className="text-primary">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
