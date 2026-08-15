import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

export function ParentPanelPreview() {
  return (
    <section id="parents" className="overflow-hidden px-6 py-32 md:px-20">
      <div className="relative flex flex-col items-center gap-16 overflow-hidden rounded-[3rem] bg-secondary p-12 text-white md:flex-row md:p-20">
        <div className="absolute -bottom-20 -right-20 rotate-12 text-[25rem] opacity-10">🦊</div>

        <div className="relative z-10 w-full space-y-8 md:w-1/2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Valideynlər Üçün</span>
          <h2 className="font-display text-3xl leading-tight md:text-5xl">Uşağınızın hər addımını izləyin</h2>
          <p className="text-lg text-grey-500 dark:text-zinc-400">
            Xüsusi Valideyn Paneli vasitəsilə tələbənin davamiyyətini, dərslərdəki aktivliyini və qazandığı
            uğurları real vaxtda izləyə bilərsiniz.
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
          <div className="rotate-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
            <Image
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_90e64f8db3_29b9a6071ab67562.png"
              alt="modern mobile app dashboard UI for tracking student grades and progress, clean white theme with oran"
              width={600}
              height={600}
              className="w-full rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
