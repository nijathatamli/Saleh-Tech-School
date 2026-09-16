import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DashCard } from "@/components/dash/card";
import { DashSectionLabel } from "@/components/dash/ledger";
import { createLesson } from "./actions";

const fieldClass =
  "w-full rounded-xl border border-dash-rule bg-white px-4 py-3 text-sm text-dash-ink placeholder:text-dash-ink/40 transition-colors focus:border-electric-500 dark:border-dash-dark-rule dark:bg-dash-dark-surface dark:text-white dark:placeholder:text-white/30";

/** Schedules the next lesson of a class — what parents see as "Növbəti dərs" and mark attendance against. */
export function NewLessonForm({ classId }: { classId: string }) {
  return (
    <DashCard>
      <DashSectionLabel className="mb-5">Yeni dərs</DashSectionLabel>
      <form action={createLesson} className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="classId" value={classId} />
        <div className="sm:col-span-2">
          <Label htmlFor="lesson-title">Mövzu</Label>
          <input id="lesson-title" name="title" required placeholder="Şəbəkə təhlükəsizliyinin əsasları" className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="lesson-date">Tarix və saat (Bakı)</Label>
          <input id="lesson-date" name="date" type="datetime-local" required className={fieldClass} />
        </div>
        <div>
          <Label htmlFor="lesson-link">Link (Zoom/Meet və ya material)</Label>
          <input id="lesson-link" name="link" type="url" placeholder="https://…" className={fieldClass} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="lesson-description">Qısa təsvir</Label>
          <textarea id="lesson-description" name="description" rows={2} className={fieldClass} placeholder="Dərsdə nə keçiləcək..." />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" variant="app">Dərsi planlaşdır</Button>
        </div>
      </form>
    </DashCard>
  );
}
