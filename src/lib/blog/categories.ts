export const BLOG_CATEGORIES = [
  { slug: "texnologiya", label: "Texnologiya" },
  { slug: "proqramlashdirma", label: "Proqramlaşdırma" },
  { slug: "robototexnika", label: "Robototexnika" },
  { slug: "kibertehlukesizlik", label: "Kibertəhlükəsizlik" },
  { slug: "suni-intellekt", label: "Süni intellekt" },
  { slug: "valideynler-ucun", label: "Valideynlər üçün" },
  { slug: "mekteb-xeberleri", label: "Məktəb xəbərləri" },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];

/** A post stores the category's label (what readers see); the slug is for URLs. */
export const categoryBySlug = (slug: string) => BLOG_CATEGORIES.find((c) => c.slug === slug);
export const categoryByLabel = (label: string) => BLOG_CATEGORIES.find((c) => c.label === label);
export const categoryLabels = BLOG_CATEGORIES.map((c) => c.label) as readonly string[];
