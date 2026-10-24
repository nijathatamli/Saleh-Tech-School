import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Bell, CalendarCheck, ClipboardList, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/app/reveal";
import { PageIntro } from "@/components/marketing/page-intro";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("parents");

const features = [
  { icon: CalendarCheck, title: "Dərs davamiyyəti", text: "Övladınızın hansı dərsdə iştirak etdiyini, hansında olmadığını dərsdən sonra dərhal görürsünüz." },
  { icon: ClipboardList, title: "Tapşırıq nəticələri", text: "Ev tapşırıqlarının qiymətlərini və müəllimin hər tapşırıq üzrə qeydlərini bir yerdə izləyin." },
  { icon: MessageSquareText, title: "Müəllim qeydləri", text: "Şagirdin inkişafı barədə müəllimin rəylərini və tövsiyələrini oxuyun." },
  { icon: Bell, title: "Ödəniş bildirişləri", text: "Hər 8 dərsdən sonra növbəti ödəniş dövrü açılanda sizə bildiriş gəlir, ödəniş statusunu panelda görürsünüz." },
];

export default function ParentPanelPage() {
  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd data={breadcrumbLd([{ name: "Valideyn Paneli", path: SEO.parents.path }])} />
      <PageIntro
        eyebrow="Valideynlər üçün"
        title="Valideyn Paneli: şagirdin inkişafını real vaxtda izləyin"
        lead="Saleh Tech School tələbəsinin valideyni olaraq övladınızın davamiyyətini, tapşırıq nəticələrini və müəllim qeydlərini telefonunuzdan və ya kompüterinizdən izləyə bilərsiniz."
      />

      <section aria-labelledby="pp-features" className="mx-auto max-w-6xl">
        <h2 id="pp-features" className="mb-10 text-center font-display text-2xl md:text-3xl">Panelda nələri görə bilərsiniz?</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 75}>
              <div className="h-full rounded-3xl border border-grey-100 p-8 dark:border-zinc-800">
                <f.icon className="h-7 w-7 text-primary" aria-hidden />
                <h3 className="mt-5 font-display text-lg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-labelledby="pp-how" className="mx-auto mt-24 grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="space-y-5">
          <h2 id="pp-how" className="font-display text-2xl md:text-3xl">Panelə necə daxil olmaq olar?</h2>
          <p className="leading-relaxed text-grey-500 dark:text-zinc-400">
            Valideyn hesabını məktəbin administrasiyası övladınızın qeydiyyatı zamanı yaradır. Giriş məlumatlarını aldıqdan sonra
            <strong className="text-secondary dark:text-white"> Giriş</strong> səhifəsindən panelə daxil olursunuz. Hələ tələbəmiz deyilsinizsə, əvvəlcə ödənişsiz sınaq dərsinə yazılın.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/giris">Panelə daxil ol</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="dark:border-zinc-700 dark:text-white">
              <Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-3xl bg-secondary p-4 shadow-2xl">
          <Image
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/gen_90e64f8db3_29b9a6071ab67562.png"
            alt="Valideyn Paneli: şagirdin qiymətləri, davamiyyəti və inkişafı mobil ekranda"
            width={600}
            height={600}
            className="w-full rounded-2xl"
          />
        </div>
      </section>
    </div>
  );
}
