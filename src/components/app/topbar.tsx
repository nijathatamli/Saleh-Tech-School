/**
 * Page heading of the admin and blog panels: a title with a muted line under it (the bell, settings and account
 * live in the panel's top bar, `AdminHeader`). Optional `children` go on the right (e.g. a period filter).
 */
export function AppTopbar({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="ap-pagehead">
      <div className="min-w-0">
        <h1 className="ap-title">{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
