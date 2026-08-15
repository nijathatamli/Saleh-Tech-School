import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllStudentsAdmin } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const session = await getServerSession(authOptions);
  const students = await getAllStudentsAdmin();

  return (
    <div>
      <AppTopbar title="Tələbələr" userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="p-6 md:p-10">
        <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100 text-left text-xs font-bold uppercase tracking-widest text-navy-400">
                <th className="px-6 py-3">Ad</th>
                <th className="px-6 py-3">Valideyn</th>
                <th className="px-6 py-3">Kurs</th>
                <th className="px-6 py-3">Səviyyə</th>
                <th className="px-6 py-3">Xal</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 font-bold text-navy-900">
                      <Avatar name={`${s.firstName} ${s.lastName}`} src={s.avatarUrl} size={32} />
                      {s.firstName} {s.lastName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-navy-600">{s.parent.user.name}</td>
                  <td className="px-6 py-4 text-navy-600">{s.enrollments[0]?.course.name ?? "—"}</td>
                  <td className="px-6 py-4 text-navy-600">{s.level}</td>
                  <td className="px-6 py-4 font-bold text-navy-900">{s.points.toLocaleString("az-AZ")} ⭐</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
