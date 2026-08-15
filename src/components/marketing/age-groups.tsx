"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle2 } from "lucide-react";

const groups = [
  {
    range: "6-8",
    title: "Tech Explorer",
    desc: "Uşaqlar oyun-əsaslı tapşırıqlarla texnologiya dünyası ilə ilk tanışlığını edir.",
    courses: ["Scratch ilə proqramlaşdırma", "LEGO Robotexnika", "Rəqəmsal Vətəndaşlıq"],
    skills: ["Məntiqi düşüncə", "Komanda işi", "Yaradıcılıq", "Əsas robotexnika"],
  },
  {
    range: "9-11",
    title: "Young Developer",
    desc: "İlk real proqramlaşdırma dilləri və elektronika ilə tanışlıq mərhələsi.",
    courses: ["Python əsasları", "Web əsasları (HTML/CSS)", "Arduino Robotexnika"],
    skills: ["Python", "HTML/CSS", "Arduino", "Problem həlli"],
  },
  {
    range: "12-14",
    title: "Tech Builder",
    desc: "Tələbələr real layihələr qurmağa və komanda ilə işləməyə başlayır.",
    courses: ["Proqramlaşdırma (JavaScript)", "Kibertəhlükəsizlik əsasları", "VEX Robotexnika", "Oyun yaratma"],
    skills: ["JavaScript", "Şəbəkə əsasları", "Git/GitHub", "Oyun dizaynı"],
  },
  {
    range: "15-18",
    title: "Future Engineer",
    desc: "Qabaqcıl istiqamətlər və peşəkar sənaye alətləri ilə işə hazırlıq.",
    courses: ["Süni İntellekt Mühəndisliyi", "Qabaqcıl Kibertəhlükəsizlik", "Full-Stack Web", "IoT Sistemləri"],
    skills: ["Machine Learning", "Linux/CTF", "React & Node.js", "Bulud sistemləri"],
  },
];

export function AgeGroups() {
  return (
    <section className="bg-grey-50 px-6 py-32 dark:bg-zinc-900 md:px-20">
      <div className="mx-auto mb-14 max-w-2xl space-y-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Yaş qrupları</span>
        <h2 className="font-display text-3xl leading-tight md:text-4xl">Övladınız üçün doğru yolu seçin</h2>
        <p className="text-grey-500 dark:text-zinc-400">Yaş qrupunu seçin, tövsiyə olunan kursları kəşf edin</p>
      </div>

      <Tabs defaultValue="6-8" className="mx-auto flex max-w-4xl flex-col items-center">
        <TabsList>
          {groups.map((g) => (
            <TabsTrigger key={g.range} value={g.range}>
              {g.range} yaş
            </TabsTrigger>
          ))}
        </TabsList>

        {groups.map((g) => (
          <TabsContent key={g.range} value={g.range} className="w-full">
            <div className="grid gap-8 rounded-3xl bg-white p-8 shadow-xl shadow-secondary/5 dark:bg-black md:grid-cols-2 md:p-12">
              <div className="space-y-4">
                <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  {g.title}
                </span>
                <h3 className="font-display text-2xl">{g.range} yaş üçün tövsiyə olunur</h3>
                <p className="text-sm leading-relaxed text-grey-500 dark:text-zinc-400">{g.desc}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {g.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-grey-100 px-3 py-1 text-[11px] font-bold text-secondary dark:bg-zinc-800 dark:text-white"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-grey-500 dark:text-zinc-400">
                  Tövsiyə olunan kurslar
                </p>
                {g.courses.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-3 rounded-2xl border border-grey-100 p-4 transition-colors hover:border-primary dark:border-zinc-800"
                  >
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm font-semibold">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
