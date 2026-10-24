export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6 md:p-10" role="status" aria-label="Yüklənir">
      <div className="ad-skeleton h-32" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="ad-skeleton h-28" />
        ))}
      </div>
      <div className="ad-skeleton h-72" />
    </div>
  );
}
