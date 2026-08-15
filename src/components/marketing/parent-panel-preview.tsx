import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

const stats = [
  { label: "Davamiyyət", value: 94, color: "from-emerald-400 to-emerald-500" },
  { label: "Tərəqqi", value: 82, color: "from-electric-400 to-electric-500" },
  { label: "Ev tapşırığı", value: 91, color: "from-violet-400 to-violet-500" },
];

export function ParentPanelPreview() {
  return (
    <section id="parents" className="overflow-hidden px-6 py-32 md:px-20">
      <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-16 overflow-hidden rounded-[3rem] bg-secondary p-12 text-white md:flex-row md:p-20">
        <div className="absolute -bottom-20 -right-20 rotate-12 text-[25rem] opacity-10">🦊</div>

        <div className="relative z-10 w-full space-y-8 md:w-1/2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Valideynlər Üçün</span>
          <h2 className="font-display text-3xl leading-tight md:text-5xl">Övladınızın inkişafını hər zaman izləyin.</h2>
          <p className="text-lg text-grey-500">
            Xüsusi Valideyn Paneli vasitəsilə tələbənin davamiyyətini, dərslərdəki aktivliyini və qazandığı uğurları
            real vaxtda izləyə bilərsiniz.
          </p>
          <ul className="space-y-4">
            {["Həftəlik tərəqqi hesabatları", "Müəllim rəyləri və tövsiyələr", "Sertifikat və nailiyyət izləmə"].map(
              (t) => (
                <li key={t} className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">{t}</span>
                </li>
              )
            )}
          </ul>
          <Link
            href="/giris"
            className="inline-block rounded-full bg-white px-10 py-4 text-xs font-bold uppercase tracking-widest text-secondary transition-all hover:bg-primary hover:text-white"
          >
            Paneli Sınaqdan Keçir
          </Link>
        </div>

        <div className="relative z-10 w-full md:w-1/2">
          <div className="rotate-2 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-grey-200/70">Salam, Elvin 👋</p>
                <p className="font-display text-sm">Ali Məmmədov</p>
              </div>
              <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold text-primary">
                1,240 ⭐
              </span>
            </div>
            <div className="space-y-5">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="mb-2 flex justify-between text-xs text-grey-200/70">
                    <span>{s.label}</span>
                    <span className="font-bold text-white">{s.value}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${s.color}`}
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
