import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllTeachersAdmin } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const session = await getServerSession(authOptions);
  const teachers = await getAllTeachersAdmin();

  return (
    <div>
      <AppTopbar title="Müəllimlər" userName={session?.user?.name ?? "Admin"} userEmail={session?.user?.email ?? ""} />

      <div className="p-6 md:p-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <div key={t.id} className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <div className="flex items-center gap-3">
                <Avatar name={t.user.name} src={t.photoUrl} size={44} />
                <div>
                  <p className="font-bold text-navy-900">{t.user.name}</p>
                  <p className="text-xs text-navy-400">{t.position}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {t.specializations.slice(0, 3).map((s) => (
                  <Badge key={s} variant="app-electric">{s}</Badge>
                ))}
              </div>
              <div className="mt-4 flex justify-between text-xs text-navy-400">
                <span>{t.courses.length} kurs</span>
                <span>{t.classes.length} sinif</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
