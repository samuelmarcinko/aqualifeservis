export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-52" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="skeleton h-9 w-36 rounded-lg" />
      </div>

      {/* Stat cards row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4">
            <div className="skeleton mb-2 h-8 w-16" />
            <div className="skeleton h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Table / content block */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3">
          <div className="skeleton h-4 w-40" />
        </div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-50 px-4 py-3.5">
            <div className="skeleton h-4 w-1/4" />
            <div className="skeleton h-4 w-1/5" />
            <div className="skeleton h-4 w-1/6" />
            <div className="skeleton ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
