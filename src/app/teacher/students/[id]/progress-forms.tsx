import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DashCard } from "@/components/dash/card";
import { DashSectionLabel } from "@/components/dash/ledger";
import { Progress } from "@/components/ui/progress";
import { awardBadge, updateSkillProgress } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-dash-rule bg-white px-4 py-3 text-sm text-dash-ink placeholder:text-dash-ink/40 transition-colors focus:border-electric-500 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white dark:placeholder:text-white/30";

/** Skill bars ("Öyrənmə inkişafı" in the parent portal) with the form that sets them. */
export function SkillProgressCard({ studentId, skills }: { studentId: string; skills: { id: string; skill: string; percent: number }[] }) {
  return (
    <DashCard>
      <DashSectionLabel className="mb-6">Bacarıq irəliləyişi</DashSectionLabel>
      {skills.length === 0 ? (
        <p className="mb-6 text-sm text-dash-ink/50 dark:text-white/40">Hələ bacarıq qeydi yoxdur.</p>
      ) : (
        <div className="mb-6 space-y-4">
          {skills.map((s) => (
            <div key={s.id}>
              <div className="mb-1.5 flex justify-between text-xs text-dash-ink/50 dark:text-white/40">
                <span>{s.skill}</span>
                <span className="font-bold text-dash-ink dark:text-white">{s.percent}%</span>
              </div>
              <Progress value={s.percent} color="electric" />
            </div>
          ))}
        </div>
      )}
      <form action={updateSkillProgress} className="grid gap-3 sm:grid-cols-[1fr_120px_auto] sm:items-end">
        <input type="hidden" name="studentId" value={studentId} />
        <div>
          <Label htmlFor="skill">Bacarıq</Label>
          <input id="skill" name="skill" required list="skill-options" placeholder="Networking" className={fieldClass} />
          <datalist id="skill-options">
            {skills.map((s) => (
              <option key={s.id} value={s.skill} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor="percent">Faiz</Label>
          <input id="percent" name="percent" type="number" min={0} max={100} required placeholder="75" className={fieldClass} />
        </div>
        <Button type="submit" variant="app">Yenilə</Button>
      </form>
    </DashCard>
  );
}

/** Earned badges ("Nailiyyətlər") with the form that awards a new one. */
export function BadgesCard({
  studentId,
  earned,
  available,
}: {
  studentId: string;
  earned: { id: string; name: string; emoji: string; earnedAt: Date }[];
  available: { id: string; name: string; emoji: string }[];
}) {
  return (
    <DashCard>
      <DashSectionLabel className="mb-6">Nailiyyətlər</DashSectionLabel>
      {earned.length === 0 ? (
        <p className="mb-6 text-sm text-dash-ink/50 dark:text-white/40">Hələ nailiyyət yoxdur.</p>
      ) : (
        <ul className="mb-6 space-y-2">
          {earned.map((b) => (
            <li key={b.id} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{b.emoji}</span>
              <span className="font-bold text-dash-ink dark:text-white">{b.name}</span>
              <span className="ml-auto text-xs text-dash-ink/40 dark:text-white/35">
                {b.earnedAt.toLocaleDateString("az-AZ", { day: "2-digit", month: "long", timeZone: "Asia/Baku" })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {available.length > 0 && (
        <form action={awardBadge} className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="studentId" value={studentId} />
          <div className="min-w-0 flex-1">
            <Label htmlFor="badgeId">Nailiyyət ver</Label>
            <select id="badgeId" name="badgeId" required className={fieldClass}>
              <option value="">Seçin...</option>
              {available.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.emoji} {b.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="app">Ver</Button>
        </form>
      )}
    </DashCard>
  );
}
