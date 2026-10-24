import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Cpu, HeartHandshake, Rocket } from "lucide-react";
import { getAllCourses, getTeachers } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PageIntro } from "@/components/marketing/page-intro";
import { TeacherPhoto } from "@/components/marketing/teacher-photo";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("about");
export const dynamic = "force-dynamic";

const approach = [
  { icon: Cpu, title: "Praktika ilə öyrənmə", text: "Hər dərs real layihə üzərində qurulur: şagird kod yazır, dövrə qurur, robot proqramlaşdırır." },
  { icon: BookOpenCheck, title: "Yaşa uyğun səviyyə", text: "6–18 yaş aralığında kurslar başlanğıcdan qabaqcıl səviyyəyə qədər yaşa və biliyə görə seçilir." },
  { icon: HeartHandshake, title: "Valideynlə şəffaflıq", text: "Davamiyyət, tapşırıq nəticələri və müəllim qeydləri Valideyn Panelində valideynə açıqdır." },
  { icon: Rocket, title: "Ödənişsiz başlanğıc", text: "Qərar verməzdən əvvəl övladınız ödənişsiz sınaq dərsində iştirak edib müəllimlə tanış ola bilər." },
];

export default async function AboutPage() {
  const [courses, teachers] = await Promise.all([getAllCourses(), getTeachers()]);

  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd data={breadcrumbLd([{ name: "Haqqımızda", path: SEO.about.path }])} />
      <PageIntro
        eyebrow="Haqqımızda"
        title="Saleh Tech School: uşaqlar üçün STEAM təhsili"
        lead="Biz 6–18 yaşlı uşaqlara proqramlaşdırma, robototexnika, elektronika, kibertəhlükəsizlik və süni intellekt sahələrini praktiki layihələrlə öyrədirik."
      />

      <div className="mx-auto max-w-6xl space-y-24">
        <section aria-labelledby="a-mission" className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 id="a-mission" className="font-display text-2xl md:text-3xl">Missiyamız</h2>
          <p className="leading-relaxed text-grey-500 dark:text-zinc-400">
            Uşaqların texnologiyanın yalnız istifadəçisi yox, yaradıcısı olmasını istəyirik. Kod yazmaq, Arduino ilə dövrə qurmaq, robot hərəkət etdirmək və ya kibertəhlükəsizliyin əsaslarını öyrənmək onlara
            məntiqi düşünməyi, problemi hissələrə bölməyi və komandada işləməyi öyrədir.
          </p>
        </section>

        <section aria-labelledby="a-approach">
          <h2 id="a-approach" className="mb-10 text-center font-display text-2xl md:text-3xl">Tədris yanaşmamız</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((a) => (
              <div key={a.title} className="rounded-3xl border border-grey-100 p-7 dark:border-zinc-800">
                <a.icon className="h-7 w-7 text-primary" aria-hidden />
                <h3 className="mt-4 font-display text-base">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="a-courses">
          <h2 id="a-courses" className="mb-8 text-center font-display text-2xl md:text-3xl">Tədris istiqamətləri</h2>
          <ul className="flex flex-wrap justify-center gap-3">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/kurslar/${c.slug}`}
                  className="inline-block rounded-full border border-grey-200 px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary dark:border-zinc-700"
                >
                  {c.name} <span className="text-grey-500 dark:text-zinc-500">· {c.minAge}–{c.maxAge} yaş</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {teachers.length > 0 && (
          <section aria-labelledby="a-team">
            <h2 id="a-team" className="mb-10 text-center font-display text-2xl md:text-3xl">Komandamız</h2>
            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2 md:grid-cols-3">
              {teachers.map((t) => (
                <Link
                  key={t.id}
                  href={`/muellimler/${t.id}`}
                  className="group flex items-center gap-4 rounded-3xl border border-grey-100 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800"
                >
                  <TeacherPhoto src={t.photoUrl} name={t.user.name} size={64} className="rounded-2xl" />
                  <div>
                    <h3 className="font-display text-base transition-colors group-hover:text-primary">{t.user.name}</h3>
                    <p className="text-xs text-grey-500 dark:text-zinc-400">{t.position}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-2xl space-y-5 text-center">
          <h2 className="font-display text-2xl md:text-3xl">Övladınızı bizimlə tanış edin</h2>
          <p className="text-grey-500 dark:text-zinc-400">Ödənişsiz sınaq dərsinə yazılın və ən uyğun istiqaməti birlikdə seçək.</p>
          <Button asChild size="lg">
            <Link href="/sinaq-dersi">Ödənişsiz sınaq dərsinə yazıl</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
