import { Archivo, Urbanist } from "next/font/google";
import { getAllCourses } from "@/lib/data";
import { CadetHero, type CadetCourse } from "./cadet-hero";

// Archivo Black Italic for the glowing headline, Urbanist for the rest of this section
const archivo = Archivo({ subsets: ["latin", "latin-ext"], style: ["italic"], weight: ["900"], variable: "--font-archivo", display: "swap" });
const urbanist = Urbanist({ subsets: ["latin", "latin-ext"], weight: ["600", "700"], variable: "--font-urbanist", display: "swap" });

// left to right along the cadet's gaze: the order of this list is the order across the section
const ORDER = ["kibertehlukesizlik", "proqramlashdirma", "robotexnika", "elektronika", "suni-intellekt", "oyun-yaratma"];
const SHORT: Record<string, string> = { "suni-intellekt": "Süni İntellekt" };

export async function CadetSection() {
  const all = await getAllCourses();
  const courses: CadetCourse[] = ORDER.map((slug) => all.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => !!c)
    .map((c) => ({ slug: c.slug, name: SHORT[c.slug] ?? c.name, shortDesc: c.shortDesc, category: c.category, minAge: c.minAge, maxAge: c.maxAge }));
  if (courses.length < 2) return null;
  return (
    <div className={`${archivo.variable} ${urbanist.variable}`}>
      <CadetHero courses={courses} />
    </div>
  );
}
