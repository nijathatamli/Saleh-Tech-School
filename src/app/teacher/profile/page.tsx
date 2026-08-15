import { getCurrentTeacher } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function TeacherProfilePage() {
  const teacher = await getCurrentTeacher();
  if (!teacher) return null;

  return (
    <div>
      <AppTopbar title="Profil" userName={teacher.user.name} userEmail={teacher.user.email} />

      <div className="max-w-2xl space-y-6 p-6 md:p-10">
        <div className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <Avatar name={teacher.user.name} src={teacher.photoUrl} size={64} />
          <div>
            <p className="font-bold text-navy-900">{teacher.user.name}</p>
            <p className="text-sm text-navy-400">{teacher.position}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
          <h3 className="mb-3 font-display text-base text-navy-900">Bio</h3>
          <p className="text-sm leading-relaxed text-navy-600">{teacher.bio}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {teacher.specializations.map((s) => (
              <Badge key={s} variant="app-electric">{s}</Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-navy-400">{teacher.experienceYears} illik təcrübə</p>
        </div>
      </div>
    </div>
  );
}
