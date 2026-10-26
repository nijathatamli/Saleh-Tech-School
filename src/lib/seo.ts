// On-page SEO for the public site: one table holds the title tag (≤ 60), meta description (≤ 160), keywords and canonical
// path of every indexable page, so the copy lives in one place and `qa/tests/seo.test.mjs` can check the limits.
import type { Metadata } from "next";
import { socialLinks } from "@/lib/social";

export const SITE_NAME = "Saleh Tech School";

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL to the live domain (https://…); otherwise the NextAuth URL is used. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");

export const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630, alt: "Saleh Tech School — uşaqlar üçün proqramlaşdırma və texnologiya məktəbi" };

export type SeoKey = "blog" | "home" | "courses" | "parents" | "reviews" | "scholarship" | "contact" | "about" | "vacancies" | "registration" | "teachers";

export type SeoEntry = { path: string; title: string; description: string; keywords: string[] };

export const SEO: Record<SeoKey, SeoEntry> = {
  home: {
    path: "/",
    title: "Saleh Tech School | İT, Robototexnika, Elektronika və Aİ",
    description:
      "6–18 yaşlı uşaqlar üçün Proqramlaşdırma, Kibertəhlükəsizlik, Robototexnika, Elektronika və Süni İntellekt dərsləri. Pulsuz sınaq dərsinə qoşulun.",
    keywords: ["uşaqlar üçün IT kursları", "uşaqlar üçün proqramlaşdırma kursu", "STEAM", "robototexnika kursu", "kibertəhlükəsizlik kursu", "Saleh Tech School"],
  },
  courses: {
    path: "/kurslar",
    title: "İT, Robototexnika, STEAM Kursları | Saleh Tech School",
    description:
      "Proqramlaşdırma, Robototexnika, Elektronika, Kibertəhlükəsizlik və Süni İntellekt kursları. 6–18 yaşlı uşaq və yeniyetmələr üçün dərslər. Pulsuz sınaq dərsi.",
    keywords: ["robototexnika kursu", "kibertəhlükəsizlik kursu", "süni intellekt kursu", "IT kursları", "texnologiya kursları", "uşaqlar üçün kurslar"],
  },
  parents: {
    path: "/valideyn-paneli",
    title: "Valideyn Paneli | Şagirdin İnkişafını İzləyin",
    description:
      "Saleh Tech School Valideyn Paneli ilə övladınızın dərs davamiyyətini, tapşırıq nəticələrini və müəllim qeydlərini izləyin, ödəniş bildirişlərini görün.",
    keywords: ["valideyn paneli", "şagirdin inkişafı", "davamiyyət", "IT", "proqramlaşdırma", "robototexnika", "Elektronika", "Aİ", "Kibertəhlükəsizlik"],
  },
  reviews: {
    path: "/reyler",
    title: "Saleh Tech School Rəyləri | Valideyn və Şagird Təcrübəsi",
    description:
      "Saleh Tech School-da təhsil alan şagird və valideynlərin real təcrübələri. IT, proqramlaşdırma, robototexnika və digər texnologiya dərsləri haqqında rəylər.",
    keywords: ["Saleh Tech School rəyləri", "valideyn rəyləri", "IT kursu rəyləri", "uşaqlar üçün kompüter kursu", "kodlaşdırma dərsləri"],
  },
  scholarship: {
    path: "/teqaud",
    title: "Təqaüd Proqramı | 60–90% Təqaüd Şansı | Saleh Tech School",
    description:
      "6–18 yaşlı uşaqlar üçün texnologiya sahəsində təqaüd proqramı: Məntiq, Riyaziyyat və İngilis dili imtahanı verin, kurslarımızda 60–90% təqaüd qazanın.",
    keywords: ["təqaüd proqramı", "təqaüd imtahanı", "IT kursuna təqaüd", "uşaqlar üçün təqaüd", "Reqamsal Gələcək"],
  },
  contact: {
    path: "/elaqe",
    title: "Əlaqə | Pulsuz Konsultasiya | Saleh Tech School",
    description:
      "IT kursları haqqında məlumat almaq üçün bizimlə əlaqə saxlayın. Pulsuz konsultasiyaya yazılın və 6–18 yaşlı uşaqlar üçün ödənişsiz demo dərsə qoşulun.",
    keywords: ["gələcəyin IT mütəxəssisləri", "IT təlim mərkəzi", "uşaqlar üçün kodlaşdırma dərsləri", "IT kursları əlaqə"],
  },
  about: {
    path: "/haqqimizda",
    title: "Saleh Tech School | Haqqımızda | Uşaqlar üçün STEAM Təhsili",
    description:
      "Saleh Tech School 6–18 yaşlı uşaqlara Robototexnika, Elektronika, proqramlaşdırma və İT dərsləri öyrədir. Missiyamız, komandamız və yanaşmamızla tanış olun.",
    keywords: ["uşaqlar üçün elektronika dərsləri", "Arduino kursu uşaqlar üçün", "uşaqlar üçün AI kursu", "STEAM təhsili", "texnologiya məktəbi"],
  },
  vacancies: {
    path: "/vakansiyalar",
    title: "Əməkdaşlıq və Təkliflər | Saleh Tech School",
    description:
      "Əməkdaşlıq təklifiniz var? Uşaqlar üçün texnologiya və İT təhsili sahəsində birlikdə işləyək. Müəllim və ya tərəfdaş kimi bizimlə əlaqə saxlayın.",
    keywords: ["uşaqlar üçün İT təhsili", "uşaq texnologiya məktəbi", "IT məktəbi", "uşaqlar üçün texnologiya məktəbi", "IT müəllimi vakansiya"],
  },
  registration: {
    path: "/sinaq-dersi",
    title: "Ödənişsiz Konsultasiya | Demo Dərs | Saleh Tech School",
    description:
      "Pulsuz konsultasiyaya yazılın. 6–18 yaşlı uşaqlar üçün ödənişsiz demo dərsdə iştirak edin: Robototexnika, Elektronika, İT kursları haqqında məlumat alın.",
    keywords: ["pulsuz demo dərs", "sınaq dərsi", "pulsuz sınaq dərsi", "IT kurslarına qeydiyyat", "uşaqlar üçün kurs qeydiyyatı"],
  },
  blog: {
    path: "/bloq",
    title: "Bloq | Uşaqlar üçün İT və Proqramlaşdırma | Saleh Tech",
    description:
      "Saleh Tech School bloqu: uşaqlar üçün proqramlaşdırma, robototexnika, kibertəhlükəsizlik və süni intellekt haqqında məqalələr və valideynlər üçün məsləhətlər.",
    keywords: ["uşaqlar üçün proqramlaşdırma bloqu", "IT məqalələri", "valideynlər üçün məsləhətlər", "robototexnika", "kibertəhlükəsizlik", "süni intellekt uşaqlar üçün"],
  },
  teachers: {
    path: "/muellimler",
    title: "Müəllimlər | İT və Robototexnika | Saleh Tech School",
    description: "Saleh Tech School-un təcrübəli müəllimləri: proqramlaşdırma, kibertəhlükəsizlik, robototexnika və elektronika üzrə mentorlar.",
    keywords: ["IT müəllimləri", "proqramlaşdırma müəllimi", "robototexnika müəllimi", "kibertəhlükəsizlik müəllimi"],
  },
};

