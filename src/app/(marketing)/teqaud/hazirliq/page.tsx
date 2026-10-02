import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/scholarship/page-header";
import { cardClass, primaryButton } from "@/components/scholarship/styles";
import { getCategories } from "@/lib/scholarship/catalog";
import { SCHOLARSHIP_BASE, SCHOLARSHIP_NAME, SUBJECT_ORDER, SUBJECTS } from "@/lib/scholarship/config";

export const metadata: Metadata = { title: "Hazırlıq" };
export const dynamic = "force-dynamic";

const rules = [
  "İmtahan yalnız kursumuzun tələbələri üçündür: qeydiyyat üçün müəllimin verdiyi 32 simvolluq kod lazımdır.",
  "Sabit internet bağlantınızın olduğundan əmin olun.",
  "Qeydiyyatdan sonra imtahan səhifəsi açılır; “İmtahana başla” düyməsinə basdığınız andan sayğac işləyir və dayandırılmır.",
  "Cavablarınız avtomatik yadda saxlanılır, istədiyiniz vaxt əvvəlki suallara qayıda bilərsiniz.",
  "Math sualları hər tələbə üçün təsadüfi seçilir. İmtahan yalnız bir dəfə verilir.",
];

const tips: Record<(typeof SUBJECT_ORDER)[number], string> = {
  LOGIC: "Ardıcıllıqlara, şəkil və ədəd qanunauyğunluqlarına, “kim hansı yerdədir” tipli məsələlərə baxın.",
  MATH: "Dörd əməli, kəsrlər, faiz, həndəsə və tənliklər üzrə sinfinizin proqramını təkrar edin.",
  ENGLISH: "Sadə cümlələrin mənasını anlamağa, düzgün sözü və məntiqli cümləni seçməyə hazırlaşın.",
};

export default async function ScholarshipPreparationPage() {
  const categories = await getCategories();

  return (
    <section className="px-6 py-16 md:px-20">
      <PageHeader eyebrow={SCHOLARSHIP_NAME} title="Hazırsan?">
        İmtahandan əvvəl mövzularla və qaydalarla tanış ol.
      </PageHeader>

      <div className={`mx-auto max-w-3xl space-y-8 ${cardClass}`}>
        <ul className="grid gap-4 sm:grid-cols-3">
          {SUBJECT_ORDER.map((k) => (
            <li key={k} className="rounded-2xl bg-grey-50 p-5 dark:bg-zinc-950">
              <p className="font-display text-lg">{SUBJECTS[k].label}</p>
              <p className="mt-3 text-xs leading-relaxed text-grey-500 dark:text-zinc-400">{tips[k]}</p>
            </li>
          ))}
        </ul>

        {categories.length > 0 && (
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">İmtahan müddəti</p>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {categories.map((c) => (
                <li key={c.key} className="flex justify-between rounded-xl border border-grey-100 px-4 py-3 dark:border-zinc-800">
                  <span>{c.label}</span>
                  <span className="font-bold">{c.durationMinutes} dəq</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="space-y-3">
          {rules.map((r) => (
            <li key={r} className="flex items-start gap-3 text-sm text-grey-500 dark:text-zinc-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {r}
            </li>
          ))}
        </ul>

        <Link href={`${SCHOLARSHIP_BASE}/qeydiyyat`} className={`${primaryButton} w-full`}>Qeydiyyatdan keç və imtahana başla</Link>
      </div>
    </section>
  );
}
