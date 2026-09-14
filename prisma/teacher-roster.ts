/**
 * Single source of truth for the teacher roster.
 *
 * Imported by both `prisma/seed.ts` (fresh database) and
 * `scripts/sync-teachers.ts` (update an already-seeded database, e.g. production,
 * where seed.ts cannot run because it only does `create` and would hit the
 * unique-email constraint).
 *
 * `email` is the stable identity key — it is what sync matches on, so it must
 * not change even when a person's name does.
 */
export type TeacherSeed = {
  name: string;
  email: string;
  position: string;
  bio: string;
  experienceYears: number;
  specializations: string[];
  photoUrl: string | null;
};

export const teacherRoster: TeacherSeed[] = [
  {
    name: "Nicat Hətəmli",
    email: "tural.zeynalov@salehtech.az",
    position: "Kiber Təhlükəsizlik üzrə Baş Mütəxəssis",
    bio: "Respublika Kibertəhlükəsizlik olimpiadasına 4-cü yer. 5-dən çox hakaton qalibi (Metro Hakaton, Azcon Hakaton və s.).",
    experienceYears: 10,
    specializations: ["Linux", "Şəbəkə", "Kibertəhlükəsizlik", "CTF"],
    photoUrl: "/teachers/nijat-hatamli.jpg",
  },
  {
    name: "Əli Mustafayev",
    email: "eli.mustafayev@salehtech.az",
    position: "Elektrik-Elektronika Müəllimi",
    bio: "Elektrik-elektronika fənni üzrə müəllim.",
    experienceYears: 1,
    specializations: ["Elektrik", "Elektronika"],
    photoUrl: "/teachers/eli-mustafayev.jpg",
  },
  {
    name: "Rasul Sadiqli",
    email: "emin.qasimov@salehtech.az",
    position: "Full-Stack Proqramçı",
    bio: "Proqramlaşdırma fənni üzrə müəllim.",
    experienceYears: 1,
    specializations: ["JavaScript", "Python", "React", "Node.js"],
    photoUrl: "/teachers/rasul-sadigli.jpg",
  },
  {
    name: "Nasib Əhmədov",
    email: "nigar.aliyeva@salehtech.az",
    position: "Robototexnika Mühəndisi",
    bio: "Robototexnika fənni üzrə müəllim.",
    experienceYears: 1,
    specializations: ["Arduino", "Robotexnika", "Süni İntellekt"],
    photoUrl: "/teachers/nasib-ahmadov.jpg",
  },
  {
    name: "Nihat Durmuşov",
    email: "sebine.huseynova@salehtech.az",
    position: "Elektronika və IoT Mütəxəssisi",
    bio: "Elektronika və IoT fənni üzrə müəllim.",
    experienceYears: 1,
    specializations: ["Elektronika", "IoT", "Arduino", "Sensor sistemləri"],
    photoUrl: "/teachers/nihat-durmusov.jpg",
  },
];
