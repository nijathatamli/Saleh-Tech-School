export default function AdminLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Yüklənir">
      <div className="ap-skeleton h-10 w-56" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ap-skeleton h-24" />
        ))}
      </div>
      <div className="ap-skeleton h-72" />
    </div>
  );
}
