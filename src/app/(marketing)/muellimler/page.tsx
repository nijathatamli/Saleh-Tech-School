import Link from "next/link";
import type { Metadata } from "next";
import { getTeachers } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { TeacherPhoto } from "@/components/marketing/teacher-photo";
import { Reveal } from "@/components/app/reveal";

export const metadata: Metadata = { title: "Müəllimlər" };
export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const teachers = await getTeachers();

  return (
    <div className="px-6 py-20 md:px-20">
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Komandamız</span>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">Peşəkar Müəllimlərimiz</h1>
      </div>
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
        {teachers.map((t, i) => (
          <Reveal key={t.id} delay={i * 75}>
            <Link
              href={`/muellimler/${t.id}`}
              className="group block overflow-hidden rounded-3xl border border-grey-100 transition-all hover:-translate-y-1 hover:shadow-xl dark:border-zinc-800"
            >
              <div className="relative aspect-[4/5]">
                <TeacherPhoto src={t.photoUrl} name={t.user.name} fill />
              </div>
              <div className="p-6">
                <h3 className="font-display text-lg group-hover:text-primary transition-colors">{t.user.name}</h3>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">
                  {t.position}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.specializations.slice(0, 3).map((s) => (
                    <Badge key={s} variant="default" className="dark:bg-zinc-800 dark:text-white">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
