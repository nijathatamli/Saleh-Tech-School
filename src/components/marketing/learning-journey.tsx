import { BookOpen, Hammer, Blocks, Trophy, FolderGit2 } from "lucide-react";

const steps = [
  { icon: BookOpen, title: "Öyrən", desc: "Əsas anlayışları interaktiv dərslərlə mənimsə." },
  { icon: Hammer, title: "Tətbiq et", desc: "Öyrəndiklərini kiçik məşqlərlə praktikaya çevir." },
  { icon: Blocks, title: "Qur", desc: "Real bir layihə üzərində baştan-başa işlə." },
  { icon: Trophy, title: "Yarış", desc: "Hackathon və yarışlarda bacarıqlarını sərgilə." },
  { icon: FolderGit2, title: "Portfolio yarat", desc: "Layihələrini şəxsi texnologiya portfolionda topla." },
];

export function LearningJourney() {
  return (
    <section className="px-6 py-24 md:px-20">
      <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Təhsil yolu</span>
        <h2 className="font-display text-3xl leading-tight md:text-4xl">Öyrənmə səyahəti necə keçir?</h2>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-5">
        {steps.map((s, i) => (
          <div key={s.title} className="relative flex flex-col items-center text-center">
            {i < steps.length - 1 && (
              <div className="absolute left-1/2 top-8 hidden h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-primary/40 to-primary/0 md:block" />
            )}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
              <s.icon className="h-6 w-6" />
            </div>
            <span className="mt-4 text-xs font-bold text-primary">0{i + 1}</span>
            <h3 className="mt-1 font-display text-sm">{s.title}</h3>
            <p className="mt-2 text-xs text-grey-500 dark:text-zinc-400">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
