import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Uşağım hansı yaşdan başlaya bilər?",
    a: "6 yaşından etibarən uşağınız Tech Explorer proqramımıza qoşula bilər. Hər yaş qrupu üçün xüsusi hazırlanmış kurslarımız var.",
  },
  {
    q: "Əvvəlcədən proqramlaşdırma bilməlidir?",
    a: "Xeyr, kurslarımızın böyük hissəsi başlanğıc səviyyədən başlayır və heç bir ön bilik tələb olunmur.",
  },
  {
    q: "Dərslər neçə dəfə keçirilir?",
    a: "Kursdan asılı olaraq, dərslər həftədə 1-3 dəfə, 60-90 dəqiqə müddətində keçirilir.",
  },
  {
    q: "Qrupda neçə tələbə olur?",
    a: "Fərdi diqqəti təmin etmək üçün qruplarımız maksimum 8-10 tələbədən ibarətdir.",
  },
  {
    q: "Valideyn övladının inkişafını necə izləyə bilər?",
    a: "Xüsusi Valideyn Paneli vasitəsilə davamiyyət, tərəqqi, ev tapşırıqları və müəllim rəylərini real vaxtda izləyə bilərsiniz.",
  },
  {
    q: "Sınaq dərsi ödənişsizdir?",
    a: "Bəli, ilk sınaq dərsi tamamilə ödənişsizdir və heç bir öhdəlik tələb etmir.",
  },
];

export function FaqSection() {
  return (
    <section className="bg-grey-50 px-6 py-32 dark:bg-zinc-900 md:px-20">
      <div className="mx-auto max-w-3xl">
        <div className="mb-14 space-y-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Suallarınız var?</span>
          <h2 className="font-display text-3xl md:text-4xl">Tez-tez verilən suallar</h2>
        </div>
        <div className="rounded-3xl bg-white px-8 dark:bg-black">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="dark:text-white">{f.q}</AccordionTrigger>
                <AccordionContent className="dark:text-zinc-400">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
