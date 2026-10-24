import type { Metadata } from "next";
import { getAllCourses } from "@/lib/data";
import { CourseCatalog } from "@/components/marketing/course-catalog";
import { JsonLd } from "@/components/seo/json-ld";
import { SEO, absoluteUrl, breadcrumbLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata("courses");
export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const courses = await getAllCourses();

  return (
    <div className="px-6 py-20 md:px-20">
      <JsonLd
        data={[
          breadcrumbLd([{ name: "Kurslar", path: SEO.courses.path }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Saleh Tech School kursları",
            itemListElement: courses.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: absoluteUrl(`/kurslar/${c.slug}`) })),
          },
        ]}
      />
      <div className="mx-auto mb-16 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">İxtisaslar</span>
        <h1 className="font-display text-3xl leading-tight md:text-5xl">Uşaqlar üçün İT, robototexnika və STEAM kursları</h1>
        <p className="text-grey-500 dark:text-zinc-400">
          6–18 yaşlı uşaqlar üçün proqramlaşdırma, kibertəhlükəsizlik, süni intellekt, elektronika və digər istiqamətlərdən birini seçin
        </p>
      </div>
      <div className="mx-auto max-w-7xl">
        <h2 className="sr-only">Kurs siyahısı: yaşa və istiqamətə görə seçin</h2>
        <CourseCatalog courses={courses} />
      </div>
    </div>
  );
}
