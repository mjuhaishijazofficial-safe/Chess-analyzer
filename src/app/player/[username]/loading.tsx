export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 sm:py-10">
      <div className="panel flex items-center gap-5 rounded-2xl p-6 sm:p-8">
        <div className="skeleton h-20 w-20 rounded-2xl sm:h-24 sm:w-24" />
        <div className="flex-1 space-y-3">
          <div className="skeleton h-7 w-48 rounded-md" />
          <div className="skeleton h-4 w-32 rounded-md" />
          <div className="skeleton h-4 w-64 rounded-md" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel space-y-4 rounded-2xl p-5">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-8 w-24 rounded" />
            <div className="skeleton h-1.5 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="skeleton h-64 rounded-2xl" />

      <div className="panel space-y-3 rounded-2xl p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-40 rounded" />
              <div className="skeleton h-3 w-56 rounded" />
            </div>
            <div className="skeleton h-4 w-12 rounded" />
          </div>
        ))}
      </div>

      <p className="text-center font-mono text-xs text-faint">
        <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent align-middle" />
        FETCHING FROM CHESS.COM…
      </p>
    </div>
  );
}
