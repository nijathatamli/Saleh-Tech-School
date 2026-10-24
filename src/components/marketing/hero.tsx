import Image from "next/image";
import Link from "next/link";
import { FoxMascot } from "./fox-mascot";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center gap-12 overflow-hidden px-6 py-20 md:flex-row md:px-20">
      <div className="absolute -z-10 right-0 top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -z-10 bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="z-10 w-full space-y-8 md:w-1/2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Gələcəyi kodla 🦊</span>
        </div>
        <h1 className="font-display text-[clamp(1.5rem,calc((100vw-3rem)/9.9),2.25rem)] leading-tight md:text-6xl">
          Uşağınız gələcəyin <span className="text-primary">texnologiyalarını</span> bu gündən öyrənsin.
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-grey-500 dark:text-zinc-400">
          Saleh Tech School ilə 6-18 yaş arası uşaqlar üçün ən müasir texnologiya yollarını kəşf edin. Bizim
          sevimli tülkü maskotumuzla öyrənmək daha əyləncəlidir!
        </p>

        <div className="flex flex-col items-center gap-6 pt-4 sm:flex-row">
          <Link
            href="/sinaq-dersi"
            className="w-full rounded-full bg-primary px-10 py-5 text-center text-xs font-bold uppercase tracking-widest text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary-dark sm:w-auto"
          >
            Sınaq dərsinə yazıl
          </Link>
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-3">
              {["student-1", "student-2", "student-3"].map((a) => (
                <Image
                  key={a}
                  className="h-10 w-10 rounded-full border-2 border-white object-cover dark:border-black"
                  src={`/students/${a}.jpg`}
                  alt=""
                  width={40}
                  height={40}
                />
              ))}
            </div>
            <p className="text-xs font-medium text-grey-500 dark:text-zinc-400">100+ aktiv tələbə</p>
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center md:w-1/2">
        <FoxMascot />
      </div>
    </section>
  );
}
