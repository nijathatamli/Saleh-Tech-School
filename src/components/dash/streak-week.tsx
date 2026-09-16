import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = ["B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən", "Baz"];

/** Last 7 days of learning activity. `days` = student.streakDays. */
export function StreakWeek({ days }: { days: number }) {
  const filled = Math.min(days, 7);

  return (
    <div className="grid grid-cols-7 gap-[7px]">
      {DAYS.map((day, i) => {
        const done = i < filled;
        return (
          <div key={day} className="text-center">
            <div
              className={cn(
                "flex h-[30px] items-center justify-center rounded-[10px]",
                done
                  ? "bg-electric-500/10 text-electric-600"
                  : "border border-electric-500/25 bg-white text-electric-500 dark:bg-transparent"
              )}
            >
              {done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : <span className="h-1 w-1 rounded-full bg-current" />}
            </div>
            <div className="mt-[7px] text-[10px] text-dash-muted">{day}</div>
          </div>
        );
      })}
    </div>
  );
}
