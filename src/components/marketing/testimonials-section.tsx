import Image from "next/image";
import { Quote } from "lucide-react";
import { getTestimonials } from "@/lib/data";

export async function TestimonialsSection() {
  const testimonials = await getTestimonials();

  return (
    <section id="testimonials" className="px-6 py-32 md:px-20">
      <div className="mx-auto mb-20 max-w-2xl space-y-4 text-center">
        <h2 className="font-display text-3xl md:text-4xl">Valideynlərimiz nə deyir?</h2>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {testimonials.map((t) => (
          <div key={t.id} className="relative space-y-6 rounded-3xl bg-grey-50 p-10 dark:bg-zinc-900">
            <Quote className="absolute left-8 top-8 h-10 w-10 text-primary opacity-20" />
            <p className="relative z-10 italic text-grey-500 dark:text-zinc-400">&quot;{t.quote}&quot;</p>
            <div className="flex items-center space-x-4 border-t border-grey-200 pt-6 dark:border-zinc-700">
              <Image src={t.avatarUrl} alt={t.name} width={48} height={48} className="rounded-full" />
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
