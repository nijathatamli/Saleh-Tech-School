import Image from "next/image";
import { FolderGit2, Award } from "lucide-react";
import { getCurrentStudent } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function StudentPortfolioPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  return (
    <div>
      <AppTopbar title="Portfolio" userName={student.user?.name ?? student.firstName} userEmail={student.user?.email ?? ""} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-navy-900 to-electric-600 p-8 text-white sm:flex-row">
          <Avatar name={`${student.firstName} ${student.lastName}`} src={student.avatarUrl} size={80} className="ring-4 ring-white/20" />
          <div className="text-center sm:text-left">
            <h2 className="font-app text-2xl font-extrabold">{student.firstName} {student.lastName}</h2>
            <p className="mt-1 text-sm text-white/70">Səviyyə {student.level} texnoloqu</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {student.enrollments.map((e) => (
                <Badge key={e.id} variant="app-cyan">{e.course.name}</Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03] lg:col-span-1">
            <h3 className="mb-6 font-app text-base font-bold text-navy-900">Bacarıqlar</h3>
            {student.progress.length === 0 ? (
              <p className="text-sm text-navy-400">Hələ bacarıq qeydi yoxdur.</p>
            ) : (
              <div className="space-y-5">
                {student.progress.map((p) => (
                  <div key={p.id}>
                    <div className="mb-1.5 flex justify-between text-xs text-navy-400">
                      <span>{p.skill}</span>
                      <span className="font-bold text-navy-900">{p.percent}%</span>
                    </div>
                    <Progress value={p.percent} color="cyan" />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 font-app text-base font-bold text-navy-900">
              <FolderGit2 className="h-4 w-4 text-electric-500" /> Layihələr
            </h3>
            {student.projects.length === 0 ? (
              <EmptyState icon={FolderGit2} title="Hələ layihə yoxdur" description="İlk layihəni əlavə etmək üçün müəllimlə əlaqə saxlayın." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {student.projects.map((p) => (
                  <div key={p.id} className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
                    <div className="relative h-36">
                      <Image src={p.imageUrl} alt={p.title} fill sizes="400px" className="object-cover" />
                    </div>
                    <div className="p-4">
                      <p className="font-bold text-navy-900">{p.title}</p>
                      <p className="mt-1 text-xs text-navy-400">{p.technologies.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 font-app text-base font-bold text-navy-900">
                <Award className="h-4 w-4 text-amber-500" /> Sertifikatlar
              </h3>
              <EmptyState icon={Award} title="Hələ sertifikat qazanılmayıb" description="Kurs tamamlandıqda burada görünəcək." />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
