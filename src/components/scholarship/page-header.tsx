import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <div className="mx-auto mb-12 max-w-2xl space-y-4 text-center">
      {eyebrow && (
        <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{eyebrow}</span>
        </div>
      )}
      <h1 className="font-display text-3xl leading-tight md:text-4xl">{title}</h1>
      {children && <p className="text-grey-500 dark:text-zinc-400">{children}</p>}
    </div>
  );
}
