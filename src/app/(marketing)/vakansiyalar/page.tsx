import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Handshake, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/marketing/page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicContact } from "@/lib/contact";
import { SEO, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("vacancies");
export const dynamic = "force-dynamic";

const directions = [
  { icon: GraduationCap, title: "Müəllim və mentor kimi", text: "Proqramlaşdırma, robototexnika, elektronika, kibertəhlükəsizlik və ya süni intellekt üzrə uşaqlara dərs demək istəyirsinizsə, bizə yazın." },
  { icon: School, title: "Məktəblər və təşkilatlar", text: "Məktəbiniz, mərkəziniz və ya şirkətiniz üçün texnologiya dərsi, seminar və ya hakaton təşkil edək." },
  { icon: Handshake, title: "Tərəfdaşlıq", text: "Texnologiya təhsili sahəsində birgə layihə, avadanlıq və ya sponsorluq təklifiniz varsa, müzakirə edək." },
];

export default async function VacanciesPage() {
  const c = await getPublicContact();

  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd data={breadcrumbLd([{ name: "Əməkdaşlıq və vakansiyalar", path: SEO.vacancies.path }])} />
      <PageIntro
        eyebrow="Əməkdaşlıq"
        title="Əməkdaşlıq təklifiniz var? Birlikdə İT təhsilini inkişaf etdirək"
        lead="Uşaqlar üçün texnologiya və İT təhsili sahəsində müəllim, mentor və ya tərəfdaş kimi əməkdaşlığı birlikdə həyata keçirək."
      />

      <section aria-labelledby="v-dir" className="mx-auto max-w-6xl">
        <h2 id="v-dir" className="mb-10 text-center font-display text-2xl md:text-3xl">Əməkdaşlıq istiqamətləri</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {directions.map((d) => (
            <div key={d.title} className="rounded-3xl border border-grey-100 p-8 dark:border-zinc-800">
              <d.icon className="h-7 w-7 text-primary" aria-hidden />
              <h3 className="mt-5 font-display text-lg">{d.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{d.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="v-apply" className="mx-auto mt-24 max-w-2xl space-y-5 text-center">
        <h2 id="v-apply" className="font-display text-2xl md:text-3xl">Təklifinizi bizə göndərin</h2>
        <p className="text-grey-500 dark:text-zinc-400">
          Qısa özünütəqdimat və ya təklifinizi göndərin, aktual olduqda sizinlə əlaqə saxlayacağıq.
          {c.email && (
            <>
              {" "}
              E-poçt: <a href={`mailto:${c.email}`} className="font-medium text-primary hover:underline">{c.email}</a>.
            </>
          )}
        </p>
        <Button asChild size="lg">
          <Link href="/elaqe">Əlaqə səhifəsinə keç</Link>
        </Button>
      </section>
    </div>
  );
}
