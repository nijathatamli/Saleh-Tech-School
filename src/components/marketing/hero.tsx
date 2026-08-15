import Image from "next/image";
import Link from "next/link";

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
      </div>

      <div className="relative flex w-full items-center justify-center md:w-1/2">
        <div className="relative z-10 animate-float">
          <Image
            src="/assets/fox-mascot-hero.png"
            alt="friendly orange fox mascot wearing a blue hoodie and tech glasses, sitting with a laptop, 3D charact"
            width={500}
            height={500}
            priority
            className="hero-mascot h-auto w-full max-w-md"
          />
        </div>
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="aspect-square w-full max-w-lg rounded-full bg-primary/10 opacity-50 blur-2xl" />
        </div>
      </div>
    </section>
  );
}
