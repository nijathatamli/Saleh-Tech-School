import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllCourses } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Badge } from "@/components/ui/badge";
import { formatAzn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const levelLabel: Record<string, string> = { BEGINNER: "Başlanğıc", INTERMEDIATE: "Orta", ADVANCED: "Qabaqcıl" };

export default async function AdminCoursesPage() {
  const session = await getServerSession(authOptions);
  const courses = await getAllCourses();

  return (
    <div>
      <AppTopbar title="Kurslar" userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="p-6 md:p-10">
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-bold uppercase tracking-widest text-navy-400">
                <th className="px-6 py-3">Kurs</th>
                <th className="px-6 py-3">Müəllim</th>
                <th className="px-6 py-3">Yaş</th>
                <th className="px-6 py-3">Səviyyə</th>
                <th className="px-6 py-3">Qiymət</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-4 font-bold text-navy-900">{c.name}</td>
                  <td className="px-6 py-4 text-navy-600">{c.teacher?.user.name ?? "—"}</td>
                  <td className="px-6 py-4 text-navy-600">{c.minAge}-{c.maxAge}</td>
                  <td className="px-6 py-4 text-navy-600">{levelLabel[c.level]}</td>
                  <td className="px-6 py-4 text-navy-600">{formatAzn(c.price)}/ay</td>
                  <td className="px-6 py-4">
                    {c.featured ? <Badge variant="success">Populyar</Badge> : <Badge variant="default">Aktiv</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
