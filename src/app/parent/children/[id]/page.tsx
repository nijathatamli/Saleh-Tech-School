import { notFound } from "next/navigation";
import Image from "next/image";
import { Award, FolderGit2, Trophy } from "lucide-react";
import { getChildForParent, getCurrentParent } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { attendanceRate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChildProfilePage({ params }: { params: { id: string } }) {
  const parent = await getCurrentParent();
  if (!parent) return null;

  const child = await getChildForParent(params.id);
  if (!child) notFound();

  const rate = attendanceRate(child.attendance);
  const age = Math.floor((Date.now() - new Date(child.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25));

  return (
    <div>
      <AppTopbar title={`${child.firstName} ${child.lastName}`} userName={parent.user.name} userEmail={parent.user.email} />

      <div className="space-y-8 p-6 md:p-10">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-navy-100 bg-white p-8 shadow-sm shadow-navy-900/[0.03] sm:flex-row">
          <Avatar name={`${child.firstName} ${child.lastName}`} src={child.avatarUrl} size={80} />
          <div className="text-center sm:text-left">
            <h2 className="font-display text-xl text-navy-900">
              {child.firstName} {child.lastName}
            </h2>
            <p className="mt-1 text-sm text-navy-400">{age} yaş · Səviyyə {child.level}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {child.enrollments.map((e) => (
                <Badge key={e.id} variant="app-electric">
                  {e.course.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="ml-0 grid grid-cols-3 gap-6 sm:ml-auto">
            <div className="text-center">
              <p className="font-display text-xl text-navy-900">{child.xp.toLocaleString("az-AZ")}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">XP</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-navy-900">{child.points.toLocaleString("az-AZ")}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Xal</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-navy-900">{rate}%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Davamiyyət</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 font-display text-base text-navy-900">Bacarıqlar üzrə tərəqqi</h3>
              {child.progress.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ tərəqqi qeydi yoxdur.</p>
              ) : (
                <div className="space-y-5">
                  {child.progress.map((p) => (
                    <div key={p.id}>
                      <div className="mb-1.5 flex justify-between text-xs text-navy-400">
                        <span>{p.skill}</span>
                        <span className="font-bold text-navy-900">{p.percent}%</span>
                      </div>
                      <Progress value={p.percent} color="electric" />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 flex items-center gap-2 font-display text-base text-navy-900">
                <FolderGit2 className="h-4 w-4 text-electric-500" /> Layihələr
              </h3>
              {child.projects.length === 0 ? (
                <EmptyState icon={FolderGit2} title="Hələ layihə yoxdur" />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {child.projects.map((p) => (
                    <div key={p.id} className="overflow-hidden rounded-xl border border-navy-100">
                      <div className="relative h-32">
                        <Image src={p.imageUrl} alt={p.title} fill className="object-cover" />
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-bold text-navy-900">{p.title}</p>
                        <p className="mt-1 text-xs text-navy-400">{p.technologies.join(", ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 flex items-center gap-2 font-display text-base text-navy-900">
                <Trophy className="h-4 w-4 text-amber-500" /> Nailiyyətlər
              </h3>
              {child.studentBadges.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ nişan qazanılmayıb.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {child.studentBadges.map((sb) => (
                    <div
                      key={sb.id}
                      className="flex flex-col items-center gap-1 rounded-xl bg-navy-50 p-3 text-center"
                      title={sb.badge.description}
                    >
                      <span className="text-2xl">{sb.badge.emoji}</span>
                      <span className="text-[10px] font-bold leading-tight text-navy-900">{sb.badge.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-6 flex items-center gap-2 font-display text-base text-navy-900">
                <Award className="h-4 w-4 text-amber-500" /> Sertifikatlar
              </h3>
              <EmptyState icon={Award} title="Hələ sertifikat qazanılmayıb" description="Kurs tamamlandıqda burada görünəcək." />
            </section>

            <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-sm shadow-navy-900/[0.03]">
              <h3 className="mb-4 font-display text-base text-navy-900">Müəllim rəyləri</h3>
              {child.grades.length === 0 ? (
                <p className="text-sm text-navy-400">Hələ qiymət qeydi yoxdur.</p>
              ) : (
                <div className="space-y-3">
                  {child.grades.slice(0, 4).map((g) => (
                    <div key={g.id} className="flex items-center justify-between text-sm">
                      <span className="text-navy-600">{g.subject}</span>
                      <span className="font-bold text-navy-900">
                        {g.score}/{g.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
