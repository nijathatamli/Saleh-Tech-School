export default function TeacherLoading() {
  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="h-32 animate-pulse rounded-3xl bg-navy-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-navy-100" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-navy-100" />
        ))}
      </div>
    </div>
  );
}
