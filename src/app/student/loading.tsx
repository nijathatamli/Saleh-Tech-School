export default function StudentLoading() {
  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="h-40 animate-pulse rounded-3xl bg-dash-paper-2" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-dash-paper-2" />
            ))}
          </div>
          <div className="h-56 animate-pulse rounded-2xl bg-dash-paper-2" />
        </div>
        <div className="h-72 animate-pulse rounded-2xl bg-dash-paper-2" />
      </div>
    </div>
  );
}
