const words = [
  { text: "ROBOTOTEXNİKA", accent: false },
  { text: "KİBER TƏHLÜKƏSİZLİK", accent: true },
  { text: "PROQRAMLAŞDIRMA", accent: false },
  { text: "SÜNİ İNTELLEKT", accent: true },
  { text: "OYUN YARADILMASI", accent: false },
];

export function Marquee() {
  const doubled = [...words, ...words];
  return (
    <section className="overflow-hidden border-y border-grey-100 bg-white py-6 dark:border-zinc-800 dark:bg-black">
      <div className="inline-block animate-scroll whitespace-nowrap">
        {doubled.map((w, i) => (
          <span
            key={i}
            className={`mx-12 font-display text-2xl md:text-3xl ${
              w.accent ? "text-primary" : "text-grey-200 dark:text-zinc-800"
            }`}
          >
            {w.text}
          </span>
        ))}
      </div>
    </section>
  );
}