/** Absolute URL for a site path. */
export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}`;

type Extra = { title?: string; description?: string; keywords?: string[]; path?: string; type?: "website" | "article"; noindex?: boolean };

/** Full metadata for a public page: absolute title (so the root "%s | Saleh Tech School" template does not double the brand),
 *  description, keywords, canonical, Open Graph and Twitter card. */
export function pageMetadata(key: SeoKey, extra: Extra = {}): Metadata {
  const e = SEO[key];
  const title = extra.title ?? e.title;
  const description = extra.description ?? e.description;
  const path = extra.path ?? e.path;
  return {
    title: { absolute: title },
    description,
    keywords: extra.keywords ?? e.keywords,
    alternates: { canonical: path },
    openGraph: {
      type: extra.type ?? "website",
      locale: "az_AZ",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE.url] },
    ...(extra.noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Same, for pages whose title comes from data (a course, a teacher, a blog post). `title` must already carry the brand and stay ≤ 60.
 *  `image` replaces the default social card; `article` adds the Open Graph article fields; `noindex` keeps a page out of search. */
export function dynamicMetadata(opts: {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  image?: { url: string; alt: string };
  article?: { publishedTime?: string; modifiedTime?: string; authors?: string[]; tags?: string[]; section?: string };
  noindex?: boolean;
  rss?: string;
}): Metadata {
  const images = opts.image ? [{ url: opts.image.url, alt: opts.image.alt }] : [OG_IMAGE];
  return {
    title: { absolute: opts.title },
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path, ...(opts.rss ? { types: { "application/rss+xml": opts.rss } } : {}) },
    openGraph: {
      type: opts.article ? "article" : opts.type ?? "website", locale: "az_AZ", siteName: SITE_NAME, title: opts.title, description: opts.description, url: opts.path, images,
      ...(opts.article ? { publishedTime: opts.article.publishedTime, modifiedTime: opts.article.modifiedTime, authors: opts.article.authors, tags: opts.article.tags, section: opts.article.section } : {}),
    },
    twitter: { card: "summary_large_image", title: opts.title, description: opts.description, images: [images[0].url] },
    ...(opts.noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Cut at a word boundary so generated descriptions never run past `max`. */
export function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,;:.–-]+$/, "")}…`;
}

// ---- structured data (schema.org JSON-LD) ----

export const organizationLd = () => ({
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-s.png`,
  image: `${SITE_URL}${OG_IMAGE.url}`,
  description: SEO.home.description,
  inLanguage: "az",
  knowsAbout: ["Proqramlaşdırma", "Robototexnika", "Elektronika", "Kibertəhlükəsizlik", "Süni intellekt", "STEAM təhsili", "Python", "Web development"],
  areaServed: { "@type": "Country", name: "Azerbaijan" },
  ...(socialLinks().length ? { sameAs: socialLinks() } : {}),
  audience: { "@type": "EducationalAudience", educationalRole: "student", suggestedMinAge: 6, suggestedMaxAge: 18 },
});

export const websiteLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "az",
  publisher: { "@id": `${SITE_URL}/#organization` },
});

export const breadcrumbLd = (trail: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Ana səhifə", path: "/" }, ...trail].map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, item: absoluteUrl(t.path) })),
});
