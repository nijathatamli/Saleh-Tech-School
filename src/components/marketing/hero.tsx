import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center gap-12 overflow-hidden px-6 py-20 md:flex-row md:px-20">
      <div className="absolute -z-10 right-0 top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -z-10 bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      <div className="z-10 w-full space-y-8 md:w-1/2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Gələcəyi kodla 🦊</span>
        </div>
        <h1 className="font-display text-4xl leading-tight md:text-6xl">
          Uşağınız gələcəyin <span className="text-primary">texnologiyalarını</span> bu gündən öyrənsin.
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-grey-500 dark:text-zinc-400">
          6-18 yaş arası uşaqlar üçün proqramlaşdırma, kibertəhlükəsizlik, robototexnika, elektronika və digər
          texnologiya istiqamətləri.
        </p>

        <div className="flex flex-col items-center gap-6 pt-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto dark:border-zinc-700 dark:text-white">
            <Link href="/kurslar">İxtisasları kəşf et</Link>
          </Button>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <div className="flex -space-x-3">
            {["avatar-1", "avatar-2", "avatar-3"].map((a) => (
              <Image
                key={a}
                className="rounded-full border-2 border-white dark:border-black"
                src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/${a}.jpg`}
                alt=""
                width={40}
                height={40}
              />
            ))}
          </div>
          <p className="text-xs font-medium text-grey-500 dark:text-zinc-400">500+ aktiv tələbə</p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center md:w-1/2">
        <div className="relative z-10 animate-float">
          <Image
            src="/assets/fox-mascot-hero.png"
            alt="Saleh Tech School tülkü maskotu"
            width={500}
            height={500}
            priority
            className="h-auto w-full max-w-md transition-transform duration-500 hover:-translate-y-1.5 hover:scale-105 hover:-rotate-2"
          />
        </div>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="aspect-square w-full max-w-lg rounded-full bg-primary/10 opacity-50 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
