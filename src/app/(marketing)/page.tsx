import { Hero } from "@/components/marketing/hero";
import { CadetSection } from "@/components/marketing/cadet-section";
import { Marquee } from "@/components/marketing/marquee";
import { Stats } from "@/components/marketing/stats";
import { CourseHighlights } from "@/components/marketing/course-highlights";
import { CoursesSection } from "@/components/marketing/courses-section";
import { TeachersSection } from "@/components/marketing/teachers-section";
import { ParentPanelPreview } from "@/components/marketing/parent-panel-preview";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { CtaSection } from "@/components/marketing/cta-section";

import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/json-ld";
import { getAllCourses } from "@/lib/data";
import { SEO, SITE_NAME, absoluteUrl, pageMetadata, type SeoKey } from "@/lib/seo";

// Head-only SEO for the landing page: nothing below renders anything visible.
export const metadata: Metadata = {
  ...pageMetadata("home"),
  category: "education",
  alternates: { canonical: "/", languages: { "az-AZ": "/", "x-default": "/" } },
  other: { "geo.region": "AZ", "geo.placename": "Azərbaycan", "content-language": "az" },
};

// the pages a visitor can reach from the site, announced to search engines as the site's main navigation
const NAV: SeoKey[] = ["courses", "registration", "scholarship", "parents", "reviews", "teachers", "about", "contact", "vacancies"];
const NAV_NAMES: Record<string, string> = { courses: "Kurslar", registration: "Ödənişsiz sınaq dərsi", scholarship: "Təqaüd proqramı", parents: "Valideyn Paneli", reviews: "Rəylər", teachers: "Müəllimlər", about: "Haqqımızda", contact: "Əlaqə", vacancies: "Əməkdaşlıq və vakansiyalar" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const courses = await getAllCourses();
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": absoluteUrl("/#webpage"),
      url: absoluteUrl("/"),
      name: SEO.home.title,
      description: SEO.home.description,
      inLanguage: "az",
      isPartOf: { "@id": absoluteUrl("/#website") },
      about: { "@id": absoluteUrl("/#organization") },
      primaryImageOfPage: absoluteUrl("/og-image.png"),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${SITE_NAME}: uşaqlar üçün kurslar`,
      itemListElement: courses.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Course",
          name: `${c.name} kursu`,
          description: c.shortDesc,
          url: absoluteUrl(`/kurslar/${c.slug}`),
          provider: { "@id": absoluteUrl("/#organization") },
          audience: { "@type": "PeopleAudience", suggestedMinAge: c.minAge, suggestedMaxAge: c.maxAge },
        },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": absoluteUrl("/#navigation"),
      name: "Əsas bölmələr",
      itemListElement: NAV.map((k, i) => ({ "@type": "SiteNavigationElement", position: i + 1, name: NAV_NAMES[k], url: absoluteUrl(SEO[k].path) })),
    },
  ];

  return (
    <>
      <JsonLd data={ld} />
      <Hero />
      <CadetSection />
      <Marquee />
      <Stats />
      <CourseHighlights />
      <CoursesSection />
      <TeachersSection />
      <ParentPanelPreview />
      <TestimonialsSection />
      <CtaSection />
    </>
  );
}
