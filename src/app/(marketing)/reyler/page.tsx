import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Quote } from "lucide-react";
import { getTestimonials } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/marketing/page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("reviews");
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const testimonials = await getTestimonials();
  const groups = [
    { id: "valideyn", heading: "Valideynlərin təcrübəsi", items: testimonials.filter((t) => t.role !== "Tələbə") },
    { id: "telebe", heading: "Şagirdlərin təcrübəsi", items: testimonials.filter((t) => t.role === "Tələbə") },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd data={breadcrumbLd([{ name: "Rəylər", path: SEO.reviews.path }])} />
      <PageIntro
        eyebrow="Rəylər"
        title="Saleh Tech School rəyləri: valideyn və şagird təcrübəsi"
        lead="IT, proqramlaşdırma, robototexnika və digər texnologiya dərslərində iştirak edən ailələr təcrübələrini bölüşür."
      />

      <div className="mx-auto max-w-7xl space-y-20">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`r-${g.id}`}>
            <h2 id={`r-${g.id}`} className="mb-10 text-center font-display text-2xl md:text-3xl">{g.heading}</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {g.items.map((t) => (
                <figure key={t.id} className="relative flex flex-col rounded-3xl bg-grey-50 p-10 dark:bg-zinc-900">
                  <Quote className="absolute left-8 top-8 h-10 w-10 text-primary opacity-20" aria-hidden />
                  <blockquote className="relative z-10 flex flex-1 items-center py-10">
                    <p className="whitespace-pre-line italic text-grey-500 dark:text-zinc-400">&quot;{t.quote}&quot;</p>
                  </blockquote>
                  <figcaption className="flex min-h-[6rem] items-center space-x-4 border-t border-grey-200 pt-6 dark:border-zinc-700">
                    <Image src={t.avatarUrl} alt={`${t.name}, ${t.role.toLowerCase()}`} width={48} height={48} className="h-12 w-12 rounded-full object-cover" />
                    <div>
                      <h3 className="text-sm font-bold text-secondary dark:text-white">{t.name}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-500">{t.role}</p>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mx-auto mt-24 max-w-2xl space-y-5 text-center">
        <h2 className="font-display text-2xl md:text-3xl">Siz də övladınız üçün sınaq dərsinə qoşulun</h2>
        <p className="text-grey-500 dark:text-zinc-400">Ödənişsiz demo dərsdə müəllimlə tanış olun və övladınıza uyğun kursu seçin.</p>
        <Button asChild size="lg">
          <Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link>
        </Button>
      </section>
    </div>
  );
}
