import Link from "next/link";
import {
  Wrench,
  Rocket,
  GraduationCap,
  Users,
  TrendingUp,
  Trophy,
  ShieldCheck,
  Award,
  ArrowUpRight,
} from "lucide-react";

const items = [
  { icon: Wrench, title: "Praktiki təhsil", desc: "Nəzəriyyədən çox, əl ilə qurulan layihələr üzərindən öyrənmə." },
  { icon: Rocket, title: "Real layihələr", desc: "Hər kurs sonunda portfolioya əlavə olunan real texnoloji layihələr." },
  { icon: GraduationCap, title: "Peşəkar müəllimlər", desc: "Sənayedə çalışan, sertifikatlı texnologiya mütəxəssisləri." },
  { icon: Users, title: "Kiçik qruplar", desc: "Maksimum diqqət üçün 8-10 nəfərlik kiçik tədris qrupları." },
  { icon: TrendingUp, title: "Fərdi inkişaf", desc: "Hər tələbə üçün fərdi proqres izləmə və inkişaf planı." },
  { icon: Trophy, title: "Yarış hazırlığı", desc: "Hackathon, CTF və robototexnika yarışlarına hazırlıq." },
  { icon: Award, title: "Sertifikat", desc: "Kursu bitirən hər tələbəyə rəsmi bitirmə sertifikatı." },
];

export function WhyUs() {
  return (
    <section className="px-6 py-32 md:px-20">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Niyə biz?</span>
        <h2 className="font-display text-3xl leading-tight md:text-4xl">Niyə Saleh Tech School?</h2>
        <p className="text-grey-500 dark:text-zinc-400">
          Valideynlərin etibar etdiyi, uşaqların sevərək gəldiyi texnologiya məktəbi
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl auto-rows-[180px] grid-cols-2 gap-4 md:grid-cols-4">
        <Link
          href="/#parents"
          className="group relative col-span-2 row-span-2 overflow-hidden rounded-3xl bg-secondary p-8 text-white transition-transform hover:-translate-y-1"
        >
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h3 className="mt-6 font-display text-xl leading-snug">Valideyn monitorinq sistemi</h3>
          <p className="mt-3 max-w-xs text-sm text-grey-200/70">
            Övladınızın davamiyyətini, tərəqqisini və ev tapşırıqlarını real vaxtda izləyin.
          </p>
          <span className="absolute bottom-8 right-8 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </Link>

        {items.map((item, i) => (
          <div
            key={item.title}
            className={`rounded-3xl border border-grey-100 p-6 transition-all hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 ${
              i % 3 === 0 ? "bg-primary/5" : "bg-white dark:bg-zinc-900"
            }`}
          >
            <item.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-4 font-display text-sm leading-snug">{item.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-grey-500 dark:text-zinc-400">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
