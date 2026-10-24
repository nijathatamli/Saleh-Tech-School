/** Shared top block of the public info pages: eyebrow, the page's single <h1>, and a lead paragraph. */
export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: React.ReactNode; lead: string }) {
  return (
    <div className="mx-auto mb-16 max-w-3xl space-y-4 text-center">
      <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
      <h1 className="font-display text-3xl leading-tight md:text-5xl">{title}</h1>
      <p className="text-lg leading-relaxed text-grey-500 dark:text-zinc-400">{lead}</p>
    </div>
  );
}
