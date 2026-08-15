import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Calendar, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import { getCourseBySlug } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LearningJourney } from "@/components/marketing/learning-journey";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const dynamic = "force-dynamic";

const levelLabel: Record<string, string> = {
  BEGINNER: "Başlanğıc",
  INTERMEDIATE: "Orta",
  ADVANCED: "Qabaqcıl",
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  return { title: course?.name ?? "Kurs tapılmadı" };
}

export default async function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug);
  if (!course) notFound();

  const projects = await prisma.project.findMany({
    where: { courseTag: course.category },
    take: 3,
  });

  const faqs = [
    { q: "Sınaq dərsi ödənişsizdir?", a: "Bəli, bu kurs üçün ilk sınaq dərsi tamamilə ödənişsizdir." },
    {
      q: `${course.name} kursuna hansı yaşdan başlamaq olar?`,
      a: `Bu kurs ${course.minAge}-${course.maxAge} yaş aralığı üçün nəzərdə tutulub.`,
    },
    { q: "Dərslər onlayn, yoxsa oflayndır?", a: "Kursların böyük əksəriyyəti bizim mərkəzimizdə oflayn keçirilir." },
  ];

  return (
    <div>
      {/* Header */}
      <section className="border-b border-grey-100 px-6 py-16 dark:border-zinc-800 md:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="primary">{course.minAge}-{course.maxAge} yaş</Badge>
            <Badge variant="default" className="dark:bg-zinc-800 dark:text-white">{levelLabel[course.level]}</Badge>
            {course.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="default" className="dark:bg-zinc-800 dark:text-white">
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="font-display text-3xl leading-tight md:text-5xl">{course.name}</h1>
          <p className="mt-4 max-w-2xl text-lg text-grey-500 dark:text-zinc-400">{course.longDesc}</p>

          <div className="mt-8 flex flex-wrap gap-8">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              {course.durationMonths} ay
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-primary" />
              Həftədə {course.lessonsPerWeek} dərs
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              {course.lessonMinutes} dəqiqə
            </div>
          </div>

          <Button asChild size="lg" className="mt-10">
            <Link href={`/sinaq-dersi?course=${course.slug}`}>Ödənişsiz sınaq dərsinə yazıl</Link>
          </Button>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="px-6 py-20 md:px-20">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl">Nə öyrənəcəklər?</h2>
            <div className="mt-6 grid gap-3">
              {course.skills.map((skill) => (
                <div key={skill} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm">{skill}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="font-display text-2xl">Tədris proqramı</h2>
            <div className="mt-6 space-y-3">
              {course.modules.map((m) => (
                <div
                  key={m.id}
                  className="flex items-start gap-4 rounded-2xl border border-grey-100 p-4 dark:border-zinc-800"
                >
                  <span className="font-display text-lg text-primary">
                    {String(m.order).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-bold text-sm">{m.title}</p>
                    <p className="mt-1 text-xs text-grey-500 dark:text-zinc-400">{m.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LearningJourney />

      {/* Projects */}
      <section className="bg-grey-50 px-6 py-20 dark:bg-zinc-900 md:px-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 font-display text-2xl">Tələbə layihələri</h2>
          {projects.length === 0 ? (
            <p className="text-sm text-grey-500 dark:text-zinc-400">Bu kurs üzrə tezliklə layihələr əlavə olunacaq.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="overflow-hidden rounded-2xl bg-white dark:bg-black">
                  <div className="relative h-40">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                  </div>
                  <div className="p-5">
                    <p className="font-bold text-sm">{p.title}</p>
                    <p className="mt-1 text-xs text-grey-500 dark:text-zinc-400">{p.technologies.join(", ")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Teacher */}
      {course.teacher && (
        <section className="px-6 py-20 md:px-20">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-3xl border border-grey-100 p-10 dark:border-zinc-800 md:flex-row">
            <Image
              src={course.teacher.photoUrl || "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg"}
              alt={course.teacher.user.name}
              width={120}
              height={120}
              className="rounded-2xl object-cover"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Kursu tədris edir</p>
              <h3 className="mt-2 font-display text-xl">{course.teacher.user.name}</h3>
              <p className="mt-1 text-sm text-grey-500 dark:text-zinc-400">
                {course.teacher.position} · {course.teacher.experienceYears} illik təcrübə
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {course.teacher.specializations.map((s) => (
                  <Badge key={s} variant="default" className="dark:bg-zinc-800 dark:text-white">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-grey-50 px-6 py-20 dark:bg-zinc-900 md:px-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center font-display text-2xl">Tez-tez verilən suallar</h2>
          <div className="rounded-3xl bg-white px-8 dark:bg-black">
            <Accordion type="single" collapsible>
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="dark:text-white">{f.q}</AccordionTrigger>
                  <AccordionContent className="dark:text-zinc-400">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-6 py-20 text-center md:px-20">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-display text-3xl text-white md:text-4xl">{course.name} kursuna qoşulmağa hazırsınız?</h2>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white">
            <Link href={`/sinaq-dersi?course=${course.slug}`} className="flex items-center gap-2">
              Ödənişsiz sınaq dərsinə yazıl <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
