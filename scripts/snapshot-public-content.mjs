// Builds src/lib/public-content.json — the content the public landing site shows.
// The landing site reads ONLY this file, so nothing edited in the admin panel reaches it.
// To refresh the site on purpose: export the database (one JSON per table) and run
//   node scripts/snapshot-public-content.mjs <dir-with-table-json> [out-file]
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2];
const out = process.argv[3] ?? "src/lib/public-content.json";
if (!dir) { console.error("usage: node scripts/snapshot-public-content.mjs <dir-with-table-json> [out-file]"); process.exit(1); }
const read = (t) => JSON.parse(fs.readFileSync(path.join(dir, `${t}.json`), "utf8"));

const users = new Map(read("User").map((u) => [u.id, u]));
const modules = read("CourseModule");

// only public fields: never email / phone / passwordHash
const teacherBase = (t) => ({
  id: t.id, position: t.position, bio: t.bio, experienceYears: t.experienceYears,
  specializations: t.specializations, photoUrl: t.photoUrl,
  user: { name: users.get(t.userId)?.name ?? "", avatarUrl: users.get(t.userId)?.avatarUrl ?? null },
});

// course id = slug: the trial-booking form sends it back and the server resolves it to the real row
const courses = read("Course")
  .filter((c) => c.active !== false)
  .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  .map((c) => ({ ...c, id: c.slug, realId: c.id, active: true }));

const teachers = read("TeacherProfile")
  .sort((a, b) => (users.get(a.userId)?.createdAt ?? "").localeCompare(users.get(b.userId)?.createdAt ?? ""))
  .map(teacherBase);
const teacherById = new Map(teachers.map((t) => [t.id, t]));

const snapshot = {
  generatedAt: new Date().toISOString(),
  teachers: teachers.map((t) => ({ ...t, courses: courses.filter((c) => c.teacherId === t.id).map(({ realId, ...c }) => c) })),
  courses: courses.map(({ realId, ...c }) => ({
    ...c,
    teacher: c.teacherId ? teacherById.get(c.teacherId) ?? null : null,
    modules: modules.filter((m) => m.courseId === realId).sort((a, b) => a.order - b.order).map((m) => ({ ...m, courseId: c.id })),
  })),
  testimonials: read("Testimonial").filter((t) => t.featured),
  projects: read("Project").map(({ studentId, ...p }) => p),
};

fs.writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
console.log(`${out}: ${snapshot.teachers.length} teachers, ${snapshot.courses.length} courses, ${snapshot.testimonials.length} testimonials, ${snapshot.projects.length} projects`);
