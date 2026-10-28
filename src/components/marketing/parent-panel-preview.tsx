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
          {/* liquid glass: orbs behind the frosted frame are churned by an SVG turbulence / displacement filter (refraction without touching the screenshot) */}
          <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
            <filter id="liquid-glass" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="3" result="n">
                <animate attributeName="baseFrequency" dur="18s" values="0.008 0.012;0.012 0.008;0.008 0.012" repeatCount="indefinite" />
              </feTurbulence>
              <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </svg>
          <span aria-hidden="true" className="glass-orb -left-6 top-4 h-44 w-44 bg-primary" />
          <span aria-hidden="true" className="glass-orb -right-4 bottom-0 h-52 w-52 bg-teal-400/80" />
          <div className="glass glass-smoke glass-sweep relative rotate-2 rounded-2xl p-4">
            <Image
              src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_90e64f8db3_29b9a6071ab67562.png"
              alt="Valideyn Paneli: şagirdin qiymətləri, davamiyyəti və inkişafı mobil ekranda"
              width={600}
              height={600}
              className="relative w-full rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
