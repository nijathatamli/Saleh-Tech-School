import { Trophy } from "lucide-react";
import { getCurrentStudent, getLeaderboard } from "@/lib/data";
import { AppTopbar } from "@/components/app/topbar";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const medalColors = ["text-amber-400", "text-zinc-400", "text-orange-400"];

export default async function StudentLeaderboardPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const leaderboard = await getLeaderboard(20);

  return (
    <div>
      <AppTopbar title="Liderlik Cədvəli" userName={student.user?.name ?? student.firstName} userEmail={student.user?.email ?? ""} />

      <div className="space-y-4 p-6 md:p-10">
        <div className="rounded-2xl border border-navy-100 bg-white shadow-sm shadow-navy-900/[0.03]">
          {leaderboard.map((s, i) => {
            const isMe = s.id === student.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-4 border-b border-navy-50 p-5 last:border-0",
                  isMe && "bg-electric-500/5"
                )}
              >
                <div className="flex w-8 items-center justify-center">
                  {i < 3 ? (
                    <Trophy className={cn("h-5 w-5", medalColors[i])} />
                  ) : (
                    <span className="text-sm font-bold text-navy-400">{i + 1}</span>
                  )}
                </div>
                <Avatar name={`${s.firstName} ${s.lastName}`} src={s.avatarUrl} size={40} />
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate font-bold", isMe ? "text-electric-600" : "text-navy-900")}>
                    {s.firstName} {s.lastName} {isMe && "(Siz)"}
                  </p>
                  <p className="text-xs text-navy-400">{s.enrollments[0]?.course.name ?? "Kurs təyin edilməyib"} · Səviyyə {s.level}</p>
                </div>
                <span className="font-bold text-navy-900">{s.points.toLocaleString("az-AZ")} ⭐</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
