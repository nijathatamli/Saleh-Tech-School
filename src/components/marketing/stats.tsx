const stats = [
  { value: "500+", label: "Aktiv Tələbə" },
  { value: "20+", label: "Ekspert Müəllim" },
  { value: "15+", label: "Tədris Proqramı" },
  { value: "98%", label: "Məmnuniyyət" },
];

export function Stats() {
  return (
    <section className="grid grid-cols-2 gap-12 bg-grey-50 px-6 py-24 text-center dark:bg-zinc-900 md:grid-cols-4 md:px-20">
      {stats.map((s) => (
        <div key={s.label} className="space-y-3">
          <div className="font-display text-4xl text-secondary dark:text-white md:text-5xl">{s.value}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">{s.label}</div>
        </div>
      ))}
    </section>
  );
}
