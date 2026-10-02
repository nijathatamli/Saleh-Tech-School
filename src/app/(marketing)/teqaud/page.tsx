import Link from "next/link";
import { BookOpenCheck, ClipboardList, KeyRound, UserPlus } from "lucide-react";
import { getCategories } from "@/lib/scholarship/catalog";
import { SCHOLARSHIP_BASE, SCHOLARSHIP_NAME, SUBJECT_ORDER, SUBJECTS } from "@/lib/scholarship/config";
import { outlineButton, primaryButton } from "@/components/scholarship/styles";

export const dynamic = "force-dynamic";

const steps = [
  { icon: KeyRound, title: "Kodu al", text: "Kursun tələbəsi kimi müəllimindən 32 simvolluq kodu al.", href: `${SCHOLARSHIP_BASE}/qeydiyyat` },
  { icon: UserPlus, title: "Qeydiyyatdan keç", text: "Ad, soyad, sinif, FIN, telefon, e-poçt və kodu daxil et.", href: `${SCHOLARSHIP_BASE}/qeydiyyat` },
  { icon: BookOpenCheck, title: "Hazırlaş", text: "Mövzularla və qaydalarla tanış ol.", href: `${SCHOLARSHIP_BASE}/hazirliq` },
  { icon: ClipboardList, title: "İmtahan ver", text: "Qeydiyyatdan sonra birbaşa imtahana keçirsən.", href: `${SCHOLARSHIP_BASE}/qeydiyyat` },
];

export default async function ScholarshipAboutPage() {
  const categories = await getCategories();
  const minutes = categories.map((c) => c.durationMinutes);
  const duration = minutes.length ? (Math.min(...minutes) === Math.max(...minutes) ? `${minutes[0]}` : `${Math.min(...minutes)}–${Math.max(...minutes)}`) : "—";
  const grades = categories.length ? `${Math.min(...categories.map((c) => c.gradeFrom))}–${Math.max(...categories.map((c) => c.gradeTo))}` : "—";

  return (
    <>
      <section className="relative overflow-hidden px-6 py-20 md:px-20 md:py-28">
        <div className="absolute -z-10 right-0 top-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -z-10 bottom-0 left-0 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Saleh Tech School təqaüd proqramı</span>
          </div>
          <h1 className="font-display text-4xl leading-tight md:text-7xl">
            Reqamsal <span className="text-primary">Gələcək</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-grey-500 dark:text-zinc-400">
            Kursumuzun tələbəsi kimi qeydiyyatdan keç, sinfinə uyğun imtahanı ver və Məntiq, Math və English üzrə bacarıqlarını nümayiş etdir.
          </p>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`} className={primaryButton}>Qeydiyyatdan keç</Link>
            <Link href={`${SCHOLARSHIP_BASE}/hazirliq`} className={outlineButton}>Hazırlıq</Link>
          </div>
          <dl className="grid grid-cols-3 gap-6 border-t border-grey-100 pt-8 dark:border-zinc-800">
            {[
              { v: String(SUBJECT_ORDER.length), l: "Fənn" },
              { v: grades, l: "Sinif aralığı" },
              { v: duration, l: "Dəqiqə (imtahan müddəti)" },
            ].map((s) => (
              <div key={s.l}>
                <dt className="sr-only">{s.l}</dt>
                <dd className="font-display text-2xl md:text-4xl">{s.v}</dd>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">{s.l}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="px-6 py-24 md:px-20">
        <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Proses</p>
          <h2 className="font-display text-3xl leading-tight md:text-4xl">Təqaüd imtahanı necə keçir?</h2>
          <p className="text-grey-500 dark:text-zinc-400">
            İmtahan məntiqi düşüncəni, riyazi bacarığı və ingilis dili biliklərini qiymətləndirir. Hər şey bir neçə addımda.
          </p>
        </div>
        <ol className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Link href={s.href} className="group block h-full rounded-3xl border border-grey-100 p-8 transition-all hover:-translate-y-1 hover:border-primary dark:border-zinc-800">
                <div className="mb-6 flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-sm text-grey-200 dark:text-zinc-700">0{i + 1}</span>
                </div>
                <h3 className="font-display text-lg leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm text-grey-500 dark:text-zinc-400">{s.text}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-grey-50 px-6 py-24 dark:bg-zinc-950 md:px-20">
        <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">İmtahan bölmələri</p>
          <h2 className="font-display text-3xl leading-tight md:text-4xl">Qarşılaşacağın mövzular:</h2>
          <p className="text-grey-500 dark:text-zinc-400">Suallar qeydiyyatda seçdiyin sinfə uyğun olaraq avtomatik yüklənir.</p>
        </div>
        <ul className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {SUBJECT_ORDER.map((k) => (
            <li key={k} className="rounded-3xl border border-grey-100 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="font-display text-2xl">{SUBJECTS[k].label}</h3>
              <p className="mt-3 text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{SUBJECTS[k].blurb}</p>
            </li>
          ))}
        </ul>
        {categories.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl text-center">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">Sinif qrupları</p>
            <ul className="flex flex-wrap justify-center gap-3">
              {categories.map((c) => (
                <li key={c.key} className="rounded-full border border-grey-200 bg-white px-5 py-2 text-xs font-bold dark:border-zinc-700 dark:bg-zinc-900">
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="px-6 py-24 text-center md:px-20">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="font-display text-3xl leading-tight md:text-4xl">{SCHOLARSHIP_NAME} səni gözləyir</h2>
          <p className="text-grey-500 dark:text-zinc-400">Qeydiyyat bir neçə dəqiqə çəkir.</p>
          <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`} className={primaryButton}>Qeydiyyatdan keç</Link>
        </div>
      </section>
    </>
  );
}
