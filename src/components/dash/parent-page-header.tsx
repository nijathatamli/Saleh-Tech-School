/** Big font-display page header matching the parent dashboard's own heading scale — used in place of the shared DashTopbar for parent subpages only, so student/teacher pages are unaffected. */
export function ParentPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-6 pb-2 pt-11 md:px-11">
      <h1 className="font-display text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] md:text-[36px]">{title}</h1>
      {subtitle && <p className="mt-3 text-[15px] tracking-[-0.005em] text-grey-500">{subtitle}</p>}
    </header>
  );
}
