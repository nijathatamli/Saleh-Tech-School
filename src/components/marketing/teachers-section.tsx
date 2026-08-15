import Link from "next/link";
import Image from "next/image";
import { GraduationCap, ArrowRight } from "lucide-react";
import { getTeachers } from "@/lib/data";

export async function TeachersSection() {
  const teachers = await getTeachers();

  return (
    <section id="teachers" className="relative overflow-hidden px-6 py-32 dark:bg-black md:px-20">
      <div className="absolute -z-10 right-0 top-0 h-[32rem] w-[32rem] rounded-full bg-blue-400/10 blur-[120px]" />
      <div className="absolute -z-10 bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />

      <div className="mx-auto mb-16 flex max-w-7xl items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-primary text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-2xl text-secondary dark:text-white md:text-4xl">Peşəkar Müəllimlərimiz</h2>
          <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-teal-500 to-transparent" />
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
        {teachers.map((t) => (
          <Link
            key={t.id}
            href={`/muellimler/${t.id}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl transition-transform duration-500 hover:z-10 hover:scale-[1.06] hover:shadow-2xl hover:shadow-black/30"
          >
            <Image
              src={t.photoUrl || `https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg`}
              alt={t.user.name}
              fill
              className="object-cover grayscale contrast-125 transition-all duration-500 group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 space-y-1 p-6">
              <h3 className="font-display text-lg text-white transition-colors duration-300 group-hover:text-primary">
                {t.user.name}
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">{t.position}</p>
              <p className="text-xs text-grey-200/70">{t.experienceYears} illik təcrübə</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Link
          href="/muellimler"
          className="inline-flex items-center gap-2 rounded-full border border-secondary bg-secondary px-8 py-4 text-sm font-semibold text-white transition-all hover:border-primary hover:bg-primary"
        >
          Bütün Müəllimlər <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
