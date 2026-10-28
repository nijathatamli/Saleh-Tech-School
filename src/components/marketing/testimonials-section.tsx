import Image from "next/image";
import { Quote } from "lucide-react";
import { getTestimonials } from "@/lib/data";

export async function TestimonialsSection() {
  const testimonials = await getTestimonials();

  return (
    <section id="testimonials" className="relative overflow-hidden px-6 py-32 md:px-20">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-1/3 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 bottom-10 -z-10 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="mx-auto mb-20 max-w-2xl space-y-4 text-center">
        <h2 className="font-display text-3xl md:text-4xl">Valideynlərimiz nə deyir?</h2>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.id} className="glass glass-lift relative flex flex-col rounded-3xl p-10 text-secondary dark:text-white">
            <Quote className="absolute left-8 top-8 h-10 w-10 text-primary opacity-20" />
            <div className="relative z-10 flex flex-1 items-center py-10">
              <p className="whitespace-pre-line italic text-grey-800/80 dark:text-zinc-300">&quot;{t.quote}&quot;</p>
            </div>
            <div className="flex min-h-[6rem] items-center space-x-4 border-t border-white/60 pt-6 dark:border-white/15">
              <Image src={t.avatarUrl} alt={`${t.name}, ${t.role.toLowerCase()}`} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-secondary dark:text-white">{t.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-500">
                  {t.role}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
