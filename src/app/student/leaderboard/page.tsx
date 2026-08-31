import { Trophy } from "lucide-react";
import { getCurrentStudent, getLeaderboard } from "@/lib/data";
import { DashTopbar } from "@/components/dash/topbar";
import { DashCard } from "@/components/dash/card";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getServerDictionary, topbarLabels } from "@/i18n/server";

export const dynamic = "force-dynamic";

const medalColors = ["text-amber-500", "text-zinc-400", "text-orange-400"];

export default async function StudentLeaderboardPage() {
  const student = await getCurrentStudent();
  if (!student) return null;

  const { locale, dict } = getServerDictionary();
  const leaderboard = await getLeaderboard(20);

  return (
    <div>
      <DashTopbar
        title={dict.studentLeaderboard.title}
        userName={student.user?.name ?? student.firstName}
        userEmail={student.user?.email ?? ""}
        locale={locale}
        labels={topbarLabels(dict)}
        settingsHref="/student/settings"
        showMobileMenuTrigger={false}
      />

      <div className="p-6 md:p-10">
        <DashCard className="p-0">
          <div className="divide-y divide-dash-rule dark:divide-dash-dark-rule">
            {leaderboard.map((s, i) => {
              const isMe = s.id === student.id;
              return (
                <div
                  key={s.id}
                  className={cn("flex items-center gap-4 p-5", isMe && "bg-electric-500/5")}
                >
                  <div className="flex w-8 items-center justify-center">
                    {i < 3 ? (
                      <Trophy className={cn("h-5 w-5", medalColors[i])} />
                    ) : (
                      <span className="text-sm font-bold text-dash-ink/40 dark:text-white/40">{i + 1}</span>
                    )}
                  </div>
                  <Avatar name={`${s.firstName} ${s.lastName}`} src={s.avatarUrl} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-bold", isMe ? "text-electric-600" : "text-dash-ink dark:text-white")}>
                      {s.firstName} {s.lastName} {isMe && `(${dict.studentLeaderboard.you})`}
                    </p>
                    <p className="text-xs text-dash-ink/50 dark:text-white/40">
                      {s.enrollments[0]?.course.name ?? dict.studentLeaderboard.courseNotAssigned} · {dict.studentLeaderboard.level} {s.level}
                    </p>
                  </div>
                  <span className="font-bold text-dash-ink dark:text-white">{s.points.toLocaleString("az-AZ")}</span>
                </div>
              );
            })}
          </div>
        </DashCard>
      </div>
    </div>
  );
}
